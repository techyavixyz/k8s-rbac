import { useState } from "react";
import Sidebar from "./components/Sidebar";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const render = () => {
    const props = { collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed };
    
    switch (page) {
      case "users": return <Users {...props} />;
      case "groups": return <Groups {...props} />;
      case "roles": return <Roles {...props} />;
      case "bindings": return <Bindings {...props} />;
      case "serviceaccounts": return <ServiceAccounts {...props} />;
      case "audit": return <Audit {...props} />;
      case "rbac": return <RBACGraph {...props} />;
      case "simulator": return <PermissionSimulator {...props} />;
      default: return <Users {...props} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar 
        page={page} 
        setPage={setPage} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      <main className="flex-1 overflow-auto">
        {render()}
      </main>
    </div>
  );
}