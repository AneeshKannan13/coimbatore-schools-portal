import React, { useState } from 'react';
import apiClient from '../api';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, ArrowRight, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

export const StaffExcelUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schoolId?: number;
}> = ({ isOpen, onClose, onSuccess, schoolId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = [
      "TEACHER NAME", "EMPLOYEE ID", "DESIGNATION", "SUBJECT",
      "CONTACT NUMBER", "QUALIFICATION", "LOCATION", "NATIVE",
      "BLOOD GROUP", "EXPERIENCE"
    ];
    const sampleRows = [
      [
        "S. Ravi Kumar", "TCH-2026-001", "PG Assistant", "Mathematics",
        "9842100001", "M.Sc., B.Ed.", "R.S. Puram, Coimbatore", "Pollachi",
        "O+ve", "8"
      ],
      [
        "M. Lakshmi Devi", "TCH-2026-002", "B.T. Assistant", "Tamil",
        "9842100002", "M.A., B.Ed.", "Peelamedu, Coimbatore", "Tiruppur",
        "B+ve", "12"
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff Details");
    XLSX.writeFile(wb, "Staff_Details_Upload_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setErrorMsg('');
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setErrorMsg('Please select an Excel file (.xlsx or .xls)');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/headmaster/staff-upload/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to parse staff Excel. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCommit = async () => {
    if (!previewData || !previewData.all_valid_records || previewData.valid_count === 0) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/headmaster/staff-upload/commit', {
        valid_records: previewData.all_valid_records,
        school_id: schoolId
      });
      alert(`Staff import successful! ${res.data.message}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to commit staff records.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-5xl w-full p-6 shadow-2xl border border-white/60 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-black text-[#650000] flex items-center gap-2">
              <Users className="w-6 h-6 text-[#8B0000]" />
              Bulk Staff Details Upload — Excel Import Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload staff info: Name, Designation, Subject, Contact, Education, Location, Native &amp; more
            </p>
          </div>
          <button onClick={resetState} className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 bg-amber-50/60 rounded-2xl p-4">
              <div className="text-xs font-black uppercase text-[#8B0000] mb-2">Step 1 — Download Template</div>
              <p className="text-xs text-slate-600 mb-3">
                Use the official Corporation staff template. Fill all columns and save as .xlsx before uploading.
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8B0000] hover:bg-[#650000] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Staff Template (.xlsx)
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-[#8B0000] rounded-2xl p-4 text-center transition bg-white/60">
              <div className="text-xs font-black uppercase text-[#8B0000] mb-2">Step 2 — Upload Filled Excel</div>
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 mb-2">Choose completed staff workbook</p>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#8B0000] file:text-white hover:file:bg-[#650000] cursor-pointer"
              />
              {file && <p className="text-xs text-emerald-700 mt-2 font-bold">Selected: {file.name}</p>}
            </div>
          </div>

          {/* Column Reference */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-black uppercase text-slate-700 mb-2">Expected Excel Columns</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
              {[
                { col: "TEACHER NAME*", desc: "Full staff name" },
                { col: "EMPLOYEE ID", desc: "Staff code" },
                { col: "DESIGNATION", desc: "PG/B.T. Assistant etc." },
                { col: "SUBJECT", desc: "Handling subject" },
                { col: "CONTACT NUMBER", desc: "Phone number" },
                { col: "QUALIFICATION", desc: "Educational degree" },
                { col: "LOCATION", desc: "Posting location" },
                { col: "NATIVE", desc: "Native hometown" },
                { col: "BLOOD GROUP", desc: "e.g. O+ve" },
                { col: "EXPERIENCE", desc: "Years of service" },
              ].map(item => (
                <div key={item.col} className="bg-white border border-slate-200 rounded-lg p-1.5">
                  <div className="font-mono font-bold text-[#8B0000] text-[9px]">{item.col}</div>
                  <div className="text-slate-500 mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-rose-600 mt-2 font-bold">* Required column. All others are optional but recommended for complete staff records.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-100 rounded-xl text-center">
                  <div className="text-[10px] text-slate-500 font-bold">Total Rows</div>
                  <div className="text-xl font-black text-slate-800">{previewData.total_records}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <div className="text-[10px] text-emerald-700 font-bold">Valid Records</div>
                  <div className="text-xl font-black text-emerald-800">{previewData.valid_count}</div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <div className="text-[10px] text-rose-700 font-bold">Errors / Skipped</div>
                  <div className="text-xl font-black text-rose-800">{previewData.invalid_count}</div>
                </div>
              </div>

              {previewData.errors?.length > 0 && (
                <div className="border border-rose-200 rounded-xl p-3 bg-rose-50/70">
                  <h4 className="text-xs font-bold text-rose-800 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors:
                  </h4>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {previewData.errors.map((e: any, i: number) => (
                      <div key={i} className="text-xs text-rose-700 bg-white p-1.5 rounded border border-rose-100">
                        Row {e.row} | <b>{e.field}</b>: {e.problem}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.preview_data?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">
                    Preview (First {previewData.preview_data.length} of {previewData.valid_count} valid records)
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#8B0000] text-white">
                        <tr>
                          <th className="p-2">Staff Name</th>
                          <th className="p-2">Employee ID</th>
                          <th className="p-2">Designation</th>
                          <th className="p-2">Subject</th>
                          <th className="p-2">Contact</th>
                          <th className="p-2">Qualification</th>
                          <th className="p-2">Location</th>
                          <th className="p-2">Native</th>
                          <th className="p-2">Blood Grp</th>
                          <th className="p-2 text-center">Exp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {previewData.preview_data.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#FFF3B0]/30">
                            <td className="p-2 font-bold text-slate-800">{r.teacher_name}</td>
                            <td className="p-2 font-mono text-slate-500 text-[10px]">{r.employee_id || '—'}</td>
                            <td className="p-2 text-slate-700">{r.designation}</td>
                            <td className="p-2 font-bold text-[#8B0000]">{r.subject_specialization || '—'}</td>
                            <td className="p-2 font-mono text-slate-600">{r.contact_number || '—'}</td>
                            <td className="p-2 text-slate-600">{r.education_qualification || '—'}</td>
                            <td className="p-2 text-slate-600">{r.location}</td>
                            <td className="p-2 text-slate-600">{r.native_place || '—'}</td>
                            <td className="p-2 text-slate-600">{r.blood_group}</td>
                            <td className="p-2 text-center font-bold text-slate-700">{r.experience_years}y</td>
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

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <button onClick={resetState} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer">
            Cancel
          </button>
          <div className="flex gap-2">
            {!previewData ? (
              <button
                onClick={handlePreview}
                disabled={loading || !file}
                className="primary-button px-5 py-2 text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {loading ? 'Validating...' : 'Validate & Preview'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setPreviewData(null); setFile(null); setErrorMsg(''); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Re-upload
                </button>
                <button
                  onClick={handleConfirmCommit}
                  disabled={loading || previewData.valid_count === 0}
                  className="gold-button px-6 py-2 text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {loading ? 'Committing...' : `Commit ${previewData.valid_count} Staff Records`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
