import React, { useState } from 'react';
import apiClient from '../api';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, ArrowRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const StaffAttendanceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState<string>('SEPTEMBER');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  const [loading, setLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = [
      "S.NO", "SCHOOL NAME", "TEACHER NAME", "HM", "SUBJECT", "CLASS", "SECTION", "TM/EM",
      "CL", "RH", "EL", "ML", "OTHERS", "TOTAL", "REASON"
    ];
    const sampleRow = [
      "1",
      "Coimbatore Corporation Higher Secondary School, R.S. Puram",
      "Ravi Kumar M.Sc., B.Ed.",
      "",
      "Mathematics",
      "10",
      "A",
      "EM",
      "2", "0", "1", "0", "0", "3",
      "Personal Leave"
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers Attendance");
    XLSX.writeFile(wb, "Teachers_Attendance_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setErrorMsg('Please select an Excel file (.xlsx)');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('month', month);
    formData.append('academic_year', academicYear);

    try {
      const res = await apiClient.post('/headmaster/staff-attendance/preview-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to parse staff attendance Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCommit = async () => {
    if (!previewData || !previewData.all_valid_records) return;
    setLoading(true);
    try {
      await apiClient.post('/headmaster/staff-attendance/commit-excel', {
        valid_records: previewData.all_valid_records,
        month: month,
        academic_year: academicYear
      });
      alert('Staff attendance records successfully committed to database!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save staff attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-4xl w-full p-6 shadow-2xl border border-white/60 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-black text-[#650000] flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[#8B0000]" />
              Teachers Attendance Excel Import Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Validates CL, RH, EL, ML, Others & auto-calculates Total Leave
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer">
            &times;
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Standardized Template</label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#8B0000]" /> Download Template (.xlsx)
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-[#8B0000] rounded-2xl p-6 text-center transition bg-white/60">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">Choose completed Teachers Attendance workbook to validate</p>
            <p className="text-xs text-slate-500 mt-1">Accepts standard .xlsx workbook (Teachers Attendance sheet)</p>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="mt-4 text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#8B0000] file:text-white hover:file:bg-[#650000] cursor-pointer"
            />
            {file && <p className="text-xs text-emerald-700 mt-2 font-bold">Selected: {file.name}</p>}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {previewData && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <div className="text-xs text-slate-500">Total Rows Processed</div>
                  <div className="text-lg font-black text-slate-800">{previewData.total_records}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-xs text-emerald-700 font-bold">Valid Records</div>
                  <div className="text-lg font-black text-emerald-800">{previewData.valid_count}</div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="text-xs text-rose-700 font-bold">Validation Errors</div>
                  <div className="text-lg font-black text-rose-800">{previewData.invalid_count}</div>
                </div>
              </div>

              {previewData.errors?.length > 0 && (
                <div className="border border-rose-200 rounded-xl p-3 bg-rose-50/70">
                  <h4 className="text-xs font-bold text-rose-800 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors:
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {previewData.errors.map((e: any, i: number) => (
                      <div key={i} className="text-xs text-rose-700 bg-white p-1.5 rounded border border-rose-100">
                        Row {e.row} | Teacher: <b>{e.teacher}</b> | Field: <b>{e.field}</b> | Problem: {e.problem}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.preview_data?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Preview Staff Attendance Rows</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#8B0000] text-white">
                        <tr>
                          <th className="p-2">Teacher Name</th>
                          <th className="p-2">Subject</th>
                          <th className="p-2">Class</th>
                          <th className="p-2">CL</th>
                          <th className="p-2">RH</th>
                          <th className="p-2">EL</th>
                          <th className="p-2">ML</th>
                          <th className="p-2">Total Leave</th>
                          <th className="p-2">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {previewData.preview_data.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#FFF3B0]/30">
                            <td className="p-2 font-bold text-slate-800">{r.teacher_name}</td>
                            <td className="p-2">{r.subject}</td>
                            <td className="p-2">{r.standard}th - {r.section}</td>
                            <td className="p-2">{r.cl}</td>
                            <td className="p-2">{r.rh}</td>
                            <td className="p-2">{r.el}</td>
                            <td className="p-2">{r.ml}</td>
                            <td className="p-2 font-bold text-[#8B0000]">{r.total_leave}</td>
                            <td className="p-2 font-bold text-emerald-700">{r.attendance_percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {!previewData ? (
              <button
                onClick={handlePreview}
                disabled={loading || !file}
                className="primary-button px-5 py-2 text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {loading ? 'Validating...' : 'Validate Excel Sheet'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleConfirmCommit}
                disabled={loading || previewData.valid_count === 0}
                className="gold-button px-5 py-2 text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Commit Validated Attendance ({previewData.valid_count} Records)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
