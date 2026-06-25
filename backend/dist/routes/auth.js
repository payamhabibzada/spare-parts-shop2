"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const authenticate_1 = require("../middleware/authenticate");
exports.authRouter = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    shopId: zod_1.z.string().uuid(),
});
const refreshSchema = zod_1.z.object({ refreshToken: zod_1.z.string() });
// POST /api/auth/login — user (shop employee) login
exports.authRouter.post("/login", async (req, res, next) => {
    try {
        const { email, password, shopId } = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findFirst({
            where: { email, shopId, isActive: true },
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            res.status(401).json({ error: "Invalid credentials or account inactive" });
            return;
        }
        const { token: refreshToken, jti } = (0, jwt_1.signRefreshToken)(user.id);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.refreshToken.create({ data: { token: jti, userId: user.id, expiresAt } });
        res.json({
            accessToken: (0, jwt_1.signAccessToken)({ sub: user.id, shopId: user.shopId, role: user.role }),
            refreshToken,
            user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, permissions: user.permissions },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/refresh
exports.authRouter.post("/refresh", async (req, res, next) => {
    try {
        const { refreshToken } = refreshSchema.parse(req.body);
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const stored = await prisma_1.prisma.refreshToken.findUnique({ where: { token: payload.jti } });
        if (!stored || stored.expiresAt < new Date()) {
            res.status(401).json({ error: "Refresh token invalid or expired" });
            return;
        }
        // Rotate
        await prisma_1.prisma.refreshToken.delete({ where: { id: stored.id } });
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            res.status(401).json({ error: "User not found" });
            return;
        }
        const { token: newRefresh, jti } = (0, jwt_1.signRefreshToken)(user.id);
        await prisma_1.prisma.refreshToken.create({ data: { token: jti, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
        res.json({
            accessToken: (0, jwt_1.signAccessToken)({ sub: user.id, shopId: user.shopId, role: user.role }),
            refreshToken: newRefresh,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/logout
exports.authRouter.post("/logout", authenticate_1.authenticate, async (req, res, next) => {
    try {
        if (req.auth?.sub) {
            await prisma_1.prisma.refreshToken.deleteMany({ where: { userId: req.auth.sub } });
        }
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=auth.js.map