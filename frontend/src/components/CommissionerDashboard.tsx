import React, { useState, useEffect } from 'react';
import {
  Building2, Sparkles, ChevronRight, UserCheck, BarChart3, Calendar, BookOpen, ArrowUpDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LabelList
} from 'recharts';
import apiClient, { CORP_LOGO_URL } from '../api';
import { SchoolDetailModal } from './SchoolDetailModal';
import { StudentAnalyticsSection } from './StudentAnalyticsSection';
import { StaffAnalyticsModal } from './StaffAnalyticsModal';

type SchoolSortMode =
  | 'FAIL_DESC'
  | 'FAIL_ASC'
  | 'PASS_DESC'
  | 'PASS_ASC'
  | 'ATT_DESC'
  | 'ATT_ASC'
  | 'AVG_DESC'
  | 'ENROLLED_DESC';

export const CommissionerDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'staff'>('overview');
  const [data, setData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [schoolStaffList, setSchoolStaffList] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedStandard, setSelectedStandard] = useState<string>('All');
  const [schoolSortBy, setSchoolSortBy] = useState<SchoolSortMode>('FAIL_DESC');
  const [filterSchoolId, setFilterSchoolId] = useState<number>(1);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedZone !== 'All') params.append('zone', selectedZone);
    if (selectedStandard !== 'All') params.append('standard', selectedStandard);
    const query = params.toString() ? `?${params.toString()}` : '';

    apiClient.get(`/commissioner/dashboard${query}`)
      .then(res => {
        setData(res.data);
        const list: any[] = res.data?.schools || [];
        if (list.length > 0) {
          const exists = list.some((s: any) => s.id === filterSchoolId);
          if (!filterSchoolId || !exists) {
            setFilterSchoolId(list[0].id);
          }
        }
      })
      .catch(console.error);

    apiClient.get(`/commissioner/staff-performance${query}`)
      .then(res => setStaffData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedZone, selectedStandard]);

  const sortedSchools = [...(data?.schools || [])].sort((a: any, b: any) => {
    const failA = a.fail_count ?? a.risk_students ?? 0;
    const failB = b.fail_count ?? b.risk_students ?? 0;
    if (schoolSortBy === 'FAIL_DESC') return failB - failA;
    if (schoolSortBy === 'FAIL_ASC') return failA - failB;
    if (schoolSortBy === 'PASS_DESC') return (b.pass_rate || 0) - (a.pass_rate || 0);
    if (schoolSortBy === 'PASS_ASC') return (a.pass_rate || 0) - (b.pass_rate || 0);
    if (schoolSortBy === 'ATT_DESC') return (b.attendance || 0) - (a.attendance || 0);
    if (schoolSortBy === 'ATT_ASC') return (a.attendance || 0) - (b.attendance || 0);
    if (schoolSortBy === 'AVG_DESC') return (b.avg_mark || 0) - (a.avg_mark || 0);
    if (schoolSortBy === 'ENROLLED_DESC') return (b.students || 0) - (a.students || 0);
    return 0;
  });

  useEffect(() => {
    if (filterSchoolId > 0) {
      apiClient.get(`/headmaster/staff?school_id=${filterSchoolId}`)
        .then(res => setSchoolStaffList(res.data?.staff || []))
        .catch(console.error);
    }
  }, [filterSchoolId]);

  const zoneData = data?.zone_summary?.map((z: any) => ({
    name: `${z.zone} Zone`,
    passRate: z.avg_pass,
    attendance: z.attendance
  })) || [];

  // 1. Quarterly Examination Pass % & Average Score Bar Graph Data (ONLY Quarterly Exam, broken down by Class 9, 10, 11, 12)
  const examPassGraphData = data?.exam_pass_comparison || [
    { exam: 'Class 9 (Quarterly)', pass_percentage: 58.4, avg_mark: 46.2 },
    { exam: 'Class 10 (Quarterly)', pass_percentage: 61.5, avg_mark: 47.8 },
    { exam: 'Class 11 (Quarterly)', pass_percentage: 60.2, avg_mark: 46.9 },
    { exam: 'Class 12 (Quarterly)', pass_percentage: 63.8, avg_mark: 49.4 },
  ];

  // 2. Student Overall Attendance Bar Graph Data — ONLY the 4 uploaded months from the Excel columns: JUNE (18d), JULY (23d), AUG (20d), SEP (18d)
  const monthlyAttendanceGraphData = data?.monthly_student_attendance || [
    { month: 'JUNE (18d)', full_month: 'June (18 Working Days)', attendance: 89.4 },
    { month: 'JULY (23d)', full_month: 'July (23 Working Days)', attendance: 91.2 },
    { month: 'AUG (20d)', full_month: 'August (20 Working Days)', attendance: 88.7 },
    { month: 'SEP (18d)', full_month: 'September (18 Working Days)', attendance: 90.8 },
  ];

  // 3. Subject-Wise Failures in Numbers
  const subjectFailures: any[] = data?.subject_failures || [
    { subject: 'Maths', failed_count: 8, low_mark_count: 10, total_students: 26, fail_percentage: 30.8, color: '#e11d48' },
    { subject: 'Science', failed_count: 7, low_mark_count: 8, total_students: 26, fail_percentage: 26.9, color: '#d97706' },
    { subject: 'English', failed_count: 6, low_mark_count: 8, total_students: 26, fail_percentage: 23.1, color: '#f59e0b' },
    { subject: 'Tamil', failed_count: 5, low_mark_count: 6, total_students: 26, fail_percentage: 19.2, color: '#2563eb' },
    { subject: 'Social Science', failed_count: 5, low_mark_count: 6, total_students: 26, fail_percentage: 19.2, color: '#7c3aed' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Corporation Command Bar */}
      <div className="glass-card p-3.5 sm:p-6 flex flex-col gap-3.5 sm:gap-4 border-l-4 border-l-[#8B0000]">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <img
              src={CORP_LOGO_URL}
              alt="CCMC"
              className="w-10 h-10 sm:w-14 sm:h-14 object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-0.5 bg-[#8B0000]/10 text-[#8B0000] rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  Commissioner Central Command
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-bold">Executive Monitoring</span>
              </div>
              <h2 className="text-base sm:text-2xl font-black text-[#650000] mt-1 leading-snug">
                Coimbatore City Municipal Corporation
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                Education Directorate • Classes 9, 10, 11 &amp; 12 • Exam &amp; Attendance Variation Analytics
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 sm:p-1.5 rounded-2xl w-full xl:w-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${
                activeTab === 'overview'
                  ? 'primary-button shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">Overview</span>
              <span className="hidden sm:inline">Schools Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${
                activeTab === 'students'
                  ? 'gold-button shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">Students</span>
              <span className="hidden sm:inline">Student Ranges &amp; Pass/Fail</span>
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${
                activeTab === 'staff'
                  ? 'primary-button shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">Staff</span>
              <span className="hidden sm:inline">Staff Performance</span>
            </button>
          </div>
        </div>

        {/* Classes (9, 10, 11, 12) + Zone Filter Bar */}
        <div className="pt-2.5 border-t border-slate-200/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Requirement 1: Classes 9, 10, 11, 12 Filter */}
          <div className="table-scroll-container flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <span className="text-[11px] font-black text-[#650000] pl-2.5 pr-1 shrink-0 uppercase">
              Class:
            </span>
            {[
              { val: 'All', label: 'All (9–12)' },
              { val: '9', label: 'Class 9' },
              { val: '10', label: 'Class 10' },
              { val: '11', label: 'Class 11' },
              { val: '12', label: 'Class 12' },
            ].map((cls) => (
              <button
                key={cls.val}
                onClick={() => setSelectedStandard(cls.val)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedStandard === cls.val
                    ? 'bg-[#8B0000] text-[#FFD700] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cls.label}
              </button>
            ))}
          </div>

          {/* Zone Filter */}
          <div className="table-scroll-container flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500 pl-2.5 pr-1 shrink-0 uppercase">Zone:</span>
            {['All', 'North', 'South', 'East', 'West', 'Central'].map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedZone === z
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

      {/* School Selector Bar for Students & Staff Tabs */}
      {activeTab !== 'overview' && (
        <div className="glass-card p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-l-4 border-l-[#FFC928]">
          <div className="flex items-center gap-2 text-xs font-black text-[#650000]">
            <Building2 className="w-4 h-4 text-[#8B0000] shrink-0" />
            <span>Select Corporation School to Inspect Staff &amp; Student Mark Ranges:</span>
          </div>
          <select
            value={filterSchoolId}
            onChange={(e) => setFilterSchoolId(Number(e.target.value))}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 sm:min-w-[340px]"
          >
            {activeTab === 'students' && <option value={0}>All Corporation Schools (Combined View)</option>}
            {data?.schools?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name} ({s.zone} Zone)
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTab === 'students' ? (
        <StudentAnalyticsSection
          schoolId={filterSchoolId}
          zone={selectedZone}
          initialStandard={selectedStandard}
          allowUploads={false}
          title="Corporation Commissioner — Student Pass/Fail Classification & 5-Range Breakdown"
          onSelectTeacher={(tid) => setSelectedTeacherId(tid)}
        />
      ) : activeTab === 'overview' ? (
        <>
          {/* School-Wise Analysis — Placed Directly Below the Top Class/Zone Filter Bar */}
          <div className="glass-card p-3.5 sm:p-6 border-t-4 border-t-[#8B0000]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3.5 sm:mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-[#650000] text-xs sm:text-base">
                    Corporation Schools Directory &amp; Performance Matrix
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#8B0000] text-[#FFD700] text-[10px] font-black uppercase">
                    {selectedStandard === 'All'
                      ? `All Classes (9–12) • ${sortedSchools.length} Schools`
                      : `Class ${selectedStandard} • ${sortedSchools.length} Active School${sortedSchools.length === 1 ? '' : 's'}`}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {selectedStandard === '11' || selectedStandard === '12'
                    ? `Showing only Higher Secondary schools that offer Class ${selectedStandard} • Tap any school to inspect Student Mark Ranges & Staff 360°`
                    : 'Tap any school to inspect all Student Mark Ranges (<35 to >90) and Staff 360° Details'}
                </p>
              </div>

              {/* Quick Sort Filter Buttons + Dropdown for Pass %, Attendance %, and Fail Count */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-black text-[#650000] uppercase flex items-center gap-1 mr-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#8B0000]" /> Sort By:
                </span>
                <button
                  onClick={() => setSchoolSortBy(schoolSortBy === 'PASS_DESC' ? 'PASS_ASC' : 'PASS_DESC')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                    schoolSortBy.startsWith('PASS_')
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Pass % {schoolSortBy === 'PASS_ASC' ? '↑' : '↓'}
                </button>
                <button
                  onClick={() => setSchoolSortBy(schoolSortBy === 'ATT_DESC' ? 'ATT_ASC' : 'ATT_DESC')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                    schoolSortBy.startsWith('ATT_')
                      ? 'bg-[#FFC928] text-[#650000] shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Attendance {schoolSortBy === 'ATT_ASC' ? '↑' : '↓'}
                </button>
                <button
                  onClick={() => setSchoolSortBy(schoolSortBy === 'FAIL_DESC' ? 'FAIL_ASC' : 'FAIL_DESC')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                    schoolSortBy.startsWith('FAIL_')
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Fail Count {schoolSortBy === 'FAIL_ASC' ? '↑' : '↓'}
                </button>

                <select
                  value={schoolSortBy}
                  onChange={(e) => setSchoolSortBy(e.target.value as SchoolSortMode)}
                  className="px-2.5 py-1 border border-slate-300 rounded-xl text-[11px] font-bold bg-white text-slate-800 cursor-pointer"
                >
                  <option value="FAIL_DESC">Fail Count: High → Low</option>
                  <option value="FAIL_ASC">Fail Count: Low → High</option>
                  <option value="PASS_DESC">Pass %: High → Low</option>
                  <option value="PASS_ASC">Pass %: Low → High</option>
                  <option value="ATT_DESC">Attendance %: High → Low</option>
                  <option value="ATT_ASC">Attendance %: Low → High</option>
                  <option value="AVG_DESC">Avg Mark: High → Low</option>
                  <option value="ENROLLED_DESC">Enrolled: High → Low</option>
                </select>
              </div>
            </div>

            {/* Mobile School Cards (<768px) */}
            <div className="md:hidden space-y-2.5">
              {sortedSchools.map((s: any) => {
                const failCount = s.fail_count ?? s.risk_students ?? 0;
                const passCount = s.pass_count ?? Math.max(0, (s.students || 0) - failCount);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSchoolId(s.id)}
                    className="p-3 bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#8B0000] shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[9px] font-bold rounded">
                          {s.code} • {s.zone} Zone
                        </span>
                        <div className="font-black text-[#8B0000] text-xs mt-1 leading-snug">{s.name}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSchoolId(s.id);
                        }}
                        className="px-2.5 py-1 bg-[#8B0000] text-white rounded-lg font-bold text-[10px] shrink-0 cursor-pointer"
                      >
                        Inspect →
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-5 gap-1 text-center text-[10px]">
                      <div>
                        <div className="text-slate-400">Enrolled</div>
                        <div className="font-bold text-slate-800">{s.students}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Avg Mark</div>
                        <div className="font-bold text-slate-800">{s.avg_mark}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Pass %</div>
                        <div className="font-black text-emerald-700">{s.pass_rate}% ({passCount})</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Attend</div>
                        <div className="font-bold text-slate-800">{s.attendance}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Fail Count</div>
                        <div className="font-black text-rose-600">{failCount}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>=768px) */}
            <div className="hidden md:block table-scroll-container rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">School Code</th>
                    <th className="p-3">Institution Name (Click to Open Staff &amp; Student Drilldown)</th>
                    <th className="p-3">Zone / Ward</th>
                    <th className="p-3">
                      <button
                        onClick={() => setSchoolSortBy('ENROLLED_DESC')}
                        className="flex items-center gap-1 font-black text-white hover:text-[#FFD700] cursor-pointer"
                      >
                        Enrolled <ArrowUpDown className="w-3 h-3 opacity-80" />
                      </button>
                    </th>
                    <th className="p-3">
                      <button
                        onClick={() => setSchoolSortBy('AVG_DESC')}
                        className="flex items-center gap-1 font-black text-white hover:text-[#FFD700] cursor-pointer"
                      >
                        Avg Mark <ArrowUpDown className="w-3 h-3 opacity-80" />
                      </button>
                    </th>
                    <th className="p-3">
                      <button
                        onClick={() => setSchoolSortBy(schoolSortBy === 'PASS_DESC' ? 'PASS_ASC' : 'PASS_DESC')}
                        className="flex items-center gap-1 font-black text-white hover:text-[#FFD700] cursor-pointer"
                      >
                        Pass % <ArrowUpDown className="w-3 h-3 text-[#FFD700]" />
                      </button>
                    </th>
                    <th className="p-3">
                      <button
                        onClick={() => setSchoolSortBy(schoolSortBy === 'ATT_DESC' ? 'ATT_ASC' : 'ATT_DESC')}
                        className="flex items-center gap-1 font-black text-white hover:text-[#FFD700] cursor-pointer"
                      >
                        Attendance <ArrowUpDown className="w-3 h-3 text-[#FFD700]" />
                      </button>
                    </th>
                    <th className="p-3">
                      <button
                        onClick={() => setSchoolSortBy(schoolSortBy === 'FAIL_DESC' ? 'FAIL_ASC' : 'FAIL_DESC')}
                        className="flex items-center gap-1 font-black text-white hover:text-[#FFD700] cursor-pointer"
                      >
                        Fail Count <ArrowUpDown className="w-3 h-3 text-[#FFD700]" />
                      </button>
                    </th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedSchools.map((s: any) => {
                    const failCount = s.fail_count ?? s.risk_students ?? 0;
                    const passCount = s.pass_count ?? Math.max(0, (s.students || 0) - failCount);
                    return (
                      <tr key={s.id} className="hover:bg-[#FFF3B0]/30 transition">
                        <td className="p-3 font-mono font-medium text-slate-600">{s.code}</td>
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedSchoolId(s.id)}
                            className="font-bold text-[#8B0000] hover:text-[#B31312] hover:underline text-left cursor-pointer flex items-center gap-1.5"
                          >
                            {s.name} <ChevronRight className="w-3.5 h-3.5 text-[#FFC928]" />
                          </button>
                        </td>
                        <td className="p-3 text-slate-600">{s.zone} / {s.ward}</td>
                        <td className="p-3 font-semibold text-slate-700">{s.students}</td>
                        <td className="p-3 font-semibold text-slate-700">{s.avg_mark}%</td>
                        <td className="p-3 font-bold text-emerald-700">
                          {s.pass_rate}% <span className="text-[10px] font-semibold text-slate-500">({passCount})</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{s.attendance}%</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black text-xs">
                            {failCount}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedSchoolId(s.id)}
                            className="px-2.5 py-1 bg-[#8B0000] text-white rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            Staff &amp; Students →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="glass-card p-3 sm:p-4 border-l-4 border-l-[#8B0000]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 truncate">Corp Schools</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000]">{data?.kpis?.total_schools || 4}</div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {selectedStandard === 'All' ? 'Classes 9, 10, 11 & 12' : `Class ${selectedStandard} Selected`}
              </p>
            </div>

            <div className="glass-card p-3 sm:p-4 border-l-4 border-l-[#FFC928]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 truncate">Quarterly Exam Pass %</div>
              <div className="text-lg sm:text-2xl font-black text-emerald-700 mt-0.5">
                {data?.kpis?.overall_pass_percentage ?? 60.8}% <span className="text-xs font-bold text-slate-600">(Avg: {data?.kpis?.corporation_avg_score ?? 47.2}%)</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">Quarterly Examination (2026–27) ↓</p>
            </div>

            <div className="glass-card p-3 sm:p-4 border-l-4 border-l-[#8B0000]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 truncate">Jun–Sep Attendance (79d)</div>
              <div className="text-xs sm:text-sm font-black text-[#650000] mt-1">
                Jun: {monthlyAttendanceGraphData[0]?.attendance}% • Jul: {monthlyAttendanceGraphData[1]?.attendance}% • Aug: {monthlyAttendanceGraphData[2]?.attendance}% • Sep: {monthlyAttendanceGraphData[3]?.attendance}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">4 Uploaded Months (79 Working Days) ↓</p>
            </div>

            <div
              onClick={() => setActiveTab('students')}
              className="glass-card p-3 sm:p-4 border-l-4 border-l-[#FFC928] cursor-pointer hover:shadow-md transition"
            >
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 truncate">Student Range View</div>
              <div className="text-lg sm:text-2xl font-black text-rose-700">5 Mark Ranges</div>
              <p className="text-[10px] sm:text-xs text-[#8B0000] font-bold mt-0.5 underline truncate">Tap for &lt;35 to &gt;90 Lists →</p>
            </div>
          </div>

          {/* Side-by-Side Bar Graphs for (A) Quarterly Examination Pass & Average & (B) June to September Uploaded Student Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Bar Graph 1: Quarterly Examination Pass % & Average Mark */}
            <div className="glass-card p-4 sm:p-5 border border-slate-200">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#650000] uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-[#8B0000] shrink-0" />
                    <span>Quarterly Examination — Overall Pass % &amp; Average Score</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Quarterly Examination (2026–27) class-wise pass percentage and average mark ({selectedStandard === 'All' ? 'Classes 9, 10, 11 & 12' : `Class ${selectedStandard}`})
                  </p>
                </div>
              </div>

              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={examPassGraphData} margin={{ top: 18, right: 12, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="exam" stroke="#475569" fontSize={10} fontWeight={700} />
                    <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} unit="%" />
                    <Tooltip formatter={(val: any) => [`${val}%`, '']} />
                    <Bar dataKey="pass_percentage" name="Quarterly Pass %" fill="#10b981" radius={[8, 8, 0, 0]}>
                      <LabelList dataKey="pass_percentage" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '10px', fontWeight: 800, fill: '#047857' }} />
                    </Bar>
                    <Bar dataKey="avg_mark" name="Quarterly Average Mark %" fill="#8B0000" radius={[8, 8, 0, 0]}>
                      <LabelList dataKey="avg_mark" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '10px', fontWeight: 800, fill: '#8B0000' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Quarterly Pass %
                  </span>
                  <span className="flex items-center gap-1 text-[#8B0000]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#8B0000] inline-block" /> Quarterly Average Mark %
                  </span>
                </div>
                <span className="text-slate-600">
                  Exam: Quarterly Examination (2026–27)
                </span>
              </div>
            </div>

            {/* Bar Graph 2: Student Attendance from Uploaded Excel Columns: JUNE (18d), JULY (23d), AUG (20d), SEP (18d) */}
            <div className="glass-card p-4 sm:p-5 border border-slate-200">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#650000] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#8B0000] shrink-0" />
                    <span>Student Monthly Attendance — June to September (79 Working Days)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Based on uploaded attendance columns: JUNE (18d), JULY (23d), AUG (20d), SEP (18d)
                  </p>
                </div>
              </div>

              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyAttendanceGraphData} margin={{ top: 18, right: 12, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#475569" fontSize={11} fontWeight={700} />
                    <YAxis domain={[70, 100]} stroke="#475569" fontSize={10} unit="%" />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Student Attendance']}
                      labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.full_month || label}
                    />
                    <Bar dataKey="attendance" name="Student Attendance %" radius={[8, 8, 0, 0]}>
                      {monthlyAttendanceGraphData.map((entry: any, idx: number) => (
                        <Cell
                          key={idx}
                          fill={entry.attendance >= 91 ? '#059669' : entry.attendance >= 89.5 ? '#d97706' : '#8B0000'}
                        />
                      ))}
                      <LabelList dataKey="attendance" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '10px', fontWeight: 800, fill: '#334155' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                <span className="text-slate-600">Uploaded Months: June (18) + July (23) + Aug (20) + Sep (18) = 79 Working Days</span>
                <span className="text-emerald-700">Overall Avg: 90.4%</span>
              </div>
            </div>
          </div>

          {/* Requirement 4: Subject-Wise Failure in Numbers */}
          <div className="glass-card p-4 sm:p-5 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
              <div>
                <h3 className="text-xs sm:text-base font-black text-[#650000] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
                  <span>Subject-Wise Failure in Numbers ({selectedStandard === 'All' ? 'All Classes 9–12' : `Class ${selectedStandard}`})</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Exact number of students scoring below passing mark (&lt; 35) in each subject — Click any card to inspect failed students
                </p>
              </div>
              <button
                onClick={() => setActiveTab('students')}
                className="px-3 py-1.5 bg-[#8B0000] text-white rounded-xl text-xs font-bold cursor-pointer self-start sm:self-auto"
              >
                Inspect Failed Student List →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {subjectFailures.map((sf: any, idx: number) => {
                const isLastOdd = idx === subjectFailures.length - 1 && subjectFailures.length % 2 === 1;
                return (
                  <div
                    key={sf.subject}
                    onClick={() => setActiveTab('students')}
                    className={`p-3.5 rounded-2xl border-2 border-rose-300 bg-rose-50/80 hover:bg-rose-100/80 transition cursor-pointer flex flex-col justify-between ${
                      isLastOdd ? 'col-span-2 sm:col-span-1' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-xs text-slate-900 truncate">{sf.subject}</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase">
                        {sf.fail_percentage}% Fail
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-rose-700">
                        {sf.failed_count}
                      </span>
                      <span className="text-xs font-bold text-rose-900">
                        Failed Students
                      </span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-rose-200 flex items-center justify-between text-[10px] font-bold text-slate-600">
                      <span>Low (&lt;50): {sf.low_mark_count}</span>
                      <span>Evaluated: {sf.total_students}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Commissioner Strategic Insights */}
          <div className="glass-card-dark p-4 sm:p-6 shadow-xl border border-[#FFD700]/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#FFD700] shrink-0" />
              <h3 className="text-xs sm:text-base font-black text-white">AI Corporation Executive Intelligence &amp; Risk Alerts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
              {data?.ai_insights?.map((alert: string, idx: number) => (
                <div key={idx} className="bg-black/20 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/20 text-xs text-white/95 flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700] mt-1 shrink-0" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone-Wise Comparison Bar Chart */}
          <div className="glass-card p-3.5 sm:p-6">
            <h3 className="font-black text-[#650000] text-xs uppercase tracking-wider mb-3 sm:mb-4">
              Zone-Wise Comparative Pass Percentage &amp; Attendance
            </h3>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} width={28} />
                  <Tooltip />
                  <Bar dataKey="passRate" fill="#8B0000" name="Pass Rate %" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="attendance" fill="#FFC928" name="Attendance %" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        /* ----------------- COMMISSIONER STAFF PERFORMANCE MODULE ----------------- */
        <div className="space-y-4 sm:space-y-6">
          {/* Individual School Staff Table with Clickable 360° Staff Analytics */}
          <div className="glass-card p-3.5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
              <div>
                <h3 className="font-black text-[#650000] text-xs sm:text-base">
                  Teaching Staff Directory — Tap Any Staff Name for 360° Dashboard (Leaves, Presents, Pass/Fail Ratio &amp; Mark Ranges)
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Showing staff details, designation, location, contact, presents, leaves, handling student count &amp; pass/fail ratio
                </p>
              </div>
            </div>

            {/* Mobile Staff Cards (<768px) */}
            <div className="md:hidden space-y-2.5">
              {schoolStaffList.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedTeacherId(s.id)}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeacherId(s.id);
                      }}
                      className="px-2.5 py-1 bg-[#8B0000] text-white font-bold rounded-lg text-[10px] shrink-0 cursor-pointer"
                    >
                      360° View →
                    </button>
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
                </div>
              ))}
            </div>

            {/* Desktop Table (>=768px) */}
            <div className="hidden md:block table-scroll-container rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[820px]">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">Staff Name (Click for 360° Dashboard)</th>
                    <th className="p-3">Designation &amp; Subject</th>
                    <th className="p-3">Location &amp; Contact</th>
                    <th className="p-3 text-center">No. of Presents</th>
                    <th className="p-3 text-center">No. of Leaves</th>
                    <th className="p-3 text-center">Handling Students</th>
                    <th className="p-3 text-center">Pass / Fail Ratio</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {schoolStaffList.map((s: any) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedTeacherId(s.id)}
                      className="hover:bg-[#FFF3B0]/30 transition cursor-pointer"
                    >
                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeacherId(s.id);
                          }}
                          className="font-black text-[#8B0000] hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                        >
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span>{s.teacher_name}</span>
                        </button>
                        <div className="text-[10px] font-mono text-slate-400">{s.employee_id}</div>
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
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-black text-xs ${
                          s.total_leave > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {s.total_leave} Days
                        </span>
                      </td>
                      <td className="p-3 text-center font-black text-[#650000]">
                        {s.handling_student_count} Students
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-emerald-700 font-black">{s.student_pass_pct}% Pass</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-rose-600 font-bold">{s.student_fail_pct}% Fail</span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeacherId(s.id);
                          }}
                          className="px-3 py-1 bg-[#8B0000] text-white font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Staff 360° Dashboard →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* School-wise Staff Comparison Table */}
          <div className="glass-card p-3.5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
              <div>
                <h3 className="font-black text-[#650000] text-xs sm:text-base">School-Wise Staff Attendance &amp; Academic Correlation</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Tap any school row to open its full Staff &amp; Student Drilldown</p>
              </div>
            </div>

            <div className="table-scroll-container rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">School Name</th>
                    <th className="p-3">Zone / Ward</th>
                    <th className="p-3 text-center">Staff Count</th>
                    <th className="p-3 text-center">Staff Attendance %</th>
                    <th className="p-3 text-center">Total Leave Days</th>
                    <th className="p-3 text-center">Avg Student Result</th>
                    <th className="p-3">Drilldown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {staffData?.school_staff_comparison?.map((sc: any) => (
                    <tr
                      key={sc.school_id}
                      onClick={() => setSelectedSchoolId(sc.school_id)}
                      className="hover:bg-[#FFF3B0]/30 transition cursor-pointer"
                    >
                      <td className="p-3 font-bold text-[#8B0000] hover:underline">{sc.school_name}</td>
                      <td className="p-3 text-slate-600">{sc.zone} / {sc.ward}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{sc.staff_count}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{sc.avg_attendance}%</td>
                      <td className="p-3 text-center font-semibold text-slate-700">{sc.total_leave}d</td>
                      <td className="p-3 text-center font-bold text-[#8B0000]">{sc.avg_student_result}%</td>
                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchoolId(sc.school_id);
                          }}
                          className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] cursor-pointer"
                        >
                          Inspect School →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* School Drilldown Detailed Analysis Modal */}
      {selectedSchoolId && (
        <SchoolDetailModal
          isOpen={!!selectedSchoolId}
          onClose={() => setSelectedSchoolId(null)}
          schoolId={selectedSchoolId}
        />
      )}

      {/* Staff 360° Analytics Dashboard Modal */}
      <StaffAnalyticsModal
        isOpen={!!selectedTeacherId}
        onClose={() => setSelectedTeacherId(null)}
        teacherId={selectedTeacherId}
      />
    </div>
  );
};
