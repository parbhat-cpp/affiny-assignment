import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { SIGNUP_REWARD_COINS } from '@/config';

const SIGNUP_URL = 'http://localhost:3000/api/auth/signup';

const buildSignupRequest = (body: Record<string, unknown>) => {
    return new NextRequest(SIGNUP_URL, {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

const createTestUser = (suffix: string) => ({
    name: `Test User ${suffix}`,
    email: `test-${suffix}@example.com`,
    password: 'correctpassword',
});

describe('POST /api/auth/signup', () => {
    it.each([
        [{ email: 'missing-password@example.com', name: 'Missing Password' }],
        [{ password: 'correctpassword' }],
        [{ name: 'Missing Email' }],
    ])('returns 400 when required fields are missing', async (payload) => {
        const response = await POST(buildSignupRequest(payload));

        expect(response.status).toBe(400);
    });

    it('returns 201 with user and checkin data for a valid signup', async () => {
        const testUser = createTestUser('success');
        const response = await POST(buildSignupRequest(testUser));
        const data = await response.json();

        expect(response.status).toBe(201);
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
                coinEarned: SIGNUP_REWARD_COINS,
            },
        });
        expect(response.headers.get('set-cookie')).toContain('token=');
    });

    it('returns 409 when the same user signs up twice', async () => {
        const testUser = createTestUser('duplicate');

        const firstResponse = await POST(buildSignupRequest(testUser));
        expect(firstResponse.status).toBe(201);

        const secondResponse = await POST(buildSignupRequest(testUser));
        const secondData = await secondResponse.json();

        expect(secondResponse.status).toBe(409);
        expect(secondData).toEqual({ error: 'User already exists' });
    });

    it('returns the expected checkin payload for a new user', async () => {
        const testUser = createTestUser('checkin');
        const response = await POST(buildSignupRequest(testUser));
        const data = await response.json();

        expect(data.checkin).toEqual({
            occurred: false,
            streakCount: 0,
            coinBalance: SIGNUP_REWARD_COINS,
            coinEarned: SIGNUP_REWARD_COINS,
        });
    });
});
