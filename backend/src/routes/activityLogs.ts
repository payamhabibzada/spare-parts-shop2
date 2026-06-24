import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const activityLogsRouter = Router();
activityLogsRouter.use(authenticate);

activityLogsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const shopId = req.auth!.shopId!;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 50));
    const [total, items] = await prisma.$transaction([
      prisma.activityLog.count({ where: { shopId } }),
      prisma.activityLog.findMany({
        where: { shopId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    res.json({ data: items, total, page, limit });
  } catch (err) { next(err); }
});
