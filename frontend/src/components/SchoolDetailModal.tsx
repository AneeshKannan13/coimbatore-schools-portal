import React, { useState, useEffect } from 'react';
import {
  X, UserCheck, Sun, Moon, Building2, ArrowUpDown
} from 'lucide-react';
import apiClient, { CORP_LOGO_URL, REAL_SCHOOLS } from '../api';
import { StudentAnalyticsSection } from './StudentAnalyticsSection';
import { StaffAnalyticsModal } from './StaffAnalyticsModal';

export const SchoolDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  schoolId: number;
}> = ({ isOpen, onClose, schoolId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'staff' | 'standards'>('students');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [filterSchoolId, setFilterSchoolId] = useState<number>(schoolId);
  const [filterStandard, setFilterStandard] = useState<string>('All');
  const [staffLeaveSort, setStaffLeaveSort] = useState<'LEAVE_DESC' | 'LEAVE_ASC' | 'PRESENT_DESC' | 'PASS_DESC'>('LEAVE_DESC');

  useEffect(() => {
    setFilterSchoolId(schoolId);
  }, [schoolId]);

  // Filter available schools based on selected class (High Schools don't have Class 11 & 12)
  const availableSchools = REAL_SCHOOLS.filter((s: any) => {
    if (filterStandard === '11' || filterStandard === '12') {
      return s.id === 2 || s.id === 3;
    }
    return true;
  });

  useEffect(() => {
    if (
      filterSchoolId !== 0 &&
      (filterStandard === '11' || filterStandard === '12') &&
      !availableSchools.some((s: any) => s.id === filterSchoolId)
    ) {
      setFilterSchoolId(0);
    }
  }, [filterStandard, filterSchoolId]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const q = filterStandard !== 'All' ? `?standard=${filterStandard}` : '';
    apiClient.get(`/commissioner/school/${filterSchoolId}/detailed-analysis${q}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, filterSchoolId, filterStandard]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-card max-w-6xl w-full p-3.5 sm:p-6 shadow-2xl border border-white/60 h-[94vh] sm:h-auto sm:max-h-[94vh] rounded-t-2xl sm:rounded-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 sm:pb-4 border-b border-slate-200 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src={CORP_LOGO_URL}
              alt="CCMC"
              className="w-9 h-9 sm:w-12 sm:h-12 object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2 py-0.5 bg-[#8B0000]/10 text-[#8B0000] text-[9px] sm:text-[10px] font-black rounded font-mono">
                  {data?.school?.code}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500">
                  Zone: {data?.school?.zone} • {data?.school?.ward}
                </span>
              </div>
              <h2 className="text-sm sm:text-xl font-black text-[#650000] mt-0.5 truncate">
                {data?.school?.name || 'School Detailed Analysis'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-600 font-medium truncate">
                HM: <b className="text-slate-800">{data?.school?.headmaster_name}</b> | EMIS: {data?.school?.emis_number}
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
              className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 border-b border-slate-200 py-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${activeTab === 'students'
              ? 'primary-button shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
          >
            <span className="sm:hidden">Students</span>
            <span className="hidden sm:inline">Student Pass/Fail &amp; Mark Ranges</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${activeTab === 'staff'
              ? 'gold-button shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
          >
            <span className="sm:hidden">Staff ({data?.staff?.length || 0})</span>
            <span className="hidden sm:inline">Staff Details, Leaves &amp; Ratio ({data?.staff?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('standards')}
            className={`px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer text-center ${activeTab === 'standards'
              ? 'primary-button shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
          >
            <span className="sm:hidden">Classes ({data?.standards?.length || 0})</span>
            <span className="hidden sm:inline">Standard &amp; Class Summary ({data?.standards?.length || 0})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-3 pr-0.5 sm:pr-1">
          {activeTab === 'students' ? (
            <StudentAnalyticsSection
              schoolId={filterSchoolId}
              initialStandard={filterStandard}
              allowUploads={false}
              title={`${data?.school?.name || 'School'} — Student Pass/Fail & Range Classification`}
              onSelectTeacher={(tid) => setSelectedTeacherId(tid)}
            />
          ) : activeTab === 'staff' ? (
            <div className="space-y-3">
              {/* Class-Wise & School-Wise Filter Bar for Staff Listing */}
              <div className="glass-card p-3 sm:p-3.5 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                {/* Class-Wise Filter */}
                <div className="table-scroll-container flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-[#650000] uppercase shrink-0 pr-1">
                    Class Filter:
                  </span>
                  {[
                    { val: 'All', label: 'All Classes (9–12)' },
                    { val: '9', label: 'Class 9' },
                    { val: '10', label: 'Class 10' },
                    { val: '11', label: 'Class 11' },
                    { val: '12', label: 'Class 12' },
                  ].map((cls) => (
                    <button
                      key={cls.val}
                      onClick={() => setFilterStandard(cls.val)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer shrink-0 ${
                        filterStandard === cls.val
                          ? 'bg-[#8B0000] text-[#FFD700] shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cls.label}
                    </button>
                  ))}
                </div>

                {/* School-Wise Filter & No. of Leaves Sort */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setStaffLeaveSort(staffLeaveSort === 'LEAVE_DESC' ? 'LEAVE_ASC' : 'LEAVE_DESC')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                      staffLeaveSort.startsWith('LEAVE_')
                        ? 'bg-[#8B0000] text-[#FFD700]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    No. of Leaves: {staffLeaveSort === 'LEAVE_ASC' ? 'Low → High ↑' : 'High → Low ↓'}
                  </button>

                  <Building2 className="w-4 h-4 text-[#8B0000] shrink-0" />
                  <select
                    value={filterSchoolId}
                    onChange={(e) => setFilterSchoolId(Number(e.target.value))}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 cursor-pointer max-w-[260px] sm:max-w-[320px]"
                  >
                    <option value={0}>All Corporation Schools (Combined Staff)</option>
                    {availableSchools.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] sm:text-xs text-amber-900 font-semibold">
                Tap any <b>Staff Name</b> below to open their 360° Staff Performance Dashboard (with Handled Students, Pass/Fail Ratio &amp; Mark Ranges).
              </div>

              {/* Mobile Staff Cards (<768px) */}
              <div className="md:hidden space-y-2.5">
                {[...(data?.staff || [])].sort((a: any, b: any) => {
                  if (staffLeaveSort === 'LEAVE_DESC') return Number(b.total_leave || 0) - Number(a.total_leave || 0);
                  if (staffLeaveSort === 'LEAVE_ASC') return Number(a.total_leave || 0) - Number(b.total_leave || 0);
                  if (staffLeaveSort === 'PRESENT_DESC') return Number(b.present_days || 0) - Number(a.present_days || 0);
                  return Number(b.pass_ratio || 0) - Number(a.pass_ratio || 0);
                }).map((s: any) => (
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
                        <div className="text-[10px] text-slate-600 font-bold mt-0.5">
                          {s.designation} • <span className="text-[#8B0000]">{s.handling_subject}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-[#FFC928]/30 text-[#650000] text-[9px] font-black">
                            {s.classes_label || 'Classes 9 & 10'}
                          </span>
                          {s.school_name && (
                            <span className="text-[9px] font-bold text-slate-500">
                              • {s.school_name}
                            </span>
                          )}
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
                        className="px-2.5 py-1 bg-[#8B0000] text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        360° View →
                      </button>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="bg-emerald-50 rounded-lg py-1">
                        <div className="text-slate-500">Presents</div>
                        <div className="font-black text-emerald-800">{s.present_days ?? 21}/{s.working_days ?? 22}d</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg py-1">
                        <div className="text-slate-500">Leaves</div>
                        <div className="font-black text-amber-900">{s.total_leave}d</div>
                      </div>
                      <div className="bg-rose-50/70 rounded-lg py-1">
                        <div className="text-slate-500">{s.handling_student_count ?? 0} Students</div>
                        <div className="font-black text-emerald-700">{s.pass_ratio ?? 85}% Pass</div>
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
                      <th className="p-2.5">Staff Name &amp; School (Click for Dashboard)</th>
                      <th className="p-2.5">Designation, Subject &amp; Class</th>
                      <th className="p-2.5">Location &amp; Contact</th>
                      <th className="p-2.5 text-center">No. of Presents</th>
                      <th className="p-2.5 text-center">
                        <button
                          onClick={() => setStaffLeaveSort(staffLeaveSort === 'LEAVE_DESC' ? 'LEAVE_ASC' : 'LEAVE_DESC')}
                          className="inline-flex items-center gap-1 font-black text-[#FFD700] hover:underline cursor-pointer"
                        >
                          No. of Leaves {staffLeaveSort === 'LEAVE_ASC' ? '↑' : '↓'} <ArrowUpDown className="w-3.5 h-3.5 text-[#FFD700]" />
                        </button>
                      </th>
                      <th className="p-2.5 text-center">Handling Students</th>
                      <th className="p-2.5 text-center">Pass / Fail Ratio</th>
                      <th className="p-2.5 text-right">Dashboard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {[...(data?.staff || [])].sort((a: any, b: any) => {
                      if (staffLeaveSort === 'LEAVE_DESC') return Number(b.total_leave || 0) - Number(a.total_leave || 0);
                      if (staffLeaveSort === 'LEAVE_ASC') return Number(a.total_leave || 0) - Number(b.total_leave || 0);
                      if (staffLeaveSort === 'PRESENT_DESC') return Number(b.present_days || 0) - Number(a.present_days || 0);
                      return Number(b.pass_ratio || 0) - Number(a.pass_ratio || 0);
                    }).map((s: any) => (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedTeacherId(s.id)}
                        className="hover:bg-[#FFF3B0]/30 transition cursor-pointer"
                      >
                        <td className="p-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeacherId(s.id);
                            }}
                            className="font-black text-[#8B0000] hover:underline text-left flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            {s.teacher_name}
                          </button>
                          <div className="text-[10px] font-mono text-slate-400">{s.employee_id}</div>
                          {s.school_name && (
                            <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{s.school_name}</div>
                          )}
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-800">{s.designation}</div>
                          <div className="text-[11px] font-bold text-[#8B0000]">{s.handling_subject}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-[#FFC928]/30 text-[#650000] text-[10px] font-black">
                            {s.classes_label || 'Classes 9 & 10'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">
                          <div className="font-semibold text-slate-800">{s.location}</div>
                          <div className="text-[10px] font-mono text-slate-500">📞 {s.contact_number}</div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs">
                            {s.present_days ?? 21} / {s.working_days ?? 22}d
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.total_leave > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                              }`}
                          >
                            {s.total_leave} Days
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-black text-[#650000]">
                          {s.handling_student_count ?? 0} Students
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="text-emerald-700 font-black">{s.pass_ratio ?? 85}% Pass</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-rose-600 font-bold">{s.fail_ratio ?? 15}% Fail</span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeacherId(s.id);
                            }}
                            className="px-2.5 py-1 bg-[#8B0000] text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            360° View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="table-scroll-container rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[520px]">
                <thead className="bg-[#8B0000] text-white">
                  <tr>
                    <th className="p-2.5">Standard &amp; Section</th>
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

        <div className="pt-2.5 sm:pt-3 border-t border-slate-200 flex justify-end safe-pb">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-900 text-center"
          >
            Close Drilldown
          </button>
        </div>
      </div>

      <StaffAnalyticsModal
        isOpen={!!selectedTeacherId}
        onClose={() => setSelectedTeacherId(null)}
        teacherId={selectedTeacherId}
      />
    </div>
  );
};
