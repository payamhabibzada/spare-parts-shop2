"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.salesRouter = (0, express_1.Router)();
exports.salesRouter.use(authenticate_1.authenticate);
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().min(1),
    price: zod_1.z.number().min(0),
});
const saleSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    currency: zod_1.z.enum(["AFN", "USD"]).default("AFN"),
    totalAmount: zod_1.z.number().min(0),
    discount: zod_1.z.number().min(0).default(0),
    paidAmount: zod_1.z.number().min(0).default(0),
    remainingAmount: zod_1.z.number().min(0).default(0),
    paymentStatus: zod_1.z.enum(["PAID", "CREDIT", "PARTIAL"]).default("CREDIT"),
    invoiceNumber: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(saleItemSchema).min(1),
});
exports.salesRouter.get("/", async (req, res, next) => {
    try {
        const shopId = req.auth.shopId;
        const page = Math.max(1, Number(req.query.page ?? 1));
        const limit = Math.min(100, Number(req.query.limit ?? 50));
        const customerId = req.query.customerId;
        const where = { shopId, ...(customerId ? { customerId } : {}) };
        const [total, items] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.sale.count({ where }),
            prisma_1.prisma.sale.findMany({ where, include: { items: true }, skip: (page - 1) * limit, take: limit, orderBy: { saleDate: "desc" } }),
        ]);
        res.json({ data: items, total, page, limit });
    }
    catch (err) {
        next(err);
    }
});
exports.salesRouter.post("/", async (req, res, next) => {
    try {
        const shopId = req.auth.shopId;
        const { items, ...saleData } = saleSchema.parse(req.body);
        const sale = await prisma_1.prisma.$transaction(async (tx) => {
            const newSale = await tx.sale.create({ data: { ...saleData, shopId } });
            await tx.saleItem.createMany({
                data: items.map(i => ({ ...i, saleId: newSale.id, shopId })),
            });
            // Deduct stock
            for (const item of items) {
                await tx.product.updateMany({
                    where: { id: item.productId, shopId },
                    data: { stock: { decrement: item.quantity } },
                });
            }
            // Update customer balance (remaining_amount = new debt)
            if (saleData.remainingAmount > 0) {
                await tx.customer.updateMany({
                    where: { id: saleData.customerId, shopId },
                    data: saleData.currency === "AFN"
                        ? { balanceAfn: { increment: saleData.remainingAmount } }
                        : { balanceUsd: { increment: saleData.remainingAmount } },
                });
            }
            return newSale;
        });
        res.status(201).json(sale);
    }
    catch (err) {
        next(err);
    }
});
exports.salesRouter.delete("/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.sale.deleteMany({ where: { id: req.params.id, shopId: req.auth.shopId } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=sales.js.map