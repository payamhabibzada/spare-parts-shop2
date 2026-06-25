"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.use(authenticate_1.authenticate);
const createSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    fullName: zod_1.z.string().min(1).max(200),
    role: zod_1.z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).default("USER"),
    isActive: zod_1.z.boolean().default(true),
    permissions: zod_1.z.array(zod_1.z.string()).default([]),
});
const updateSchema = createSchema.partial().omit({ password: true }).extend({
    password: zod_1.z.string().min(8).optional(),
});
exports.usersRouter.get("/", (0, authenticate_1.requireRole)("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
    try {
        const items = await prisma_1.prisma.user.findMany({
            where: { shopId: req.auth.shopId },
            select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true, permissions: true, createdAt: true },
        });
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
exports.usersRouter.post("/", (0, authenticate_1.requireRole)("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
    try {
        const data = createSchema.parse(req.body);
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        const user = await prisma_1.prisma.user.create({
            data: { ...data, passwordHash, shopId: req.auth.shopId },
            select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true },
        });
        res.status(201).json(user);
    }
    catch (err) {
        next(err);
    }
});
exports.usersRouter.put("/:id", (0, authenticate_1.requireRole)("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
    try {
        const data = updateSchema.parse(req.body);
        const update = { ...data };
        if (data.password) {
            update.passwordHash = await bcryptjs_1.default.hash(data.password, 12);
            delete update.password;
        }
        await prisma_1.prisma.user.updateMany({ where: { id: req.params.id, shopId: req.auth.shopId }, data: update });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
exports.usersRouter.delete("/:id", (0, authenticate_1.requireRole)("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
    try {
        await prisma_1.prisma.user.deleteMany({ where: { id: req.params.id, shopId: req.auth.shopId } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=users.js.map