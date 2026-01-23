import { useEffect, useState } from "react";
import { apiGet } from "../api";
import { Network, Loader } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function RBACGraph({ collapsed, setCollapsed }) {
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet("/rbac/graph")
      .then(setGraph)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="RBAC Graph"
        description="Visualize the relationships between users, roles, and permissions"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Network className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">RBAC Relationship Data</h3>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading RBAC graph data...</p>
              </div>
            ) : graph ? (
              <div>
                <div className="bg-gradient-to-br from-primary-50 to-blue-50 p-6 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {graph.users && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Total Users</p>
                        <p className="text-3xl font-bold text-primary-600">{graph.users.length || 0}</p>
                      </div>
                    )}
                    {graph.roles && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Total Roles</p>
                        <p className="text-3xl font-bold text-primary-600">{graph.roles.length || 0}</p>
                      </div>
                    )}
                    {graph.bindings && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Total Bindings</p>
                        <p className="text-3xl font-bold text-primary-600">{graph.bindings.length || 0}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
                  <pre className="text-gray-100 text-sm">
                    {JSON.stringify(graph, null, 2)}
                  </pre>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This is the raw RBAC relationship data. In a production environment, 
                    this would typically be visualized using a graph library like D3.js, Cytoscape, or vis.js 
                    to show interactive node relationships.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No graph data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}