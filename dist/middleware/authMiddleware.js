"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = exports.verifyToken = void 0;
const verifyToken = async (_req, res, _next) => {
    try {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
};
exports.verifyToken = verifyToken;
const requireAuth = async (req, res, next) => {
    return (0, exports.verifyToken)(req, res, next);
};
exports.requireAuth = requireAuth;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const normalizedRole = (user.role || "user").toLowerCase();
        const allowed = allowedRoles.map((role) => role.toLowerCase());
        if (!allowed.includes(normalizedRole)) {
            res
                .status(403)
                .json({ error: "Forbidden: Insufficient role privileges" });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=authMiddleware.js.map