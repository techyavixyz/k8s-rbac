import { useEffect, useState } from "react";
import { api } from "../api";
import { ClipboardList, Calendar, User, Activity } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function Audit({ collapsed, setCollapsed }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api("/audit")
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Audit Logs"
        description="Track all RBAC changes and operations"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <ClipboardList className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading audit logs...</p>
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-primary-500 bg-gray-50 p-4 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Activity className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {log.action || log.event || 'Activity'}
                          </p>
                          {log.user && (
                            <p className="text-sm text-gray-600 flex items-center space-x-1 mt-1">
                              <User className="w-3 h-3" />
                              <span>{log.user}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      {log.timestamp && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {log.details && (
                      <pre className="mt-3 bg-white p-3 rounded text-xs text-gray-700 overflow-x-auto">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No audit logs available</p>
                <pre className="mt-4 bg-gray-50 p-4 rounded-lg text-xs text-left inline-block max-w-2xl overflow-x-auto">
                  {JSON.stringify(logs, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}