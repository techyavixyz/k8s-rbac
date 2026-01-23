import { useState, useMemo, useEffect } from "react";
import { apiGet, apiPost } from "../api";
import { Shield, Plus, Edit2, Trash2, Code, Save } from "lucide-react";
import PageHeader from "../components/PageHeader";

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

export default function Roles({ collapsed, setCollapsed }) {
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
  const [selectedRole, setSelectedRole] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    apiGet("/namespaces").then(setAvailableNamespaces);
  }, []);

  const addRule = () =>
    setRules([...rules, { apiGroups: [""], resources: [], verbs: [] }]);

  const removeRule = (i) =>
    setRules(rules.filter((_, idx) => idx !== i));

  const updateRule = (i, field, value) => {
    const copy = [...rules];
    copy[i][field] = value;
    setRules(copy);
  };

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

  const loadYamlFromCluster = async (r, cluster) => {
    const res = await apiGet(
      `/roles/yaml?name=${r.name}&namespace=${r.namespace || ""}&cluster=${cluster}`
    );
    setYamlOverride(res.yaml);
    setAdvancedMode(true);
    setSelectedRole({ ...r, cluster });
    setShowForm(true);
  };

  const addNamespace = (ns) => {
    if (ns && !namespaces.includes(ns)) {
      setNamespaces([...namespaces, ns]);
    }
    setNsInput("");
  };

  const removeNamespace = (ns) => {
    setNamespaces(namespaces.filter(n => n !== ns));
  };

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
    setShowForm(false);
    loadExisting();
  };

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

  const applyGenerated = async () => {
    await apiPost(
      allNamespaces ? "/roles/clusterrole" : "/roles/role",
      { name, rules, namespaces }
    );
    alert("Role applied successfully");
    setShowForm(false);
    setName("");
    setRules([{ apiGroups: [""], resources: [], verbs: [] }]);
    setNamespaces([]);
    loadExisting();
  };

  const applyYamlOverride = async () => {
    await apiPost("/roles/diff", { yaml: yamlOverride });
    await apiPost("/roles/apply-yaml", { yaml: yamlOverride });
    alert("YAML applied successfully");
    setShowForm(false);
    loadExisting();
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Roles Management"
        description="Define permissions for resources in your Kubernetes cluster"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        action={
          <button
            onClick={() => {
              setShowForm(!showForm);
              setAdvancedMode(false);
              setYamlOverride("");
              setSelectedRole(null);
            }}
            className="btn btn-primary flex items-center space-x-2"
            data-testid="create-role-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Create/Edit Form */}
          {showForm && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRole ? 'Edit Role' : 'Create New Role'}
                </h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advancedMode}
                    onChange={e => setAdvancedMode(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center space-x-1">
                    <Code className="w-4 h-4" />
                    <span>Advanced YAML editor</span>
                  </span>
                </label>
              </div>

              {!advancedMode ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter role name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="input"
                      data-testid="role-name-input"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allNamespaces}
                        onChange={e => {
                          setAllNamespaces(e.target.checked);
                          if (e.target.checked) setNamespaces([]);
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Apply to ALL namespaces (ClusterRole)
                      </span>
                    </label>
                  </div>

                  {!allNamespaces && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Namespaces
                      </label>
                      <div className="flex space-x-2">
                        <input
                          list="ns-list"
                          placeholder="Type namespace"
                          value={nsInput}
                          onChange={e => setNsInput(e.target.value)}
                          className="input flex-1"
                        />
                        <datalist id="ns-list">
                          {availableNamespaces.map(ns => (
                            <option key={ns} value={ns} />
                          ))}
                        </datalist>
                        <button onClick={() => addNamespace(nsInput)} className="btn btn-secondary">
                          Add
                        </button>
                      </div>

                      {namespaces.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {namespaces.map(ns => (
                            <span key={ns} className="badge badge-primary flex items-center space-x-1">
                              <span>{ns}</span>
                              <button onClick={() => removeNamespace(ns)} className="hover:text-primary-900">
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Permission Rules
                      </label>
                      <button onClick={addRule} className="btn btn-sm btn-secondary flex items-center space-x-1">
                        <Plus className="w-4 h-4" />
                        <span>Add Rule</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {rules.map((r, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">Rule #{i + 1}</span>
                            <button
                              onClick={() => removeRule(i)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                API Groups
                              </label>
                              <select
                                multiple
                                value={r.apiGroups}
                                onChange={e =>
                                  updateRule(i, "apiGroups",
                                    [...e.target.selectedOptions].map(o => o.value)
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm h-24"
                              >
                                {Object.keys(API_GROUPS).map(k => (
                                  <option key={k} value={k}>
                                    {k || "core"}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Resources
                              </label>
                              <select
                                multiple
                                value={r.resources}
                                onChange={e =>
                                  updateRule(i, "resources",
                                    [...e.target.selectedOptions].map(o => o.value)
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm h-24"
                              >
                                {Object.keys(RESOURCES).map(k => (
                                  <option key={k} value={k}>
                                    {k}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Verbs (Actions)
                              </label>
                              <select
                                multiple
                                value={r.verbs}
                                onChange={e =>
                                  updateRule(i, "verbs",
                                    [...e.target.selectedOptions].map(o => o.value)
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm h-24"
                              >
                                {Object.keys(VERBS).map(k => (
                                  <option key={k} value={k}>
                                    {k}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Generated YAML
                    </label>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                      {generatedYaml}
                    </pre>
                  </div>

                  <div className="flex space-x-3">
                    <button onClick={applyGenerated} className="btn btn-primary flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Apply Role</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setName("");
                        setRules([{ apiGroups: [""], resources: [], verbs: [] }]);
                        setNamespaces([]);
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YAML Editor
                    </label>
                    <textarea
                      rows={20}
                      value={yamlOverride || generatedYaml}
                      onChange={e => setYamlOverride(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm bg-gray-900 text-gray-100"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={applyYamlOverride} className="btn btn-primary">
                      Apply YAML
                    </button>
                    {selectedRole && (
                      <button onClick={deleteRole} className="btn btn-danger">
                        Delete Role
                      </button>
                    )}
                    <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing Roles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Namespace Roles */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary-600" />
                <span>Namespace Roles</span>
              </h3>
              <div className="space-y-2">
                {existingRoles.length > 0 ? (
                  existingRoles.map(r => (
                    <div
                      key={`${r.name}-${r.namespace}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{r.name}</p>
                        <p className="text-sm text-gray-500">{r.namespace}</p>
                      </div>
                      <button
                        onClick={() => loadYamlFromCluster(r, false)}
                        className="btn btn-sm btn-ghost"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No namespace roles found</p>
                )}
              </div>
            </div>

            {/* Cluster Roles */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary-600" />
                <span>Cluster Roles</span>
              </h3>
              <div className="space-y-2">
                {existingClusterRoles.length > 0 ? (
                  existingClusterRoles.map(r => (
                    <div
                      key={r.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{r.name}</p>
                        <p className="text-sm text-gray-500">ClusterRole</p>
                      </div>
                      <button
                        onClick={() => loadYamlFromCluster(r, true)}
                        className="btn btn-sm btn-ghost"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No cluster roles found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}