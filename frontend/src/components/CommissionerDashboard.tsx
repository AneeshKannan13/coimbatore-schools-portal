import React, { useState, useEffect } from 'react';
import {
  Building2, Sparkles, ChevronRight, UserCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import apiClient from '../api';
import { SchoolDetailModal } from './SchoolDetailModal';
import { StudentAnalyticsSection } from './StudentAnalyticsSection';
import { StaffAnalyticsModal } from './StaffAnalyticsModal';

export const CommissionerDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'staff'>('overview');
  const [data, setData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [schoolStaffList, setSchoolStaffList] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [filterSchoolId, setFilterSchoolId] = useState<number>(1);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = selectedZone !== 'All' ? `?zone=${selectedZone}` : '';
    apiClient.get(`/commissioner/dashboard${query}`)
      .then(res => {
        setData(res.data);
        if (res.data?.schools?.length > 0 && !filterSchoolId) {
          setFilterSchoolId(res.data.schools[0].id);
        }
      })
      .catch(console.error);

    apiClient.get(`/commissioner/staff-performance${query}`)
      .then(res => setStaffData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedZone]);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Corporation Command Bar */}
      <div className="glass-card p-3.5 sm:p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3.5 sm:gap-4 border-l-4 border-l-[#8B0000]">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <img
            src="/coimbatore_corp_logo.png"
            alt="Logo"
            className="h-10 sm:h-14 w-auto object-contain hidden sm:block shrink-0"
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
              Education Directorate • Student Pass/Fail Range Classification &amp; Staff 360° Analytics
            </p>
          </div>
        </div>

        {/* Tab & Zone Filter Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 sm:p-1.5 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${
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
              className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${
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
              className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${
                activeTab === 'staff'
                  ? 'primary-button shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">Staff</span>
              <span className="hidden sm:inline">Staff Performance</span>
            </button>
          </div>

          <div className="table-scroll-container flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500 pl-2 shrink-0">Zone:</span>
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
          title="Corporation Commissioner — Student Pass/Fail Classification & 5-Range Breakdown"
          onSelectTeacher={(tid) => setSelectedTeacherId(tid)}
        />
      ) : activeTab === 'overview' ? (
        <>
          {/* Commissioner Overview KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="glass-card p-3 sm:p-5 border-l-4 border-l-[#8B0000]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Corp Schools</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000]">{data?.kpis?.total_schools || 7}</div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">100% On EMIS</p>
            </div>

            <div className="glass-card p-3 sm:p-5 border-l-4 border-l-[#FFC928]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Corp Average</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000]">{data?.kpis?.corporation_avg_score || 71.4}%</div>
              <p className="text-[10px] sm:text-xs text-emerald-700 font-bold mt-0.5 truncate">Pass: {data?.kpis?.overall_pass_percentage}%</p>
            </div>

            <div className="glass-card p-3 sm:p-5 border-l-4 border-l-[#8B0000]">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Attendance Base</div>
              <div className="text-lg sm:text-2xl font-black text-[#650000]">{data?.kpis?.overall_attendance || 92.3}%</div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Staff: {data?.kpis?.staff_attendance}%</p>
            </div>

            <div
              onClick={() => setActiveTab('students')}
              className="glass-card p-3 sm:p-5 border-l-4 border-l-[#FFC928] cursor-pointer hover:shadow-md transition"
            >
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Student Range View</div>
              <div className="text-lg sm:text-2xl font-black text-rose-700">5 Mark Ranges</div>
              <p className="text-[10px] sm:text-xs text-[#8B0000] font-bold mt-0.5 underline truncate">Tap for &lt;35 to &gt;90 Lists →</p>
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

          {/* School-Wise Analysis */}
          <div className="glass-card p-3.5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
              <div>
                <h3 className="font-black text-[#650000] text-xs sm:text-base">Corporation Schools Directory &amp; Performance Matrix</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Tap any school to inspect all Student Mark Ranges (&lt;35 to &gt;90) and Staff 360° Details</p>
              </div>
            </div>

            {/* Mobile School Cards (<768px) */}
            <div className="md:hidden space-y-2.5">
              {data?.schools?.map((s: any) => (
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

                  <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-4 gap-1 text-center text-[10px]">
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
                      <div className="font-black text-emerald-700">{s.pass_rate}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Risk</div>
                      <div className="font-black text-rose-600">{s.risk_students}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>=768px) */}
            <div className="hidden md:block table-scroll-container rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">School Code</th>
                    <th className="p-3">Institution Name (Click to Open Staff &amp; Student Drilldown)</th>
                    <th className="p-3">Zone / Ward</th>
                    <th className="p-3">Enrolled</th>
                    <th className="p-3">Avg Mark</th>
                    <th className="p-3">Pass %</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3">Risk Cohort</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data?.schools?.map((s: any) => (
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
                      <td className="p-3 font-bold text-emerald-700">{s.pass_rate}%</td>
                      <td className="p-3 font-semibold text-slate-700">{s.attendance}%</td>
                      <td className="p-3 font-bold text-rose-600">{s.risk_students}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedSchoolId(s.id)}
                          className="px-2.5 py-1 bg-[#8B0000] text-white rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          Staff &amp; Students →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
