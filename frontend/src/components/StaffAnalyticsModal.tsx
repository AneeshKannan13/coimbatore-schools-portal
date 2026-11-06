import React, { useState, useEffect } from 'react';
import {
  Phone, MapPin, Award, Calendar, CheckCircle2,
  AlertTriangle, Users, X, Briefcase, ChevronDown, ChevronUp, Sun, Moon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, CartesianGrid
} from 'recharts';
import apiClient from '../api';

const RANGE_STYLES: Record<string, {
  bg: string;
  border: string;
  text: string;
  badge: string;
  barColor: string;
}> = {
  below_35: {
    bg: 'bg-rose-50 hover:bg-rose-100/80',
    border: 'border-rose-300',
    text: 'text-rose-800',
    badge: 'bg-rose-600 text-white',
    barColor: '#e11d48'
  },
  '35_50': {
    bg: 'bg-amber-50 hover:bg-amber-100/80',
    border: 'border-amber-300',
    text: 'text-amber-900',
    badge: 'bg-amber-500 text-white',
    barColor: '#f59e0b'
  },
  '50_75': {
    bg: 'bg-blue-50 hover:bg-blue-100/80',
    border: 'border-blue-300',
    text: 'text-blue-900',
    badge: 'bg-blue-600 text-white',
    barColor: '#2563eb'
  },
  '75_90': {
    bg: 'bg-emerald-50 hover:bg-emerald-100/80',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    badge: 'bg-emerald-600 text-white',
    barColor: '#059669'
  },
  above_90: {
    bg: 'bg-purple-50 hover:bg-purple-100/80',
    border: 'border-purple-300',
    text: 'text-purple-900',
    badge: 'bg-purple-700 text-white',
    barColor: '#7c3aed'
  }
};

