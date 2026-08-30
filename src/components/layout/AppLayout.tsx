import React from 'react';
import { Outlet } from 'react-router-dom';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from '../navigation/MobileBottomNav';
import { DesktopSidebar } from './DesktopSidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-full w-full bg-page-bg overflow-hidden">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <MobileHeader />

        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-6">
          <Outlet />
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
};
