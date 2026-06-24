import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";

export interface AccessPayload {
  sub: string;       // user id or shop user id
  shopId?: string;   // set for shop-user tokens
  role: string;
  type: "access";
}

export interface RefreshPayload {
  jti: string;
  sub: string;
  type: "refresh";
}

export function signAccessToken(payload: Omit<AccessPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(sub: string): { token: string; jti: string } {
  const jti = uuid();
  const token = jwt.sign({ jti, sub, type: "refresh" }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
}
