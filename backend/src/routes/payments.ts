import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const paymentsRouter = Router();
paymentsRouter.use(authenticate);

const paymentSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().min(0.01),
  currency: z.enum(["AFN", "USD"]).default("AFN"),
  note: z.string().max(500).default(""),
});

paymentsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const shopId = req.auth!.shopId!;
    const customerId = req.query.customerId as string | undefined;
    const items = await prisma.payment.findMany({
      where: { shopId, ...(customerId ? { customerId } : {}) },
      orderBy: { paidAt: "desc" },
    });
    res.json(items);
  } catch (err) { next(err); }
});

paymentsRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const shopId = req.auth!.shopId!;
    const data = paymentSchema.parse(req.body);
    const payment = await prisma.$transaction(async (tx) => {
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
  } catch (err) { next(err); }
});

paymentsRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.payment.deleteMany({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
