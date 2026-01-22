import { useState } from "react";
import { apiPost } from "../api";
import { useCatalogs } from "../hooks/useCatalogs";

/* Static RBAC catalogs */
const VERBS = ["get", "list", "watch", "create", "update", "patch", "delete"];
const RESOURCES = [
  "pods",
  "services",
  "deployments",
  "statefulsets",
  "configmaps",
  "secrets",
  "ingresses",
  "jobs"
];
const API_GROUPS = ["", "apps", "batch", "networking.k8s.io", "rbac.authorization.k8s.io"];

export default function PermissionSimulator() {
  const { users } = useCatalogs();

  const [form, setForm] = useState({
    username: "",
    verb: "get",
    resource: "pods",
    namespace: "",
    apiGroup: ""
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!form.username) {
      return alert("User is required");
    }

    setLoading(true);
    try {
      const res = await apiPost("/rbac/can-i", form);
      setResult(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>RBAC Permission Simulator</h3>

      {/* USER */}
      <label>User</label><br />
      <input
        list="sim-users"
        placeholder="select or type user"
        value={form.username}
        onChange={e => setForm({ ...form, username: e.target.value })}
      />
      <datalist id="sim-users">
        {users.map(u => <option key={u} value={u} />)}
      </datalist>

      <br /><br />

      {/* VERB */}
      <label>Verb</label><br />
      <select
        value={form.verb}
        onChange={e => setForm({ ...form, verb: e.target.value })}
      >
        {VERBS.map(v => <option key={v}>{v}</option>)}
      </select>

      <br /><br />

      {/* RESOURCE */}
      <label>Resource</label><br />
      <select
        value={form.resource}
        onChange={e => setForm({ ...form, resource: e.target.value })}
      >
        {RESOURCES.map(r => <option key={r}>{r}</option>)}
      </select>

      <br /><br />

      {/* API GROUP */}
      <label>API Group</label><br />
      <select
        value={form.apiGroup}
        onChange={e => setForm({ ...form, apiGroup: e.target.value })}
      >
        <option value="">core</option>
        {API_GROUPS.filter(g => g).map(g => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <br /><br />

      {/* NAMESPACE */}
      <label>Namespace (optional)</label><br />
      <input
        placeholder="default"
        value={form.namespace}
        onChange={e => setForm({ ...form, namespace: e.target.value })}
      />

      <br /><br />

      <button onClick={run} disabled={loading}>
        {loading ? "Checking..." : "Check Permission"}
      </button>

      {/* RESULT */}
      {result && (
        <>
          <hr />
          <h4>Result</h4>

          <div
            style={{
              padding: 10,
              background: result.allowed ? "#dcfce7" : "#fee2e2",
              color: result.allowed ? "#166534" : "#991b1b",
              fontWeight: "bold"
            }}
          >
            {result.allowed ? "✅ ALLOWED" : "❌ DENIED"}
          </div>

          <h5>Evaluated Command</h5>
          <pre style={{ background: "#f3f4f6", padding: 10 }}>
            {result.command}
          </pre>

          <h5>Context</h5>
          <pre style={{ background: "#f9fafb", padding: 10 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
