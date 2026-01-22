import { Router } from "express";
import {
  downloadUserKubeconfig,
  downloadSAKubeconfig
} from "../controllers/kubeconfig.controller.js";

const router = Router();

router.get("/user/:username", downloadUserKubeconfig);
router.get("/serviceaccount/:name/:namespace", downloadSAKubeconfig);

export default router;
