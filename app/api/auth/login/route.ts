import { NextRequest, NextResponse } from 'next/server';
import { checkins, coinTransactions, users, userStats } from '@/db/schema';
import { comparePassword } from '@/lib/password';
import { generateToken } from '@/lib/auth';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { CHECKIN_REWARD_COINS, NODE_ENV } from '@/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const foundUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = foundUsers[0];

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const checkinDate = new Date().toISOString().split('T')[0];
    const checkinResponse: Record<string, unknown> = { occurred: true };

    const userCheckinToday = await db.select().from(checkins).where(and(eq(checkins.userId, user.id), eq(checkins.checkinDate, checkinDate))).limit(1);
    const usrStat = await db.select().from(userStats).where(eq(userStats.userId, user.id)).limit(1);

    if (userCheckinToday.length > 0) {
      checkinResponse.occurred = false;
      checkinResponse.streakCount = usrStat[0].streak;
      checkinResponse.coinBalance = usrStat[0].coinBalance;
      checkinResponse.coinEarned = 0;
    } else {
      await db.transaction(async (tx) => {
        let currentStreakCount = usrStat[0]?.streak || 0;
        const lastCheckinDate = usrStat[0]?.lastCheckinDate;

        if (!lastCheckinDate)
          currentStreakCount = 1;

        if (lastCheckinDate) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          if (lastCheckinDate === yesterday) {
            currentStreakCount += 1;
          } else {
            currentStreakCount = 1;
          }
        }

        const userCheckin = await tx.insert(checkins).values({
          userId: user.id,
          checkinDate,
          streakCount: currentStreakCount,
        }).returning();

        await tx.insert(coinTransactions).values({
          userId: user.id,
          amount: CHECKIN_REWARD_COINS,
          transactionDirection: 'credit',
          checkinId: userCheckin[0].id,
          transactionType: 'checkin',
          transactionStatus: 'completed',
        });

        const updatedUserStats = await tx.update(userStats).set({
          streak: currentStreakCount,
          coinBalance: sql`${userStats.coinBalance} + ${CHECKIN_REWARD_COINS}`,
          lastCheckinDate: checkinDate,
        }).where(eq(userStats.userId, user.id)).returning();

        checkinResponse.streakCount = currentStreakCount;
        checkinResponse.coinBalance = updatedUserStats[0]?.coinBalance || 0;
        checkinResponse.coinEarned = CHECKIN_REWARD_COINS;
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Set token in cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        checkin: checkinResponse,
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', JSON.stringify(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
