import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api";
import { useCatalogs } from "../hooks/useCatalogs";
import { Link2, Plus, Code, Save, Edit2, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function Bindings({ collapsed, setCollapsed }) {
  const { users, groups, roles } = useCatalogs();

  const [existing, setExisting] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [data, setData] = useState({
    name: "",
    role: "",
    subject: "",
    kind: "User",
    namespace: ""
  });

  const [advancedMode, setAdvancedMode] = useState(false);
  const [yamlOverride, setYamlOverride] = useState("");

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
    setShowForm(true);
  };

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

    alert("Binding created successfully");
    setShowForm(false);
    setData({ name: "", role: "", subject: "", kind: "User", namespace: "" });
    loadExisting();
  };

  const applyYamlOverride = async () => {
    if (!yamlOverride.trim()) {
      return alert("YAML is empty");
    }

    await apiPost("/bindings/apply-yaml", { yaml: yamlOverride });
    alert("YAML applied successfully");
    setShowForm(false);
    loadExisting();
  };

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
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Role Bindings"
        description="Connect roles with users, groups, or service accounts"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        action={
          <button
            onClick={() => {
              setShowForm(!showForm);
              setAdvancedMode(false);
              setYamlOverride("");
            }}
            className="btn btn-primary flex items-center space-x-2"
            data-testid="create-binding-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create Binding</span>
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Create/Edit Form */}
          {showForm && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create Role Binding</h3>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Binding Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter binding name"
                        value={data.name}
                        onChange={e => setData({ ...data, name: e.target.value })}
                        className="input"
                        data-testid="binding-name-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role Name
                      </label>
                      <input
                        list="roles"
                        placeholder="Select or type role"
                        value={data.role}
                        onChange={e => setData({ ...data, role: e.target.value })}
                        className="input"
                        data-testid="binding-role-input"
                      />
                      <datalist id="roles">
                        {roles.map(r => <option key={r} value={r} />)}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject (User/Group)
                      </label>
                      <input
                        list="subjects"
                        placeholder="Select or type user/group"
                        value={data.subject}
                        onChange={e => setData({ ...data, subject: e.target.value })}
                        className="input"
                        data-testid="binding-subject-input"
                      />
                      <datalist id="subjects">
                        {users.map(u => <option key={u} value={u} />)}
                        {groups.map(g => <option key={g} value={g} />)}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Type
                      </label>
                      <select
                        value={data.kind}
                        onChange={e => setData({ ...data, kind: e.target.value })}
                        className="input"
                      >
                        <option>User</option>
                        <option>Group</option>
                        <option>ServiceAccount</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Namespace (optional - leave empty for ClusterRoleBinding)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter namespace"
                      value={data.namespace}
                      onChange={e => setData({ ...data, namespace: e.target.value })}
                      className="input"
                      data-testid="binding-namespace-input"
                    />
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
                    <button onClick={bind} className="btn btn-primary flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Create Binding</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setData({ name: "", role: "", subject: "", kind: "User", namespace: "" });
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
                    <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing Bindings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Link2 className="w-5 h-5 text-primary-600" />
              <span>Existing Bindings</span>
            </h3>
            <div className="space-y-3">
              {existing.length > 0 ? (
                existing.map(b => (
                  <div
                    key={b.name}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    data-testid={`binding-${b.name}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <p className="font-medium text-gray-900">{b.name}</p>
                        {b.namespace ? (
                          <span className="badge badge-primary">{b.namespace}</span>
                        ) : (
                          <span className="badge badge-warning">ClusterRoleBinding</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Role: <span className="font-medium">{b.roleRef?.name}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadBinding(b)}
                        className="btn btn-sm btn-ghost"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBinding(b)}
                        className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No bindings created yet</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="btn btn-primary mt-4"
                  >
                    Create Your First Binding
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}