import yaml from "js-yaml";
import { rbacV1 } from "../kube/client.js";
import RoleBinding from "../models/RoleBinding.js";
import ClusterRoleBinding from "../models/ClusterRoleBinding.js";
import Role from "../models/Role.js";

/* ================= CREATE ================= */

export async function createRole(req, res) {
  const { name, namespaces, namespace, rules } = req.body;
  const targets = namespaces?.length ? namespaces : [namespace];

  if (!name || !Array.isArray(rules) || rules.length === 0 || !targets?.length) {
    return res.status(400).json({ error: "Invalid role data" });
  }

  try {
    for (const ns of targets) {
      console.log(`🛠️ Creating Role '${name}' in namespace '${ns}'`);

      await rbacV1.createNamespacedRole({
        namespace: ns,
        body: {
          apiVersion: "rbac.authorization.k8s.io/v1",
          kind: "Role",
          metadata: { name },
          rules
        }
      });

      // 🔹 Mirror into DB (upsert-safe)
      await Role.updateOne(
        { name, namespace: ns, type: "Role" },
        {
          name,
          namespace: ns,
          rules,
          type: "Role"
        },
        { upsert: true }
      );

      console.log(`✅ Role '${name}' created & stored for namespace '${ns}'`);
    }

    res.json({ success: true, namespaces: targets });
  } catch (e) {
    console.error("❌ Failed to create Role:", e?.body || e?.message);
    res.status(500).json({
      error: "Failed to create role",
      details: e?.body || e?.message
    });
  }
}

export async function createClusterRole(req, res) {
  const { name, rules } = req.body;

  if (!name || !Array.isArray(rules) || rules.length === 0) {
    return res.status(400).json({ error: "Invalid cluster role data" });
  }

  try {
    console.log(`🛠️ Creating ClusterRole '${name}'`);

    await rbacV1.createClusterRole({
      body: {
        apiVersion: "rbac.authorization.k8s.io/v1",
        kind: "ClusterRole",
        metadata: { name },
        rules
      }
    });

    // 🔹 Mirror into DB
    await Role.updateOne(
      { name, type: "ClusterRole" },
      {
        name,
        namespace: null,
        rules,
        type: "ClusterRole"
      },
      { upsert: true }
    );

    console.log(`✅ ClusterRole '${name}' created & stored`);

    res.json({ success: true });
  } catch (e) {
    console.error("❌ Failed to create ClusterRole:", e?.body || e?.message);
    res.status(500).json({
      error: "Failed to create cluster role",
      details: e?.body || e?.message
    });
  }
}

/* ================= LIST ================= */

export async function listRoles(req, res) {
  const namespace = req.query.namespace || "default";

  const { body } = await rbacV1.listNamespacedRole({ namespace });

  res.json(
    (body?.items || []).map(r => ({
      name: r.metadata.name,
      namespace: r.metadata.namespace,
      rules: r.rules
    }))
  );
}

export async function listClusterRoles(req, res) {
  const { body } = await rbacV1.listClusterRole();

  res.json(
    (body?.items || []).map(r => ({
      name: r.metadata.name,
      rules: r.rules
    }))
  );
}

/* ================= ROLE → BINDINGS ================= */

export async function getRoleBindings(req, res) {
  const { name, namespace } = req.params;

  const rbs = await RoleBinding.find({
    namespace,
    "roleRef.name": name
  });

  const crbs = await ClusterRoleBinding.find({
    "roleRef.name": name
  });

  res.json({
    roleBindings: rbs,
    clusterRoleBindings: crbs
  });
}

/* ================= ROLE USAGE ================= */

export async function roleUsage(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "role name is required" });
  }

  const rbs = await RoleBinding.find({ "roleRef.name": name });
  const crbs = await ClusterRoleBinding.find({ "roleRef.name": name });

  res.json({
    roleBindings: rbs.length,
    clusterRoleBindings: crbs.length,
    total: rbs.length + crbs.length
  });
}

/* ================= SAFE DELETE ================= */

export async function deleteRole(req, res) {
  const { name, namespace, cluster } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const bindings = cluster
    ? await ClusterRoleBinding.find({ "roleRef.name": name })
    : await RoleBinding.find({ "roleRef.name": name, namespace });

  if (bindings.length > 0) {
    return res.status(400).json({
      error: "Role is still bound",
      bindings
    });
  }

  try {
    if (cluster) {
      console.log(`🗑️ Deleting ClusterRole '${name}'`);
      await rbacV1.deleteClusterRole({ name });
      await Role.deleteOne({ name, type: "ClusterRole" });
    } else {
      console.log(`🗑️ Deleting Role '${name}' from namespace '${namespace}'`);
      await rbacV1.deleteNamespacedRole({ name, namespace });
      await Role.deleteOne({ name, namespace, type: "Role" });
    }

    console.log(`✅ Role '${name}' deleted successfully`);
    res.json({ success: true });
  } catch (e) {
    console.error("❌ Failed to delete role:", e?.body || e?.message);
    res.status(500).json({
      error: "Delete failed",
      details: e?.body || e?.message
    });
  }
}

/* ================= DIFF (API DRY-RUN) ================= */

export async function diffRole(req, res) {
  try {
    const { yaml: yamlText } = req.body;

    if (!yamlText) {
      return res.status(400).json({ error: "YAML required" });
    }

    const doc = yaml.load(yamlText);

    if (!doc?.kind || !doc?.metadata?.name) {
      return res.status(400).json({ error: "Invalid RBAC YAML" });
    }

    const dryRun = ["All"];
    let result;

    if (doc.kind === "Role") {
      if (!doc.metadata.namespace) {
        return res.status(400).json({ error: "Role namespace is required" });
      }

      result = await rbacV1.replaceNamespacedRole({
        name: doc.metadata.name,
        namespace: doc.metadata.namespace,
        body: doc,
        dryRun
      });
    }

    if (doc.kind === "ClusterRole") {
      result = await rbacV1.replaceClusterRole({
        name: doc.metadata.name,
        body: doc,
        dryRun
      });
    }

    res.json({
      diff: "Dry-run successful (no changes applied)",
      serverResponse: result?.body || null
    });
  } catch (e) {
    res.status(400).json({
      error: "Diff failed",
      details: e?.body || e?.message
    });
  }
}
