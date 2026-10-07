import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { LoginModal } from './components/LoginModal';
import { StaffDashboard } from './components/StaffDashboard';
import { HeadmasterDashboard } from './components/HeadmasterDashboard';
import { CommissionerDashboard } from './components/CommissionerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LogOut } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // If user is not logged in, show Public Website
  if (!currentUser) {
    return (
      <>
        <HomePage onOpenLogin={() => setShowLoginModal(true)} />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(userData) => setCurrentUser(userData)}
        />
      </>
    );
  }

  // Authenticated Portal Header & Dashboard based on DB Role
  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col font-sans">
      {/* Official Gov Header */}
      <div className="bg-[#650000] text-white px-6 py-1.5 text-xs flex justify-between items-center border-b border-[#FFD700]/30 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-[#FFD700] tracking-wider">TAMIL NADU GOVERNMENT</span>
          <span>•</span>
          <span className="text-white/90">Coimbatore City Municipal Corporation</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[#FFD700] flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" /> SESSION ACTIVE
          </span>
          <span>•</span>
          <span className="text-white/70">EMIS Network Secure</span>
        </div>
      </div>

      {/* Main Authenticated Header (Red gradient with Coimbatore Corporation Logo Left & CM image Top-Right) */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#650000] via-[#8B0000] to-[#B31312] text-white shadow-lg border-b-2 border-[#FFD700]">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex justify-between items-center">
          
          {/* Left: Coimbatore Corporation Logo & Title */}
          <div className="flex items-center gap-4">
            <img
              src="/coimbatore_corp_logo.png"
              alt="Coimbatore Corporation Official Logo"
              className="h-12 md:h-14 w-auto object-contain drop-shadow-md"
            />
            <div>
              <h1 className="text-base md:text-xl font-black text-white tracking-tight leading-tight">
                Coimbatore City Municipal Corporation
              </h1>
              <div className="flex items-center gap-2 text-[11px] md:text-xs text-white/90 mt-0.5">
                <span className="font-extrabold text-[#FFD700] uppercase tracking-wider">{currentUser.role} PORTAL</span>
                <span>•</span>
                <span>User: <b>{currentUser.username}</b></span>
              </div>
            </div>
          </div>

          {/* Right: CM Image + Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-wider leading-none">
                  Hon'ble Chief Minister
                </p>
                <p className="text-[11px] font-extrabold text-white leading-tight mt-0.5">
                  Tamil Nadu
                </p>
              </div>
              <img
                src="/hon_cm_tn.jpg"
                alt="Honourable Chief Minister of Tamil Nadu"
                className="w-[50px] sm:w-[58px] h-[60px] sm:h-[68px] object-cover object-top rounded-xl border-2 border-[#FFD700] shadow-md"
              />
            </div>

            <button
              onClick={handleLogout}
              className="gold-button flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shadow-md cursor-pointer ml-2"
            >
              <LogOut className="w-3.5 h-3.5 text-[#650000]" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Content automatically routed by verified DB role */}
      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full">
        {currentUser.role === 'STAFF' && <StaffDashboard user={currentUser} />}
        {currentUser.role === 'HEADMASTER' && <HeadmasterDashboard user={currentUser} />}
        {currentUser.role === 'COMMISSIONER' && <CommissionerDashboard user={currentUser} />}
        {currentUser.role === 'ADMIN' && <AdminDashboard user={currentUser} />}
      </main>

      <footer className="bg-gradient-to-r from-[#650000] via-[#8B0000] to-[#650000] border-t-2 border-[#FFD700] py-4 text-center text-xs text-white/80 font-medium">
        © 2026 Coimbatore City Municipal Corporation • Government Schools Performance & AI Analytics Portal
      </footer>
    </div>
  );
}

export default App;
