import { db } from '@/db';
import { checkins, coinTransactions, userStats, users } from '@/db/schema';
import { afterAll, beforeEach } from 'vitest';

beforeEach(async () => {
    // truncate in FK-safe order
    await db.delete(coinTransactions);
    await db.delete(checkins);
    await db.delete(userStats);
    await db.delete(users);
});

afterAll(async () => {
    await db.$client.end(); // close connection pool
});
