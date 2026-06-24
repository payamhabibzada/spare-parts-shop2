import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest, requireRole } from "../middleware/authenticate";

export const usersRouter = Router();
usersRouter.use(authenticate);

const createSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(200),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).default("USER"),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).default([]),
});

const updateSchema = createSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).optional(),
});

usersRouter.get("/", requireRole("ADMIN", "SUPER_ADMIN"), async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.user.findMany({
      where: { shopId: req.auth!.shopId! },
      select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true, permissions: true, createdAt: true },
    });
    res.json(items);
  } catch (err) { next(err); }
});

usersRouter.post("/", requireRole("ADMIN", "SUPER_ADMIN"), async (req: AuthRequest, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { ...data, passwordHash, shopId: req.auth!.shopId! },
      select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
});

usersRouter.put("/:id", requireRole("ADMIN", "SUPER_ADMIN"), async (req: AuthRequest, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const update: Record<string, unknown> = { ...data };
    if (data.password) {
      update.passwordHash = await bcrypt.hash(data.password, 12);
      delete update.password;
    }
    await prisma.user.updateMany({ where: { id: req.params.id, shopId: req.auth!.shopId! }, data: update });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

usersRouter.delete("/:id", requireRole("ADMIN", "SUPER_ADMIN"), async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.deleteMany({ where: { id: req.params.id, shopId: req.auth!.shopId! } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
