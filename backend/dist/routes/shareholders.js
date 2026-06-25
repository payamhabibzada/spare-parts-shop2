"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareholdersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.shareholdersRouter = (0, express_1.Router)();
exports.shareholdersRouter.use(authenticate_1.authenticate);
const schema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    phone: zod_1.z.string().max(30).default(""),
    address: zod_1.z.string().max(500).default(""),
    investmentAmountAfn: zod_1.z.number().min(0).default(0),
    investmentAmountUsd: zod_1.z.number().min(0).default(0),
    sharePercentage: zod_1.z.number().min(0).max(100).default(0),
    monthlyProfitAfn: zod_1.z.number().min(0).default(0),
    monthlyProfitUsd: zod_1.z.number().min(0).default(0),
    remainingProfitAfn: zod_1.z.number().min(0).default(0),
    remainingProfitUsd: zod_1.z.number().min(0).default(0),
});
exports.shareholdersRouter.get("/", async (req, res, next) => {
    try {
        const items = await prisma_1.prisma.shareHolder.findMany({ where: { shopId: req.auth.shopId }, orderBy: { name: "asc" } });
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
exports.shareholdersRouter.post("/", async (req, res, next) => {
    try {
        const data = schema.parse(req.body);
        const item = await prisma_1.prisma.shareHolder.create({ data: { ...data, shopId: req.auth.shopId } });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
exports.shareholdersRouter.put("/:id", async (req, res, next) => {
    try {
        const data = schema.parse(req.body);
        await prisma_1.prisma.shareHolder.updateMany({ where: { id: req.params.id, shopId: req.auth.shopId }, data });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
exports.shareholdersRouter.delete("/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.shareHolder.deleteMany({ where: { id: req.params.id, shopId: req.auth.shopId } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=shareholders.js.map