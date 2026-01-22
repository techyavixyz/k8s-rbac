import fs from "fs";
import User from "../models/User.js";
import RoleBinding from "../models/RoleBinding.js";
import ClusterRoleBinding from "../models/ClusterRoleBinding.js";
import AuditLog from "../models/AuditLog.js";

import { createUserCert } from "../services/cert.service.js";
import { generateUserKubeconfig } from "../services/kubeconfig.service.js";
import { rbacV1 } from "../kube/client.js";

/* ============================================================
   CREATE USER
============================================================ */
export async function createUser(req, res) {
  const { username, groups } = req.body;

  console.log("👤 [CREATE USER] Request received:", { username, groups });

  if (!username) {
    console.warn("❌ [CREATE USER] username missing");
    return res.status(400).json({ error: "username is required" });
  }

  const existing = await User.findOne({ username });
  if (existing) {
    console.warn(`⚠️ [CREATE USER] User already exists: ${username}`);
    return res.status(409).json({
      error: "User already exists",
      username
    });
  }

  console.log(`🔐 [CREATE USER] Generating certificate for ${username}`);
  const certDir = await createUserCert(username, groups || []);

  console.log(`📄 [CREATE USER] Generating kubeconfig for ${username}`);
  const kubeconfigPath = generateUserKubeconfig(username, certDir);

  const user = await User.create({
    username,
    groups,
    certPath: certDir,
    kubeconfigPath,
    status: "active"
  });

  console.log(`💾 [CREATE USER] User stored in DB: ${username}`);

  await AuditLog.create({
    action: "USER_CREATED",
    entityType: "User",
    entityId: username,
    metadata: { groups }
  });

  console.log(`📜 [AUDIT] USER_CREATED → ${username}`);
  console.log(`✅ [CREATE USER] Completed for ${username}\n`);

  res.json(user);
}

/* ============================================================
   LIST USERS
============================================================ */
export async function listUsers(req, res) {
  console.log("📋 [LIST USERS] Fetching users");
  const users = await User.find();
  console.log(`✅ [LIST USERS] Found ${users.length} users`);
  res.json(users);
}

/* ============================================================
   DISABLE USER (SOFT REVOKE)
============================================================ */
export async function disableUser(req, res) {
  const { username } = req.params;
  console.log(`🚫 [DISABLE USER] Requested for ${username}`);

  const user = await User.findOne({ username });
  if (!user) {
    console.warn(`❌ [DISABLE USER] User not found: ${username}`);
    return res.status(404).json({ error: "User not found" });
  }

  if (user.status === "disabled") {
    console.log(`ℹ️ [DISABLE USER] User already disabled: ${username}`);
    return res.json({ message: "User already disabled" });
  }

  const subjectsToRevoke = [username, ...(user.groups || [])];
  console.log("🔗 [DISABLE USER] Revoking subjects:", subjectsToRevoke);

  /* ================= ROLE BINDINGS ================= */
  const roleBindings = await RoleBinding.find({
    "subjects.name": { $in: subjectsToRevoke }
  });

  console.log(`🔍 Found ${roleBindings.length} RoleBindings to revoke`);

  for (const rb of roleBindings) {
    console.log(`🗑️ Deleting RoleBinding ${rb.name} (ns=${rb.namespace})`);

    await rbacV1.deleteNamespacedRoleBinding({
      name: rb.name,
      namespace: rb.namespace
    });

    await rb.deleteOne();
  }

  /* ================= CLUSTER ROLE BINDINGS ================= */
  const clusterRoleBindings = await ClusterRoleBinding.find({
    "subjects.name": { $in: subjectsToRevoke }
  });

  console.log(
    `🔍 Found ${clusterRoleBindings.length} ClusterRoleBindings to revoke`
  );

  for (const crb of clusterRoleBindings) {
    console.log(`🗑️ Deleting ClusterRoleBinding ${crb.name}`);

    await rbacV1.deleteClusterRoleBinding({
      name: crb.name
    });

    await crb.deleteOne();
  }

  /* ================= FILE CLEANUP ================= */
  if (user.certPath && fs.existsSync(user.certPath)) {
    console.log(`🧹 Removing cert directory: ${user.certPath}`);
    fs.rmSync(user.certPath, { recursive: true, force: true });
  }

  if (user.kubeconfigPath && fs.existsSync(user.kubeconfigPath)) {
    console.log(`🧹 Removing kubeconfig: ${user.kubeconfigPath}`);
    fs.unlinkSync(user.kubeconfigPath);
  }

  user.status = "disabled";
  user.revokedAt = new Date();
  user.certPath = null;
  user.kubeconfigPath = null;

  await user.save();

  console.log(`💾 [DISABLE USER] User marked disabled in DB: ${username}`);

  await AuditLog.create({
    action: "USER_DISABLED",
    entityType: "User",
    entityId: username,
    metadata: { groups: user.groups }
  });

  console.log(`📜 [AUDIT] USER_DISABLED → ${username}`);
  console.log(`✅ [DISABLE USER] Completed for ${username}\n`);

  res.json({
    message: `User '${username}' disabled (soft revoke)`
  });
}

