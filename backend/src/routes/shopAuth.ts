import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";

export const shopAuthRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/shop-auth/login — shop owner login
shopAuthRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const shopUser = await prisma.shopUser.findUnique({ where: { email, isActive: true } });
    if (!shopUser || !(await bcrypt.compare(password, shopUser.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials or account inactive" });
      return;
    }
    const { token: refreshToken, jti } = signRefreshToken(shopUser.id);
    await prisma.refreshToken.create({
      data: { token: jti, shopUserId: shopUser.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    res.json({
      accessToken: signAccessToken({ sub: shopUser.id, role: "SHOP_OWNER" }),
      refreshToken,
      shopUser: { id: shopUser.id, name: shopUser.name, email: shopUser.email, shopName: shopUser.shopName },
    });
  } catch (err) { next(err); }
});

// POST /api/shop-auth/refresh
shopAuthRouter.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { token: payload.jti } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: "Refresh token invalid or expired" });
      return;
    }
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const shopUser = await prisma.shopUser.findUnique({ where: { id: payload.sub } });
    if (!shopUser) { res.status(401).json({ error: "Shop not found" }); return; }
    const { token: newRefresh, jti } = signRefreshToken(shopUser.id);
    await prisma.refreshToken.create({ data: { token: jti, shopUserId: shopUser.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    res.json({
      accessToken: signAccessToken({ sub: shopUser.id, role: "SHOP_OWNER" }),
      refreshToken: newRefresh,
    });
  } catch (err) { next(err); }
});
