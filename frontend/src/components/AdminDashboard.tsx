import React, { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, FileSpreadsheet,
  Settings, Activity, RefreshCw, FileUp, Plus, UserPlus, UserCheck
} from 'lucide-react';
import apiClient from '../api';
import { StaffExcelUploadModal } from './StaffExcelUploadModal';
import { StaffProfileModal } from './StaffProfileModal';
import { StudentAnalyticsSection } from './StudentAnalyticsSection';
import { StaffAnalyticsModal } from './StaffAnalyticsModal';

export const AdminDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'staff' | 'audit'>('students');
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStaffExcelModal, setShowStaffExcelModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number>(1);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);

  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/admin/audit-logs'),
      apiClient.get('/admin/meta'),
      apiClient.get(`/headmaster/staff?school_id=${selectedSchoolId}`)
    ]).then(([logsRes, metaRes, staffRes]) => {
      setLogs(logsRes.data);
      setMeta(metaRes.data);
      setStaffList(staffRes.data?.staff || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, [selectedSchoolId]);

  return (
    <div className="space-y-6">
      {/* Admin Command Header */}
      <div className="glass-card p-4 sm:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-l-4 border-l-[#8B0000]">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/coimbatore_corp_logo.png"
            alt="Logo"
            className="h-10 sm:h-14 w-auto object-contain hidden sm:block"
          />
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 py-0.5 bg-[#8B0000]/10 text-[#8B0000] rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider">
                System Administration
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-bold">Full Staff &amp; Student Oversight</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#650000] mt-1">
              System Administrator &amp; Configuration Portal
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Student Pass/Fail Ranges • Staff 360° Dashboards • Bulk Excel Upload • Audit Trail
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'students' ? 'primary-button shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Ranges &amp; Pass/Fail
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'staff' ? 'gold-button shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Details &amp; Excel
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'audit' ? 'primary-button shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Logs ({logs.length})
            </button>
          </div>
        </div>
      </div>

      {/* School Selector & Quick Staff Actions Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-l-4 border-l-[#FFC928]">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-black text-[#650000] shrink-0">Active School Filter:</span>
          <select
            value={selectedSchoolId}
            onChange={e => setSelectedSchoolId(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold flex-1 sm:min-w-[320px]"
          >
            {meta?.schools?.map((sc: any) => (
              <option key={sc.id} value={sc.id}>{sc.code} — {sc.name}</option>
            )) || <option value={1}>Default Corporation School</option>}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowProfileModal(true)}
            className="primary-button px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer flex-1 sm:flex-initial"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#FFD700]" /> Add Staff Manually
          </button>
          <button
            onClick={() => setShowStaffExcelModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer bg-slate-800 hover:bg-slate-900 text-white transition flex-1 sm:flex-initial"
          >
            <FileUp className="w-3.5 h-3.5" /> Bulk Staff Upload (.xlsx)
          </button>
          <button
            onClick={fetchAdminData}
            className="gold-button flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#650000]" /> Refresh
          </button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <StudentAnalyticsSection
          schoolId={selectedSchoolId}
          title="Admin Portal — Student Pass/Fail Auto-Classification & 5-Range Breakdown"
          onSelectTeacher={(tid) => setSelectedTeacherId(tid)}
        />
      ) : activeTab === 'staff' ? (
        <div className="glass-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-black text-[#650000] text-sm sm:text-base">
                School Staff Directory — Click Any Staff Name for 360° Performance Dashboard
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Displays staff designation, location, contact, presents, leaves, handling student count &amp; pass/fail ratio
              </p>
            </div>
          </div>

          <div className="table-scroll-container rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs min-w-[820px]">
              <thead className="bg-[#8B0000] text-white">
                <tr>
                  <th className="p-3">Staff Name (Click for Dashboard)</th>
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
                {staffList.map((s: any) => (
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
                        360° Dashboard →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* System Audit Logs */
        <div className="glass-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <div>
              <h3 className="font-black text-[#650000] text-sm sm:text-base">Comprehensive Audit Trail Log</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Records logins, mark uploads, staff attendance changes and role verifications</p>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 bg-[#8B0000]/10 text-[#8B0000] rounded-lg">
              Live Stream
            </span>
          </div>

          <div className="table-scroll-container rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-[#8B0000] text-white">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FFF3B0]/30 transition">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-3 font-bold text-slate-900">{l.username}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#8B0000]/10 text-[#8B0000]">
                        {l.role}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#8B0000]">{l.action}</td>
                    <td className="p-3 text-slate-700">{l.details}</td>
                    <td className="p-3 font-mono text-slate-400">{l.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Excel Bulk Upload Modal */}
      <StaffExcelUploadModal
        isOpen={showStaffExcelModal}
        onClose={() => setShowStaffExcelModal(false)}
        onSuccess={fetchAdminData}
        schoolId={selectedSchoolId}
      />

      {/* Add Staff Manually Modal */}
      {showProfileModal && (
        <StaffProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSuccess={fetchAdminData}
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
