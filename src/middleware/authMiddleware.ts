import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";

const buildHeaders = (req: Request): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (req.headers.cookie) {
    headers["cookie"] =
      Array.isArray(req.headers.cookie) ?
        req.headers.cookie.join("; ")
      : req.headers.cookie;
  }

  if (req.headers.authorization) {
    headers["authorization"] =
      Array.isArray(req.headers.authorization) ?
        req.headers.authorization.join(", ")
      : req.headers.authorization;
  }

  return headers;
};

const normalizeAuthSession = async (req: Request) => {
  const headers = buildHeaders(req);
  const session = await auth.api.getSession({ headers });

  if (!session?.user) {
    return null;
  }

  return {
    user: session.user,
    session,
  };
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authState = await normalizeAuthSession(req);

    if (!authState?.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    (req as Request & { user?: unknown; session?: unknown }).user =
      authState.user;
    (req as Request & { session?: unknown }).session = authState.session;
    next();
    return;
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
