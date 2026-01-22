import { api } from "../api";

export default function UserTable({ users, reload }) {
  const action = async (path, method = "POST") => {
    await api(path, { method });
    reload();
  };

  return (
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Status</th>
          <th>Groups</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.username}>
            <td>{u.username}</td>
            <td>{u.status}</td>
            <td>{(u.groups || []).join(", ")}</td>
            <td>
              {u.status === "active" && (
                <button onClick={() => action(`/users/${u.username}/disable`)}>
                  Disable
                </button>
              )}

              {u.status === "disabled" && (
                <button onClick={() => action(`/users/${u.username}/enable`)}>
                  Enable
                </button>
              )}

              <a
                href={`http://localhost:3001/api/kubeconfigs/user/${u.username}`}
                target="_blank"
              >
                <button>Download</button>
              </a>

              <button
                className="danger"
                onClick={() => action(`/users/${u.username}`, "DELETE")}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
