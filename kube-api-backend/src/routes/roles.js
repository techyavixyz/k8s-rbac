import { Router } from "express";
import {
  createRole,
  createClusterRole,
  listRoles,
  listClusterRoles,
  getRoleBindings,
  deleteRole,
  diffRole,
  roleUsage
} from "../controllers/role.controller.js";

import { runOut } from "../utils/exec.js";

const r = Router();

/* ================= CREATE ================= */

r.post("/role", createRole);
r.post("/clusterrole", createClusterRole);

/* ================= LIST ================= */

r.get("/role", listRoles);
r.get("/clusterrole", listClusterRoles);

/* ================= USAGE ================= */

r.get("/usage", roleUsage);

/* ================= FETCH YAML (NEW) ================= */
/**
 * GET /api/roles/yaml?name=&namespace=&cluster=true|false
 */
r.get("/yaml", (req, res) => {
  const { name, namespace, cluster } = req.query;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const cmd = cluster === "true"
    ? `kubectl get clusterrole ${name} -o yaml`
    : `kubectl get role ${name} -n ${namespace} -o yaml`;

  const yaml = runOut(cmd);
  res.json({ yaml });
});



/* ================= AGGREGATED ================= */

r.get("/", async (req, res) => {
  const roles = JSON.parse(
    runOut("kubectl get roles --all-namespaces -o json")
  ).items.map(r => ({
    name: r.metadata.name,
    namespace: r.metadata.namespace,
    kind: "Role"
  }));

  const clusterRoles = JSON.parse(
    runOut("kubectl get clusterroles -o json")
  ).items.map(r => ({
    name: r.metadata.name,
    kind: "ClusterRole"
  }));

  res.json([...roles, ...clusterRoles]);
});

/* ================= ROLE → BINDINGS ================= */

r.get("/bindings/:namespace/:name", getRoleBindings);

/* ================= DELETE ================= */

r.post("/delete", deleteRole);

/* ================= DIFF ================= */

r.post("/diff", diffRole);

export default r;
