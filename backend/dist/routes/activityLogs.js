"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogsRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../middleware/authenticate");
exports.activityLogsRouter = (0, express_1.Router)();
exports.activityLogsRouter.use(authenticate_1.authenticate);
exports.activityLogsRouter.get("/", async (req, res, next) => {
    try {
        const shopId = req.auth.shopId;
        const page = Math.max(1, Number(req.query.page ?? 1));
        const limit = Math.min(100, Number(req.query.limit ?? 50));
        const [total, items] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.activityLog.count({ where: { shopId } }),
            prisma_1.prisma.activityLog.findMany({
                where: { shopId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
        ]);
        res.json({ data: items, total, page, limit });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=activityLogs.js.map