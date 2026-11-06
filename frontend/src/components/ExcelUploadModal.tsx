import React, { useState } from 'react';
import apiClient from '../api';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, ArrowRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ExcelUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schoolId?: number;
}> = ({ isOpen, onClose, onSuccess, schoolId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [examId, setExamId] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = [
      "SCHOOL NAME", "EMIS NO", "STUDENT NAME", "CLASS", "SECTION", "TM/EM", "GROUP CODE",
      "TAMIL", "ENGLISH", "MATHS", "SCIENCE – THEORY", "SCIENCE – PRACTICAL", "SOCIAL SCIENCE"
    ];
    const sampleRows = [
      ["Coimbatore Corporation HSS, R.S. Puram", "33120109001", "Aadhavan K (Above 90)", "10", "A", "EM", "General", "96", "94", "98", "70", "25", "95"],
      ["Coimbatore Corporation HSS, R.S. Puram", "33120109002", "Bharathi S (75 to 90)", "10", "A", "EM", "General", "84", "82", "86", "60", "24", "85"],
      ["Coimbatore Corporation HSS, R.S. Puram", "33120109003", "Chitra M (50 to 75 - Maths Fail)", "10", "A", "EM", "General", "72", "68", "27", "48", "20", "70"],
      ["Coimbatore Corporation HSS, R.S. Puram", "33120109004", "Dinesh R (35 to 50)", "10", "B", "TM", "General", "45", "42", "38", "25", "16", "46"],
      ["Coimbatore Corporation HSS, R.S. Puram", "33120109005", "Ezhil V (Below 35 Fail)", "10", "B", "TM", "General", "30", "26", "22", "15", "12", "31"]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Mark Details");
    XLSX.writeFile(wb, "Coimbatore_Corp_Marks_Upload_Template.xlsx");
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
      setErrorMsg('Please select an Excel file (.xlsx)');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('exam_id', examId.toString());
    formData.append('academic_year', '2026-2027');
    if (schoolId) formData.append('school_id', schoolId.toString());

    try {
      const res = await apiClient.post('/excel/preview-marks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to parse Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCommit = async () => {
    if (!previewData || !previewData.all_valid_records) return;
    setLoading(true);
    try {
      await apiClient.post('/excel/commit-marks', {
        valid_records: previewData.all_valid_records,
        exam_id: examId,
        academic_year: '2026-2027',
        school_id: schoolId
      });
      alert('Examination marks validated and saved into local database! Student Pass/Fail & Mark Ranges updated.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save marks to database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start sm:items-center pb-3 sm:pb-4 border-b border-slate-200 gap-2">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
              <span>Excel Examination Mark Upload &amp; Validation</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Supports Coimbatore Corporation standardized quarterly/half-yearly marks sheet
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer w-8 h-8 flex items-center justify-center shrink-0"
          >
            &times;
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-3.5 sm:py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Examination</label>
              <select
                value={examId}
                onChange={(e) => setExamId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-slate-50"
              >
                <option value={1}>Quarterly Examination (2026-2027)</option>
                <option value={2}>Half-Yearly Examination (2026-2027)</option>
                <option value={3}>Annual Examination (2026-2027)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Standardized Template</label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 font-medium transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" /> Download Blank Template (.xlsx)
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 sm:p-6 text-center transition bg-slate-50">
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-medium text-slate-700">Choose completed Excel workbook to validate</p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Accepts standard .xlsx workbook (Students Mark Details sheet)</p>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="mt-3 sm:mt-4 text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer max-w-full"
            />
            {file && <p className="text-xs text-emerald-600 mt-2 font-medium break-all">Selected: {file.name}</p>}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {previewData && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-slate-100 rounded-lg text-center">
                  <div className="text-[10px] sm:text-xs text-slate-500">Total Rows</div>
                  <div className="text-base sm:text-lg font-bold text-slate-800">{previewData.total_records}</div>
                </div>
                <div className="p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                  <div className="text-[10px] sm:text-xs text-emerald-700 font-medium">Valid</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-800">{previewData.valid_count}</div>
                </div>
                <div className="p-2.5 sm:p-3 bg-rose-50 border border-rose-200 rounded-lg text-center">
                  <div className="text-[10px] sm:text-xs text-rose-700 font-medium">Errors</div>
                  <div className="text-base sm:text-lg font-bold text-rose-800">{previewData.invalid_count}</div>
                </div>
              </div>

              {previewData.errors?.length > 0 && (
                <div className="border border-rose-200 rounded-lg p-3 bg-rose-50/50">
                  <h4 className="text-xs font-bold text-rose-800 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Validation Error Log (Correct before importing)
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {previewData.errors.map((e: any, i: number) => (
                      <div key={i} className="text-xs text-rose-700 bg-white p-1.5 rounded border border-rose-100">
                        Row {e.row} | Student: <b>{e.student || e.emis}</b> | Field: <b>{e.field}</b> | Problem: {e.problem}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.preview_data?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Preview Validated Rows (Normalized)</h4>
                  <div className="table-scroll-container border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs min-w-[460px]">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="p-2">EMIS</th>
                          <th className="p-2">Student Name</th>
                          <th className="p-2">Standard</th>
                          <th className="p-2">Section</th>
                          <th className="p-2">Subjects Parsed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.preview_data.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{r.emis_number}</td>
                            <td className="p-2 font-medium">{r.student_name}</td>
                            <td className="p-2">{r.standard}th</td>
                            <td className="p-2">{r.section}</td>
                            <td className="p-2 text-slate-500">{r.marks?.length || 0} subjects extracted</td>
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
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-3 sm:pt-4 border-t border-slate-200 safe-pb">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer text-center"
          >
            Cancel
          </button>
          <div className="flex flex-col sm:flex-row gap-2">
            {!previewData ? (
              <button
                onClick={handlePreview}
                disabled={loading || !file}
                className="px-5 py-2.5 sm:py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                {loading ? 'Validating...' : 'Parse & Validate Rows'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleConfirmCommit}
                disabled={loading || previewData.valid_count === 0}
                className="px-5 py-2.5 sm:py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm &amp; Save to Database ({previewData.valid_count} Records)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
