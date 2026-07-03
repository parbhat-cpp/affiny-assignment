import { NextRequest, NextResponse } from 'next/server';
import { coinTransactions, users, userStats } from '@/db/schema';
import { hashPassword } from '@/lib/password';
import { generateToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { NODE_ENV, SIGNUP_REWARD_COINS } from '@/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    await db.transaction(async (tx) => {
      // Create user
      const newUser = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
        })
        .returning();

      const txn = await tx.insert(coinTransactions).values({
        checkinId: null,
        userId: newUser[0].id,
        amount: SIGNUP_REWARD_COINS,
        transactionDirection: 'credit',
        transactionStatus: 'completed',
        transactionType: 'new_user_bonus',
      }).returning();

      if (!txn[0]) {
        throw new Error('Failed to create coin transaction');
      }

      const userStat = await tx.insert(userStats).values({
        userId: newUser[0].id,
        coinBalance: SIGNUP_REWARD_COINS,
        lastCheckinDate: null,
      }).returning();

      if (!userStat[0]) {
        throw new Error('Failed to create user stats');
      }
    });

    const newUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const checkinResponse: Record<string, unknown> = { occurred: false, streakCount: 0, coinBalance: SIGNUP_REWARD_COINS, coinEarned: SIGNUP_REWARD_COINS };

    // Generate JWT token
    const token = generateToken({
      id: newUser[0].id,
      email: newUser[0].email,
      name: newUser[0].name,
    });

    // Set token in cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
        },
        checkin: checkinResponse,
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
