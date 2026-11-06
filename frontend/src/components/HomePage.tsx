import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, GraduationCap, Award, ChevronRight, LogIn, 
  MapPin, Activity, Sparkles, Menu, X, Search, Sun, Moon 
} from 'lucide-react';
import apiClient, { CORP_LOGO_URL, CM_PHOTO_URL } from '../api';

export const HomePage: React.FC<{
  onOpenLogin: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}> = ({ onOpenLogin, isDarkMode = false, onToggleTheme }) => {
  const [data, setData] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [directoryZone, setDirectoryZone] = useState('All');
  const [directorySearch, setDirectorySearch] = useState('');

  const defaultSchools = [
    { id: 1, school_code: "CCM-01", school_name: "Corporation Higher Secondary School, R.S. Puram", zone: "West", ward: "Ward 23", school_type: "Higher Secondary", student_count: 840, teacher_count: 42 },
    { id: 2, school_code: "CCM-02", school_name: "Corporation Higher Secondary School, Siddhapudur", zone: "Central", ward: "Ward 31", school_type: "Higher Secondary", student_count: 760, teacher_count: 38 },
    { id: 3, school_code: "CCM-03", school_name: "Corporation High School, Ramanathapuram", zone: "East", ward: "Ward 62", school_type: "High School", student_count: 520, teacher_count: 26 },
    { id: 4, school_code: "CCM-04", school_name: "Corporation Girls Higher Secondary School, Oppanakara St", zone: "South", ward: "Ward 45", school_type: "Higher Secondary", student_count: 910, teacher_count: 45 },
    { id: 5, school_code: "CCM-05", school_name: "Corporation High School, Peelamedu", zone: "East", ward: "Ward 38", school_type: "High School", student_count: 490, teacher_count: 24 },
    { id: 6, school_code: "CCM-06", school_name: "Corporation Higher Secondary School, Rathinapuri", zone: "North", ward: "Ward 18", school_type: "Higher Secondary", student_count: 680, teacher_count: 35 },
  ];

  const [schools, setSchools] = useState<any[]>(defaultSchools);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    apiClient.get('/public/homepage').then(res => {
      if (res.data) setData(res.data);
    }).catch(console.error);

    apiClient.get('/public/schools').then(res => {
      if (res.data && res.data.length > 0) setSchools(res.data);
    }).catch(console.error);
  }, []);

  const slides = data?.hero_slides || [
    {
      title: "Coimbatore Corporation Schools Academic Excellence",
      description: "Driving smart digital education, futuristic AI-supported mentoring, and state-of-the-art facilities across all municipal schools.",
      image_url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80",
      category: "Municipal Education Drive"
    }
  ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const filteredSchools = schools.filter(s => {
    const matchesZone = directoryZone === 'All' || s.zone === directoryZone;
    const matchesSearch = s.school_name.toLowerCase().includes(directorySearch.toLowerCase()) ||
                          s.school_code.toLowerCase().includes(directorySearch.toLowerCase()) ||
                          s.ward.toLowerCase().includes(directorySearch.toLowerCase());
    return matchesZone && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col font-sans overflow-x-hidden">
      {/* Top Govt Bar */}
      <div className="bg-[#650000] text-white px-3 sm:px-6 py-1 text-[10px] sm:text-xs flex justify-between items-center border-b border-[#FFD700]/30 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-3 truncate">
          <span className="font-extrabold text-[#FFD700] tracking-wider whitespace-nowrap">TAMIL NADU GOVT</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-white/90 truncate hidden sm:inline">Coimbatore City Municipal Corporation</span>
        </div>
        <div className="flex gap-2 sm:gap-4 text-[10px] sm:text-xs font-semibold shrink-0">
          <span className="cursor-pointer hover:text-[#FFD700] transition">English / தமிழ்</span>
          <span className="text-white/40">•</span>
          <span className="cursor-pointer hover:text-[#FFD700] transition">Accessibility</span>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#650000] via-[#8B0000] to-[#B31312] text-white shadow-lg border-b-2 border-[#FFD700]">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-2.5 flex justify-between items-center gap-2">
          
          {/* Left: Coimbatore Corporation Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 overflow-hidden">
            <img
              src={CORP_LOGO_URL}
              alt="CCMC"
              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain drop-shadow-md shrink-0 rounded-full bg-white/10 p-0.5"
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className="text-xs sm:text-base md:text-xl font-black text-white tracking-tight leading-tight truncate">
                Coimbatore Corporation Schools
              </h1>
              <p className="text-[9px] sm:text-[11px] md:text-xs font-bold text-[#FFD700] uppercase tracking-wider truncate">
                Education Performance &amp; AI Analytics Portal
              </p>
            </div>
          </div>

          {/* Right: Desktop Navigation + Theme Toggle + CM Image + Mobile Menu Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-white/90">
              <a href="#hero" className="hover:text-[#FFD700] transition">Home</a>
              <a href="#stats" className="hover:text-[#FFD700] transition">Statistics</a>
              <a href="#schools" className="hover:text-[#FFD700] transition">Schools</a>
              <button
                onClick={onOpenLogin}
                className="gold-button px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-[#650000]" />
                PORTAL LOGIN
              </button>
            </nav>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black bg-black/30 hover:bg-black/45 text-[#FFD700] border border-[#FFD700]/40 shadow-sm transition cursor-pointer shrink-0"
                title={isDarkMode ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Dark or Bright Mode"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFD700]" />
                    <span className="hidden sm:inline">Bright</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFD700]" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Login button on tablet/mobile */}
            <button
              onClick={onOpenLogin}
              className="lg:hidden gold-button px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-[#650000]" />
              <span>Login</span>
            </button>

            {/* Honourable Tamil Nadu Chief Minister Portrait */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/20">
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-wider leading-none">
                  Hon'ble Chief Minister
                </p>
                <p className="text-[11px] font-extrabold text-white leading-tight mt-0.5">
                  Tamil Nadu
                </p>
              </div>
              <img
                src={CM_PHOTO_URL}
                alt="CM TN"
                className="w-10 sm:w-[48px] md:w-[60px] h-12 sm:h-[58px] md:h-[72px] object-cover object-top rounded-lg sm:rounded-xl border border-[#FFD700] shadow-md shrink-0"
              />
            </div>

            {/* Hamburger button for mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#FFD700]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#650000]/98 backdrop-blur-xl border-t border-[#FFD700]/30 px-4 py-4 space-y-3 shadow-xl">
            <nav className="flex flex-col space-y-2 text-sm font-bold text-white">
              <a 
                href="#hero" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFD700] transition"
              >
                🏠 Home
              </a>
              <a 
                href="#stats" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFD700] transition"
              >
                📊 Portal Statistics
              </a>
              <a 
                href="#schools" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFD700] transition"
              >
                🏫 Schools Directory
              </a>
            </nav>
            <div className="pt-2 border-t border-white/20 flex flex-col gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
                className="w-full gold-button py-2.5 rounded-xl text-xs uppercase tracking-wider font-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#650000]" />
                PORTAL SIGN IN
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Banner Slider */}
      <section id="hero" className="relative min-h-[440px] sm:h-[480px] bg-slate-950 overflow-hidden flex items-center">
        {slides.map((s: any, idx: number) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={s.image_url}
              alt={s.title}
              className="w-full h-full object-cover object-center opacity-40 scale-105 transition duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#650000]/95 via-[#8B0000]/85 to-transparent flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-8">
                <div className="max-w-2xl text-white space-y-3 sm:space-y-4">
                  <span className="inline-block bg-[#FFD700] text-[#650000] text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    {s.category || 'Education Department'}
                  </span>
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                    {s.title}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed font-medium line-clamp-3 sm:line-clamp-none">
                    {s.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-2">
                    <button
                      onClick={onOpenLogin}
                      className="gold-button px-5 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer w-full sm:w-auto"
                    >
                      Access Official Portal <ChevronRight className="w-4 h-4" />
                    </button>
                    <a
                      href="#schools"
                      className="px-5 sm:px-6 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition text-center w-full sm:w-auto"
                    >
                      Explore Schools Directory
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-20">
          {slides.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? 'w-6 sm:w-8 bg-[#FFD700]' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* KPI Cards / Statistics Section (Glassmorphism Cards) */}
      <section id="stats" className="max-w-7xl mx-auto px-3 sm:px-6 -mt-8 sm:-mt-12 relative z-30 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="glass-card p-3.5 sm:p-5 border-l-4 border-l-[#8B0000] hover:border-[#FFD700] transition">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#8B0000] mb-1 sm:mb-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B0000] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 truncate">Schools</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#650000]">{data?.stats?.total_schools || 42}</div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Across 5 Zones & 100 Wards</p>
          </div>

          <div className="glass-card p-3.5 sm:p-5 border-l-4 border-l-[#FFC928] hover:border-[#8B0000] transition">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#8B0000] mb-1 sm:mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B0000] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 truncate">Students</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#650000]">
              {data?.stats?.total_students?.toLocaleString() || '18,750'}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">EMIS Tracked Records</p>
          </div>

          <div className="glass-card p-3.5 sm:p-5 border-l-4 border-l-[#8B0000] hover:border-[#FFD700] transition">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#8B0000] mb-1 sm:mb-2">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B0000] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 truncate">Teaching Staff</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#650000]">{data?.stats?.total_teachers || 950}</div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">PG & BT Assistants</p>
          </div>

          <div className="glass-card p-3.5 sm:p-5 border-l-4 border-l-[#FFC928] hover:border-[#8B0000] transition">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#8B0000] mb-1 sm:mb-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B0000] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 truncate">Attendance</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#650000]">{data?.stats?.avg_attendance || '91.4'}%</div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Corporation Benchmark</p>
          </div>
        </div>
      </section>

      {/* Public School Directory */}
      <section id="schools" className="max-w-7xl mx-auto px-3 sm:px-6 py-10 sm:py-16 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="text-[10px] sm:text-xs font-black text-[#B31312] uppercase tracking-widest">Directory</span>
            <h3 className="text-xl sm:text-2xl font-black text-[#650000] mt-1">Corporation Educational Institutions</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Official list of Corporation Higher Secondary and High Schools in Coimbatore</p>
          </div>

          {/* Search & Zone Filter for Mobile & Desktop */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search school or ward..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div className="table-scroll-container flex gap-1 bg-slate-100 p-1 rounded-xl">
              {['All', 'North', 'South', 'East', 'West', 'Central'].map(z => (
                <button
                  key={z}
                  onClick={() => setDirectoryZone(z)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    directoryZone === z
                      ? 'bg-[#8B0000] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredSchools.map((s) => (
            <div key={s.id} className="glass-card p-4 sm:p-5 hover:shadow-lg transition border hover:border-[#FFD700] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <span className="px-2 py-0.5 bg-[#8B0000]/10 text-[#8B0000] text-[11px] font-black rounded-lg font-mono">
                    {s.school_code}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-[#FFD700]/20 text-[#650000] rounded">
                    {s.zone} Zone
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-sm sm:text-base line-clamp-2 mb-2">
                  {s.school_name}
                </h4>
                <div className="text-xs text-slate-600 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#8B0000]" /> {s.ward}</div>
                  <div>Category: <span className="font-bold text-slate-800">{s.school_type}</span></div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500">Students:</span> <b className="text-[#650000]">{s.student_count}</b>
                </div>
                <div>
                  <span className="text-slate-500">Staff:</span> <b className="text-[#650000]">{s.teacher_count}</b>
                </div>
              </div>
            </div>
          ))}
          {filteredSchools.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm glass-card">
              No educational institutions found matching "{directorySearch}".
            </div>
          )}
        </div>
      </section>

      {/* Official Footer */}
      <footer className="bg-gradient-to-r from-[#650000] via-[#8B0000] to-[#650000] text-white py-8 sm:py-12 border-t-2 border-[#FFD700] mt-auto safe-pb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-xs">
          <div>
            <div className="flex items-center gap-2.5 text-white font-bold text-sm sm:text-base mb-2">
              <img src={CORP_LOGO_URL} alt="CCMC" className="w-9 h-9 object-contain shrink-0 rounded-full bg-white/10 p-0.5" />
              <span>Coimbatore City Municipal Corporation</span>
            </div>
            <p className="leading-relaxed text-white/80 text-[11px] sm:text-xs">
              Department of School Education. Dedicated to data-driven academic monitoring, student growth analytics, and teacher empowerment.
            </p>
          </div>
          <div>
            <h5 className="font-black text-[#FFD700] text-xs sm:text-sm mb-2.5 uppercase tracking-wider">Security & Compliance</h5>
            <ul className="space-y-1 text-white/90 font-medium text-[11px] sm:text-xs">
              <li>• Role-Based Access Control (RBAC)</li>
              <li>• Student Data Privacy Protected</li>
              <li>• Automated Audit Trail Logging</li>
              <li>• High-Throughput Normalized Database</li>
            </ul>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <h5 className="font-black text-[#FFD700] text-xs sm:text-sm mb-2.5 uppercase tracking-wider">Portal Access</h5>
            <button
              onClick={onOpenLogin}
              className="gold-button px-4 py-2 rounded-lg font-black transition cursor-pointer w-full sm:w-auto text-center"
            >
              Universal Portal Sign In
            </button>
            <p className="mt-3 text-white/60 text-[10px] sm:text-[11px]">© 2026 Coimbatore City Municipal Corporation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
