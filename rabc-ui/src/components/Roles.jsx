import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [rules, setRules] = useState("");

  const load = async () => {
    setRoles(await apiGet("/roles"));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await apiPost("/roles", {
      name,
      rules: JSON.parse(rules)
    });
    setName("");
    setRules("");
    load();
  };

  return (
    <div>
      <h3>Create Role</h3>
      <input placeholder="role name" value={name} onChange={e => setName(e.target.value)} />
      <textarea
        placeholder='JSON rules'
        rows={6}
        value={rules}
        onChange={e => setRules(e.target.value)}
      />
      <button onClick={create}>Create</button>

      <h3>Roles</h3>
      <ul>
        {roles.map(r => (
          <li key={r.name}>{r.name}</li>
        ))}
      </ul>
    </div>
  );
}
