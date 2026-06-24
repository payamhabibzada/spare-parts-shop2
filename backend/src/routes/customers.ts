import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const customersRouter = Router();
customersRouter.use(authenticate);

const customerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(30).default(""),
  address: z.string().max(500).default(""),
  balanceAfn: z.number().default(0),
  balanceUsd: z.number().default(0),
});

customersRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const shopId = req.auth!.shopId!;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 50));
    const search = String(req.query.search ?? "");
    const [total, items] = await prisma.$transaction([
      prisma.customer.count({ where: { shopId, name: search ? { contains: search, mode: "insensitive" } : undefined } }),
      prisma.customer.findMany({
        where: { shopId, name: search ? { contains: search, mode: "insensitive" } : undefined },
        skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" },
      }),
    ]);
    res.json({ data: items, total, page, limit });
  } catch (err) { next(err); }
});

customersRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const item = await prisma.customer.findFirst({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json(item);
  } catch (err) { next(err); }
});

customersRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = customerSchema.parse(req.body);
    const item = await prisma.customer.create({ data: { ...data, shopId: req.auth!.shopId! } });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

customersRouter.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = customerSchema.parse(req.body);
    const result = await prisma.customer.updateMany({ where: { id: req.params.id, shopId: req.auth!.shopId! }, data });
    if (result.count === 0) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

customersRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.customer.deleteMany({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
