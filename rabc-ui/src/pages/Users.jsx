import { useEffect, useState } from "react";
import { api, apiGet } from "../api";
import UserTable from "../components/UserTable";
import { useCatalogs } from "../hooks/useCatalogs";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);

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
    loadUsers();
  };

  const addGroup = (g) => {
    if (g && !selectedGroups.includes(g)) {
      setSelectedGroups([...selectedGroups, g]);
    }
  };

  return (
    <div>
      <h3>Create User</h3>

      <input
        placeholder="username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />

      <br /><br />

      <label>Assign Groups</label><br />
      <input
        list="groups-list"
        placeholder="type or select group"
        onChange={e => addGroup(e.target.value)}
      />

      <datalist id="groups-list">
        {groups.map(g => (
          <option key={g} value={g} />
        ))}
      </datalist>

      <div style={{ marginTop: 6 }}>
        {selectedGroups.map(g => (
          <span key={g} style={{ marginRight: 8 }}>
            {g}
            <button onClick={() =>
              setSelectedGroups(selectedGroups.filter(x => x !== g))
            }>×</button>
          </span>
        ))}
      </div>

      <br />
      <button onClick={createUser} disabled={!username}>
        Create
      </button>

      <h3>Users</h3>
      <UserTable users={users} reload={loadUsers} />
    </div>
  );
}
