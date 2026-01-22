import { Router } from "express";
import User from "../models/User.js";
import Group from "../models/Group.js";
import RoleBinding from "../models/RoleBinding.js";
import ClusterRoleBinding from "../models/ClusterRoleBinding.js";
import { canI } from "../controllers/rbac.controller.js";

const router = Router();

/**
 * Permission simulator
 */
router.post("/can-i", canI);

/**
 * RBAC SUMMARY
 * Who has access to what and why
 */
router.get("/summary", async (req, res) => {
  const users = await User.find();
  const groups = await Group.find();
  const roleBindings = await RoleBinding.find();
  const clusterRoleBindings = await ClusterRoleBinding.find();

  res.json({
    users,
    groups,
    roleBindings,
    clusterRoleBindings
  });
});

/**
 * RBAC GRAPH DATA
 * Role ↔ Binding ↔ User/Group
 */
router.get("/graph", async (req, res) => {
  const users = await User.find();
  const groups = await Group.find();
  const roleBindings = await RoleBinding.find();
  const clusterRoleBindings = await ClusterRoleBinding.find();

  const nodes = [
    ...users.map(u => ({ id: u.username, type: "User" })),
    ...groups.map(g => ({ id: g.name, type: "Group" }))
  ];

  const edges = [
    ...roleBindings.flatMap(b =>
      b.subjects.map(s => ({
        from: s.name,
        to: b.roleRef.name,
        type: "RoleBinding"
      }))
    ),
    ...clusterRoleBindings.flatMap(b =>
      b.subjects.map(s => ({
        from: s.name,
        to: b.roleRef.name,
        type: "ClusterRoleBinding"
      }))
    )
  ];

  res.json({ nodes, edges });
});

/**
 * ✅ IMPORTANT
 * Default export REQUIRED for server.js
 */
export default router;
