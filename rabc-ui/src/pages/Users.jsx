import { useEffect, useState } from "react";
import { api } from "../api";
import { UserPlus, Search, Download, Ban, CheckCircle, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useCatalogs } from "../hooks/useCatalogs";

export default function Users({ collapsed, setCollapsed }) {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { groups } = useCatalogs();

  const loadUsers = async () => {
    setUsers(await api("/users"));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    await api("/users", {
      method: "POST",
      body: JSON.stringify({
        username,
        groups: selectedGroups
      })
    });

    setUsername("");
    setSelectedGroups([]);
    setShowForm(false);
    loadUsers();
  };

  const addGroup = (g) => {
    if (g && !selectedGroups.includes(g)) {
      setSelectedGroups([...selectedGroups, g]);
    }
  };

  const action = async (path, method = "POST") => {
    await api(path, { method });
    loadUsers();
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Users Management"
        description="Manage Kubernetes users and their group assignments"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center space-x-2"
            data-testid="create-user-btn"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Create User Form */}
          {showForm && (
            <div className="card" data-testid="user-form">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="input"
                    data-testid="username-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Groups
                  </label>
                  <input
                    list="groups-list"
                    placeholder="Type or select group"
                    onChange={e => {
                      addGroup(e.target.value);
                      e.target.value = '';
                    }}
                    className="input"
                    data-testid="group-input"
                  />
                  <datalist id="groups-list">
                    {groups.map(g => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>

                  {selectedGroups.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedGroups.map(g => (
                        <span
                          key={g}
                          className="badge badge-primary flex items-center space-x-1"
                        >
                          <span>{g}</span>
                          <button
                            onClick={() =>
                              setSelectedGroups(selectedGroups.filter(x => x !== g))
                            }
                            className="hover:text-primary-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={createUser}
                    disabled={!username}
                    className="btn btn-primary"
                    data-testid="submit-user-btn"
                  >
                    Create User
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setUsername("");
                      setSelectedGroups([]);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Users List</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  data-testid="search-users-input"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Status</th>
                    <th>Groups</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.username} data-testid={`user-row-${u.username}`}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {u.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{u.username}</span>
                        </div>
                      </td>
                      <td>
                        {u.status === "active" ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-danger">Disabled</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(u.groups || []).map(g => (
                            <span key={g} className="badge badge-primary">{g}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end space-x-2">
                          {u.status === "active" && (
                            <button
                              onClick={() => action(`/users/${u.username}/disable`)}
                              className="btn btn-sm btn-ghost flex items-center space-x-1"
                              data-testid={`disable-user-${u.username}`}
                            >
                              <Ban className="w-4 h-4" />
                              <span>Disable</span>
                            </button>
                          )}

                          {u.status === "disabled" && (
                            <button
                              onClick={() => action(`/users/${u.username}/enable`)}
                              className="btn btn-sm btn-ghost flex items-center space-x-1"
                              data-testid={`enable-user-${u.username}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Enable</span>
                            </button>
                          )}

                              <a
                                href={`/api/kubeconfigs/user/${u.username}`}
                              >
                                                          <button className="btn btn-sm btn-ghost flex items-center space-x-1">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          </a>

                          <button
                            onClick={() => action(`/users/${u.username}`, "DELETE")}
                            className="btn btn-sm btn-danger flex items-center space-x-1"
                            data-testid={`delete-user-${u.username}`}
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
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}