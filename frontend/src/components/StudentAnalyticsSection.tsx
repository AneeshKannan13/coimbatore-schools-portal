import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, ChevronDown, ChevronUp,
  Search, UserCheck, Award, X, Upload, FileUp
} from 'lucide-react';
import apiClient from '../api';
import { StaffAnalyticsModal } from './StaffAnalyticsModal';
import { ExcelUploadModal } from './ExcelUploadModal';
import { StaffExcelUploadModal } from './StaffExcelUploadModal';

const RANGE_THEMES: Record<string, {
  cardBg: string;
  cardBorder: string;
  activeRing: string;
  badge: string;
  text: string;
  headerBg: string;
}> = {
  below_35: {
    cardBg: 'bg-rose-50/90 hover:bg-rose-100/80',
    cardBorder: 'border-rose-300',
    activeRing: 'ring-2 ring-rose-600 border-rose-600',
    badge: 'bg-rose-600 text-white',
    text: 'text-rose-800',
    headerBg: 'bg-rose-700 text-white'
  },
  '35_50': {
    cardBg: 'bg-amber-50/90 hover:bg-amber-100/80',
    cardBorder: 'border-amber-300',
    activeRing: 'ring-2 ring-amber-500 border-amber-500',
    badge: 'bg-amber-500 text-white',
    text: 'text-amber-900',
    headerBg: 'bg-amber-600 text-white'
  },
  '50_75': {
    cardBg: 'bg-blue-50/90 hover:bg-blue-100/80',
    cardBorder: 'border-blue-300',
    activeRing: 'ring-2 ring-blue-600 border-blue-600',
    badge: 'bg-blue-600 text-white',
    text: 'text-blue-900',
    headerBg: 'bg-blue-700 text-white'
  },
  '75_90': {
    cardBg: 'bg-emerald-50/90 hover:bg-emerald-100/80',
    cardBorder: 'border-emerald-300',
    activeRing: 'ring-2 ring-emerald-600 border-emerald-600',
    badge: 'bg-emerald-600 text-white',
    text: 'text-emerald-900',
    headerBg: 'bg-emerald-700 text-white'
  },
  above_90: {
    cardBg: 'bg-purple-50/90 hover:bg-purple-100/80',
    cardBorder: 'border-purple-300',
    activeRing: 'ring-2 ring-purple-600 border-purple-600',
    badge: 'bg-purple-700 text-white',
    text: 'text-purple-900',
    headerBg: 'bg-purple-800 text-white'
  }
};

