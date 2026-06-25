"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.productsRouter = (0, express_1.Router)();
exports.productsRouter.use(authenticate_1.authenticate);
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
    barcode: zod_1.z.string().max(100).optional().nullable(),
    buyPriceAfn: zod_1.z.number().min(0),
    buyPriceUsd: zod_1.z.number().min(0),
    sellPriceAfn: zod_1.z.number().min(0),
    sellPriceUsd: zod_1.z.number().min(0),
    stock: zod_1.z.number().int().min(0),
    minStock: zod_1.z.number().int().min(0),
    description: zod_1.z.string().max(1000).default(""),
});
exports.productsRouter.get("/", async (req, res, next) => {
    try {
        const shopId = req.auth.shopId;
        const page = Math.max(1, Number(req.query.page ?? 1));
        const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
        const search = String(req.query.search ?? "");
        const [total, items] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.product.count({ where: { shopId, name: search ? { contains: search, mode: "insensitive" } : undefined } }),
            prisma_1.prisma.product.findMany({
                where: { shopId, name: search ? { contains: search, mode: "insensitive" } : undefined },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: "asc" },
            }),
        ]);
        res.json({ data: items, total, page, limit });
    }
    catch (err) {
        next(err);
    }
});
exports.productsRouter.get("/:id", async (req, res, next) => {
    try {
        const item = await prisma_1.prisma.product.findFirst({ where: { id: req.params.id, shopId: req.auth.shopId } });
        if (!item) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
exports.productsRouter.post("/", async (req, res, next) => {
    try {
        const data = productSchema.parse(req.body);
        const item = await prisma_1.prisma.product.create({ data: { ...data, shopId: req.auth.shopId } });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
exports.productsRouter.put("/:id", async (req, res, next) => {
    try {
        const data = productSchema.parse(req.body);
        const item = await prisma_1.prisma.product.updateMany({ where: { id: req.params.id, shopId: req.auth.shopId }, data });
        if (item.count === 0) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
exports.productsRouter.delete("/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.product.deleteMany({ where: { id: req.params.id, shopId: req.auth.shopId } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=products.js.map