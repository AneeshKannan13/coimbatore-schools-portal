import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, GraduationCap, Award, ChevronRight, LogIn, 
  MapPin, Activity, Sparkles 
} from 'lucide-react';
import apiClient from '../api';

export const HomePage: React.FC<{ onOpenLogin: () => void }> = ({ onOpenLogin }) => {
  const [data, setData] = useState<any>(null);
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

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col font-sans">
      {/* Top Govt Bar */}
      <div className="bg-[#650000] text-white px-6 py-1.5 text-xs flex justify-between items-center border-b border-[#FFD700]/30 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-[#FFD700] tracking-wider">TAMIL NADU GOVERNMENT</span>
          <span>•</span>
          <span className="text-white/90">Coimbatore City Municipal Corporation Education Department</span>
        </div>
        <div className="flex gap-4 text-xs font-semibold">
          <span className="cursor-pointer hover:text-[#FFD700] transition">English / தமிழ்</span>
          <span>•</span>
          <span className="cursor-pointer hover:text-[#FFD700] transition">Accessibility</span>
        </div>
      </div>

      {/* Main Navigation Header (Red Gradient Background with Corporation Logo Left & CM Image Top-Right) */}
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
              <p className="text-[11px] md:text-xs font-bold text-[#FFD700] uppercase tracking-wider">
                Government Schools – Education Performance & AI Analytics Portal
              </p>
            </div>
          </div>

          {/* Right: Navigation + CM Image */}
          <div className="flex items-center gap-5">
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-white/90">
              <a href="#hero" className="hover:text-[#FFD700] transition">Home</a>
              <a href="#stats" className="hover:text-[#FFD700] transition">Statistics</a>
              <a href="#schools" className="hover:text-[#FFD700] transition">Schools</a>
              <button
                onClick={onOpenLogin}
                className="gold-button px-5 py-2 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-[#650000]" />
                PORTAL LOGIN
              </button>
            </nav>

            {/* Honourable Tamil Nadu Chief Minister Portrait */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-wider leading-none">
                  Hon'ble Chief Minister
                </p>
                <p className="text-[11px] font-extrabold text-white leading-tight mt-0.5">
                  Tamil Nadu
                </p>
              </div>
              <div className="relative group">
                <img
                  src="/hon_cm_tn.jpg"
                  alt="Honourable Chief Minister of Tamil Nadu"
                  className="w-[50px] sm:w-[60px] h-[60px] sm:h-[72px] object-cover object-top rounded-xl border-2 border-[#FFD700] shadow-md transition group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner Slider */}
      <section id="hero" className="relative h-[480px] bg-slate-950 overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#650000]/95 via-[#8B0000]/80 to-transparent flex items-center">
              <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="max-w-2xl text-white space-y-4">
                  <span className="inline-block bg-[#FFD700] text-[#650000] text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                    {s.category || 'Education Department'}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                    {s.title}
                  </h2>
                  <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium">
                    {s.description}
                  </p>
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={onOpenLogin}
                      className="gold-button px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
                    >
                      Access Official Portal <ChevronRight className="w-4 h-4" />
                    </button>
                    <a
                      href="#schools"
                      className="px-6 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-md border border-white/20 transition"
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
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? 'w-8 bg-[#FFD700]' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* KPI Cards / Statistics Section (Glassmorphism Cards) */}
      <section id="stats" className="max-w-7xl mx-auto px-6 -mt-12 relative z-30 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 border-l-4 border-l-[#8B0000] hover:border-[#FFD700] transition">
            <div className="flex items-center gap-2 text-[#8B0000] mb-2">
              <Building2 className="w-5 h-5 text-[#8B0000]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Corporation Schools</span>
            </div>
            <div className="text-3xl font-black text-[#650000]">{data?.stats?.total_schools || 42}</div>
            <p className="text-xs text-slate-500 mt-1">Across 5 Zones & 100 Wards</p>
          </div>

          <div className="glass-card p-5 border-l-4 border-l-[#FFC928] hover:border-[#8B0000] transition">
            <div className="flex items-center gap-2 text-[#8B0000] mb-2">
              <Users className="w-5 h-5 text-[#8B0000]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Enrolled Students</span>
            </div>
            <div className="text-3xl font-black text-[#650000]">
              {data?.stats?.total_students?.toLocaleString() || '18,750'}
            </div>
            <p className="text-xs text-slate-500 mt-1">EMIS Tracked Records</p>
          </div>

          <div className="glass-card p-5 border-l-4 border-l-[#8B0000] hover:border-[#FFD700] transition">
            <div className="flex items-center gap-2 text-[#8B0000] mb-2">
              <GraduationCap className="w-5 h-5 text-[#8B0000]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Teaching Staff</span>
            </div>
            <div className="text-3xl font-black text-[#650000]">{data?.stats?.total_teachers || 950}</div>
            <p className="text-xs text-slate-500 mt-1">PG & BT Assistants</p>
          </div>

          <div className="glass-card p-5 border-l-4 border-l-[#FFC928] hover:border-[#8B0000] transition">
            <div className="flex items-center gap-2 text-[#8B0000] mb-2">
              <Activity className="w-5 h-5 text-[#8B0000]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Avg Attendance</span>
            </div>
            <div className="text-3xl font-black text-[#650000]">{data?.stats?.avg_attendance || '91.4'}%</div>
            <p className="text-xs text-slate-500 mt-1">Corporation Monthly Benchmark</p>
          </div>
        </div>
      </section>

      {/* Public School Directory */}
      <section id="schools" className="max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-black text-[#B31312] uppercase tracking-widest">Directory</span>
            <h3 className="text-2xl font-black text-[#650000] mt-1">Corporation Educational Institutions</h3>
            <p className="text-sm text-slate-600 mt-1">Official list of Corporation Higher Secondary and High Schools in Coimbatore</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {schools.map((s) => (
            <div key={s.id} className="glass-card p-5 hover:shadow-lg transition border hover:border-[#FFD700]">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2.5 py-1 bg-[#8B0000]/10 text-[#8B0000] text-xs font-black rounded-lg font-mono">
                  {s.school_code}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#FFD700]/20 text-[#650000] rounded">
                  {s.zone} Zone
                </span>
              </div>
              <h4 className="font-black text-slate-900 text-base line-clamp-2 mb-2">
                {s.school_name}
              </h4>
              <div className="text-xs text-slate-600 space-y-1 mb-4">
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#8B0000]" /> {s.ward}</div>
                <div>Category: <span className="font-bold text-slate-800">{s.school_type}</span></div>
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
        </div>
      </section>

      {/* Official Footer */}
      <footer className="bg-gradient-to-r from-[#650000] via-[#8B0000] to-[#650000] text-white py-12 border-t-2 border-[#FFD700] mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
          <div>
            <div className="flex items-center gap-3 text-white font-bold text-base mb-2">
              <img src="/coimbatore_corp_logo.png" alt="Logo" className="h-10 w-auto" />
              <span>Coimbatore City Municipal Corporation</span>
            </div>
            <p className="leading-relaxed text-white/80">
              Department of School Education. Dedicated to data-driven academic monitoring, student growth analytics, and teacher empowerment.
            </p>
          </div>
          <div>
            <h5 className="font-black text-[#FFD700] text-sm mb-3 uppercase tracking-wider">Security & Compliance</h5>
            <ul className="space-y-1.5 text-white/90 font-medium">
              <li>• Role-Based Access Control (RBAC)</li>
              <li>• Student Data Privacy Protected</li>
              <li>• Automated Audit Trail Logging</li>
              <li>• High-Throughput Normalized Database</li>
            </ul>
          </div>
          <div>
            <h5 className="font-black text-[#FFD700] text-sm mb-3 uppercase tracking-wider">Portal Access</h5>
            <button
              onClick={onOpenLogin}
              className="gold-button px-4 py-2 rounded-lg font-black transition cursor-pointer"
            >
              Universal Portal Sign In
            </button>
            <p className="mt-3 text-white/60">© 2026 Coimbatore City Municipal Corporation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
