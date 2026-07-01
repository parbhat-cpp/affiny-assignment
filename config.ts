import 'dotenv/config';

export const DATABASE_URL: string = process.env.DATABASE_URL as string;
export const JWT_SECRET: string = process.env.JWT_SECRET as string;
export const NODE_ENV: string = process.env.NODE_ENV as string;

export const SIGNUP_REWARD_COINS: number = 300;
export const CHECKIN_REWARD_COINS: number = 10;
