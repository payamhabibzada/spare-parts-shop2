"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: "access" }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}
function signRefreshToken(sub) {
    const jti = (0, uuid_1.v4)();
    const token = jsonwebtoken_1.default.sign({ jti, sub, type: "refresh" }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
    return { token, jti };
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
}
//# sourceMappingURL=jwt.js.map