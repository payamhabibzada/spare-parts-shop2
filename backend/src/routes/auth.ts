import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  shopId: z.string().uuid(),
});

const refreshSchema = z.object({ refreshToken: z.string() });

// POST /api/auth/login — user (shop employee) login
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password, shopId } = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: { email, shopId, isActive: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials or account inactive" });
      return;
    }
    const { token: refreshToken, jti } = signRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: jti, userId: user.id, expiresAt } });

    res.json({
      accessToken: signAccessToken({ sub: user.id, shopId: user.shopId, role: user.role }),
      refreshToken,
      user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, permissions: user.permissions },
    });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
authRouter.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { token: payload.jti } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: "Refresh token invalid or expired" });
      return;
    }
    // Rotate
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const { token: newRefresh, jti } = signRefreshToken(user.id);
    await prisma.refreshToken.create({ data: { token: jti, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    res.json({
      accessToken: signAccessToken({ sub: user.id, shopId: user.shopId, role: user.role }),
      refreshToken: newRefresh,
    });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
authRouter.post("/logout", authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (req.auth?.sub) {
      await prisma.refreshToken.deleteMany({ where: { userId: req.auth.sub } });
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});
