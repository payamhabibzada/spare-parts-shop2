"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.cashRouter = (0, express_1.Router)();
exports.cashRouter.use(authenticate_1.authenticate);
exports.cashRouter.get("/", async (req, res, next) => {
    try {
        const ledger = await prisma_1.prisma.cashLedger.findUnique({ where: { shopId: req.auth.shopId } });
        res.json(ledger ?? { balanceAfn: 0, balanceUsd: 0 });
    }
    catch (err) {
        next(err);
    }
});
exports.cashRouter.put("/", async (req, res, next) => {
    try {
        const { balanceAfn, balanceUsd } = zod_1.z.object({
            balanceAfn: zod_1.z.number(),
            balanceUsd: zod_1.z.number(),
        }).parse(req.body);
        const shopId = req.auth.shopId;
        const ledger = await prisma_1.prisma.cashLedger.upsert({
            where: { shopId },
            create: { shopId, balanceAfn, balanceUsd },
            update: { balanceAfn, balanceUsd },
        });
        res.json(ledger);
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=cash.js.map