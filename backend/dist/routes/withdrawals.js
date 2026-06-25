"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawalsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.withdrawalsRouter = (0, express_1.Router)();
exports.withdrawalsRouter.use(authenticate_1.authenticate);
const schema = zod_1.z.object({
    category: zod_1.z.enum(["SHAREHOLDER", "CUSTOMER"]),
    personName: zod_1.z.string().min(1).max(200),
    customerId: zod_1.z.string().uuid().optional().nullable(),
    amountAfn: zod_1.z.number().min(0).default(0),
    amountUsd: zod_1.z.number().min(0).default(0),
    description: zod_1.z.string().max(1000).default(""),
});
exports.withdrawalsRouter.get("/", async (req, res, next) => {
    try {
        const items = await prisma_1.prisma.withdrawal.findMany({ where: { shopId: req.auth.shopId }, orderBy: { withdrawnAt: "desc" } });
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
exports.withdrawalsRouter.post("/", async (req, res, next) => {
    try {
        const data = schema.parse(req.body);
        const item = await prisma_1.prisma.withdrawal.create({ data: { ...data, shopId: req.auth.shopId } });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
exports.withdrawalsRouter.delete("/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.withdrawal.deleteMany({ where: { id: req.params.id, shopId: req.auth.shopId } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=withdrawals.js.map