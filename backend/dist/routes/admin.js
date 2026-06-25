"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.adminRouter = (0, express_1.Router)();
// All admin routes require SHOP_OWNER or super admin token
exports.adminRouter.use(authenticate_1.authenticate);
exports.adminRouter.use((0, authenticate_1.requireRole)("SHOP_OWNER", "SUPER_ADMIN"));
const shopSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    phone: zod_1.z.string().max(30).default(""),
    shopName: zod_1.z.string().min(1).max(200),
    isActive: zod_1.z.boolean().default(true),
});
exports.adminRouter.get("/shops", async (_req, res, next) => {
    try {
        const shops = await prisma_1.prisma.shopUser.findMany({
            select: { id: true, name: true, email: true, shopName: true, isActive: true, createdAt: true, phone: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(shops);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.post("/shops", async (req, res, next) => {
    try {
        const data = shopSchema.parse(req.body);
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        const shop = await prisma_1.prisma.shopUser.create({
            data: { ...data, passwordHash },
            select: { id: true, name: true, email: true, shopName: true, isActive: true },
        });
        res.status(201).json(shop);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.put("/shops/:id", async (req, res, next) => {
    try {
        const data = shopSchema.partial().parse(req.body);
        const update = { ...data };
        if (data.password) {
            update.passwordHash = await bcryptjs_1.default.hash(data.password, 12);
            delete update.password;
        }
        await prisma_1.prisma.shopUser.update({ where: { id: req.params.id }, data: update });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.delete("/shops/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.shopUser.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=admin.js.map