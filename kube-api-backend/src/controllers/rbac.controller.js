import { authV1 } from "../kube/client.js";
import User from "../models/User.js";

/**
 * RBAC Permission Simulator
 * EXACT kubectl auth can-i equivalent
 */
export async function canI(req, res) {
  const { username, verb, resource, namespace, apiGroup } = req.body;

  if (!username || !verb || !resource) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  /* ============================================================
     SubjectAccessReview (spec.user is REQUIRED by API)
     kubectl uses the caller user here (kubernetes-admin)
  ============================================================ */

  const review = {
    apiVersion: "authorization.k8s.io/v1",
    kind: "SubjectAccessReview",
    spec: {
      user: "kubernetes-admin", 
      resourceAttributes: {
        verb,
        resource,
        namespace: namespace || undefined,
        group:
          apiGroup && apiGroup !== "" && apiGroup !== "core"
            ? apiGroup
            : undefined
      }
    }
  };

  /* ============================================================
     Impersonation headers (REAL subject)
  ============================================================ */

  const headers = {
    "Impersonate-User": username
  };

  if (Array.isArray(user.groups) && user.groups.length > 0) {
    headers["Impersonate-Group"] = user.groups;
  }

  /* ============================================================
     Call Kubernetes API
  ============================================================ */

  const { body } = await authV1.createSubjectAccessReview({
    body: review,
    headers
  });

  const allowed = body?.status?.allowed === true;

  /* ============================================================
     Console diagnostics
  ============================================================ */

  console.log("🔍 RBAC CHECK (IMPERSONATION)");
  console.log("────────────────────────────────");
  console.log(`👤 User      : ${username}`);
  console.log(`👥 Groups    : ${(user.groups || []).join(", ") || "-"}`);
  console.log(`🔧 Verb      : ${verb}`);
  console.log(`📦 Resource  : ${resource}`);
  console.log(`🧩 API Group : ${apiGroup || "core"}`);
  console.log(`📍 Namespace : ${namespace || "-"}`);
  console.log(`✅ Allowed   : ${allowed}`);
  console.log(`📛 Reason    : ${body?.status?.reason || "-"}`);
  console.log("────────────────────────────────\n");

  res.json({
    allowed,
    reason: body?.status?.reason || null,
    user: username,
    groups: user.groups || [],
    verb,
    resource,
    apiGroup: apiGroup || "core",
    namespace: namespace || null
  });
}
