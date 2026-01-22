import { Router } from "express";
import {
  createRoleBinding,
  createClusterRoleBinding,
  listRoleBindings,
  listClusterRoleBindings,
  deleteBinding,
  getBindingYAML,
  applyBindingYAML
} from "../controllers/binding.controller.js";

const router = Router();

/* CREATE */
router.post("/rolebinding", createRoleBinding);
router.post("/clusterrolebinding", createClusterRoleBinding);

/* LIST */
router.get("/rolebindings", listRoleBindings);
router.get("/clusterrolebindings", listClusterRoleBindings);

/* YAML */
router.get("/yaml/:name", getBindingYAML);
router.post("/apply-yaml", applyBindingYAML);

/* DELETE */
router.post("/delete", deleteBinding);

export default router;
