import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
        image?: string;
        avatar?: string;
        phone?: string;
        address?: string;
        bio?: string;
        role?: string;
    };
}
export declare const getPets: (req: Request, res: Response) => Promise<void>;
export declare const getPetById: (req: Request, res: Response) => Promise<void>;
export declare const createPet: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePet: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deletePet: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyPets: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyPetsSummary: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAdminRecentActivity: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAdminUsers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAdminDashboardStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAllPetsForAdmin: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updatePetStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCurrentUserProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=petController.d.ts.map