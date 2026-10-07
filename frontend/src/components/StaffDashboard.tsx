import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, TrendingUp, AlertTriangle, 
  Upload, Sparkles, Filter 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';
import apiClient from '../api';
import { ExcelUploadModal } from './ExcelUploadModal';

const CHART_COLORS = ['#8B0000', '#B31312', '#FFC928', '#D97706', '#64748B'];

export const StaffDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [selectedStandard, setSelectedStandard] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const fetchDashboardData = () => {
    setLoading(true);
    apiClient.get(`/teacher/dashboard?standard=${selectedStandard}&section=${selectedSection}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedStandard, selectedSection]);

  const loadStudentProfile = (studentId: number) => {
    apiClient.get(`/students/${studentId}/profile`)
      .then(res => setSelectedStudent(res.data))
      .catch(console.error);
  };

  const chartData = data?.subject_performance?.map((s: any) => ({
    name: s.subject,
    average: s.average
  })) || [
    { name: 'Tamil', average: 78 },
    { name: 'English', average: 82 },
    { name: 'Maths', average: 64 },
    { name: 'Science', average: 71 },
    { name: 'Social', average: 84 },
  ];

  const passFailData = [
    { name: 'Passed', value: data?.kpis?.passed_count || 32, color: '#10b981' },
    { name: 'Failed', value: data?.kpis?.failed_count || 6, color: '#8B0000' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Teacher Information */}
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
                Staff Portal
              </span>
              <span className="text-xs text-slate-500 font-bold">{user.school_name || 'Corporation HSS'}</span>
            </div>
            <h2 className="text-2xl font-black text-[#650000] mt-1">
              Welcome, {user.username}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Subject-Handling Teacher & Class Performance Analytics
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="gold-button flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Upload className="w-4 h-4 text-[#650000]" />
          Upload Exam Marks (.xlsx)
        </button>
      </div>

      {/* Standard & Section Filter Tabs */}
      <div className="glass-card p-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pl-2">
          <Filter className="w-3.5 h-3.5 text-[#8B0000]" /> Class Selection:
        </span>
        {['9', '10', '11', '12'].map((std) => (
          <button
            key={std}
            onClick={() => setSelectedStandard(std)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedStandard === std
                ? 'primary-button shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {std}th Standard
          </button>
        ))}
        <div className="h-5 w-px bg-slate-300 mx-2" />
        {['A', 'B', 'C'].map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedSection === sec
                ? 'bg-[#FFC928] text-[#650000] font-black shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Section {sec}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-[#8B0000]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
            <Users className="w-5 h-5 text-[#8B0000]" />
          </div>
          <div className="text-2xl font-black text-[#650000]">
            {data?.kpis?.total_students || 38}
          </div>
          <p className="text-xs text-slate-400 mt-1">{selectedStandard}th Standard Sec {selectedSection}</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-[#FFC928]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Class Average</span>
            <TrendingUp className="w-5 h-5 text-[#8B0000]" />
          </div>
          <div className="text-2xl font-black text-[#650000]">
            {data?.kpis?.class_average || 68.4}%
          </div>
          <p className="text-xs text-emerald-700 font-bold mt-1">+3.2% vs previous exam</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-[#8B0000]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pass Percentage</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {data?.kpis?.pass_percentage || 86.8}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Passing threshold: 35%</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-[#FFC928]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Needs Attention</span>
            <AlertTriangle className="w-5 h-5 text-[#8B0000]" />
          </div>
          <div className="text-2xl font-black text-rose-700">
            {data?.kpis?.students_needing_attention || 5}
          </div>
          <p className="text-xs text-rose-600 font-bold mt-1">AI Early Warning Flag</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-card p-6">
          <h3 className="font-black text-[#650000] text-xs uppercase tracking-wider mb-4">
            Subject-Wise Performance Averages
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip />
                <Bar dataKey="average" fill="#8B0000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col items-center">
          <h3 className="font-black text-[#650000] text-xs uppercase tracking-wider mb-4 w-full text-left">
            Pass vs Fail Distribution
          </h3>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={passFailData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Passed ({passFailData[0].value})
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-3 h-3 rounded-full bg-[#8B0000]" /> Failed ({passFailData[1].value})
            </span>
          </div>
        </div>
      </div>

      {/* Student List with AI Performance Insights */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-black text-[#650000] text-base">Class Students & Mark Evaluations</h3>
            <p className="text-xs text-slate-500">Click any student to inspect detailed AI performance and risk diagnostics</p>
          </div>
          <button
            onClick={() => loadStudentProfile(1)}
            className="px-3 py-1.5 bg-[#8B0000]/10 hover:bg-[#8B0000]/20 text-[#8B0000] text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" /> Sample Student AI Insight
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#8B0000] text-white">
              <tr>
                <th className="p-3">EMIS ID</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Quarterly Average</th>
                <th className="p-3">Attendance</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {[
                { id: 1, emis: '331201001001', name: 'Arun Kumar S', avg: '78.5%', att: '94.2%', status: 'Good' },
                { id: 2, emis: '331201001002', name: 'Bhuvaneshwari K', avg: '88.0%', att: '96.5%', status: 'Excellent' },
                { id: 3, emis: '331201001003', name: 'Chandran M', avg: '42.3%', att: '73.0%', status: 'Needs Attention' },
                { id: 4, emis: '331201001004', name: 'Deepika R', avg: '81.2%', att: '92.1%', status: 'Good' },
                { id: 5, emis: '331201001005', name: 'Elango V', avg: '34.5%', att: '68.5%', status: 'High Risk' },
              ].map((st) => (
                <tr key={st.id} className="hover:bg-[#FFF3B0]/30 transition">
                  <td className="p-3 font-mono font-medium text-slate-600">{st.emis}</td>
                  <td className="p-3 font-bold text-slate-900">{st.name}</td>
                  <td className="p-3 font-semibold text-slate-700">{st.avg}</td>
                  <td className="p-3 font-semibold text-slate-700">{st.att}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      st.status === 'Excellent' ? 'bg-emerald-100 text-emerald-800' :
                      st.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                      st.status === 'Needs Attention' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {st.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => loadStudentProfile(st.id)}
                      className="text-[#8B0000] hover:text-[#B31312] font-black text-xs underline cursor-pointer"
                    >
                      AI Analysis
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Student Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-2xl w-full p-6 shadow-2xl border border-white/60">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#8B0000]/10 text-[#8B0000] rounded">
                  EMIS: {selectedStudent.student?.emis_number}
                </span>
                <h3 className="text-lg font-black text-[#650000] mt-1">
                  {selectedStudent.student?.student_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedStudent.student?.standard}th Standard - Section {selectedStudent.student?.section} | {selectedStudent.student?.medium}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-gradient-to-r from-[#8B0000]/10 to-[#FFD700]/10 border border-[#8B0000]/20 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">AI Risk Classification</span>
                  <div className="text-base font-black text-[#650000] mt-0.5">
                    {selectedStudent.ai_analysis?.risk_level}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Composite Risk Score</span>
                  <div className="text-base font-black text-[#8B0000]">
                    {selectedStudent.ai_analysis?.risk_score} / 100
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/80 border border-slate-200 rounded-2xl">
                <h4 className="font-black text-[#650000] flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-[#FFC928]" /> AI Synthesized Student Insight
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {selectedStudent.ai_analysis?.summary}
                </p>
              </div>

              <div>
                <h4 className="font-black text-[#650000] mb-2">Actionable Interventions:</h4>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  {selectedStudent.ai_analysis?.recommendations?.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedStudent(null)}
                className="primary-button px-5 py-2 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      <ExcelUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
