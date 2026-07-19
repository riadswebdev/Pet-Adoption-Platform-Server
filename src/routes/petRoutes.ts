import { Router } from "express";
import {
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  getMyPets,
  getMyPetsSummary,
  updatePetStatus,
  getAdminDashboardStats,
  getAdminRecentActivity,
  getAllPetsForAdmin,
  getAdminUsers,
  getCurrentUserProfile,
} from "../controllers/petController";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.get("/", getPets);
router.get("/health", (_req, res) => res.status(200).json({ status: "OK" }));
router.get("/me/summary", requireAuth, getMyPetsSummary);

// Admin routes
router.get("/admin/stats", requireAuth, requireRole(["admin"]), getAdminDashboardStats);
router.get(
  "/admin/recent-activity",
  requireAuth,
  requireRole(["admin"]),
  getAdminRecentActivity,
);
router.get("/admin/all", requireAuth, requireRole(["admin"]), getAllPetsForAdmin);
router.get("/admin/users", requireAuth, requireRole(["admin"]), getAdminUsers);
router.put("/admin/:id/status", requireAuth, requireRole(["admin"]), updatePetStatus);

// Protected user routes
router.get("/my-pets", requireAuth, requireRole(["user"]), getMyPets);
router.post("/", requireAuth, requireRole(["user"]), createPet);
router.put("/:id", requireAuth, requireRole(["user", "admin"]), updatePet);
router.delete("/:id", requireAuth, requireRole(["user", "admin"]), deletePet);
router.get("/:id", getPetById);

// Profile routes
router.get("/users/me", requireAuth, requireRole(["user", "admin"]), getCurrentUserProfile);

export default router;
