import { Request, Response, NextFunction } from "express";

import { getAuth } from "../config/auth";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = await getAuth();
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

    (req as any).user = session.user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  return verifyToken(req, res, next);
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

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
