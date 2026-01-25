import { NavLink, Outlet } from 'react-router';
import { Home } from 'lucide-react';

import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-black text-white p-4">
        <NavLink
          to={paths.app.dashboard.getHref()}
          className={({ isActive }) =>
            cn(isActive ? 'text-white' : 'text-gray-400')
          }
        >
          <Home className="inline mr-2 size-4" />
          Dashboard
        </NavLink>
      </aside>

      <main className="flex-1 p-4">
        {children || <Outlet />}
      </main>
    </div>
  );
}
