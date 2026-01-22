import { useState } from "react";
import Navbar from "./components/Navbar";

import Users from "./pages/Users";
import Groups from "./pages/Groups";
import Roles from "./pages/Roles";
import Bindings from "./pages/Bindings";
import ServiceAccounts from "./pages/ServiceAccounts";
import Audit from "./pages/Audit";
import RBACGraph from "./pages/RBACGraph";
import PermissionSimulator from "./pages/PermissionSimulator";



export default function App() {
  const [page, setPage] = useState("users");

  const render = () => {
    switch (page) {
      case "users": return <Users />;
      case "groups": return <Groups />;
      case "roles": return <Roles />;
      case "bindings": return <Bindings />;
      case "serviceaccounts": return <ServiceAccounts />;
      case "audit": return <Audit />;
      case "rbac": return <RBACGraph />;
      case "simulator": return <PermissionSimulator />;

      default: return <Users />;
    }
  };

  return (
    <>
      <Navbar page={page} setPage={setPage} />
      <div className="container">{render()}</div>
    </>
  );
}
