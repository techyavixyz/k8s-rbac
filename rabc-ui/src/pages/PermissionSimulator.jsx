import { useState } from "react";
import { apiPost } from "../api";
import { useCatalogs } from "../hooks/useCatalogs";
import { TestTube2, Play, CheckCircle, XCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";

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

export default function PermissionSimulator({ collapsed, setCollapsed }) {
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
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Permission Simulator"
        description="Test if a user has specific permissions before granting access"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Simulator Form */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <TestTube2 className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Test User Permissions</h3>
            </div>

            <div className="space-y-4">
              {/* User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <input
                  list="sim-users"
                  placeholder="Select or type user"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="input"
                  data-testid="sim-user-input"
                />
                <datalist id="sim-users">
                  {users.map(u => <option key={u} value={u} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Verb */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action (Verb)
                  </label>
                  <select
                    value={form.verb}
                    onChange={e => setForm({ ...form, verb: e.target.value })}
                    className="input"
                  >
                    {VERBS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                {/* Resource */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Type
                  </label>
                  <select
                    value={form.resource}
                    onChange={e => setForm({ ...form, resource: e.target.value })}
                    className="input"
                  >
                    {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* API Group */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Group
                  </label>
                  <select
                    value={form.apiGroup}
                    onChange={e => setForm({ ...form, apiGroup: e.target.value })}
                    className="input"
                  >
                    <option value="">core</option>
                    {API_GROUPS.filter(g => g).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Namespace */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Namespace (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="default"
                    value={form.namespace}
                    onChange={e => setForm({ ...form, namespace: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <button
                onClick={run}
                disabled={loading || !form.username}
                className="btn btn-primary w-full flex items-center justify-center space-x-2"
                data-testid="check-permission-btn"
              >
                <Play className="w-4 h-4" />
                <span>{loading ? "Checking..." : "Check Permission"}</span>
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Result</h3>

              <div
                className={`p-6 rounded-lg flex items-center space-x-4 mb-6 ${
                  result.allowed
                    ? "bg-green-50 border-2 border-green-500"
                    : "bg-red-50 border-2 border-red-500"
                }`}
              >
                {result.allowed ? (
                  <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <p className={`text-2xl font-bold ${
                    result.allowed ? "text-green-900" : "text-red-900"
                  }`}>
                    {result.allowed ? "✓ ALLOWED" : "✗ DENIED"}
                  </p>
                  <p className={`text-sm mt-1 ${
                    result.allowed ? "text-green-700" : "text-red-700"
                  }`}>
                    {result.allowed
                      ? "The user has permission to perform this action"
                      : "The user does not have permission to perform this action"
                    }
                  </p>
                </div>
              </div>

              {result.command && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evaluated Command
                  </label>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {result.command}
                  </pre>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Context
                </label>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs text-gray-700">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="card bg-blue-50 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">ℹ</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
                <p className="text-sm text-blue-800">
                  This simulator checks if a specific user has permission to perform an action on a resource. 
                  It evaluates all roles and bindings associated with the user to determine access rights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}