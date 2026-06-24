import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const withdrawalsRouter = Router();
withdrawalsRouter.use(authenticate);

const schema = z.object({
  category: z.enum(["SHAREHOLDER", "CUSTOMER"]),
  personName: z.string().min(1).max(200),
  customerId: z.string().uuid().optional().nullable(),
  amountAfn: z.number().min(0).default(0),
  amountUsd: z.number().min(0).default(0),
  description: z.string().max(1000).default(""),
});

withdrawalsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.withdrawal.findMany({ where: { shopId: req.auth!.shopId! }, orderBy: { withdrawnAt: "desc" } });
    res.json(items);
  } catch (err) { next(err); }
});

withdrawalsRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = schema.parse(req.body);
    const item = await prisma.withdrawal.create({ data: { ...data, shopId: req.auth!.shopId! } });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

withdrawalsRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.withdrawal.deleteMany({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
