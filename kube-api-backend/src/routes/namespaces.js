import { Router } from "express";
import { coreV1 } from "../kube/client.js";

const router = Router();

/**
 * List Kubernetes namespaces
 */
router.get("/", async (req, res, next) => {
  try {
    const { body } = await coreV1.listNamespace();

    // 🛡️ Defensive: body or items may be undefined if API fails
    const namespaces = (body?.items || []).map(
      ns => ns.metadata.name
    );

    res.json(namespaces);
  } catch (err) {
    next(err);
  }
});

export default router;
