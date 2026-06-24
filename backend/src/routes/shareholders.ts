import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const shareholdersRouter = Router();
shareholdersRouter.use(authenticate);

const schema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(30).default(""),
  address: z.string().max(500).default(""),
  investmentAmountAfn: z.number().min(0).default(0),
  investmentAmountUsd: z.number().min(0).default(0),
  sharePercentage: z.number().min(0).max(100).default(0),
  monthlyProfitAfn: z.number().min(0).default(0),
  monthlyProfitUsd: z.number().min(0).default(0),
  remainingProfitAfn: z.number().min(0).default(0),
  remainingProfitUsd: z.number().min(0).default(0),
});

shareholdersRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.shareHolder.findMany({ where: { shopId: req.auth!.shopId! }, orderBy: { name: "asc" } });
    res.json(items);
  } catch (err) { next(err); }
});

shareholdersRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = schema.parse(req.body);
    const item = await prisma.shareHolder.create({ data: { ...data, shopId: req.auth!.shopId! } });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

shareholdersRouter.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = schema.parse(req.body);
    await prisma.shareHolder.updateMany({ where: { id: req.params.id, shopId: req.auth!.shopId! }, data });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

shareholdersRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.shareHolder.deleteMany({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
