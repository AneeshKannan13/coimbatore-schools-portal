import React, { useState } from 'react';
import apiClient from '../api';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, ArrowRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ExcelUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [examId, setExamId] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    // Generates the reference workbook structure
    const headers = [
      "SCHOOL NAME", "EMIS NO", "STUDENT NAME", "CLASS", "SECTION", "TM/EM", "GROUP CODE",
      "TAMIL", "ENGLISH", "MATHS", "SCIENCE – THEORY", "SCIENCE – PRACTICAL", "SOCIAL SCIENCE",
      "PHYSICS – THEORY", "PHYSICS – PRACTICAL", "CHEMISTRY – THEORY", "CHEMISTRY – PRACTICAL",
      "COMP SCI – THEORY", "COMP SCI – PRACTICAL", "BIOLOGY – THEORY", "BIOLOGY – PRACTICAL",
      "COMMERCE", "ACCOUNTS", "ECONOMICS", "BUS MATHS"
    ];
    const sampleRow = [
      "Coimbatore Corporation Higher Secondary School, R.S. Puram",
      "331201001001",
      "Arun Kumar S",
      "10",
      "A",
      "EM",
      "General",
      "85", "78", "92", "68", "25", "88",
      "", "", "", "", "", "", "", "", "", "", "", ""
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Mark Details");
    XLSX.writeFile(wb, "Coimbatore_Corp_Marks_Upload_Template.xlsx");
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
    formData.append('exam_id', examId.toString());
    formData.append('academic_year', '2026-2027');

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
        academic_year: '2026-2027'
      });
      alert('Examination marks validated and successfully saved into database single source of truth!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save marks to database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              Excel Examination Mark Upload & Validation Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Supports Coimbatore Corporation standardized quarterly/half-yearly marks sheet
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer">
            &times;
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Examination</label>
              <select
                value={examId}
                onChange={(e) => setExamId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-sm text-slate-700 font-medium transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" /> Download Blank Template (.xlsx)
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center transition bg-slate-50">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Choose completed Excel workbook to validate</p>
            <p className="text-xs text-slate-500 mt-1">Accepts standard .xlsx workbook (Students Mark Details sheet)</p>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="mt-4 text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            {file && <p className="text-xs text-emerald-600 mt-2 font-medium">Selected: {file.name}</p>}
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
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="text-xs text-slate-500">Total Rows Processed</div>
                  <div className="text-lg font-bold text-slate-800">{previewData.total_records}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-xs text-emerald-700 font-medium">Valid Records</div>
                  <div className="text-lg font-bold text-emerald-800">{previewData.valid_count}</div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="text-xs text-rose-700 font-medium">Invalid / Errors</div>
                  <div className="text-lg font-bold text-rose-800">{previewData.invalid_count}</div>
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
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
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
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {!previewData ? (
              <button
                onClick={handlePreview}
                disabled={loading || !file}
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {loading ? 'Validating...' : 'Parse & Validate Rows'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleConfirmCommit}
                disabled={loading || previewData.valid_count === 0}
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & Save to Database ({previewData.valid_count} Records)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
