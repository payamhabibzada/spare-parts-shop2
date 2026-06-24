import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { Prisma } from "@prisma/client";

export const salesRouter = Router();
salesRouter.use(authenticate);

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
});

const saleSchema = z.object({
  customerId: z.string().uuid(),
  currency: z.enum(["AFN", "USD"]).default("AFN"),
  totalAmount: z.number().min(0),
  discount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  remainingAmount: z.number().min(0).default(0),
  paymentStatus: z.enum(["PAID", "CREDIT", "PARTIAL"]).default("CREDIT"),
  invoiceNumber: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1),
});

salesRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const shopId = req.auth!.shopId!;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 50));
    const customerId = req.query.customerId as string | undefined;
    const where: Prisma.SaleWhereInput = { shopId, ...(customerId ? { customerId } : {}) };
    const [total, items] = await prisma.$transaction([
      prisma.sale.count({ where }),
      prisma.sale.findMany({ where, include: { items: true }, skip: (page - 1) * limit, take: limit, orderBy: { saleDate: "desc" } }),
    ]);
    res.json({ data: items, total, page, limit });
  } catch (err) { next(err); }
});

salesRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const shopId = req.auth!.shopId!;
    const { items, ...saleData } = saleSchema.parse(req.body);

    const sale = await prisma.$transaction(async (tx) => {
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
  } catch (err) { next(err); }
});

salesRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.sale.deleteMany({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
