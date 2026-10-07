import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, GraduationCap, Award, TrendingUp, AlertTriangle, 
  Sparkles, Filter, ChevronRight, BarChart3, UserCheck, BookOpen 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import apiClient from '../api';
import { SchoolDetailModal } from './SchoolDetailModal';

const SUBJECT_COLORS = ['#8B0000', '#B31312', '#FFC928', '#D97706', '#64748B'];

export const CommissionerDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff'>('overview');
  const [data, setData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = selectedZone !== 'All' ? `?zone=${selectedZone}` : '';
    apiClient.get(`/commissioner/dashboard${query}`)
      .then(res => setData(res.data))
      .catch(console.error);

    apiClient.get(`/commissioner/staff-performance${query}`)
      .then(res => setStaffData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedZone]);

  const zoneData = data?.zone_summary?.map((z: any) => ({
    name: `${z.zone} Zone`,
    passRate: z.avg_pass,
    attendance: z.attendance
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Corporation Command Bar */}
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
                Corporation Central Command
              </span>
              <span className="text-xs text-slate-500 font-bold">Executive Monitoring Portal</span>
            </div>
            <h2 className="text-2xl font-black text-[#650000] mt-1">
              Coimbatore City Municipal Corporation
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Education Directorate • Multi-School Unified Performance Dashboard & AI Insights
            </p>
          </div>
        </div>

        {/* Tab & Zone Filter Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl mr-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'primary-button shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Schools Overview
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'staff'
                  ? 'gold-button shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Performance
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 pl-2">Zone:</span>
            {['All', 'North', 'South', 'East', 'West', 'Central'].map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
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

      {activeTab === 'overview' ? (
        <>
          {/* Commissioner Overview KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 border-l-4 border-l-[#8B0000]">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Corporation Schools</div>
              <div className="text-2xl font-black text-[#650000]">{data?.kpis?.total_schools || 42}</div>
              <p className="text-xs text-slate-500 mt-1">100% On-boarded on EMIS</p>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-[#FFC928]">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Corporation Average</div>
              <div className="text-2xl font-black text-[#650000]">{data?.kpis?.corporation_avg_score || 71.4}%</div>
              <p className="text-xs text-emerald-700 font-bold mt-1">Pass Benchmark: {data?.kpis?.overall_pass_percentage}%</p>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-[#8B0000]">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Attendance Baseline</div>
              <div className="text-2xl font-black text-[#650000]">{data?.kpis?.overall_attendance || 92.3}%</div>
              <p className="text-xs text-slate-500 mt-1">Staff Rate: {data?.kpis?.staff_attendance}%</p>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-[#FFC928]">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">High Risk Alert Cohort</div>
              <div className="text-2xl font-black text-rose-700">{data?.kpis?.high_risk_students || 136}</div>
              <p className="text-xs text-rose-600 font-bold mt-1">Intervention Mandated</p>
            </div>
          </div>

          {/* AI Commissioner Strategic Insights */}
          <div className="glass-card-dark p-6 shadow-xl border border-[#FFD700]/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-base font-black text-white">AI Corporation Executive Intelligence & Risk Alerts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.ai_insights?.map((alert: string, idx: number) => (
                <div key={idx} className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-xs text-white/95 flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700] mt-1 shrink-0" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone-Wise Comparison Bar Chart */}
          <div className="glass-card p-6">
            <h3 className="font-black text-[#650000] text-xs uppercase tracking-wider mb-4">
              Zone-Wise Comparative Pass Percentage & Attendance
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="passRate" fill="#8B0000" name="Pass Rate %" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="attendance" fill="#FFC928" name="Attendance %" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* School-Wise Analysis Table */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-black text-[#650000] text-base">Corporation Schools Directory & Performance Matrix</h3>
                <p className="text-xs text-slate-500">Real-time status of examinations, pass percentages, and upload verification</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">School Code</th>
                    <th className="p-3">Institution Name</th>
                    <th className="p-3">Zone / Ward</th>
                    <th className="p-3">Enrolled</th>
                    <th className="p-3">Avg Mark</th>
                    <th className="p-3">Pass %</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3">Risk Cohort</th>
                    <th className="p-3">Status</th>
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
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          {s.upload_status}
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
        /* ----------------- COMMISSIONER STAFF PERFORMANCE MODULE ----------------- */
        <div className="space-y-6">
          {/* Staff KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 border-l-4 border-l-[#8B0000]">
              <div className="text-[11px] font-bold uppercase text-slate-500">Total Teaching Staff</div>
              <div className="text-2xl font-black text-[#650000]">{staffData?.kpis?.total_staff || 950}</div>
              <p className="text-[11px] text-slate-400 mt-1">Across 42 Schools</p>
            </div>
            <div className="glass-card p-5 border-l-4 border-l-emerald-600">
              <div className="text-[11px] font-bold uppercase text-slate-500">Avg Staff Attendance</div>
              <div className="text-2xl font-black text-emerald-700">{staffData?.kpis?.avg_staff_attendance || 94.6}%</div>
              <p className="text-[11px] text-slate-400 mt-1">Benchmark: 95.0%</p>
            </div>
            <div className="glass-card p-5 border-l-4 border-l-[#FFC928]">
              <div className="text-[11px] font-bold uppercase text-slate-500">Staff on Leave</div>
              <div className="text-2xl font-black text-[#650000]">{staffData?.kpis?.staff_on_leave || 18}</div>
              <p className="text-[11px] text-slate-400 mt-1">Current Month Cohort</p>
            </div>
            <div className="glass-card p-5 border-l-4 border-l-rose-600">
              <div className="text-[11px] font-bold uppercase text-slate-500">High Leave Cases</div>
              <div className="text-2xl font-black text-rose-700">{staffData?.kpis?.high_leave_cases || 12}</div>
              <p className="text-[11px] text-rose-600 font-bold mt-1">Under Review</p>
            </div>
          </div>

          {/* AI Staff Intelligence Alerts */}
          <div className="glass-card-dark p-6 shadow-xl border border-[#FFD700]/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-base font-black text-white">AI Staff Performance & Student Correlation Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {staffData?.insights?.map((ins: string, idx: number) => (
                <div key={idx} className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-xs text-white/95 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700] mt-1 shrink-0" />
                  <span>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* School-wise Staff Comparison Table */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-black text-[#650000] text-base">School-Wise Staff Attendance & Academic Correlation</h3>
                <p className="text-xs text-slate-500">Monitoring teacher attendance rate vs average student pass percentage</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-3">School Name</th>
                    <th className="p-3">Zone / Ward</th>
                    <th className="p-3 text-center">Staff Count</th>
                    <th className="p-3 text-center">Staff Attendance %</th>
                    <th className="p-3 text-center">Total Leave Days</th>
                    <th className="p-3 text-center">Avg Student Result</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {staffData?.school_staff_comparison?.map((sc: any) => (
                    <tr key={sc.school_id} className="hover:bg-[#FFF3B0]/30 transition">
                      <td className="p-3 font-bold text-slate-900">{sc.school_name}</td>
                      <td className="p-3 text-slate-600">{sc.zone} / {sc.ward}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{sc.staff_count}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{sc.avg_attendance}%</td>
                      <td className="p-3 text-center font-semibold text-slate-700">{sc.total_leave}d</td>
                      <td className="p-3 text-center font-bold text-[#8B0000]">{sc.avg_student_result}%</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          {sc.compliance_status}
                        </span>
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
    </div>
  );
};
