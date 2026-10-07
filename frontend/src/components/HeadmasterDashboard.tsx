import React, { useState, useEffect } from 'react';
import { 
  Users, Award, TrendingUp, AlertTriangle, 
  Sparkles, Calendar, Plus, Upload, CheckCircle2, 
  Search, BookOpen, Clock, BarChart3, Filter, FileUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line 
} from 'recharts';
import apiClient from '../api';
import { StaffAttendanceModal } from './StaffAttendanceModal';
import { StaffProfileModal } from './StaffProfileModal';
import { StaffExcelUploadModal } from './StaffExcelUploadModal';

const LEAVE_COLORS = ['#8B0000', '#FFC928', '#B31312', '#F59E0B', '#64748B'];

export const HeadmasterDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff'>('overview');
  const [data, setData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Staff filters & entry
  const [selectedMonth, setSelectedMonth] = useState('SEPTEMBER');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStaffExcelModal, setShowStaffExcelModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileStaff, setSelectedProfileStaff] = useState<any>(null);
  
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
    s.subject.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* School Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-l-[#8B0000]">
        <div className="flex items-center gap-4">
          <img
            src="/coimbatore_corp_logo.png"
            alt="Logo"
            className="h-14 w-auto object-contain hidden sm:block"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#8B0000]/10 text-[#8B0000] rounded-full text-xs font-black uppercase tracking-wider">
                Headmaster Command Center
              </span>
              <span className="text-xs text-slate-500 font-bold">UDISE / EMIS: {data?.school?.code}</span>
            </div>
            <h2 className="text-2xl font-black text-[#650000] mt-1">
              {data?.school?.name || 'Coimbatore Corporation HSS, R.S. Puram'}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              {data?.school?.zone} Zone • {data?.school?.ward} • Comprehensive Institution Analytics
            </p>
          </div>
        </div>

        {/* Tab Navigation between School and Staff Performance */}
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'overview'
                ? 'primary-button shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            School Overview
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'staff'
                ? 'gold-button shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff Performance & Attendance
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Main Institution KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 border-l-4 border-l-[#8B0000]">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Enrolled</div>
              <div className="text-2xl font-black text-[#650000]">{data?.kpis?.total_students || 380}</div>
              <p className="text-xs text-slate-500 mt-1">Students Enrolled</p>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-[#FFC928]">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Teaching Staff</div>
              <div className="text-2xl font-black text-[#650000]">{data?.kpis?.total_teachers || 28}</div>
              <p className="text-xs text-slate-500 mt-1">Active Staff Members</p>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-[#8B0000]">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pass Percentage</div>
              <div className="text-2xl font-black text-emerald-700">{data?.kpis?.pass_percentage || 87.2}%</div>
              <p className="text-xs text-slate-500 mt-1">State Board Standard</p>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-[#FFC928]">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Student Attendance</div>
              <div className="text-2xl font-black text-[#650000]">{data?.kpis?.avg_attendance || 92.1}%</div>
              <p className="text-xs text-slate-500 mt-1">Staff: {data?.kpis?.teacher_attendance_rate}%</p>
            </div>
          </div>

          {/* AI School Insights Card */}
          <div className="glass-card-dark p-6 shadow-xl border border-[#FFD700]/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-base font-black text-white">AI Institutional Diagnostic & School Performance Index (SPI)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  Automated institutional scoring combines academic examination marks (40%), attendance rate (30%), and low-performing cohort mitigation (30%).
                </p>
                <div className="space-y-1.5">
                  {data?.ai_insights?.key_insights?.map((ins: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-white/90">
                      <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD700]">School Performance Index</span>
                <div className="text-4xl font-black text-[#FFD700] mt-1">
                  {data?.ai_insights?.school_performance_index || 88.5}
                </div>
                <span className="text-xs font-bold text-emerald-400 mt-1">Grade: A (Very Good)</span>
              </div>
            </div>
          </div>

          {/* Class-wise Performance Table */}
          <div className="glass-card p-6">
            <h3 className="font-black text-[#650000] text-sm mb-4">Class-Wise Academic Breakdown</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">Class & Section</th>
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
        <div className="space-y-6">
          {/* Staff KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-card p-4 border-l-4 border-l-[#8B0000]">
              <div className="text-[11px] font-bold uppercase text-slate-500">Total Staff</div>
              <div className="text-2xl font-black text-[#650000] mt-1">{staffData?.kpis?.total_staff || 28}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Assigned to School</p>
            </div>
            <div className="glass-card p-4 border-l-4 border-l-emerald-600">
              <div className="text-[11px] font-bold uppercase text-slate-500">Present / Active</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{staffData?.kpis?.active_staff || 25}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">On Active Duty</p>
            </div>
            <div className="glass-card p-4 border-l-4 border-l-rose-600">
              <div className="text-[11px] font-bold uppercase text-slate-500">Staff on Leave</div>
              <div className="text-2xl font-black text-rose-700 mt-1">{staffData?.kpis?.staff_on_leave || 3}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedMonth} Recorded</p>
            </div>
            <div className="glass-card p-4 border-l-4 border-l-[#FFC928]">
              <div className="text-[11px] font-bold uppercase text-slate-500">Total Leave Days</div>
              <div className="text-2xl font-black text-[#650000] mt-1">{staffData?.kpis?.total_leave_days || 17}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Cumulative Sum</p>
            </div>
            <div className="glass-card p-4 border-l-4 border-l-[#8B0000]">
              <div className="text-[11px] font-bold uppercase text-slate-500">Staff Attendance</div>
              <div className="text-2xl font-black text-[#650000] mt-1">{staffData?.kpis?.average_staff_attendance || 94.6}%</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Benchmark Target 95%</p>
            </div>
          </div>

          {/* Action Header & Filters */}
          <div className="glass-card p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Calendar className="w-4 h-4 text-[#8B0000]" /> Month:
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800"
              >
                {['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search staff by name or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setSelectedProfileStaff(null); setShowProfileModal(true); }}
                className="primary-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFD700]" /> Add Staff Profile
              </button>
              <button
                onClick={() => setShowStaffExcelModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer bg-slate-800 hover:bg-slate-900 text-white transition"
              >
                <FileUp className="w-3.5 h-3.5" /> Upload Staff Details (.xlsx)
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="gold-button px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Attendance (.xlsx)
              </button>
            </div>
          </div>

          {/* Staff Attendance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-card p-6">
              <h3 className="font-black text-[#650000] text-xs uppercase tracking-wider mb-4">
                Monthly Staff Attendance Trend (%)
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={staffData?.monthly_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[90, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#8B0000" strokeWidth={3} dot={{ r: 5, fill: '#FFD700' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6 flex flex-col items-center">
              <h3 className="font-black text-[#650000] text-xs uppercase tracking-wider mb-2 w-full text-left">
                Leave Category Distribution
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={staffData?.leave_distribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                      {staffData?.leave_distribution?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={LEAVE_COLORS[index % LEAVE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600 justify-center">
                {staffData?.leave_distribution?.map((d: any, idx: number) => (
                  <span key={d.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEAVE_COLORS[idx % LEAVE_COLORS.length] }} />
                    {d.name}: {d.value}d
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Searchable Staff Directory & Attendance Entry Table */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-black text-[#650000] text-base">
                  Staff Attendance & Performance Register ({selectedMonth})
                </h3>
                <p className="text-xs text-slate-500">
                  Headmaster leave entry, student improvement link & performance metrics
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Classes</th>
                    <th className="p-3 text-center">CL</th>
                    <th className="p-3 text-center">RH</th>
                    <th className="p-3 text-center">EL</th>
                    <th className="p-3 text-center">ML</th>
                    <th className="p-3 text-center font-bold">Total Leave</th>
                    <th className="p-3">Attendance %</th>
                    <th className="p-3">Student Pass %</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStaff.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#FFF3B0]/30 transition">
                      <td className="p-3 font-bold text-slate-900">{s.teacher_name}</td>
                      <td className="p-3 text-slate-700">{s.subject}</td>
                      <td className="p-3 text-slate-500">{s.classes_handled}</td>
                      <td className="p-3 text-center">{s.cl}</td>
                      <td className="p-3 text-center">{s.rh}</td>
                      <td className="p-3 text-center">{s.el}</td>
                      <td className="p-3 text-center">{s.ml}</td>
                      <td className="p-3 text-center font-bold text-[#8B0000]">{s.total_leave}</td>
                      <td className="p-3 font-bold text-emerald-700">{s.attendance_percentage}%</td>
                      <td className="p-3 font-semibold text-slate-800">{s.student_pass_pct}%</td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
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
                            Edit Info
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-lg w-full p-6 shadow-2xl border border-white/60">
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
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-5 gap-2">
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

              {/* Automatic Total Calculation */}
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

            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                className="primary-button px-5 py-2 rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                Save & Update Register
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
        schoolId={data?.school?.id || user.school_id}
      />

      {/* Staff Personal Details Add/Edit Modal */}
      {showProfileModal && (
        <StaffProfileModal
          isOpen={showProfileModal}
          onClose={() => { setShowProfileModal(false); setSelectedProfileStaff(null); }}
          onSuccess={fetchDashboard}
          staffData={selectedProfileStaff}
          schoolId={data?.school?.id || user.school_id}
        />
      )}
    </div>
  );
};
