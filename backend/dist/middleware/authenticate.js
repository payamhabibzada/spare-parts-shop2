"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jwt_1 = require("../lib/jwt");
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid Authorization header" });
        return;
    }
    try {
        req.auth = (0, jwt_1.verifyAccessToken)(header.slice(7));
        next();
    }
    catch {
        res.status(401).json({ error: "Token expired or invalid" });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.auth || !roles.includes(req.auth.role)) {
            res.status(403).json({ error: "Insufficient permissions" });
            return;
        }
        next();
    };
}
//# sourceMappingURL=authenticate.js.map