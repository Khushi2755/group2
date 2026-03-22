import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

export const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'dev-super-secret';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    jwtid: randomUUID()
  });
};
