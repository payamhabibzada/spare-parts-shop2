"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.paymentsRouter = (0, express_1.Router)();
exports.paymentsRouter.use(authenticate_1.authenticate);
const paymentSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().min(0.01),
    currency: zod_1.z.enum(["AFN", "USD"]).default("AFN"),
    note: zod_1.z.string().max(500).default(""),
});
exports.paymentsRouter.get("/", async (req, res, next) => {
    try {
        const shopId = req.auth.shopId;
        const customerId = req.query.customerId;
        const items = await prisma_1.prisma.payment.findMany({
            where: { shopId, ...(customerId ? { customerId } : {}) },
            orderBy: { paidAt: "desc" },
        });
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
exports.paymentsRouter.post("/", async (req, res, next) => {
    try {
        const shopId = req.auth.shopId;
        const data = paymentSchema.parse(req.body);
        const payment = await prisma_1.prisma.$transaction(async (tx) => {
            const p = await tx.payment.create({ data: { ...data, shopId } });
            await tx.customer.updateMany({
                where: { id: data.customerId, shopId },
                data: data.currency === "AFN"
                    ? { balanceAfn: { decrement: data.amount } }
                    : { balanceUsd: { decrement: data.amount } },
            });
            return p;
        });
        res.status(201).json(payment);
    }
    catch (err) {
        next(err);
    }
});
exports.paymentsRouter.delete("/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.payment.deleteMany({ where: { id: req.params.id, shopId: req.auth.shopId } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=payments.js.map