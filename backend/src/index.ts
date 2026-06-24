import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { authRouter } from "./routes/auth";
import { shopAuthRouter } from "./routes/shopAuth";
import { productsRouter } from "./routes/products";
import { customersRouter } from "./routes/customers";
import { salesRouter } from "./routes/sales";
import { paymentsRouter } from "./routes/payments";
import { suppliersRouter } from "./routes/suppliers";
import { shareholdersRouter } from "./routes/shareholders";
import { expensesRouter } from "./routes/expenses";
import { withdrawalsRouter } from "./routes/withdrawals";
import { usersRouter } from "./routes/users";
import { activityLogsRouter } from "./routes/activityLogs";
import { cashRouter } from "./routes/cash";
import { adminRouter } from "./routes/admin";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { setCsrfToken, verifyCsrfToken } from "./middleware/csrf";

const app = express();
const PORT = process.env.PORT ?? 4000;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  credentials: true,
}));

// Rate limiting
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.use(morgan("combined"));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// CSRF Protection (set token on all routes, verify on state-changing methods)
app.use(setCsrfToken);
app.use(verifyCsrfToken);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// Routes — shop-level auth
app.use("/api/auth", authRouter);
app.use("/api/shop-auth", shopAuthRouter);

// Routes — resource endpoints (all require shop JWT)
app.use("/api/products", productsRouter);
app.use("/api/categories", productsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/sales", salesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/shareholders", shareholdersRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/users", usersRouter);
app.use("/api/logs", activityLogsRouter);
app.use("/api/cash", cashRouter);

// Super-admin routes
app.use("/api/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

export default app;
