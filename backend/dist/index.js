"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = require("./routes/auth");
const shopAuth_1 = require("./routes/shopAuth");
const products_1 = require("./routes/products");
const customers_1 = require("./routes/customers");
const sales_1 = require("./routes/sales");
const payments_1 = require("./routes/payments");
const suppliers_1 = require("./routes/suppliers");
const shareholders_1 = require("./routes/shareholders");
const expenses_1 = require("./routes/expenses");
const withdrawals_1 = require("./routes/withdrawals");
const users_1 = require("./routes/users");
const activityLogs_1 = require("./routes/activityLogs");
const cash_1 = require("./routes/cash");
const admin_1 = require("./routes/admin");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const csrf_1 = require("./middleware/csrf");
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 4000;
// Security
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
// Rate limiting
app.use("/api/auth", (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use("/api", (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: 300 }));
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json({ limit: "2mb" }));
app.use((0, cookie_parser_1.default)());
// CSRF Protection
app.use(csrf_1.setCsrfToken);
app.use(csrf_1.verifyCsrfToken);
// Health check
app.get("/health", (_req, res) => res.json({
    status: "ok",
    ts: new Date().toISOString(),
}));
// Routes
app.use("/api/auth", auth_1.authRouter);
app.use("/api/shop-auth", shopAuth_1.shopAuthRouter);
app.use("/api/products", products_1.productsRouter);
app.use("/api/categories", products_1.productsRouter);
app.use("/api/customers", customers_1.customersRouter);
app.use("/api/sales", sales_1.salesRouter);
app.use("/api/payments", payments_1.paymentsRouter);
app.use("/api/suppliers", suppliers_1.suppliersRouter);
app.use("/api/shareholders", shareholders_1.shareholdersRouter);
app.use("/api/expenses", expenses_1.expensesRouter);
app.use("/api/withdrawals", withdrawals_1.withdrawalsRouter);
app.use("/api/users", users_1.usersRouter);
app.use("/api/logs", activityLogs_1.activityLogsRouter);
app.use("/api/cash", cash_1.cashRouter);
app.use("/api/admin", admin_1.adminRouter);
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map