import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "vitb_secret_key_jwt_super_secure_random_2026";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

export interface JWTPayload {
  userId: string;
  username: string;
}

export function generateToken(
  payload: JWTPayload,
  expiresIn: jwt.SignOptions["expiresIn"] = JWT_EXPIRES_IN
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
