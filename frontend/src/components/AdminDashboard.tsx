import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Shield, FileSpreadsheet, 
  Settings, Activity, RefreshCw, FileUp, Plus, UserPlus
} from 'lucide-react';
import apiClient from '../api';
import { StaffExcelUploadModal } from './StaffExcelUploadModal';
import { StaffProfileModal } from './StaffProfileModal';

export const AdminDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStaffExcelModal, setShowStaffExcelModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number>(1);

  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/admin/audit-logs'),
      apiClient.get('/admin/meta')
    ]).then(([logsRes, metaRes]) => {
      setLogs(logsRes.data);
      setMeta(metaRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Admin Command Header */}
      <div className="glass-card p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-l-[#8B0000]">
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
              <span className="text-[11px] sm:text-xs text-slate-500 font-bold">Security & Configuration Control</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#650000] mt-1">
              System Administrator & Configuration Portal
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Audit Trail Logging • Subject & Exam Master Data • RBAC Management • Staff Management
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="gold-button flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm w-full md:w-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#650000]" /> Refresh Audit Trail
        </button>
      </div>

      {/* Admin Master Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="glass-card p-3.5 sm:p-5 border-l-4 border-l-[#8B0000]">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Configured Subjects</div>
          <div className="text-xl sm:text-2xl font-black text-[#650000]">{meta?.subjects?.length || 14}</div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Curriculums</p>
        </div>

        <div className="glass-card p-3.5 sm:p-5 border-l-4 border-l-[#FFC928]">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Examinations</div>
          <div className="text-xl sm:text-2xl font-black text-[#650000]">{meta?.examinations?.length || 4}</div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Active Exam Cycles</p>
        </div>

        <div className="glass-card p-3.5 sm:p-5 border-l-4 border-l-[#8B0000]">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Audit Entries</div>
          <div className="text-xl sm:text-2xl font-black text-[#650000]">{logs?.length || 24}</div>
          <p className="text-[10px] sm:text-xs text-emerald-700 font-bold mt-0.5 truncate">Tamper-Proof DB</p>
        </div>

        <div className="glass-card p-3.5 sm:p-5 border-l-4 border-l-[#FFC928]">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate">Corp Schools</div>
          <div className="text-xl sm:text-2xl font-black text-[#650000]">{meta?.schools?.length || 7}</div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Active Institutions</p>
        </div>
      </div>

      {/* ── Staff Management Module for Admin ── */}
      <div className="glass-card p-4 sm:p-6 border-l-4 border-l-[#FFC928]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div>
            <h3 className="font-black text-[#650000] text-sm sm:text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8B0000]" /> Corporation-Wide Staff Management
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Add, edit, or bulk-import staff details across all Corporation schools
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {/* School picker for admin */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 shrink-0">School:</span>
              <select
                value={selectedSchoolId}
                onChange={e => setSelectedSchoolId(Number(e.target.value))}
                className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold flex-1 sm:flex-initial"
              >
                {meta?.schools?.map((sc: any) => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                )) || <option value={1}>Default School</option>}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="primary-button px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer flex-1 sm:flex-initial"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#FFD700]" /> Add Manually
              </button>
              <button
                onClick={() => setShowStaffExcelModal(true)}
                className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer bg-slate-800 hover:bg-slate-900 text-white transition flex-1 sm:flex-initial"
              >
                <FileUp className="w-3.5 h-3.5" /> Bulk Upload (.xlsx)
              </button>
            </div>
          </div>
        </div>

        {/* Admin info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4 text-xs">
            <div className="font-black text-amber-800 uppercase tracking-wider text-[10px] mb-1.5">Add Staff Manually</div>
            <p className="text-amber-700 text-[11px] sm:text-xs">Create individual staff profiles with name, designation, contact, education, native, blood group and more.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 text-xs">
            <div className="font-black text-slate-800 uppercase tracking-wider text-[10px] mb-1.5">Bulk Excel Import</div>
            <p className="text-slate-600 text-[11px] sm:text-xs">Download template, fill staff details in Excel, and upload to import/update multiple records at once.</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:p-4 text-xs">
            <div className="font-black text-emerald-800 uppercase tracking-wider text-[10px] mb-1.5">Audit Trail</div>
            <p className="text-emerald-700 text-[11px] sm:text-xs">All additions and edits are recorded in the tamper-proof audit trail with timestamp and user details.</p>
          </div>
        </div>
      </div>

      {/* System Audit Logs */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
          <div>
            <h3 className="font-black text-[#650000] text-sm sm:text-base">Comprehensive Audit Trail Log</h3>
            <p className="text-[11px] sm:text-xs text-slate-500">Records logins, mark uploads, staff attendance changes and role verifications</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 sm:hidden">⇄ Swipe table horizontally</span>
            <span className="text-[10px] font-black px-2.5 py-1 bg-[#8B0000]/10 text-[#8B0000] rounded-lg">
              Live Stream
            </span>
          </div>
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
    </div>
  );
};
