import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const cashRouter = Router();
cashRouter.use(authenticate);

cashRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const ledger = await prisma.cashLedger.findUnique({ where: { shopId: req.auth!.shopId! } });
    res.json(ledger ?? { balanceAfn: 0, balanceUsd: 0 });
  } catch (err) { next(err); }
});

cashRouter.put("/", async (req: AuthRequest, res, next) => {
  try {
    const { balanceAfn, balanceUsd } = z.object({
      balanceAfn: z.number(),
      balanceUsd: z.number(),
    }).parse(req.body);
    const shopId = req.auth!.shopId!;
    const ledger = await prisma.cashLedger.upsert({
      where: { shopId },
      create: { shopId, balanceAfn, balanceUsd },
      update: { balanceAfn, balanceUsd },
    });
    res.json(ledger);
  } catch (err) { next(err); }
});
