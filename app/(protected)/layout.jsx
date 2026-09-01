import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import LeftSidebar from '../../components/layout/LeftSidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import MobileNav from '../../components/layout/MobileNav';
import MobileHeader from '../../components/layout/MobileHeader';
import MobileFAB from '../../components/ui/MobileFAB';
import NotificationPrompt from '../../components/modals/NotificationPrompt';

export default function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute type="protected">
      <div className="min-h-screen bg-[#0C0E14] text-white font-body flex justify-center selection:bg-blue-500/30">
        <NotificationPrompt />
        <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[220px_1fr_380px] gap-0 md:gap-6 px-0 md:px-6 relative">
          
          {/* Left Sidebar */}
          <LeftSidebar />

          {/* Main Feed Content Area */}
          <main className="w-full min-h-screen pb-24 md:pb-6 md:py-6 overflow-x-hidden flex flex-col">
            <MobileHeader />
            <div className="px-4 md:px-0 flex-1">
              {children}
            </div>
          </main>

          {/* Right Sidebar */}
          <RightSidebar />
          
        </div>

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Mobile Floating Action Button */}
        <MobileFAB />
      </div>
    </ProtectedRoute>
  );
}