export const StaffAnalyticsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  teacherId: number | null;
}> = ({ isOpen, onClose, teacherId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRangeKey, setSelectedRangeKey] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen || !teacherId) return;
    setLoading(true);
    setSelectedRangeKey('ALL');
    apiClient.get(`/staff/${teacherId}/dashboard-details`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, teacherId]);

  if (!isOpen || !teacherId) return null;

  const staff = data?.staff || {};
  const att = data?.attendance || {};
  const metrics = data?.student_metrics || {};
  const ranges: any[] = metrics.mark_ranges || [];
  const allStudents: any[] = metrics.students || [];

  const filteredStudents = selectedRangeKey === 'ALL'
    ? allStudents
    : allStudents.filter((s: any) => s.range_key === selectedRangeKey);

  const chartData = ranges.map((r: any) => ({
    name: r.label,
    count: r.count,
    key: r.key,
    color: RANGE_STYLES[r.key]?.barColor || '#8B0000'
  }));

  const passFailPie = [
    { name: 'Pass', value: metrics.pass_count || 0, color: '#10b981' },
    { name: 'Fail', value: metrics.fail_count || 0, color: '#e11d48' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
      <div className="glass-card max-w-6xl w-full p-3 sm:p-6 shadow-2xl border border-white/70 h-[94vh] sm:h-auto sm:max-h-[94vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        {/* Top Executive Header */}
        <div className="flex justify-between items-start pb-3 sm:pb-4 border-b border-slate-200 gap-2 sm:gap-3">
          <div className="flex items-start gap-2.5 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#650000] text-[#FFD700] flex items-center justify-center font-black text-base sm:text-xl shadow-md shrink-0">
              {staff.teacher_name ? staff.teacher_name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="px-2 py-0.5 bg-[#8B0000] text-[#FFD700] text-[9px] sm:text-[10px] font-black rounded-full uppercase tracking-wider">
                  Staff 360° Dashboard
                </span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[9px] sm:text-[10px] font-bold rounded">
                  ID: {staff.employee_id}
                </span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9px] sm:text-[10px] font-bold rounded">
                  {staff.designation}
                </span>
              </div>
              <h2 className="text-base sm:text-2xl font-black text-[#650000] mt-1 truncate">
                {loading ? 'Loading Staff Profile...' : staff.teacher_name}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium line-clamp-1">
                Subject: <b className="text-[#8B0000]">{staff.subject_specialization}</b> • {staff.school_name} ({staff.zone} Zone)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                const root = document.documentElement;
                const nextDark = !root.classList.contains('dark-mode');
                root.classList.toggle('dark-mode', nextDark);
                localStorage.setItem('theme', nextDark ? 'dark' : 'light');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer transition"
              title="Toggle Dark / Bright Mode"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Theme</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center cursor-pointer transition shrink-0"
              aria-label="Close Staff Dashboard"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-4 sm:space-y-5 pr-0.5 sm:pr-1">
          {loading ? (
            <div className="py-16 text-center text-xs sm:text-sm font-bold text-slate-500">
              Loading complete staff analytics, attendance &amp; student mark ranges...
            </div>
          ) : (
            <>
              {/* Row 1: Staff Personal, Contact & Location Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
                <div className="bg-white/90 border border-slate-200 rounded-xl p-2.5 sm:p-3 min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-[#8B0000] shrink-0" /> Designation
                  </div>
                  <div className="text-xs font-black text-slate-800 mt-1 truncate">{staff.designation}</div>
                  <div className="text-[10px] text-slate-500 truncate">{staff.education_qualification}</div>
                </div>

                <div className="bg-white/90 border border-slate-200 rounded-xl p-2.5 sm:p-3 min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#8B0000] shrink-0" /> Location
                  </div>
                  <div className="text-xs font-black text-slate-800 mt-1 truncate" title={staff.location}>
                    {staff.location}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Native: {staff.native_place}</div>
                </div>

                <div className="bg-white/90 border border-slate-200 rounded-xl p-2.5 sm:p-3 min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600 shrink-0" /> Contact
                  </div>
                  <div className="text-xs font-black font-mono text-slate-800 mt-1 truncate">{staff.contact_number}</div>
                  <div className="text-[10px] text-slate-500 truncate">Blood: {staff.blood_group} • {staff.experience_years}y Exp</div>
                </div>

                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5 sm:p-3 min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Presents
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-800 mt-0.5">
                    {att.present_days} <span className="text-[10px] sm:text-xs font-bold text-emerald-600">/ {att.working_days}d</span>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700">Attendance: {att.attendance_percentage}%</div>
                </div>

                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 sm:p-3 min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-600 shrink-0" /> Leaves
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-900 mt-0.5">
                    {att.total_leave} <span className="text-[10px] sm:text-xs font-bold text-amber-700">Days</span>
                  </div>
                  <div className="text-[10px] text-amber-800 truncate" title={`CL:${att.cl} RH:${att.rh} EL:${att.el} ML:${att.ml}`}>
                    CL:{att.cl} • EL:{att.el} • ML:{att.ml}
                  </div>
                </div>

                <div className="bg-rose-50/80 border border-[#8B0000]/20 rounded-xl p-2.5 sm:p-3 min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#8B0000] uppercase flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#8B0000] shrink-0" /> Handled Students
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#650000] mt-0.5">
                    {metrics.handling_student_count} <span className="text-[10px] sm:text-xs font-bold text-slate-600">Students</span>
                  </div>
                  <div className="text-[10px] text-slate-600 truncate">
                    Classes: {staff.classes_handled?.join(', ')}
                  </div>
                </div>
              </div>

              {/* Row 2: Pass Ratio, Fail Ratio & Subject Average Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                      Student Pass Ratio (≥ 35 Marks)
                    </div>
                    <div className="text-xl sm:text-3xl font-black mt-0.5 sm:mt-1">
                      {metrics.pass_ratio}%
                    </div>
                    <div className="text-[11px] sm:text-xs text-emerald-100 font-semibold mt-0.5">
                      {metrics.pass_count} of {metrics.handling_student_count} Students Passed
                    </div>
                  </div>
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-200/80 shrink-0" />
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-md flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-rose-100">
                      Student Fail Ratio (&lt; 35 Marks)
                    </div>
                    <div className="text-xl sm:text-3xl font-black mt-0.5 sm:mt-1">
                      {metrics.fail_ratio}%
                    </div>
                    <div className="text-[11px] sm:text-xs text-rose-100 font-semibold mt-0.5">
                      {metrics.fail_count} of {metrics.handling_student_count} Students Failed
                    </div>
                  </div>
                  <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-200/80 shrink-0" />
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#650000] text-white shadow-md flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#FFD700]">
                      Subject Average ({staff.subject_specialization})
                    </div>
                    <div className="text-xl sm:text-3xl font-black text-[#FFD700] mt-0.5 sm:mt-1">
                      {metrics.subject_average}%
                    </div>
                    <div className="text-[11px] sm:text-xs text-white/85 font-semibold mt-0.5">
                      Across {staff.classes_handled?.join(', ')}
                    </div>
                  </div>
                  <Award className="w-8 h-8 sm:w-10 sm:h-10 text-[#FFD700]/80 shrink-0" />
                </div>
              </div>

              {/* Row 3: Mark-Wise Range Distribution Interactive Cards + Visual Chart */}
              <div className="glass-card p-3 sm:p-4 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[#650000] uppercase tracking-wider">
                      Mark-Wise Range Distribution (Tap any range to filter)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Breakdown of {metrics.handling_student_count} students handled by {staff.teacher_name} in {staff.subject_specialization}
                    </p>
                  </div>
                  {selectedRangeKey !== 'ALL' && (
                    <button
                      onClick={() => setSelectedRangeKey('ALL')}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer self-start sm:self-auto"
                    >
                      Show All ({allStudents.length})
                    </button>
                  )}
                </div>

                {/* 5 Interactive Range Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 mb-4">
                  {ranges.map((r: any, idx: number) => {
                    const st = RANGE_STYLES[r.key] || RANGE_STYLES['50_75'];
                    const isSelected = selectedRangeKey === r.key;
                    const isLastOdd = idx === ranges.length - 1 && ranges.length % 2 === 1;
                    return (
                      <button
                        key={r.key}
                        onClick={() => setSelectedRangeKey(isSelected ? 'ALL' : r.key)}
                        className={`p-2.5 sm:p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                          isLastOdd ? 'col-span-2 sm:col-span-1' : ''
                        } ${st.bg} ${
                          isSelected ? 'ring-2 ring-[#8B0000] border-[#8B0000] shadow-md' : st.border
                        }`}
                      >
                        <div className="flex items-center justify-between w-full gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black ${st.badge}`}>
                            {r.label}
                          </span>
                          <span className={`text-[11px] font-black ${st.text}`}>
                            {r.percentage}%
                          </span>
                        </div>
                        <div className={`text-xl sm:text-2xl font-black mt-1.5 sm:mt-2 ${st.text}`}>
                          {r.count} <span className="text-[11px] sm:text-xs font-bold">Students</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium mt-1 flex items-center justify-between">
                          <span className="truncate">{r.sublabel}</span>
                          {isSelected ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bar Chart & Pass/Fail Pie */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div className="md:col-span-2 h-40 sm:h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" fontSize={10} stroke="#475569" />
                        <YAxis allowDecimals={false} fontSize={10} stroke="#475569" width={28} />
                        <Tooltip />
                        <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                          {chartData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-40 sm:h-44 flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={passFailPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={48} innerRadius={25}>
                          {passFailPie.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-3 text-[11px] font-bold">
                      <span className="text-emerald-700">● Pass: {metrics.pass_count} ({metrics.pass_ratio}%)</span>
                      <span className="text-rose-700">● Fail: {metrics.fail_count} ({metrics.fail_ratio}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Handled Students List & Their Names */}
              <div className="glass-card p-3 sm:p-4 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[#650000]">
                      Handling Students List &amp; Marks ({filteredStudents.length} Students)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Automatic Pass/Fail color classification and mark-range tagging for students under {staff.teacher_name}
                    </p>
                  </div>
                </div>

                {/* Mobile Card View (<768px) */}
                <div className="md:hidden space-y-2.5 max-h-96 overflow-y-auto pr-0.5">
                  {filteredStudents.map((st: any) => {
                    const rStyle = RANGE_STYLES[st.range_key] || RANGE_STYLES['50_75'];
                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border-l-4 border border-slate-200 ${
                          st.is_pass
                            ? 'border-l-emerald-500 bg-white'
                            : 'border-l-rose-600 bg-rose-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-black text-slate-900 text-xs">{st.student_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              EMIS: {st.emis_number} • {st.class_name}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                              st.is_pass
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {st.result_status}
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500">{staff.subject_specialization}: </span>
                            <span className={`font-black text-sm ${st.is_pass ? 'text-slate-900' : 'text-rose-700'}`}>
                              {st.subject_mark}/100
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rStyle.badge}`}>
                            {st.range_label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700">
                            Overall Avg: {st.overall_avg}%
                          </span>
                        </div>

                        {st.low_subjects?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {st.low_subjects.map((ls: any, i: number) => (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  ls.is_fail
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                ⚠ {ls.subject_name}: {ls.mark}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                      No students in this mark range category.
                    </div>
                  )}
                </div>

                {/* Desktop Table View (>=768px) */}
                <div className="hidden md:block table-scroll-container rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs min-w-[640px]">
                    <thead className="bg-[#8B0000] text-white">
                      <tr>
                        <th className="p-2.5">EMIS ID</th>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5">Class &amp; Sec</th>
                        <th className="p-2.5 text-center">{staff.subject_specialization} Mark</th>
                        <th className="p-2.5 text-center">Mark Range</th>
                        <th className="p-2.5 text-center">Subject Pass / Fail</th>
                        <th className="p-2.5">Overall Avg &amp; Low Subject Alerts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredStudents.map((st: any) => {
                        const rStyle = RANGE_STYLES[st.range_key] || RANGE_STYLES['50_75'];
                        return (
                          <tr
                            key={st.id}
                            className={`transition ${
                              st.is_pass ? 'hover:bg-emerald-50/40' : 'bg-rose-50/60 hover:bg-rose-100/60'
                            }`}
                          >
                            <td className="p-2.5 font-mono text-slate-500 text-[11px]">{st.emis_number}</td>
                            <td className="p-2.5 font-bold text-slate-900">{st.student_name}</td>
                            <td className="p-2.5 text-slate-600 font-semibold">{st.class_name}</td>
                            <td className="p-2.5 text-center">
                              <span className={`font-black text-sm ${st.is_pass ? 'text-slate-900' : 'text-rose-700'}`}>
                                {st.subject_mark}
                              </span>
                              <span className="text-[10px] text-slate-400"> / 100</span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rStyle.badge}`}>
                                {st.range_label}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  st.is_pass
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-600 text-white shadow-xs'
                                }`}
                              >
                                {st.result_status}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-700">Avg: {st.overall_avg}%</span>
                                {st.low_subjects?.map((ls: any, i: number) => (
                                  <span
                                    key={i}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      ls.is_fail
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                    }`}
                                  >
                                    {ls.subject_name}: {ls.mark}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">
                            No students in this mark range category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2.5 sm:pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 safe-pb">
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium text-center sm:text-left">
            Coimbatore City Municipal Corporation • Staff &amp; Student Performance Analytics
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 sm:py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer text-center"
          >
            Close Staff Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
