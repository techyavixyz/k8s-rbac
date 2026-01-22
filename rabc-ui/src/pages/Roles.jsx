import { useState, useMemo, useEffect } from "react";
import { apiGet, apiPost } from "../api";

/* ---------- STATIC CATALOG ---------- */
const API_GROUPS = {
  "": "Core API group (pods, services, configmaps)",
  "apps": "Workloads like deployments, statefulsets",
  "batch": "Jobs and CronJobs",
  "networking.k8s.io": "Ingress, NetworkPolicy",
  "rbac.authorization.k8s.io": "Roles and bindings (advanced)"
};

const RESOURCES = {
  pods: "Running containers inside Kubernetes",
  "pods/log": "View logs of running pods",
  services: "Network access to pods",
  deployments: "Stateless application controllers",
  statefulsets: "Stateful workloads",
  configmaps: "Configuration data",
  secrets: "Sensitive configuration",
  ingresses: "HTTP routing into cluster",
  jobs: "Run-to-completion workloads"
};

const VERBS = {
  get: "Read a single resource",
  list: "List resources",
  watch: "Watch for changes",
  create: "Create new resource",
  update: "Update entire resource",
  patch: "Update part of resource",
  delete: "Delete resource"
};

export default function Roles() {
  const [name, setName] = useState("");
  const [allNamespaces, setAllNamespaces] = useState(false);
  const [namespaces, setNamespaces] = useState([]);
  const [nsInput, setNsInput] = useState("");
  const [availableNamespaces, setAvailableNamespaces] = useState([]);

  const [rules, setRules] = useState([
    { apiGroups: [""], resources: [], verbs: [] }
  ]);

  const [advancedMode, setAdvancedMode] = useState(false);
  const [yamlOverride, setYamlOverride] = useState("");

  const [existingRoles, setExistingRoles] = useState([]);
  const [existingClusterRoles, setExistingClusterRoles] = useState([]);

  /* NEW: selected role meta */
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    apiGet("/namespaces").then(setAvailableNamespaces);
  }, []);

  /* ---------------- RULE HELPERS ---------------- */

  const addRule = () =>
    setRules([...rules, { apiGroups: [""], resources: [], verbs: [] }]);

  const removeRule = (i) =>
    setRules(rules.filter((_, idx) => idx !== i));

  const updateRule = (i, field, value) => {
    const copy = [...rules];
    copy[i][field] = value;
    setRules(copy);
  };

  /* ---------------- LOAD EXISTING ROLES ---------------- */

  const loadExisting = async () => {
    if (!allNamespaces && namespaces.length === 1) {
      setExistingRoles(
        await apiGet(`/roles/role?namespace=${namespaces[0]}`)
      );
    } else {
      setExistingRoles([]);
    }

    setExistingClusterRoles(await apiGet("/roles/clusterrole"));
  };

  useEffect(() => {
    loadExisting();
  }, [allNamespaces, namespaces]);

  /* NEW: load YAML from cluster */
  const loadYamlFromCluster = async (r, cluster) => {
    const res = await apiGet(
      `/roles/yaml?name=${r.name}&namespace=${r.namespace || ""}&cluster=${cluster}`
    );
    setYamlOverride(res.yaml);
    setAdvancedMode(true);
    setSelectedRole({ ...r, cluster });
  };

  /* ---------------- NAMESPACE HELPERS ---------------- */

  const addNamespace = (ns) => {
    if (ns && !namespaces.includes(ns)) {
      setNamespaces([...namespaces, ns]);
    }
    setNsInput("");
  };

  const removeNamespace = (ns) => {
    setNamespaces(namespaces.filter(n => n !== ns));
  };

  /* NEW: delete role */
  const deleteRole = async () => {
    if (!selectedRole) return;
    if (!confirm(`Delete role ${selectedRole.name}?`)) return;

    await apiPost("/roles/delete", {
      name: selectedRole.name,
      namespace: selectedRole.namespace,
      cluster: selectedRole.cluster
    });

    setYamlOverride("");
    setSelectedRole(null);
    loadExisting();
  };

  /* ---------------- YAML PREVIEW ---------------- */

  const generatedYaml = useMemo(() => `
apiVersion: rbac.authorization.k8s.io/v1
kind: ${allNamespaces ? "ClusterRole" : "Role"}
metadata:
  name: ${name || "<name>"}
${allNamespaces ? "" : namespaces.map(ns => `  namespace: ${ns}`).join("\n")}
rules:
${rules.map(r => `
- apiGroups: ${JSON.stringify(r.apiGroups)}
  resources: ${JSON.stringify(r.resources)}
  verbs: ${JSON.stringify(r.verbs)}
`).join("")}
`.trim(), [name, allNamespaces, namespaces, rules]);

  /* ---------------- APPLY ---------------- */

  const applyGenerated = async () => {
    await apiPost(
      allNamespaces ? "/roles/clusterrole" : "/roles/role",
      { name, rules, namespaces }
    );
    alert("Role applied");
    loadExisting();
  };

  const applyYamlOverride = async () => {
    await apiPost("/roles/diff", { yaml: yamlOverride });
    await apiPost("/roles/apply-yaml", { yaml: yamlOverride });
    alert("YAML applied");
    loadExisting();
  };

  return (
    <div>
      <h3>Create Role / ClusterRole</h3>

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
            placeholder="Role name"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <br /><br />

          <label>
            <input
              type="checkbox"
              checked={allNamespaces}
              onChange={e => {
                setAllNamespaces(e.target.checked);
                if (e.target.checked) setNamespaces([]);
              }}
            />
            Apply to ALL namespaces (ClusterRole)
          </label>

          {!allNamespaces && (
            <>
              <h4>Namespaces</h4>

              <input
                list="ns-list"
                placeholder="type namespace"
                value={nsInput}
                onChange={e => setNsInput(e.target.value)}
              />
              <datalist id="ns-list">
                {availableNamespaces.map(ns => (
                  <option key={ns} value={ns} />
                ))}
              </datalist>

              <button onClick={() => addNamespace(nsInput)}>Add</button>

              <div>
                {namespaces.map(ns => (
                  <span key={ns} style={{ marginRight: 8 }}>
                    {ns}
                    <button onClick={() => removeNamespace(ns)}>×</button>
                  </span>
                ))}
              </div>
            </>
          )}

          <hr />

          <h4>Rules</h4>

          {rules.map((r, i) => (
            <div key={i} style={{ border: "1px solid #ccc", padding: 10 }}>
              <b>Rule #{i + 1}</b><br /><br />

              <label>API Groups</label><br />
              <select multiple value={r.apiGroups}
                onChange={e =>
                  updateRule(i, "apiGroups",
                    [...e.target.selectedOptions].map(o => o.value)
                  )
                }>
                {Object.keys(API_GROUPS).map(k => (
                  <option key={k} value={k}>
                    {k || "core"} — {API_GROUPS[k]}
                  </option>
                ))}
              </select>

              <br /><br />

              <label>Resources</label><br />
              <select multiple value={r.resources}
                onChange={e =>
                  updateRule(i, "resources",
                    [...e.target.selectedOptions].map(o => o.value)
                  )
                }>
                {Object.keys(RESOURCES).map(k => (
                  <option key={k} value={k}>
                    {k} — {RESOURCES[k]}
                  </option>
                ))}
              </select>

              <br /><br />

              <label>Verbs</label><br />
              <select multiple value={r.verbs}
                onChange={e =>
                  updateRule(i, "verbs",
                    [...e.target.selectedOptions].map(o => o.value)
                  )
                }>
                {Object.keys(VERBS).map(k => (
                  <option key={k} value={k}>
                    {k} — {VERBS[k]}
                  </option>
                ))}
              </select>

              <br /><br />
              <button onClick={() => removeRule(i)}>Remove Rule</button>
            </div>
          ))}

          <button onClick={addRule}>➕ Add Rule</button>

          <br /><br />
          <button onClick={applyGenerated}>Apply</button>

          <h4>Generated YAML</h4>
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

          {selectedRole && (
            <button className="danger" onClick={deleteRole}>
              Delete Role
            </button>
          )}
        </>
      )}

      <hr />

      <h3>Existing Roles</h3>
      <ul>
        {existingRoles.map(r => (
          <li key={`${r.name}-${r.namespace}`}>
            {r.name} ({r.namespace})
            <button onClick={() => loadYamlFromCluster(r, false)}>Edit</button>
          </li>
        ))}
        {existingClusterRoles.map(r => (
          <li key={r.name}>
            {r.name} (ClusterRole)
            <button onClick={() => loadYamlFromCluster(r, true)}>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
