import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api";
import { UserCog, Plus, Code, Edit2, Trash2, Save } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function ServiceAccounts({ collapsed, setCollapsed }) {
  const [sas, setSAs] = useState([]);
  const [name, setName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [advanced, setAdvanced] = useState(false);
  const [yaml, setYaml] = useState("");

  const load = async () => {
    setSAs(await apiGet("/serviceaccounts"));
  };

  useEffect(() => {
    load();
  }, []);

  const yamlPreview = useMemo(() => `
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${name || "<name>"}
  namespace: ${namespace || "<namespace>"}
`.trim(), [name, namespace]);

  const create = async () => {
    await apiPost("/serviceaccounts", { name, namespace });
    setName("");
    setNamespace("");
    setShowForm(false);
    load();
  };

  const loadYaml = async (sa) => {
    const res = await apiGet(
      `/serviceaccounts/yaml?name=${sa.name}&namespace=${sa.namespace}`
    );
    setYaml(res.yaml);
    setAdvanced(true);
    setShowForm(true);
  };

  const applyYaml = async () => {
    await apiPost("/serviceaccounts/apply-yaml", { yaml });
    alert("ServiceAccount applied successfully");
    setShowForm(false);
    setAdvanced(false);
    setYaml("");
    load();
  };

  const remove = async (sa, ns) => {
    if (!confirm("Delete ServiceAccount?")) return;
    await apiDelete(`/serviceaccounts/${sa}/${ns}`);
    load();
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Service Accounts"
        description="Manage service accounts for pod authentication"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        action={
          <button
            onClick={() => {
              setShowForm(!showForm);
              setAdvanced(false);
              setYaml("");
            }}
            className="btn btn-primary flex items-center space-x-2"
            data-testid="create-sa-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create Service Account</span>
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Create Form */}
          {showForm && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {advanced ? 'Edit Service Account' : 'Create Service Account'}
                </h3>
                {!advanced && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advanced}
                      onChange={e => setAdvanced(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center space-x-1">
                      <Code className="w-4 h-4" />
                      <span>YAML editor</span>
                    </span>
                  </label>
                )}
              </div>

              {!advanced ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Account Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input"
                        data-testid="sa-name-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Namespace
                      </label>
                      <input
                        type="text"
                        placeholder="Enter namespace"
                        value={namespace}
                        onChange={e => setNamespace(e.target.value)}
                        className="input"
                        data-testid="sa-namespace-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Generated YAML
                    </label>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                      {yamlPreview}
                    </pre>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={create}
                      disabled={!name || !namespace}
                      className="btn btn-primary flex items-center space-x-2"
                      data-testid="submit-sa-btn"
                    >
                      <Save className="w-4 h-4" />
                      <span>Create</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setName("");
                        setNamespace("");
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
                      rows={14}
                      value={yaml}
                      onChange={e => setYaml(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm bg-gray-900 text-gray-100"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={applyYaml} className="btn btn-primary">
                      Apply YAML
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setAdvanced(false);
                        setYaml("");
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Service Accounts List */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <UserCog className="w-5 h-5 text-primary-600" />
              <span>Service Accounts</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Namespace</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sas.map(sa => (
                    <tr key={`${sa.name}-${sa.namespace}`} data-testid={`sa-row-${sa.name}`}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                            <UserCog className="w-4 h-4 text-primary-600" />
                          </div>
                          <span className="font-medium">{sa.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{sa.namespace}</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => loadYaml(sa)}
                            className="btn btn-sm btn-ghost"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => remove(sa.name, sa.namespace)}
                            className="btn btn-sm btn-danger flex items-center space-x-1"
                            data-testid={`delete-sa-${sa.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {sas.length === 0 && (
                <div className="text-center py-12">
                  <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No service accounts found</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="btn btn-primary mt-4"
                  >
                    Create Your First Service Account
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