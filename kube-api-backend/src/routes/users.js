import { Router } from "express";
import {
  createUser,
  listUsers,
  disableUser,
  enableUser,
  deleteUser
} from "../controllers/user.controller.js";

const router = Router();

/**
 * Create user
 */
router.post("/", createUser);

/**
 * List users
 */
router.get("/", listUsers);

/**
 * Soft revoke (disable user)
 */
router.post("/:username/disable", disableUser);

/**
 * Re-enable user (rotate cert + kubeconfig)
 */
router.post("/:username/enable", enableUser);

/**
 * Hard delete (permanent revoke)
 */
router.delete("/:username", deleteUser);

export default router;
