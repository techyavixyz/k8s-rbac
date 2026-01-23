import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";
import { useCatalogs } from "../hooks/useCatalogs";
import { UsersRound, Plus, UserPlus, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function Groups({ collapsed, setCollapsed }) {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { users } = useCatalogs();

  const load = async () => {
    setGroups(await apiGet("/groups"));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await apiPost("/groups", { name });
    setName("");
    setShowForm(false);
    load();
  };

  const addUser = async (group) => {
    await apiPost(`/groups/${group}/users`, { user });
    setUser("");
    load();
  };

  const deleteGroup = async (groupName) => {
    if (!confirm(`Delete group '${groupName}'?`)) return;
    await apiPost("/groups/delete", { name: groupName });
    load();
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Groups Management"
        description="Organize users into logical groups for easier permission management"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center space-x-2"
            data-testid="create-group-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Create Group Form */}
          {showForm && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Group</h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input flex-1"
                  data-testid="group-name-input"
                />
                <button
                  onClick={create}
                  disabled={!name}
                  className="btn btn-primary"
                  data-testid="submit-group-btn"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setName("");
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Groups List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(g => (
              <div key={g.name} className="card" data-testid={`group-card-${g.name}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <UsersRound className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{g.name}</h3>
                      <p className="text-sm text-gray-500">
                        {(g.users || []).length} {(g.users || []).length === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGroup(g.name)}
                    className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                    data-testid={`delete-group-${g.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Users List */}
                <div className="mb-4">
                  {(g.users || []).length > 0 ? (
                    <div className="space-y-2">
                      {(g.users || []).map(u => (
                        <div
                          key={u}
                          className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg"
                        >
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-700">
                              {u.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span>{u}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No members yet</p>
                  )}
                </div>

                {/* Add User Form */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Add User to Group
                  </label>
                  <div className="flex space-x-2">
                    <input
                      list={`users-${g.name}`}
                      placeholder="Select user"
                      value={user}
                      onChange={e => setUser(e.target.value)}
                      className="input flex-1 text-sm"
                      data-testid={`add-user-to-${g.name}`}
                    />
                    <datalist id={`users-${g.name}`}>
                      {users.map(u => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                    <button
                      onClick={() => addUser(g.name)}
                      disabled={!user}
                      className="btn btn-sm btn-primary"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {groups.length === 0 && (
            <div className="card text-center py-12">
              <UsersRound className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No groups created yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                Create Your First Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}