export const StudentAnalyticsSection: React.FC<{
  schoolId: number;
  zone?: string;
  title?: string;
  onSelectTeacher?: (teacherId: number) => void;
}> = ({ schoolId, zone = 'All', title, onSelectTeacher }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStandard, setSelectedStandard] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'LOW_SUBJECT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown state for the 5 mark range categories
  const [expandedRangeKey, setExpandedRangeKey] = useState<string | null>('below_35');

  // Student Detail Modal & Staff Dashboard Modal state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTeacherId, setActiveTeacherId] = useState<number | null>(null);
  const [showMarksUploadModal, setShowMarksUploadModal] = useState(false);
  const [showStaffUploadModal, setShowStaffUploadModal] = useState(false);

  const fetchStudentsAnalytics = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedStandard !== 'All') params.append('standard', selectedStandard);
    if (selectedSection !== 'All') params.append('section', selectedSection);
    if (zone && zone !== 'All') params.append('zone', zone);

    apiClient.get(`/schools/${schoolId}/students-analytics?${params.toString()}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudentsAnalytics();
  }, [schoolId, selectedStandard, selectedSection, zone]);

  const handleTeacherClick = (teacherId: number | null) => {
    if (!teacherId) return;
    if (onSelectTeacher) {
      onSelectTeacher(teacherId);
    } else {
      setActiveTeacherId(teacherId);
    }
  };

  const summary = data?.summary || {};
  const ranges: any[] = data?.ranges || [];
  const students: any[] = data?.students || [];

  const filteredStudents = students.filter((st: any) => {
    const matchesSearch =
      st.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.emis_number.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'PASS') return st.is_pass;
    if (statusFilter === 'FAIL') return !st.is_pass;
    if (statusFilter === 'LOW_SUBJECT') return (st.low_mark_subjects?.length || 0) > 0;
    return true;
  });

  const activeRangeObj = ranges.find((r: any) => r.key === expandedRangeKey);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Summary Banner: Pass/Fail Classification & Single-Subject Low Mark Alert */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`glass-card p-3 sm:p-4 border-l-4 border-l-[#8B0000] cursor-pointer transition ${
            statusFilter === 'ALL' ? 'ring-2 ring-[#8B0000]' : ''
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 truncate">Total Evaluated</div>
          <div className="text-lg sm:text-2xl font-black text-[#650000] mt-0.5">{summary.total_students || 0}</div>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">Avg Score: <b>{summary.overall_avg_mark || 0}%</b></p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'PASS' ? 'ALL' : 'PASS')}
          className={`p-3 sm:p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/90 cursor-pointer transition ${
            statusFilter === 'PASS' ? 'ring-2 ring-emerald-600 shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase text-emerald-800 truncate">Auto PASS</span>
            <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] sm:text-[10px] font-black shrink-0">
              {summary.pass_percentage || 0}%
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-800 mt-0.5">
            {summary.pass_count || 0} <span className="text-[11px] sm:text-xs font-bold">Students</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-emerald-700 font-semibold mt-0.5 truncate">All Subjects ≥ 35 (Tap to filter)</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'FAIL' ? 'ALL' : 'FAIL')}
          className={`p-3 sm:p-4 rounded-2xl border-2 border-rose-300 bg-rose-50/90 cursor-pointer transition ${
            statusFilter === 'FAIL' ? 'ring-2 ring-rose-600 shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase text-rose-800 truncate">Auto FAIL</span>
            <span className="px-1.5 sm:px-2 py-0.5 bg-rose-600 text-white rounded-full text-[9px] sm:text-[10px] font-black shrink-0">
              {summary.fail_percentage || 0}%
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-800 mt-0.5">
            {summary.fail_count || 0} <span className="text-[11px] sm:text-xs font-bold">Students</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-rose-700 font-semibold mt-0.5 truncate">Any Subject &lt; 35 (Tap to filter)</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'LOW_SUBJECT' ? 'ALL' : 'LOW_SUBJECT')}
          className={`p-3 sm:p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/90 cursor-pointer transition ${
            statusFilter === 'LOW_SUBJECT' ? 'ring-2 ring-amber-600 shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase text-amber-900 truncate">Low Subject</span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-900 mt-0.5">
            {summary.low_subject_students_count || 0} <span className="text-[11px] sm:text-xs font-bold">Students</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-amber-800 font-semibold mt-0.5 truncate">Score &lt; 50 Flagged (Tap to filter)</p>
        </div>
      </div>

      {/* 5 Mark Range Categories with Clickable Dropdown Lists */}
      <div className="glass-card p-3.5 sm:p-5 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-xs sm:text-base font-black text-[#650000] flex items-center gap-1.5 sm:gap-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B0000] shrink-0" />
              <span>Mark Range Category Breakdown (Tap Any Range to Open Student Dropdown)</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Categorized into Below 35, 35 to 50, 50 to 75, 75 to 90, and Above 90 with single-subject low mark alerts
            </p>
          </div>
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowMarksUploadModal(true)}
              className="gold-button px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer w-full sm:w-auto"
            >
              <Upload className="w-3.5 h-3.5 text-[#650000] shrink-0" /> Upload Student Marks (.xlsx)
            </button>
            <button
              onClick={() => setShowStaffUploadModal(true)}
              className="px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer bg-slate-900 hover:bg-slate-800 text-[#FFD700] transition w-full sm:w-auto"
            >
              <FileUp className="w-3.5 h-3.5 text-[#FFD700] shrink-0" /> Upload Staff Workbook (.xlsx)
            </button>
          </div>
        </div>

        {/* 5 Range Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {ranges.map((r: any, idx: number) => {
            const theme = RANGE_THEMES[r.key] || RANGE_THEMES['50_75'];
            const isExpanded = expandedRangeKey === r.key;
            const isLastOdd = idx === ranges.length - 1 && ranges.length % 2 === 1;
            return (
              <button
                key={r.key}
                onClick={() => setExpandedRangeKey(isExpanded ? null : r.key)}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  isLastOdd ? 'col-span-2 sm:col-span-1' : ''
                } ${theme.cardBg} ${
                  isExpanded ? `${theme.activeRing} shadow-lg` : theme.cardBorder
                }`}
              >
                <div className="flex items-center justify-between w-full gap-1">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase ${theme.badge}`}>
                    {r.label}
                  </span>
                  <span className={`text-xs font-black ${theme.text}`}>{r.percentage}%</span>
                </div>

                <div className={`text-xl sm:text-3xl font-black mt-1.5 sm:mt-2 ${theme.text}`}>
                  {r.count} <span className="text-[11px] sm:text-xs font-bold">Students</span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-black/10 flex items-center justify-between text-[10px] font-bold text-slate-700">
                  <span>{isExpanded ? 'Hide Dropdown' : 'Student List'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dropdown Panel for the Clicked Range Category */}
        {activeRangeObj && (
          <div className="mt-3 sm:mt-4 rounded-2xl border-2 border-slate-300 overflow-hidden shadow-md">
            <div className={`px-3 sm:px-4 py-2.5 flex justify-between items-center gap-2 ${RANGE_THEMES[activeRangeObj.key]?.headerBg || 'bg-[#8B0000] text-white'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider truncate">
                  {activeRangeObj.label} Range — ({activeRangeObj.count} Students)
                </span>
                <span className="text-[11px] opacity-90 hidden sm:inline">• {activeRangeObj.sublabel}</span>
              </div>
              <button
                onClick={() => setExpandedRangeKey(null)}
                className="text-[11px] sm:text-xs font-bold bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded-lg cursor-pointer shrink-0"
              >
                Close ✕
              </button>
            </div>

            {/* Mobile Card List (<768px) */}
            <div className="md:hidden bg-white max-h-96 overflow-y-auto divide-y divide-slate-200">
              {activeRangeObj.students.map((st: any) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudent(st)}
                  className={`p-3 cursor-pointer transition ${
                    st.is_pass ? 'bg-emerald-50/30' : 'bg-rose-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-slate-900 text-xs">{st.student_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        EMIS: {st.emis_number} • {st.class_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-black text-xs text-[#650000]">{st.avg_mark}%</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          st.is_pass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {st.result_status}
                      </span>
                    </div>
                  </div>

                  {st.low_mark_subjects?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {st.low_mark_subjects.map((ls: any, i: number) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            ls.is_fail
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-200 text-amber-950'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {ls.subject_name}: {ls.mark}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(st);
                      }}
                      className="px-2.5 py-1 bg-[#8B0000] text-white font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      Student &amp; Staff Detail →
                    </button>
                  </div>
                </div>
              ))}
              {activeRangeObj.students.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs font-bold">
                  No students in this range.
                </div>
              )}
            </div>

            {/* Desktop Table (>=768px) */}
            <div className="hidden md:block table-scroll-container bg-white max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2.5">EMIS No</th>
                    <th className="p-2.5">Student Name</th>
                    <th className="p-2.5">Class</th>
                    <th className="p-2.5 text-center">Avg Mark</th>
                    <th className="p-2.5 text-center">Auto Pass / Fail</th>
                    <th className="p-2.5">Low Mark Subject Alert (&lt; 50 / Fail &lt; 35)</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeRangeObj.students.map((st: any) => (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStudent(st)}
                      className={`cursor-pointer transition ${
                        st.is_pass
                          ? 'bg-emerald-50/30 hover:bg-emerald-100/50'
                          : 'bg-rose-50/70 hover:bg-rose-100/70'
                      }`}
                    >
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">{st.emis_number}</td>
                      <td className="p-2.5 font-black text-slate-900">{st.student_name}</td>
                      <td className="p-2.5 font-semibold text-slate-600">{st.class_name}</td>
                      <td className="p-2.5 text-center font-black text-sm text-[#650000]">{st.avg_mark}%</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            st.is_pass
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {st.result_status}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {st.low_mark_subjects?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {st.low_mark_subjects.map((ls: any, i: number) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                  ls.is_fail
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-200 text-amber-950'
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                {ls.subject_name}: {ls.mark} {ls.is_fail ? '(FAIL)' : '(Low)'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px]">✓ All Subjects Good</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(st);
                          }}
                          className="px-2.5 py-1 bg-[#8B0000] hover:bg-[#650000] text-white font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Student &amp; Staff Detail →
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeRangeObj.students.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-bold">
                        No students in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Complete Student Directory with Filters, Color-Highlighted Pass/Fail & Subject Marks */}
      <div className="glass-card p-3.5 sm:p-5 border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h3 className="text-xs sm:text-base font-black text-[#650000]">
              {title || 'Student Master Register — Auto Pass/Fail & Subject-Wise Low Mark Tracker'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Tap any student to view all Handling Staff names, then tap any Staff name for their 360° Staff Dashboard
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {/* Standard Filter */}
              <select
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                className="px-2.5 py-2 sm:py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white w-full sm:w-auto"
              >
                <option value="All">All Standards</option>
                <option value="10">10th Standard</option>
                <option value="11">11th Standard</option>
                <option value="12">12th Standard</option>
              </select>

              {/* Section Filter */}
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-2.5 py-2 sm:py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white w-full sm:w-auto"
              >
                <option value="All">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 sm:top-2" />
              <input
                type="text"
                placeholder="Search student or EMIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>
        </div>

        {/* Mobile Student Cards (<768px) */}
        <div className="md:hidden space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-bold">
              Loading student records and pass/fail classifications...
            </div>
          ) : (
            filteredStudents.map((st: any) => {
              const rTheme = RANGE_THEMES[st.range_key] || RANGE_THEMES['50_75'];
              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudent(st)}
                  className={`p-3 rounded-xl border border-slate-200 border-l-4 cursor-pointer transition ${
                    st.is_pass
                      ? 'border-l-emerald-500 bg-white'
                      : 'border-l-rose-600 bg-rose-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-black text-slate-900 text-xs truncate">{st.student_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        EMIS: {st.emis_number} • {st.class_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${rTheme.badge}`}>
                        {st.range_label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          st.is_pass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {st.result_status}
                      </span>
                    </div>
                  </div>

                  {/* Subject Marks Pills */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {st.subject_marks?.map((m: any, idx: number) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          !m.is_pass
                            ? 'bg-rose-600 text-white font-black'
                            : m.mark < 50
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.subject_name.slice(0, 3)}: {m.mark}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-xs font-black text-[#650000]">
                      Avg: {st.avg_mark}%
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(st);
                      }}
                      className="px-3 py-1 bg-[#8B0000] text-white font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      Staff &amp; Marks →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (>=768px) */}
        <div className="hidden md:block table-scroll-container rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs min-w-[820px]">
            <thead className="bg-[#8B0000] text-white">
              <tr>
                <th className="p-2.5">EMIS ID</th>
                <th className="p-2.5">Student Name</th>
                <th className="p-2.5">Class</th>
                <th className="p-2.5 text-center">Subject Marks Breakdown</th>
                <th className="p-2.5 text-center">Avg %</th>
                <th className="p-2.5 text-center">Range Category</th>
                <th className="p-2.5 text-center">Pass / Fail</th>
                <th className="p-2.5">Low Mark Subject Alert</th>
                <th className="p-2.5 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-bold">
                    Loading student records and pass/fail classifications...
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st: any) => {
                  const rTheme = RANGE_THEMES[st.range_key] || RANGE_THEMES['50_75'];
                  return (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStudent(st)}
                      className={`cursor-pointer transition border-l-4 ${
                        st.is_pass
                          ? 'border-l-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/60'
                          : 'border-l-rose-600 bg-rose-50/60 hover:bg-rose-100/70'
                      }`}
                    >
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">{st.emis_number}</td>
                      <td className="p-2.5">
                        <div className="font-black text-slate-900">{st.student_name}</div>
                        <div className="text-[10px] text-slate-500">{st.school_name}</div>
                      </td>
                      <td className="p-2.5 font-bold text-slate-700">{st.class_name}</td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {st.subject_marks?.map((m: any, idx: number) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                !m.is_pass
                                  ? 'bg-rose-600 text-white font-black'
                                  : m.mark < 50
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                              title={`Handled by: ${m.teacher_name}`}
                            >
                              {m.subject_name.slice(0, 3)}: {m.mark}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-black text-sm text-[#650000]">{st.avg_mark}%</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rTheme.badge}`}>
                          {st.range_label}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                            st.is_pass
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {st.result_status}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {st.low_mark_subjects?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {st.low_mark_subjects.map((ls: any, i: number) => (
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
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700">No Low Subject</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(st);
                          }}
                          className="px-2.5 py-1 bg-[#8B0000]/10 hover:bg-[#8B0000] hover:text-white text-[#8B0000] font-bold rounded-lg text-[11px] transition cursor-pointer"
                        >
                          Staff &amp; Marks
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail & Handling Staff Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="glass-card max-w-4xl w-full p-3.5 sm:p-6 shadow-2xl border border-white/70 h-[92vh] sm:h-auto sm:max-h-[92vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-200 gap-2 sm:gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[9px] sm:text-[10px] font-bold rounded">
                    EMIS: {selectedStudent.emis_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase ${
                      selectedStudent.is_pass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    RESULT: {selectedStudent.result_status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${RANGE_THEMES[selectedStudent.range_key]?.badge || 'bg-blue-600 text-white'}`}>
                    Range: {selectedStudent.range_label}
                  </span>
                </div>
                <h3 className="text-base sm:text-2xl font-black text-[#650000] mt-1 truncate">
                  {selectedStudent.student_name}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 font-medium line-clamp-1">
                  {selectedStudent.class_name} ({selectedStudent.medium}) • {selectedStudent.school_name} • Attendance: <b>{selectedStudent.attendance_pct}%</b>
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl w-8 h-8 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-4 sm:space-y-5 pr-0.5 sm:pr-1">
              {/* Alert banner if student has low mark in any one subject */}
              {selectedStudent.low_mark_subjects?.length > 0 && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-start gap-2.5 sm:gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-black text-rose-900 uppercase">
                      Low Mark Subject Alert Detected
                    </div>
                    <p className="text-rose-800 mt-0.5">
                      This student scored low marks in:{' '}
                      {selectedStudent.low_mark_subjects.map((ls: any, idx: number) => (
                        <span key={idx} className="font-black underline mr-2 inline-block">
                          {ls.subject_name} ({ls.mark}/100 - Handled by {ls.teacher_name})
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              )}

              {/* Subject-Wise Marks & Clickable Handling Staff */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs sm:text-sm font-black text-[#650000] uppercase tracking-wider">
                    Subject Marks &amp; Handling Staff (Tap Any Staff Name for 360° Staff Dashboard)
                  </h4>
                </div>

                {/* Mobile Subject + Staff Cards (<640px) */}
                <div className="sm:hidden space-y-2">
                  {selectedStudent.subject_marks?.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border border-slate-200 ${
                        !m.is_pass
                          ? 'bg-rose-50/80 border-rose-300'
                          : m.is_low
                          ? 'bg-amber-50/60 border-amber-300'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 text-xs">{m.subject_name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-sm ${!m.is_pass ? 'text-rose-700' : m.is_low ? 'text-amber-800' : 'text-emerald-800'}`}>
                            {m.mark}/{m.max_mark}
                          </span>
                          {!m.is_pass ? (
                            <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[9px] font-black">
                              FAIL
                            </span>
                          ) : m.is_low ? (
                            <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-black">
                              Low Mark
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-black">
                              PASS ({m.grade})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                        <div className="text-[10px] text-slate-600 truncate">
                          {m.teacher_designation}
                        </div>
                        <button
                          onClick={() => handleTeacherClick(m.teacher_id)}
                          className="px-2.5 py-1 bg-[#8B0000] text-white font-black rounded-lg text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>{m.teacher_name} →</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Subject Marks Table (>=640px) */}
                <div className="hidden sm:block table-scroll-container rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs min-w-[580px]">
                    <thead className="bg-[#8B0000] text-white">
                      <tr>
                        <th className="p-2.5">Subject</th>
                        <th className="p-2.5 text-center">Mark Scored</th>
                        <th className="p-2.5 text-center">Grade</th>
                        <th className="p-2.5 text-center">Subject Status</th>
                        <th className="p-2.5">Handling Staff Name (Click to Open Dashboard)</th>
                        <th className="p-2.5">Designation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedStudent.subject_marks?.map((m: any, idx: number) => (
                        <tr
                          key={idx}
                          className={
                            !m.is_pass
                              ? 'bg-rose-50/80'
                              : m.is_low
                              ? 'bg-amber-50/60'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="p-2.5 font-black text-slate-800">{m.subject_name}</td>
                          <td className="p-2.5 text-center">
                            <span className={`font-black text-sm ${!m.is_pass ? 'text-rose-700' : m.is_low ? 'text-amber-800' : 'text-emerald-800'}`}>
                              {m.mark}
                            </span>
                            <span className="text-[10px] text-slate-400"> / {m.max_mark}</span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">{m.grade}</td>
                          <td className="p-2.5 text-center">
                            {!m.is_pass ? (
                              <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black">
                                FAIL (&lt;35)
                              </span>
                            ) : m.is_low ? (
                              <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">
                                PASS (Low Mark)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
                                PASS
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <button
                              onClick={() => handleTeacherClick(m.teacher_id)}
                              className="px-2.5 py-1 bg-[#8B0000]/10 hover:bg-[#8B0000] text-[#8B0000] hover:text-white font-black rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span className="underline">{m.teacher_name}</span>
                            </button>
                          </td>
                          <td className="p-2.5 text-slate-600 font-semibold">{m.teacher_designation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* All Handling Staff Quick Cards */}
              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  All Handling Staff Assigned to {selectedStudent.student_name} — Tap Card for Staff 360° Analytics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
                  {selectedStudent.handling_staff?.map((hs: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleTeacherClick(hs.teacher_id)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-[#8B0000] bg-white hover:bg-amber-50/40 text-left transition cursor-pointer shadow-2xs flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-[10px] font-black uppercase text-[#8B0000]">{hs.subject_name} Faculty</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5 underline truncate">{hs.teacher_name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{hs.designation}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400">Mark</div>
                        <div className={`text-sm font-black ${hs.is_pass ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {hs.mark}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2.5 sm:pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 safe-pb">
              <span className="text-[10px] sm:text-[11px] text-slate-500 text-center sm:text-left">
                Tip: Tap any staff name above to open their full Staff Performance Dashboard
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2.5 sm:py-2 bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer text-center"
              >
                Close Student Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff 360° Analytics Dashboard Modal when clicking a staff name */}
      <StaffAnalyticsModal
        isOpen={!!activeTeacherId}
        onClose={() => setActiveTeacherId(null)}
        teacherId={activeTeacherId}
      />

      {/* Upload Student Marks Excel Modal */}
      <ExcelUploadModal
        isOpen={showMarksUploadModal}
        onClose={() => setShowMarksUploadModal(false)}
        onSuccess={fetchStudentsAnalytics}
        schoolId={schoolId > 0 ? schoolId : 1}
      />

      {/* Upload Staff Workbook Excel Modal */}
      <StaffExcelUploadModal
        isOpen={showStaffUploadModal}
        onClose={() => setShowStaffUploadModal(false)}
        onSuccess={fetchStudentsAnalytics}
        schoolId={schoolId > 0 ? schoolId : 1}
      />
    </div>
  );
};