/* ============================================================
   ENABLE USER (ROTATE CERT)
============================================================ */
export async function enableUser(req, res) {
  const { username } = req.params;
  console.log(`🔁 [ENABLE USER] Requested for ${username}`);

  const user = await User.findOne({ username });
  if (!user) {
    console.warn(`❌ [ENABLE USER] User not found: ${username}`);
    return res.status(404).json({ error: "User not found" });
  }

  if (user.status === "active") {
    console.log(`ℹ️ [ENABLE USER] User already active: ${username}`);
    return res.json({ message: "User already active" });
  }

  console.log(`🔐 [ENABLE USER] Rotating cert for ${username}`);
  const certDir = await createUserCert(username, user.groups || []);

  console.log(`📄 [ENABLE USER] Generating new kubeconfig`);
  const kubeconfigPath = generateUserKubeconfig(username, certDir);

  user.certPath = certDir;
  user.kubeconfigPath = kubeconfigPath;
  user.status = "active";
  user.revokedAt = null;

  await user.save();

  console.log(`💾 [ENABLE USER] User reactivated in DB: ${username}`);

  await AuditLog.create({
    action: "USER_REENABLED",
    entityType: "User",
    entityId: username,
    metadata: { groups: user.groups }
  });

  console.log(`📜 [AUDIT] USER_REENABLED → ${username}`);
  console.log(`✅ [ENABLE USER] Completed for ${username}\n`);

  res.json({
    message: `User '${username}' re-enabled successfully`,
    kubeconfigPath
  });
}

/* ============================================================
   HARD DELETE USER
============================================================ */
export async function deleteUser(req, res) {
  const { username } = req.params;
  console.log(`💣 [DELETE USER] Requested for ${username}`);

  const user = await User.findOne({ username });
  if (!user) {
    console.warn(`❌ [DELETE USER] User not found: ${username}`);
    return res.status(404).json({ error: "User not found" });
  }

  const subjectsToRevoke = [username, ...(user.groups || [])];

  console.log("🔗 [DELETE USER] Revoking subjects:", subjectsToRevoke);

  const roleBindings = await RoleBinding.find({
    "subjects.name": { $in: subjectsToRevoke }
  });

  for (const rb of roleBindings) {
    console.log(`🗑️ Deleting RoleBinding ${rb.name} (ns=${rb.namespace})`);
    await rbacV1.deleteNamespacedRoleBinding({
      name: rb.name,
      namespace: rb.namespace
    });
    await rb.deleteOne();
  }

  const clusterRoleBindings = await ClusterRoleBinding.find({
    "subjects.name": { $in: subjectsToRevoke }
  });

  for (const crb of clusterRoleBindings) {
    console.log(`🗑️ Deleting ClusterRoleBinding ${crb.name}`);
    await rbacV1.deleteClusterRoleBinding({ name: crb.name });
    await crb.deleteOne();
  }

  if (user.certPath && fs.existsSync(user.certPath)) {
    console.log(`🧹 Removing cert directory: ${user.certPath}`);
    fs.rmSync(user.certPath, { recursive: true, force: true });
  }

  if (user.kubeconfigPath && fs.existsSync(user.kubeconfigPath)) {
    console.log(`🧹 Removing kubeconfig: ${user.kubeconfigPath}`);
    fs.unlinkSync(user.kubeconfigPath);
  }

  await user.deleteOne();

  console.log(`💀 [DELETE USER] User removed from DB: ${username}`);

  await AuditLog.create({
    action: "USER_DELETED",
    entityType: "User",
    entityId: username,
    metadata: { groups: user.groups }
  });

  console.log(`📜 [AUDIT] USER_DELETED → ${username}`);
  console.log(`✅ [DELETE USER] Completed for ${username}\n`);

  res.json({
    message: `User '${username}' deleted permanently`
  });
}
