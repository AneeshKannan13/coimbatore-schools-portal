import React, { useState, useEffect } from 'react';
import {
  Sparkles, Calendar, Plus, Upload,
  Search, FileUp, UserCheck
} from 'lucide-react';
import apiClient from '../api';
import { StaffAttendanceModal } from './StaffAttendanceModal';
import { StaffProfileModal } from './StaffProfileModal';
import { StaffExcelUploadModal } from './StaffExcelUploadModal';
import { StudentAnalyticsSection } from './StudentAnalyticsSection';
import { StaffAnalyticsModal } from './StaffAnalyticsModal';

export const HeadmasterDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'staff'>('students');
  const [data, setData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Staff filters & modals
  const [selectedMonth, setSelectedMonth] = useState('SEPTEMBER');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStaffExcelModal, setShowStaffExcelModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileStaff, setSelectedProfileStaff] = useState<any>(null);
  const [selectedAnalyticsTeacherId, setSelectedAnalyticsTeacherId] = useState<number | null>(null);

  // Single Staff manual attendance modal
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [cl, setCl] = useState(0);
  const [rh, setRh] = useState(0);
  const [el, setEl] = useState(0);
  const [ml, setMl] = useState(0);
  const [others, setOthers] = useState(0);
  const [reason, setReason] = useState('');

  const fetchDashboard = () => {
    setLoading(true);
    apiClient.get('/headmaster/dashboard')
      .then(res => setData(res.data))
      .catch(console.error);

    apiClient.get(`/headmaster/staff?month=${selectedMonth}`)
      .then(res => setStaffData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedMonth]);

  const handleEditAttendance = (staff: any) => {
    setEditingStaff(staff);
    setCl(staff.cl || 0);
    setRh(staff.rh || 0);
    setEl(staff.el || 0);
    setMl(staff.ml || 0);
    setOthers(staff.others || 0);
    setReason(staff.reason || '');
  };

  const handleSaveAttendance = async () => {
    if (!editingStaff) return;
    try {
      await apiClient.post('/headmaster/staff-attendance/update', {
        teacher_id: editingStaff.id,
        month: selectedMonth,
        academic_year: '2026-2027',
        cl, rh, el, ml, others,
        reason
      });
      alert(`Attendance for ${editingStaff.teacher_name} updated and logged in audit trail.`);
      setEditingStaff(null);
      fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update attendance');
    }
  };

  const totalCalculatedLeave = Number(cl) + Number(rh) + Number(el) + Number(ml) + Number(others);

  const filteredStaff = staffData?.staff?.filter((s: any) =>
    s.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const schoolId = data?.school?.id || user?.school_id || 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* School Header Banner */}
      <div className="glass-card p-3.5 sm:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3.5 sm:gap-4 border-l-4 border-l-[#8B0000]">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <img
            src="/coimbatore_corp_logo.png"
            alt="Logo"
            className="h-10 sm:h-14 w-auto object-contain hidden sm:block shrink-0"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 py-0.5 bg-[#8B0000]/10 text-[#8B0000] rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider">
                Headmaster Command Center
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-bold">EMIS: {data?.school?.code}</span>
            </div>
            <h2 className="text-base sm:text-2xl font-black text-[#650000] mt-1 leading-snug">
              {data?.school?.name || 'Coimbatore Corporation HSS, R.S. Puram'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              {data?.school?.zone} Zone • {data?.school?.ward} • Student Pass/Fail Ranges &amp; Staff 360° Analytics
            </p>
          </div>
        </div>

        {/* Action & Tab Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowStaffExcelModal(true)}
            className="px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer bg-slate-900 hover:bg-slate-800 text-[#FFD700] transition"
          >
            <FileUp className="w-4 h-4 text-[#FFD700]" /> Upload Staff Excel (.xlsx)
          </button>

          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 sm:p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${
                activeTab === 'students'
                  ? 'primary-button shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">Students</span>
              <span className="hidden sm:inline">Student Ranges &amp; Pass/Fail</span>
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${
                activeTab === 'staff'
                  ? 'gold-button shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">Staff &amp; Leave</span>
              <span className="hidden sm:inline">Staff Details &amp; Leave</span>
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${
                activeTab === 'overview'
                  ? 'primary-button shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">Overview</span>
              <span className="hidden sm:inline">School Overview</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'students' ? (
        <StudentAnalyticsSection
          schoolId={schoolId}
          title={`${data?.school?.name || 'School'} — Student Pass/Fail & Mark Range Classification`}
          onSelectTeacher={(tid) => setSelectedAnalyticsTeacherId(tid)}
        />
      ) : activeTab === 'overview' ? (
        <>
          {/* Main Institution KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="glass-card p-3 sm:p-5 border-l-4 border-l-[#8B0000]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Total Enrolled</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000]">{data?.kpis?.total_students || 380}</div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Students Enrolled</p>
            </div>

            <div className="glass-card p-3 sm:p-5 border-l-4 border-l-[#FFC928]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Teaching Staff</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000]">{data?.kpis?.total_teachers || 28}</div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Active Staff</p>
            </div>

            <div className="glass-card p-3 sm:p-5 border-l-4 border-l-[#8B0000]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Pass Percentage</div>
              <div className="text-lg sm:text-2xl font-black text-emerald-700">{data?.kpis?.pass_percentage || 87.2}%</div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">State Benchmark</p>
            </div>

            <div className="glass-card p-3 sm:p-5 border-l-4 border-l-[#FFC928]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Student Attendance</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000]">{data?.kpis?.avg_attendance || 92.1}%</div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Staff: {data?.kpis?.teacher_attendance_rate}%</p>
            </div>
          </div>

          {/* AI School Insights Card */}
          <div className="glass-card-dark p-4 sm:p-6 shadow-xl border border-[#FFD700]/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#FFD700] shrink-0" />
              <h3 className="text-xs sm:text-base font-black text-white">AI Institutional Diagnostic &amp; School Performance Index (SPI)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="md:col-span-2 space-y-2.5 sm:space-y-3">
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  Automated institutional scoring combines academic examination marks (40%), attendance rate (30%), and low-performing cohort mitigation (30%).
                </p>
                <div className="space-y-1.5">
                  {data?.ai_insights?.key_insights?.map((ins: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-1.5 shrink-0" />
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD700]">School Performance Index</span>
                <div className="text-3xl sm:text-4xl font-black text-[#FFD700] mt-1">
                  {data?.ai_insights?.school_performance_index || 88.5}
                </div>
                <span className="text-xs font-bold text-emerald-400 mt-1">Grade: A (Very Good)</span>
              </div>
            </div>
          </div>

          {/* Class-wise Performance Table */}
          <div className="glass-card p-3.5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <h3 className="font-black text-[#650000] text-sm sm:text-base">Class-Wise Academic Breakdown</h3>
              <button
                onClick={() => setActiveTab('students')}
                className="px-3 py-1.5 bg-[#8B0000] text-white rounded-xl text-xs font-bold cursor-pointer w-full sm:w-auto text-center"
              >
                Open Student Pass/Fail &amp; Mark Ranges →
              </button>
            </div>
            <div className="table-scroll-container rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[460px]">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">Class &amp; Section</th>
                    <th className="p-3">Students</th>
                    <th className="p-3">Average Mark</th>
                    <th className="p-3">Pass Percentage</th>
                    <th className="p-3">Evaluation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data?.classes?.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#FFF3B0]/30">
                      <td className="p-3 font-bold text-slate-800">{c.class_name}</td>
                      <td className="p-3 text-slate-600">{c.student_count}</td>
                      <td className="p-3 font-semibold text-slate-700">{c.avg_score}%</td>
                      <td className="p-3 font-bold text-emerald-700">{c.pass_rate}%</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          Marks Finalized
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ----------------- STAFF MANAGEMENT MODULE ----------------- */
        <div className="space-y-4 sm:space-y-6">
          {/* Staff KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            <div className="glass-card p-3 sm:p-4 border-l-4 border-l-[#8B0000]">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 truncate">Total Staff</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000] mt-0.5">{staffData?.kpis?.total_staff || 7}</div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Assigned to School</p>
            </div>
            <div className="glass-card p-3 sm:p-4 border-l-4 border-l-emerald-600">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 truncate">Present / Active</div>
              <div className="text-lg sm:text-2xl font-black text-emerald-700 mt-0.5">{staffData?.kpis?.active_staff || 5}</div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Full Attendance</p>
            </div>
            <div className="glass-card p-3 sm:p-4 border-l-4 border-l-rose-600">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 truncate">Staff on Leave</div>
              <div className="text-lg sm:text-2xl font-black text-rose-700 mt-0.5">{staffData?.kpis?.staff_on_leave || 2}</div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{selectedMonth} Recorded</p>
            </div>
            <div className="glass-card p-3 sm:p-4 border-l-4 border-l-[#FFC928]">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 truncate">Total Leave Days</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000] mt-0.5">{staffData?.kpis?.total_leave_days || 5.5}</div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Cumulative Sum</p>
            </div>
            <div className="glass-card p-3 sm:p-4 border-l-4 border-l-[#8B0000] col-span-2 sm:col-span-1">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 truncate">Attendance %</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000] mt-0.5">{staffData?.kpis?.average_staff_attendance || 95.8}%</div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Target 95%</p>
            </div>
          </div>

          {/* Action Header & Filters */}
          <div className="glass-card p-3.5 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
                  <Calendar className="w-4 h-4 text-[#8B0000]" /> Month:
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 sm:py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 flex-1 sm:flex-initial"
                >
                  {['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search staff, subject, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
              <button
                onClick={() => { setSelectedProfileStaff(null); setShowProfileModal(true); }}
                className="primary-button px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFD700]" /> Add Staff Profile
              </button>
              <button
                onClick={() => setShowStaffExcelModal(true)}
                className="px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer bg-slate-800 hover:bg-slate-900 text-white transition"
              >
                <FileUp className="w-3.5 h-3.5" /> Upload Staff Workbook (.xlsx)
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="gold-button px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Attendance (.xlsx)
              </button>
            </div>
          </div>

          {/* Searchable Staff Directory & Attendance Entry */}
          <div className="glass-card p-3.5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
              <div>
                <h3 className="font-black text-[#650000] text-xs sm:text-base">
                  Staff Master Register — Tap Any Staff Name for 360° Analytics Dashboard ({selectedMonth})
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Shows Designation, Location, Contact, Presents, Leaves, Handled Students Count, and Pass/Fail Ratio
                </p>
              </div>
            </div>

            {/* Mobile Staff Cards (<768px) */}
            <div className="md:hidden space-y-2.5">
              {filteredStaff.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedAnalyticsTeacherId(s.id)}
                  className="p-3 bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#8B0000] shadow-2xs cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-[#8B0000] text-xs flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>{s.teacher_name}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-700 mt-0.5">
                        {s.designation} • <span className="text-[#8B0000]">{s.subject}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        📍 {s.location} • 📞 {s.contact_number}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">{s.employee_id}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="bg-emerald-50 rounded-lg py-1">
                      <div className="text-slate-500">Presents</div>
                      <div className="font-black text-emerald-800">{s.present_days}/{s.working_days}d</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg py-1">
                      <div className="text-slate-500">Leaves</div>
                      <div className="font-black text-amber-900">{s.total_leave}d</div>
                    </div>
                    <div className="bg-rose-50/70 rounded-lg py-1">
                      <div className="text-slate-500">{s.handling_student_count} Students</div>
                      <div className="font-black text-emerald-700">{s.student_pass_pct}% Pass</div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnalyticsTeacherId(s.id);
                      }}
                      className="px-2.5 py-1 bg-[#8B0000] text-white font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      360° Dashboard
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAttendance(s);
                      }}
                      className="px-2.5 py-1 bg-[#8B0000]/10 text-[#8B0000] font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      Leave
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProfileStaff(s);
                        setShowProfileModal(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>=768px) */}
            <div className="hidden md:block table-scroll-container rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[860px]">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">Staff Name (Click for Dashboard)</th>
                    <th className="p-3">Designation &amp; Subject</th>
                    <th className="p-3">Location &amp; Contact</th>
                    <th className="p-3 text-center">No. of Presents</th>
                    <th className="p-3 text-center">No. of Leaves</th>
                    <th className="p-3 text-center">Handling Students</th>
                    <th className="p-3 text-center">Pass / Fail Ratio</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStaff.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#FFF3B0]/30 transition">
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedAnalyticsTeacherId(s.id)}
                          className="font-black text-[#8B0000] hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                        >
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span>{s.teacher_name}</span>
                        </button>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{s.employee_id}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{s.designation}</div>
                        <div className="text-[11px] font-bold text-[#8B0000]">{s.subject} ({s.classes_handled})</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-700">{s.location}</div>
                        <div className="text-[10px] font-mono text-slate-500">📞 {s.contact_number}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs">
                          {s.present_days} / {s.working_days}d
                        </span>
                        <div className="text-[10px] font-bold text-emerald-700 mt-0.5">{s.attendance_percentage}%</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-black text-xs ${
                          s.total_leave > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {s.total_leave} Days
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          CL:{s.cl} EL:{s.el} ML:{s.ml}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedAnalyticsTeacherId(s.id)}
                          className="font-black text-[#650000] hover:underline cursor-pointer"
                        >
                          {s.handling_student_count} Students
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-bold">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px]">
                            Pass: {s.student_pass_pct}%
                          </span>
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px]">
                            Fail: {s.student_fail_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAnalyticsTeacherId(s.id)}
                            className="px-2.5 py-1 bg-[#8B0000] text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                          >
                            360° Dashboard
                          </button>
                          <button
                            onClick={() => handleEditAttendance(s)}
                            className="px-2 py-1 bg-[#8B0000]/10 hover:bg-[#8B0000] hover:text-white text-[#8B0000] font-bold rounded-lg text-[11px] transition cursor-pointer"
                          >
                            Leave
                          </button>
                          <button
                            onClick={() => { setSelectedProfileStaff(s); setShowProfileModal(true); }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Staff Attendance Entry Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="glass-card max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-white/60 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#8B0000]">
                  HM Staff Attendance Entry
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {editingStaff.teacher_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingStaff.subject} • Month: {selectedMonth}
                </p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer w-8 h-8 flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">CL</label>
                  <input
                    type="number"
                    min="0"
                    value={cl}
                    onChange={(e) => setCl(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">RH</label>
                  <input
                    type="number"
                    min="0"
                    value={rh}
                    onChange={(e) => setRh(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">EL</label>
                  <input
                    type="number"
                    min="0"
                    value={el}
                    onChange={(e) => setEl(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">ML</label>
                  <input
                    type="number"
                    min="0"
                    value={ml}
                    onChange={(e) => setMl(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Others</label>
                  <input
                    type="number"
                    min="0"
                    value={others}
                    onChange={(e) => setOthers(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center">
                <span className="font-bold text-slate-700">Calculated Total Leave Days:</span>
                <span className="text-base font-black text-[#8B0000]">{totalCalculatedLeave} Days</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Reason for Leave</label>
                <input
                  type="text"
                  placeholder="e.g. Medical Leave, Official Duty, Casual"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                className="primary-button px-5 py-2 rounded-xl text-xs font-black shadow-md cursor-pointer text-center"
              >
                Save &amp; Update Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Attendance Excel Upload Modal */}
      <StaffAttendanceModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={fetchDashboard}
      />

      {/* Staff Details Bulk Excel Upload Modal */}
      <StaffExcelUploadModal
        isOpen={showStaffExcelModal}
        onClose={() => setShowStaffExcelModal(false)}
        onSuccess={fetchDashboard}
        schoolId={schoolId}
      />

      {/* Staff Personal Details Add/Edit Modal */}
      {showProfileModal && (
        <StaffProfileModal
          isOpen={showProfileModal}
          onClose={() => { setShowProfileModal(false); setSelectedProfileStaff(null); }}
          onSuccess={fetchDashboard}
          staffData={selectedProfileStaff}
          schoolId={schoolId}
        />
      )}

      {/* Staff 360° Analytics Dashboard Modal */}
      <StaffAnalyticsModal
        isOpen={!!selectedAnalyticsTeacherId}
        onClose={() => setSelectedAnalyticsTeacherId(null)}
        teacherId={selectedAnalyticsTeacherId}
      />
    </div>
  );
};
