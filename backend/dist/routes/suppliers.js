"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppliersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.suppliersRouter = (0, express_1.Router)();
exports.suppliersRouter.use(authenticate_1.authenticate);
const supplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    companyName: zod_1.z.string().max(200).default(""),
    phone: zod_1.z.string().max(30).default(""),
    address: zod_1.z.string().max(500).default(""),
    balanceAfn: zod_1.z.number().default(0),
    balanceUsd: zod_1.z.number().default(0),
});
const purchaseItemSchema = zod_1.z.object({ name: zod_1.z.string(), quantity: zod_1.z.number(), price: zod_1.z.number() });
const purchaseSchema = zod_1.z.object({
    supplierId: zod_1.z.string().uuid(),
    totalAmountAfn: zod_1.z.number().min(0),
    totalAmountUsd: zod_1.z.number().min(0),
    paidAmountAfn: zod_1.z.number().min(0).default(0),
    paidAmountUsd: zod_1.z.number().min(0).default(0),
    items: zod_1.z.array(purchaseItemSchema),
    description: zod_1.z.string().max(1000).default(""),
});
const paymentSchema = zod_1.z.object({
    supplierId: zod_1.z.string().uuid(),
    amountAfn: zod_1.z.number().min(0).default(0),
    amountUsd: zod_1.z.number().min(0).default(0),
    note: zod_1.z.string().max(500).default(""),
});
exports.suppliersRouter.get("/", async (req, res, next) => {
    try {
        const items = await prisma_1.prisma.supplier.findMany({ where: { shopId: req.auth.shopId }, orderBy: { name: "asc" } });
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
exports.suppliersRouter.post("/", async (req, res, next) => {
    try {
        const data = supplierSchema.parse(req.body);
        const item = await prisma_1.prisma.supplier.create({ data: { ...data, shopId: req.auth.shopId } });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
exports.suppliersRouter.put("/:id", async (req, res, next) => {
    try {
        const data = supplierSchema.parse(req.body);
        await prisma_1.prisma.supplier.updateMany({ where: { id: req.params.id, shopId: req.auth.shopId }, data });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
exports.suppliersRouter.delete("/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.supplier.deleteMany({ where: { id: req.params.id, shopId: req.auth.shopId } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
// Purchases
exports.suppliersRouter.get("/purchases", async (req, res, next) => {
    try {
        const items = await prisma_1.prisma.supplierPurchase.findMany({ where: { shopId: req.auth.shopId }, orderBy: { purchaseDate: "desc" } });
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
exports.suppliersRouter.post("/purchases", async (req, res, next) => {
    try {
        const shopId = req.auth.shopId;
        const data = purchaseSchema.parse(req.body);
        const remaining = { afn: data.totalAmountAfn - data.paidAmountAfn, usd: data.totalAmountUsd - data.paidAmountUsd };
        const purchase = await prisma_1.prisma.$transaction(async (tx) => {
            const p = await tx.supplierPurchase.create({ data: { ...data, shopId } });
            await tx.supplier.updateMany({
                where: { id: data.supplierId, shopId },
                data: { balanceAfn: { increment: remaining.afn }, balanceUsd: { increment: remaining.usd } },
            });
            return p;
        });
        res.status(201).json(purchase);
    }
    catch (err) {
        next(err);
    }
});
// Supplier payments
exports.suppliersRouter.post("/payments", async (req, res, next) => {
    try {
        const shopId = req.auth.shopId;
        const data = paymentSchema.parse(req.body);
        const payment = await prisma_1.prisma.$transaction(async (tx) => {
            const p = await tx.supplierPayment.create({ data: { ...data, shopId } });
            await tx.supplier.updateMany({
                where: { id: data.supplierId, shopId },
                data: { balanceAfn: { decrement: data.amountAfn }, balanceUsd: { decrement: data.amountUsd } },
            });
            return p;
        });
        res.status(201).json(payment);
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=suppliers.js.map