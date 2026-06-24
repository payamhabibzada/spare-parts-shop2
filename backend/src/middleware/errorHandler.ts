import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  if (err instanceof ZodError) {
    res.status(422).json({ error: "Validation error", details: err.flatten() });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Duplicate entry — a record with this value already exists" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Record not found" });
      return;
    }
  }

  if (err instanceof Error && 'statusCode' in err && typeof (err as any).statusCode === 'number') {
    const status = (err as any).statusCode;
    res.status(status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}
