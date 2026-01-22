import yaml from "js-yaml";
import { rbacV1 } from "../kube/client.js";
import RoleBinding from "../models/RoleBinding.js";
import ClusterRoleBinding from "../models/ClusterRoleBinding.js";

/* ================= CREATE ================= */

export async function createRoleBinding(req, res) {
  const { name, namespace, subjects, roleRef } = req.body;

  if (!name || !namespace || !subjects || !roleRef) {
    return res.status(400).json({ error: "Invalid RoleBinding data" });
  }

  const body = {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "RoleBinding",
    metadata: { name, namespace },
    subjects,
    roleRef
  };

  try {
    // 1️⃣ Create in Kubernetes
    await rbacV1.createNamespacedRoleBinding({
      namespace,
      body
    });

    console.log(`🔗 RoleBinding created in cluster: ${name} (ns=${namespace})`);

    // 2️⃣ Mirror into DB
    const dbBinding = await RoleBinding.updateOne(
      { name, namespace },
      { name, namespace, subjects, roleRef },
      { upsert: true }
    );

    console.log(`💾 RoleBinding stored in DB: ${name} (ns=${namespace})`);

    res.json({
      success: true,
      name,
      namespace
    });
  } catch (e) {
    console.error("❌ Failed to create RoleBinding", e.body || e.message);
    res.status(400).json({
      error: "Failed to create RoleBinding",
      details: e.body || e.message
    });
  }
}

export async function createClusterRoleBinding(req, res) {
  const { name, subjects, roleRef } = req.body;

  if (!name || !subjects || !roleRef) {
    return res.status(400).json({ error: "Invalid ClusterRoleBinding data" });
  }

  const body = {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "ClusterRoleBinding",
    metadata: { name },
    subjects,
    roleRef
  };

  try {
    // 1️⃣ Create in Kubernetes
    await rbacV1.createClusterRoleBinding({ body });

    console.log(`🔗 ClusterRoleBinding created in cluster: ${name}`);

    // 2️⃣ Mirror into DB
    await ClusterRoleBinding.updateOne(
      { name },
      { name, subjects, roleRef },
      { upsert: true }
    );

    console.log(`💾 ClusterRoleBinding stored in DB: ${name}`);

    res.json({
      success: true,
      name
    });
  } catch (e) {
    console.error("❌ Failed to create ClusterRoleBinding", e.body || e.message);
    res.status(400).json({
      error: "Failed to create ClusterRoleBinding",
      details: e.body || e.message
    });
  }
}

/* ================= LIST ================= */

export async function listRoleBindings(req, res) {
  res.json(await RoleBinding.find());
}

export async function listClusterRoleBindings(req, res) {
  res.json(await ClusterRoleBinding.find());
}

/* ================= GET YAML ================= */

export async function getBindingYAML(req, res) {
  const { name } = req.params;
  const { namespace } = req.query;

  try {
    if (namespace) {
      const { body } = await rbacV1.readNamespacedRoleBinding({
        name,
        namespace
      });

      return res.json({
        yaml: yaml.dump(body, { noRefs: true })
      });
    }

    const { body } = await rbacV1.readClusterRoleBinding({ name });

    res.json({
      yaml: yaml.dump(body, { noRefs: true })
    });
  } catch (e) {
    console.error("❌ Failed to fetch binding YAML", e.body || e.message);
    res.status(404).json({
      error: "Binding not found",
      details: e.body || e.message
    });
  }
}

/* ================= APPLY YAML ================= */

export async function applyBindingYAML(req, res) {
  try {
    const { yaml: yamlText } = req.body;
    if (!yamlText) {
      return res.status(400).json({ error: "YAML required" });
    }

    const doc = yaml.load(yamlText);

    if (!doc?.kind || !doc?.metadata?.name) {
      return res.status(400).json({ error: "Invalid YAML" });
    }

    if (doc.kind === "RoleBinding") {
      await rbacV1.replaceNamespacedRoleBinding({
        name: doc.metadata.name,
        namespace: doc.metadata.namespace,
        body: doc
      });

      await RoleBinding.updateOne(
        { name: doc.metadata.name, namespace: doc.metadata.namespace },
        {
          name: doc.metadata.name,
          namespace: doc.metadata.namespace,
          subjects: doc.subjects,
          roleRef: doc.roleRef
        },
        { upsert: true }
      );

      console.log(
        `🔁 RoleBinding applied via YAML: ${doc.metadata.name} (ns=${doc.metadata.namespace})`
      );
    }

    if (doc.kind === "ClusterRoleBinding") {
      await rbacV1.replaceClusterRoleBinding({
        name: doc.metadata.name,
        body: doc
      });

      await ClusterRoleBinding.updateOne(
        { name: doc.metadata.name },
        {
          name: doc.metadata.name,
          subjects: doc.subjects,
          roleRef: doc.roleRef
        },
        { upsert: true }
      );

      console.log(
        `🔁 ClusterRoleBinding applied via YAML: ${doc.metadata.name}`
      );
    }

    res.json({ success: true });
  } catch (e) {
    console.error("❌ Failed to apply binding YAML", e.body || e.message);
    res.status(400).json({
      error: "Apply failed",
      details: e.body || e.message
    });
  }
}

/* ================= DELETE ================= */

export async function deleteBinding(req, res) {
  const { name, namespace, cluster } = req.body;

  try {
    if (cluster) {
      await rbacV1.deleteClusterRoleBinding({ name });
      await ClusterRoleBinding.deleteOne({ name });

      console.log(`🗑️ ClusterRoleBinding deleted: ${name}`);
    } else {
      await rbacV1.deleteNamespacedRoleBinding({ name, namespace });
      await RoleBinding.deleteOne({ name, namespace });

      console.log(`🗑️ RoleBinding deleted: ${name} (ns=${namespace})`);
    }

    res.json({ success: true });
  } catch (e) {
    console.error("❌ Failed to delete binding", e.body || e.message);
    res.status(400).json({
      error: "Delete failed",
      details: e.body || e.message
    });
  }
}
