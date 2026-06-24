import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const suppliersRouter = Router();
suppliersRouter.use(authenticate);

const supplierSchema = z.object({
  name: z.string().min(1).max(200),
  companyName: z.string().max(200).default(""),
  phone: z.string().max(30).default(""),
  address: z.string().max(500).default(""),
  balanceAfn: z.number().default(0),
  balanceUsd: z.number().default(0),
});

const purchaseItemSchema = z.object({ name: z.string(), quantity: z.number(), price: z.number() });
const purchaseSchema = z.object({
  supplierId: z.string().uuid(),
  totalAmountAfn: z.number().min(0),
  totalAmountUsd: z.number().min(0),
  paidAmountAfn: z.number().min(0).default(0),
  paidAmountUsd: z.number().min(0).default(0),
  items: z.array(purchaseItemSchema),
  description: z.string().max(1000).default(""),
});

const paymentSchema = z.object({
  supplierId: z.string().uuid(),
  amountAfn: z.number().min(0).default(0),
  amountUsd: z.number().min(0).default(0),
  note: z.string().max(500).default(""),
});

suppliersRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.supplier.findMany({ where: { shopId: req.auth!.shopId! }, orderBy: { name: "asc" } });
    res.json(items);
  } catch (err) { next(err); }
});

suppliersRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = supplierSchema.parse(req.body);
    const item = await prisma.supplier.create({ data: { ...data, shopId: req.auth!.shopId! } });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

suppliersRouter.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = supplierSchema.parse(req.body);
    await prisma.supplier.updateMany({ where: { id: req.params.id, shopId: req.auth!.shopId! }, data });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

suppliersRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.supplier.deleteMany({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Purchases
suppliersRouter.get("/purchases", async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.supplierPurchase.findMany({ where: { shopId: req.auth!.shopId! }, orderBy: { purchaseDate: "desc" } });
    res.json(items);
  } catch (err) { next(err); }
});

suppliersRouter.post("/purchases", async (req: AuthRequest, res, next) => {
  try {
    const shopId = req.auth!.shopId!;
    const data = purchaseSchema.parse(req.body);
    const remaining = { afn: data.totalAmountAfn - data.paidAmountAfn, usd: data.totalAmountUsd - data.paidAmountUsd };
    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.supplierPurchase.create({ data: { ...data, shopId } });
      await tx.supplier.updateMany({
        where: { id: data.supplierId, shopId },
        data: { balanceAfn: { increment: remaining.afn }, balanceUsd: { increment: remaining.usd } },
      });
      return p;
    });
    res.status(201).json(purchase);
  } catch (err) { next(err); }
});

// Supplier payments
suppliersRouter.post("/payments", async (req: AuthRequest, res, next) => {
  try {
    const shopId = req.auth!.shopId!;
    const data = paymentSchema.parse(req.body);
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.supplierPayment.create({ data: { ...data, shopId } });
      await tx.supplier.updateMany({
        where: { id: data.supplierId, shopId },
        data: { balanceAfn: { decrement: data.amountAfn }, balanceUsd: { decrement: data.amountUsd } },
      });
      return p;
    });
    res.status(201).json(payment);
  } catch (err) { next(err); }
});
