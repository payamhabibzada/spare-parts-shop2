"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.expensesRouter = (0, express_1.Router)();
exports.expensesRouter.use(authenticate_1.authenticate);
const schema = zod_1.z.object({
    category: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(1000).default(""),
    amountAfn: zod_1.z.number().min(0).default(0),
    amountUsd: zod_1.z.number().min(0).default(0),
});
exports.expensesRouter.get("/", async (req, res, next) => {
    try {
        const items = await prisma_1.prisma.expense.findMany({ where: { shopId: req.auth.shopId }, orderBy: { expenseDate: "desc" } });
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
exports.expensesRouter.post("/", async (req, res, next) => {
    try {
        const data = schema.parse(req.body);
        const item = await prisma_1.prisma.expense.create({ data: { ...data, shopId: req.auth.shopId } });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
exports.expensesRouter.put("/:id", async (req, res, next) => {
    try {
        const data = schema.parse(req.body);
        await prisma_1.prisma.expense.updateMany({ where: { id: req.params.id, shopId: req.auth.shopId }, data });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
exports.expensesRouter.delete("/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.expense.deleteMany({ where: { id: req.params.id, shopId: req.auth.shopId } });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=expenses.js.map