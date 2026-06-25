"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopAuthRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
exports.shopAuthRouter = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
// POST /api/shop-auth/login — shop owner login
exports.shopAuthRouter.post("/login", async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const shopUser = await prisma_1.prisma.shopUser.findUnique({ where: { email, isActive: true } });
        if (!shopUser || !(await bcryptjs_1.default.compare(password, shopUser.passwordHash))) {
            res.status(401).json({ error: "Invalid credentials or account inactive" });
            return;
        }
        const { token: refreshToken, jti } = (0, jwt_1.signRefreshToken)(shopUser.id);
        await prisma_1.prisma.refreshToken.create({
            data: { token: jti, shopUserId: shopUser.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        });
        res.json({
            accessToken: (0, jwt_1.signAccessToken)({ sub: shopUser.id, role: "SHOP_OWNER" }),
            refreshToken,
            shopUser: { id: shopUser.id, name: shopUser.name, email: shopUser.email, shopName: shopUser.shopName },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/shop-auth/refresh
exports.shopAuthRouter.post("/refresh", async (req, res, next) => {
    try {
        const { refreshToken } = zod_1.z.object({ refreshToken: zod_1.z.string() }).parse(req.body);
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const stored = await prisma_1.prisma.refreshToken.findUnique({ where: { token: payload.jti } });
        if (!stored || stored.expiresAt < new Date()) {
            res.status(401).json({ error: "Refresh token invalid or expired" });
            return;
        }
        await prisma_1.prisma.refreshToken.delete({ where: { id: stored.id } });
        const shopUser = await prisma_1.prisma.shopUser.findUnique({ where: { id: payload.sub } });
        if (!shopUser) {
            res.status(401).json({ error: "Shop not found" });
            return;
        }
        const { token: newRefresh, jti } = (0, jwt_1.signRefreshToken)(shopUser.id);
        await prisma_1.prisma.refreshToken.create({ data: { token: jti, shopUserId: shopUser.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
        res.json({
            accessToken: (0, jwt_1.signAccessToken)({ sub: shopUser.id, role: "SHOP_OWNER" }),
            refreshToken: newRefresh,
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=shopAuth.js.map