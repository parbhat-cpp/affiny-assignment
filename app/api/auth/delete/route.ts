import { NextResponse } from 'next/server';
import { checkins, coinTransactions, users, userStats } from '@/db/schema';
import { getAuthToken } from '@/lib/auth';
import { verifyToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { db } from '@/db';

export async function DELETE() {
  try {
    // Verify JWT token
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.id;

    // Verify user exists before deletion
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user and all related records in a transaction
    // Order matters due to foreign key constraints
    await db.transaction(async (tx) => {
      // Delete coin transactions first (references checkins and users)
      await tx.delete(coinTransactions).where(eq(coinTransactions.userId, userId));

      // Delete checkins (references users)
      await tx.delete(checkins).where(eq(checkins.userId, userId));

      // Delete user stats (references users)
      await tx.delete(userStats).where(eq(userStats.userId, userId));

      // Finally delete the user
      await tx.delete(users).where(eq(users.id, userId));
    });

    // Clear the token cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'User account deleted successfully',
      },
      { status: 200 }
    );

    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Immediately expire the cookie
    });

    return response;
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
