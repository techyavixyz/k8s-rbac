import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api";
import { useCatalogs } from "../hooks/useCatalogs";

export default function Bindings() {
  const { users, groups, roles } = useCatalogs();

  const [existing, setExisting] = useState([]);

  const [data, setData] = useState({
    name: "",
    role: "",
    subject: "",
    kind: "User",
    namespace: ""
  });

  const [advancedMode, setAdvancedMode] = useState(false);
  const [yamlOverride, setYamlOverride] = useState("");

  /* ---------------- LOAD EXISTING BINDINGS ---------------- */

  const loadExisting = async () => {
    const [rb, crb] = await Promise.all([
      apiGet("/bindings/rolebindings"),
      apiGet("/bindings/clusterrolebindings")
    ]);
    setExisting([...rb, ...crb]);
  };

  useEffect(() => {
    loadExisting();
  }, []);

  /* ---------------- LOAD INTO EDITOR ---------------- */

  const loadBinding = (b) => {
    const subject = b.subjects?.[0];

    setData({
      name: b.name,
      role: b.roleRef?.name || "",
      subject: subject?.name || "",
      kind: subject?.kind || "User",
      namespace: b.namespace || ""
    });

    setAdvancedMode(false);
    setYamlOverride("");
  };

  /* ---------------- YAML PREVIEW ---------------- */

  const generatedYaml = useMemo(() => `
apiVersion: rbac.authorization.k8s.io/v1
kind: ${data.namespace ? "RoleBinding" : "ClusterRoleBinding"}
metadata:
  name: ${data.name || "<binding-name>"}
${data.namespace ? `  namespace: ${data.namespace}` : ""}
subjects:
- kind: ${data.kind}
  name: ${data.subject || "<subject>"}
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ${data.namespace ? "Role" : "ClusterRole"}
  name: ${data.role || "<role>"}
  apiGroup: rbac.authorization.k8s.io
`.trim(), [data]);

  /* ---------------- CREATE FROM UI ---------------- */

  const bind = async () => {
    const endpoint = data.namespace
      ? "/bindings/rolebinding"
      : "/bindings/clusterrolebinding";

    await apiPost(endpoint, {
      name: data.name,
      namespace: data.namespace,
      roleRef: {
        kind: data.namespace ? "Role" : "ClusterRole",
        name: data.role,
        apiGroup: "rbac.authorization.k8s.io"
      },
      subjects: [{
        kind: data.kind,
        name: data.subject,
        apiGroup: "rbac.authorization.k8s.io"
      }]
    });

    alert("Binding created");
    loadExisting();
  };

  /* ---------------- APPLY YAML ---------------- */

  const applyYamlOverride = async () => {
    if (!yamlOverride.trim()) {
      return alert("YAML is empty");
    }

    await apiPost("/bindings/apply-yaml", { yaml: yamlOverride });
    alert("YAML applied");
    loadExisting();
  };

  /* NEW: delete binding */
  const deleteBinding = async (b) => {
    if (!confirm(`Delete binding '${b.name}'?`)) return;

    await apiPost("/bindings/delete", {
      name: b.name,
      namespace: b.namespace,
      cluster: !b.namespace
    });

    loadExisting();
  };

  return (
    <div>
      <h3>Create Binding</h3>

      <label>
        <input
          type="checkbox"
          checked={advancedMode}
          onChange={e => setAdvancedMode(e.target.checked)}
        />
        Advanced YAML editor
      </label>

      <hr />

      {!advancedMode && (
        <>
          <input
            placeholder="binding name"
            value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })}
          />

          <input
            list="roles"
            placeholder="role name (select or type)"
            value={data.role}
            onChange={e => setData({ ...data, role: e.target.value })}
          />
          <datalist id="roles">
            {roles.map(r => <option key={r} value={r} />)}
          </datalist>

          <input
            list="subjects"
            placeholder="user / group"
            value={data.subject}
            onChange={e => setData({ ...data, subject: e.target.value })}
          />
          <datalist id="subjects">
            {users.map(u => <option key={u} value={u} />)}
            {groups.map(g => <option key={g} value={g} />)}
          </datalist>

          <select
            value={data.kind}
            onChange={e => setData({ ...data, kind: e.target.value })}
          >
            <option>User</option>
            <option>Group</option>
            <option>ServiceAccount</option>
          </select>

          <input
            placeholder="namespace (optional)"
            value={data.namespace}
            onChange={e => setData({ ...data, namespace: e.target.value })}
          />

          <button onClick={bind}>Bind</button>

          <h4>Generated YAML (read-only)</h4>
          <pre style={{ background: "#f3f4f6", padding: 12 }}>
            {generatedYaml}
          </pre>
        </>
      )}

      {advancedMode && (
        <>
          <h4>Advanced YAML Editor</h4>
          <textarea
            rows={20}
            style={{ width: "100%" }}
            value={yamlOverride || generatedYaml}
            onChange={e => setYamlOverride(e.target.value)}
          />
          <br />
          <button onClick={applyYamlOverride}>Apply YAML</button>
        </>
      )}

      <hr />

      <h3>Existing Bindings</h3>
      <ul>
        {existing.map(b => (
          <li key={b.name}>
            {b.name} → {b.roleRef?.name}
            {b.namespace && ` (${b.namespace})`}
            <button style={{ marginLeft: 6 }} onClick={() => loadBinding(b)}>
              Load
            </button>

            {/* NEW: delete binding */}
            <button
              className="danger"
              style={{ marginLeft: 6 }}
              onClick={() => deleteBinding(b)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
