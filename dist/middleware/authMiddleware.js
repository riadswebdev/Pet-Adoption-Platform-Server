"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = exports.verifyToken = void 0;
const auth_1 = require("../config/auth");
const verifyToken = async (req, res, next) => {
    try {
        const auth = await (0, auth_1.getAuth)();
        if (!auth) {
            res.status(500).json({ error: "Auth not initialized" });
            return;
        }
        const { fromNodeHeaders } = await import("better-auth/node");
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        if (!session || !session.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        req.user = session.user;
        next();
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