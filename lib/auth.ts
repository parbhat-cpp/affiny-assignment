import { JWT_SECRET } from '@/config';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_EXPIRY = '7d';

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JWTPayload;
  } catch {
    return null;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    return token || null;
  } catch {
    return null;
  }
};

export const clearAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('authToken');
};

export const getCurrentUser = async (): Promise<JWTPayload | null> => {
  try {
    const token = await getAuthToken();
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
};
