import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest, requireRole } from "../middleware/authenticate";

export const adminRouter = Router();
// All admin routes require SHOP_OWNER or super admin token
adminRouter.use(authenticate);
adminRouter.use(requireRole("SHOP_OWNER", "SUPER_ADMIN"));

const shopSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().max(30).default(""),
  shopName: z.string().min(1).max(200),
  isActive: z.boolean().default(true),
});

adminRouter.get("/shops", async (_req, res, next) => {
  try {
    const shops = await prisma.shopUser.findMany({
      select: { id: true, name: true, email: true, shopName: true, isActive: true, createdAt: true, phone: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(shops);
  } catch (err) { next(err); }
});

adminRouter.post("/shops", async (req: AuthRequest, res, next) => {
  try {
    const data = shopSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);
    const shop = await prisma.shopUser.create({
      data: { ...data, passwordHash },
      select: { id: true, name: true, email: true, shopName: true, isActive: true },
    });
    res.status(201).json(shop);
  } catch (err) { next(err); }
});

adminRouter.put("/shops/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = shopSchema.partial().parse(req.body);
    const update: Record<string, unknown> = { ...data };
    if (data.password) {
      update.passwordHash = await bcrypt.hash(data.password, 12);
      delete update.password;
    }
    await prisma.shopUser.update({ where: { id: req.params.id }, data: update });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

adminRouter.delete("/shops/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.shopUser.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
