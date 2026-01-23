import { useState } from 'react';
import { 
  Users, 
  UsersRound, 
  Shield, 
  Link2, 
  UserCog, 
  Network, 
  ClipboardList, 
  TestTube2,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';

const menuItems = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'groups', label: 'Groups', icon: UsersRound },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'bindings', label: 'Bindings', icon: Link2 },
  { id: 'serviceaccounts', label: 'Service Accounts', icon: UserCog },
  { id: 'rbac', label: 'RBAC Graph', icon: Network },
  { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
  { id: 'simulator', label: 'Simulator', icon: TestTube2 },
];

export default function Sidebar({ page, setPage, collapsed, setCollapsed }) {
  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-20"
          onClick={() => setCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 z-30
          transition-all duration-300 ease-in-out flex flex-col
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">RBAC UI</span>
            </div>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            data-testid="sidebar-toggle-btn"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = page === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setPage(item.id);
                      if (window.innerWidth < 1024) setCollapsed(true);
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200 group
                      ${isActive 
                        ? 'bg-primary-50 text-primary-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    data-testid={`nav-${item.id}`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@rbac.local</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}