import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";
import { useCatalogs } from "../hooks/useCatalogs";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [user, setUser] = useState("");

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
    load();
  };

  const addUser = async (group) => {
    await apiPost(`/groups/${group}/users`, { user });
    setUser("");
    load();
  };

    /* NEW: delete group */
    const deleteGroup = async (groupName) => {
      if (!confirm(`Delete group '${groupName}'?`)) return;
      await apiPost("/groups/delete", { name: groupName });
      load();
    };
  return (
    <div>
      <h3>Create Group</h3>
      <input
        placeholder="group name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button onClick={create}>Create</button>

      <h3>Groups</h3>
      {groups.map(g => (
        <div key={g.name} style={{ marginBottom: 12 }}>
          <b>{g.name}</b>
          <ul>
            {(g.users || []).map(u => (
              <li key={u}>{u}</li>
            ))}
          </ul>

          <input
            list={`users-${g.name}`}
            placeholder="add user"
            value={user}
            onChange={e => setUser(e.target.value)}
          />

          <datalist id={`users-${g.name}`}>
            {users.map(u => (
              <option key={u} value={u} />
            ))}
          </datalist>

          <button onClick={() => addUser(g.name)}>Add</button>
          <button
            className="danger"
            style={{ marginLeft: 8 }}
            onClick={() => deleteGroup(g.name)}
          >
            Delete
          </button>
          
        </div>
      ))}
    </div>
  );
}
