import { useEffect, useState } from "react";
import { apiGet } from "../api";

export function useCatalogs() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    apiGet("/users").then(setUsers).catch(() => {});
    apiGet("/groups").then(setGroups).catch(() => {});
    apiGet("/roles").then(setRoles).catch(() => {});
  }, []);

  return {
    users: users.map(u => u.username),
    groups: groups.map(g => g.name),
    roles: roles.map(r => r.name)
  };
}
