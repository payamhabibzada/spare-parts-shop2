"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.customersRouter = (0, express_1.Router)();
exports.customersRouter.use(authenticate_1.authenticate);
const customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    phone: zod_1.z.string().max(30).default(""),
    address: zod_1.z.string().max(500).default(""),
    balanceAfn: zod_1.z.number().default(0),
    balanceUsd: zod_1.z.number().default(0),
});
exports.customersRouter.get("/", async (req, res, next) => {
    try {
        const shopId = req.auth.shopId;
        const page = Math.max(1, Number(req.query.page ?? 1));
        const limit = Math.min(100, Number(req.query.limit ?? 50));
        const search = String(req.query.search ?? "");
        const [total, items] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.customer.count({ where: { shopId, name: search ? { contains: search, mode: "insensitive" } : undefined } }),
            prisma_1.prisma.customer.findMany({
                where: { shopId, name: search ? { contains: search, mode: "insensitive" } : undefined },
                skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" },
            }),
        ]);
        res.json({ data: items, total, page, limit });
    }
    catch (err) {
        next(err);
    }
});
exports.customersRouter.get("/:id", async (req, res, next) => {
    try {
        const item = await prisma_1.prisma.customer.findFirst({ where: { id: req.params.id, shopId: req.auth.shopId } });
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
exports.customersRouter.post("/", async (req, res, next) => {
    try {
        const data = customerSchema.parse(req.body);
        const item = await prisma_1.prisma.customer.create({ data: { ...data, shopId: req.auth.shopId } });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
exports.customersRouter.put("/:id", async (req, res, next) => {
    try {
        const data = customerSchema.parse(req.body);
        const result = await prisma_1.prisma.customer.updateMany({ where: { id: req.params.id, shopId: req.auth.shopId }, data });
        if (result.count === 0) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
exports.customersRouter.delete("/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.customer.deleteMany({ where: { id: req.params.id, shopId: req.auth.shopId } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=customers.js.map