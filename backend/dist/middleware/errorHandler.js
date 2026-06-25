"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
function errorHandler(err, _req, res, _next) {
    console.error(err);
    if (err instanceof zod_1.ZodError) {
        res.status(422).json({ error: "Validation error", details: err.flatten() });
        return;
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            res.status(409).json({ error: "Duplicate entry — a record with this value already exists" });
            return;
        }
        if (err.code === "P2025") {
            res.status(404).json({ error: "Record not found" });
            return;
        }
    }
    if (err instanceof Error && 'statusCode' in err && typeof err.statusCode === 'number') {
        const status = err.statusCode;
        res.status(status).json({ error: err.message });
        return;
    }
    res.status(500).json({ error: "Internal server error" });
}
//# sourceMappingURL=errorHandler.js.map