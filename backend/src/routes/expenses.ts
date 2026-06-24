import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const expensesRouter = Router();
expensesRouter.use(authenticate);

const schema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().max(1000).default(""),
  amountAfn: z.number().min(0).default(0),
  amountUsd: z.number().min(0).default(0),
});

expensesRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.expense.findMany({ where: { shopId: req.auth!.shopId! }, orderBy: { expenseDate: "desc" } });
    res.json(items);
  } catch (err) { next(err); }
});

expensesRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = schema.parse(req.body);
    const item = await prisma.expense.create({ data: { ...data, shopId: req.auth!.shopId! } });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

expensesRouter.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = schema.parse(req.body);
    await prisma.expense.updateMany({ where: { id: req.params.id, shopId: req.auth!.shopId! }, data });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

expensesRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.expense.deleteMany({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
