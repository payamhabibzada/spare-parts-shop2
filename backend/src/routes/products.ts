import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const productsRouter = Router();
productsRouter.use(authenticate);

const productSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.string().uuid().optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  buyPriceAfn: z.number().min(0),
  buyPriceUsd: z.number().min(0),
  sellPriceAfn: z.number().min(0),
  sellPriceUsd: z.number().min(0),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  description: z.string().max(1000).default(""),
});

productsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const shopId = req.auth!.shopId!;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const search = String(req.query.search ?? "");
    const [total, items] = await prisma.$transaction([
      prisma.product.count({ where: { shopId, name: search ? { contains: search, mode: "insensitive" } : undefined } }),
      prisma.product.findMany({
        where: { shopId, name: search ? { contains: search, mode: "insensitive" } : undefined },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
    ]);
    res.json({ data: items, total, page, limit });
  } catch (err) { next(err); }
});

productsRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const item = await prisma.product.findFirst({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json(item);
  } catch (err) { next(err); }
});

productsRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const item = await prisma.product.create({ data: { ...data, shopId: req.auth!.shopId! } });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

productsRouter.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const item = await prisma.product.updateMany({ where: { id: req.params.id, shopId: req.auth!.shopId! }, data });
    if (item.count === 0) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

productsRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.product.deleteMany({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
