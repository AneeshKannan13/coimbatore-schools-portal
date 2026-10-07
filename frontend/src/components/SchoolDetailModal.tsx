import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, GraduationCap, Award, Phone, MapPin, 
  BookOpen, Calendar, CheckCircle2, AlertTriangle, X, Heart
} from 'lucide-react';
import apiClient from '../api';

export const SchoolDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  schoolId: number;
}> = ({ isOpen, onClose, schoolId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'staff' | 'standards'>('staff');

  useEffect(() => {
    if (!isOpen || !schoolId) return;
    setLoading(true);
    apiClient.get(`/commissioner/school/${schoolId}/detailed-analysis`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, schoolId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-5xl w-full p-6 shadow-2xl border border-white/60 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src="/coimbatore_corp_logo.png"
              alt="Logo"
              className="h-12 w-auto object-contain hidden sm:block"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#8B0000]/10 text-[#8B0000] text-[10px] font-black rounded font-mono">
                  {data?.school?.code}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Zone: {data?.school?.zone} • {data?.school?.ward}
                </span>
              </div>
              <h2 className="text-xl font-black text-[#650000] mt-0.5">
                {data?.school?.name || 'School Detailed Analysis'}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Headmaster: <b className="text-slate-800">{data?.school?.headmaster_name}</b> | EMIS: {data?.school?.emis_number}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-2xl cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* School Executive KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          <div className="glass-card p-3 border-l-4 border-l-[#8B0000]">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Enrolled Students</div>
            <div className="text-xl font-black text-[#650000]">{data?.stats?.total_students}</div>
            <p className="text-[10px] text-slate-400">Class 9 to 12</p>
          </div>
          <div className="glass-card p-3 border-l-4 border-l-[#FFC928]">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Teaching Staff</div>
            <div className="text-xl font-black text-[#650000]">{data?.stats?.total_staff}</div>
            <p className="text-[10px] text-slate-400">PG & BT Teachers</p>
          </div>
          <div className="glass-card p-3 border-l-4 border-l-emerald-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Avg Attendance</div>
            <div className="text-xl font-black text-emerald-700">{data?.stats?.avg_school_attendance}%</div>
            <p className="text-[10px] text-slate-400">Staff: {data?.stats?.avg_staff_attendance}%</p>
          </div>
          <div className="glass-card p-3 border-l-4 border-l-[#8B0000]">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Pass Benchmark</div>
            <div className="text-xl font-black text-[#650000]">{data?.stats?.overall_pass_percentage}%</div>
            <p className="text-[10px] text-rose-600 font-bold">{data?.stats?.risk_students_count} Risk Cohort</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 mb-3">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'staff'
                ? 'primary-button shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Staff Details & Leave Status ({data?.staff?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('standards')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'standards'
                ? 'gold-button shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Standard & Student Details ({data?.standards?.length || 0} Classes)
          </button>
        </div>

        {/* Body tables */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'staff' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-2.5">Staff Name</th>
                    <th className="p-2.5">Designation</th>
                    <th className="p-2.5">Handling Subject</th>
                    <th className="p-2.5">Contact</th>
                    <th className="p-2.5">Education / Native</th>
                    <th className="p-2.5 text-center">Leave Status</th>
                    <th className="p-2.5 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data?.staff?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#FFF3B0]/30 transition">
                      <td className="p-2.5 font-bold text-slate-900">
                        {s.teacher_name}
                        <div className="text-[10px] font-mono text-slate-400">{s.employee_id}</div>
                      </td>
                      <td className="p-2.5 text-slate-600">{s.designation}</td>
                      <td className="p-2.5 font-bold text-[#8B0000]">{s.handling_subject}</td>
                      <td className="p-2.5 font-mono text-slate-600">{s.contact_number}</td>
                      <td className="p-2.5 text-slate-600">
                        <div>{s.education_qualification}</div>
                        <div className="text-[10px] text-slate-400">{s.native_place} ({s.blood_group})</div>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.total_leave > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.leave_status}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">
                        {s.attendance_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-2.5">Standard & Section</th>
                    <th className="p-2.5">Medium</th>
                    <th className="p-2.5">Group Code</th>
                    <th className="p-2.5 text-center">Student Count</th>
                    <th className="p-2.5 text-center">Class Attendance</th>
                    <th className="p-2.5 text-center">Average Exam Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data?.standards?.map((c: any) => (
                    <tr key={c.class_id} className="hover:bg-[#FFF3B0]/30 transition">
                      <td className="p-2.5 font-bold text-slate-900">{c.standard}th Standard - Section {c.section}</td>
                      <td className="p-2.5 text-slate-600">{c.medium}</td>
                      <td className="p-2.5 font-semibold text-slate-700">{c.group_code}</td>
                      <td className="p-2.5 text-center font-bold text-[#650000]">{c.student_count}</td>
                      <td className="p-2.5 text-center font-semibold text-emerald-700">{c.avg_attendance}%</td>
                      <td className="p-2.5 text-center font-bold text-[#8B0000]">{c.avg_score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-900"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
};
