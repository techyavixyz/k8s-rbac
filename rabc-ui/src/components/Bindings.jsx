import { useState } from "react";
import { apiPost } from "../api";

export default function Bindings() {
  const [subject, setSubject] = useState("");
  const [role, setRole] = useState("");

  const bind = async () => {
    await apiPost("/bindings/role", { subject, role });
    alert("Bound successfully");
  };

  return (
    <div>
      <h3>Create Role Binding</h3>
      <input placeholder="user / group / sa" value={subject} onChange={e => setSubject(e.target.value)} />
      <input placeholder="role name" value={role} onChange={e => setRole(e.target.value)} />
      <button onClick={bind}>Bind</button>
    </div>
  );
}
