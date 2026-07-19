import { Request, Response, NextFunction } from "express";
export declare const verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map