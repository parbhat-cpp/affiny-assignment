import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { POST as SignupMethod } from '@/app/api/auth/signup/route';
import { CHECKIN_REWARD_COINS, SIGNUP_REWARD_COINS } from '@/config';
import { afterEach, beforeEach } from 'vitest';
import { CONSISTENT_CHECKIN_TESTS, CONSISTENT_CHECKIN_TESTS_WITH_MISSED_DAY, WEEK_STREAK_WITH_SIX_MONTHS_GAP_TESTS } from '@/tests/testcases/login';
import { db } from '@/db';
import { coinTransactions, userStats } from '@/db/schema';
import { and, eq, sum } from 'drizzle-orm';

const LOGIN_URL = 'http://localhost:3000/api/auth/login';
const SIGNUP_URL = 'http://localhost:3000/api/auth/signup';

const buildRequest = (url: string, body: Record<string, unknown>) => {
    return new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

const createTestUser = (suffix: string) => ({
    name: `Test User ${suffix}`,
    email: `test-${suffix}@example.com`,
    password: 'correctpassword',
});

describe('POST /api/auth/login', () => {
    it.each([
        [{ password: 'correctpassword' }],
        [{ email: 'test@example.com' }],
    ])('returns 400 when required fields are missing', async (payload) => {
        const response = await POST(buildRequest(LOGIN_URL, payload));

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Email and password are required' });
    });

    it('returns 401 when the email does not exist', async () => {
        const response = await POST(
            buildRequest(LOGIN_URL, {
                email: 'missing-user@example.com',
                password: 'correctpassword',
            })
        );

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Invalid email or password' });
    });

    it('returns 401 when the password is invalid', async () => {
        const testUser = createTestUser('invalid-password');

        const signupResponse = await SignupMethod(buildRequest(SIGNUP_URL, testUser));

        expect(signupResponse.status).toBe(201);

        const response = await POST(
            buildRequest(LOGIN_URL, {
                email: testUser.email,
                password: 'wrongpassword',
            })
        );

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Invalid email or password' });
    });

    it('returns 200 with user data, checkin data, and auth cookie when credentials are valid', async () => {
        const testUser = createTestUser('success');

        const signupResponse = await SignupMethod(buildRequest(SIGNUP_URL, testUser));
        expect(signupResponse.status).toBe(201);

        const response = await POST(
            buildRequest(LOGIN_URL, {
                email: testUser.email,
                password: testUser.password,
            })
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toMatchObject({
            success: true,
            user: {
                email: testUser.email,
                name: testUser.name,
            },
            checkin: {
                occurred: false,
                streakCount: 0,
                coinBalance: SIGNUP_REWARD_COINS,
                coinEarned: 0,
            },
        });
        expect(response.headers.get('set-cookie')).toContain('token=');
    });

    it('keeps the checkin response consistent for a newly signed up user', async () => {
        const testUser = createTestUser('checkin');

        await SignupMethod(buildRequest(SIGNUP_URL, testUser));

        const response = await POST(
            buildRequest(LOGIN_URL, {
                email: testUser.email,
                password: testUser.password,
            })
        );
        const data = await response.json();

        expect(data.checkin).toEqual({
            occurred: false,
            streakCount: 0,
            coinBalance: SIGNUP_REWARD_COINS,
            coinEarned: 0,
        });
    });

    describe('test user check ins', async () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('consistently logs in user check in reward', async () => {
            const testUser = createTestUser('checkin-consistent');

            await SignupMethod(buildRequest(SIGNUP_URL, testUser));
            const today = new Date();

            for (const testCase of CONSISTENT_CHECKIN_TESTS) {
                vi.setSystemTime(today);

                const response = await POST(
                    buildRequest(LOGIN_URL, {
                        email: testUser.email,
                        password: testUser.password,
                    })
                );
                const data = await response.json();

                expect(data.checkin).toEqual({
                    occurred: testCase.occurred,
                    streakCount: testCase.streakCount,
                    coinBalance: testCase.coinBalance,
                    coinEarned: testCase.coinEarned,
                });

                today.setDate(today.getDate() + 1);
            }
        });

        it('resets streak count after a missed day', async () => {
            const testUser = createTestUser('checkin-missed-day');

            await SignupMethod(buildRequest(SIGNUP_URL, testUser));

            const today = new Date();

            for (const testCase of CONSISTENT_CHECKIN_TESTS_WITH_MISSED_DAY) {
                vi.setSystemTime(today);

                if (testCase.skipped) {
                    today.setDate(today.getDate() + 1);
                    continue;
                }

                const response = await POST(
                    buildRequest(LOGIN_URL, {
                        email: testUser.email,
                        password: testUser.password,
                    })
                );
                const data = await response.json();

                expect(data.checkin).toEqual({
                    occurred: testCase.occurred,
                    streakCount: testCase.streakCount,
                    coinBalance: testCase.coinBalance,
                    coinEarned: testCase.coinEarned,
                });

                today.setDate(today.getDate() + 1);
            }
        });

        it('resets streak count after a six month gap', async () => {
            const testUser = createTestUser('checkin-six-month-gap');

            await SignupMethod(buildRequest(SIGNUP_URL, testUser));

            const today = new Date();

            for (const testCase of WEEK_STREAK_WITH_SIX_MONTHS_GAP_TESTS) {
                vi.setSystemTime(today);

                if (testCase.skipped) {
                    today.setDate(today.getDate() + 6 * 30);
                    continue;
                }

                const response = await POST(
                    buildRequest(LOGIN_URL, {
                        email: testUser.email,
                        password: testUser.password,
                    })
                );
                const data = await response.json();

                expect(data.checkin).toEqual({
                    occurred: testCase.occurred,
                    streakCount: testCase.streakCount,
                    coinBalance: testCase.coinBalance,
                    coinEarned: testCase.coinEarned,
                });

                today.setDate(today.getDate() + 1);
            }
        });
    });

    describe('multiple logins in a single day', () => {
        it('login twice the same day of signup, streak should be zero', async () => {
            const testUser = createTestUser('checkin-twice-same-day');

            await SignupMethod(buildRequest(SIGNUP_URL, testUser));

            const today = new Date();

            vi.setSystemTime(today);

            const firstResponse = await POST(
                buildRequest(LOGIN_URL, {
                    email: testUser.email,
                    password: testUser.password,
                })
            );
            const firstData = await firstResponse.json();

            expect(firstData.checkin).toEqual({
                occurred: false,
                streakCount: 0,
                coinBalance: SIGNUP_REWARD_COINS,
                coinEarned: 0,
            });

            const secondResponse = await POST(
                buildRequest(LOGIN_URL, {
                    email: testUser.email,
                    password: testUser.password,
                })
            );
            const secondData = await secondResponse.json();

            expect(secondData.checkin).toEqual({
                occurred: false,
                streakCount: 0,
                coinBalance: SIGNUP_REWARD_COINS,
                coinEarned: 0,
            });
        });

        it('login twice the same day after a streak, streak should be 1', async () => {
            const testUser = createTestUser('checkin-twice-same-day-after-streak');

            await SignupMethod(buildRequest(SIGNUP_URL, testUser));

            const today = new Date();

            vi.setSystemTime(today);

            const firstResponse = await POST(
                buildRequest(LOGIN_URL, {
                    email: testUser.email,
                    password: testUser.password,
                })
            );
            const firstData = await firstResponse.json();

            expect(firstData.checkin).toEqual({
                occurred: false,
                streakCount: 0,
                coinBalance: SIGNUP_REWARD_COINS,
                coinEarned: 0,
            });

            today.setDate(today.getDate() + 1);
            vi.setSystemTime(today);

            const secondResponse = await POST(
                buildRequest(LOGIN_URL, {
                    email: testUser.email,
                    password: testUser.password,
                })
            );
            const secondData = await secondResponse.json();

            expect(secondData.checkin).toEqual({
                occurred: true,
                streakCount: 1,
                coinBalance: SIGNUP_REWARD_COINS + CHECKIN_REWARD_COINS,
                coinEarned: CHECKIN_REWARD_COINS,
            });

            const thirdResponse = await POST(
                buildRequest(LOGIN_URL, {
                    email: testUser.email,
                    password: testUser.password,
                })
            );
            const thirdData = await thirdResponse.json();

            expect(thirdData.checkin).toEqual({
                occurred: false,
                streakCount: 1,
                coinBalance: SIGNUP_REWARD_COINS + CHECKIN_REWARD_COINS,
                coinEarned: 0,
            });
        });
    });

    describe('data integrity tests', () => {
        it('after N logins - coin balance should be correct', async () => {
            const testUser = createTestUser('checkin-data-integrity');

            const userResp = await SignupMethod(buildRequest(SIGNUP_URL, testUser));
            const userData = await userResp.json();
            const userId = userData.user.id;

            const today = new Date();
            let lastestCheckinData;

            for (const testCase of WEEK_STREAK_WITH_SIX_MONTHS_GAP_TESTS) {
                vi.setSystemTime(today);

                const response = await POST(
                    buildRequest(LOGIN_URL, {
                        email: testUser.email,
                        password: testUser.password,
                    })
                );
                const data = await response.json();

                lastestCheckinData = data.checkin;

                today.setDate(today.getDate() + 1);
            }

            const userCoinBalance = await db.select({ balance: sum(coinTransactions.amount) })
                .from(coinTransactions)
                .where(
                    and(
                        eq(coinTransactions.userId, userId),
                        eq(coinTransactions.transactionStatus, 'completed')
                    )
                );

            expect(parseInt(userCoinBalance[0].balance || '0', 10)).toBe(lastestCheckinData.coinBalance);
        });

        it('after N logins - user stats should be correct', async () => {
            const testUser = createTestUser('stat-data-integrity');

            const userResp = await SignupMethod(buildRequest(SIGNUP_URL, testUser));
            const userData = await userResp.json();
            const userId = userData.user.id;

            const today = new Date();
            let lastestCheckinData;

            for (const testCase of WEEK_STREAK_WITH_SIX_MONTHS_GAP_TESTS) {
                vi.setSystemTime(today);

                const response = await POST(
                    buildRequest(LOGIN_URL, {
                        email: testUser.email,
                        password: testUser.password,
                    })
                );
                const data = await response.json();

                lastestCheckinData = data.checkin;

                today.setDate(today.getDate() + 1);
            }

            const usrStats = await db.select().from(userStats)
                .where(eq(userStats.userId, userId));
            
            today.setDate(today.getDate() - 1);
            
            expect(usrStats[0].streak).toBe(lastestCheckinData.streakCount);
            expect(usrStats[0].coinBalance).toBe(lastestCheckinData.coinBalance);
            expect(usrStats[0].lastCheckinDate?.toString().split('T')[0]).toBe(today.toISOString().split('T')[0]);
        });
    });
});
