export default function Navbar({ page, setPage }) {
  const btn = (label, key) => (
    <button
      onClick={() => setPage(key)}
      style={{
        background: page === key ? "#2563eb" : "#e5e7eb",
        color: page === key ? "white" : "black",
        border: "none",
        padding: "6px 12px",
        marginRight: "6px",
        cursor: "pointer"
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ background: "#1e293b", padding: "12px", color: "white" }}>
      <strong style={{ marginRight: 20 }}>RABC</strong>
      {btn("Users", "users")}
      {btn("Groups", "groups")}
      {btn("Roles", "roles")}
      {btn("Bindings", "bindings")}
      {btn("Service Accounts", "serviceaccounts")}
      {btn("RBAC Graph", "rbac")}
      {btn("Audit", "audit")}
      {btn("Simulator", "simulator")}

    </div>
  );
}
