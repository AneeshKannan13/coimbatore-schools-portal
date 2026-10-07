import React, { useState } from 'react';
import { UserPlus, UserCheck, X, AlertCircle } from 'lucide-react';
import apiClient from '../api';

export const StaffProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffData?: any;
  schoolId?: number;
}> = ({ isOpen, onClose, onSuccess, staffData, schoolId }) => {
  const [teacherName, setTeacherName] = useState(staffData?.teacher_name || '');
  const [employeeId, setEmployeeId] = useState(staffData?.employee_id || '');
  const [designation, setDesignation] = useState(staffData?.designation || 'B.T. Assistant');
  const [subjectSpecialization, setSubjectSpecialization] = useState(staffData?.subject || staffData?.handling_subject || 'Mathematics');
  const [contactNumber, setContactNumber] = useState(staffData?.contact_number || '');
  const [educationQualification, setEducationQualification] = useState(staffData?.education_qualification || 'M.Sc., B.Ed.');
  const [location, setLocation] = useState(staffData?.location || 'Coimbatore');
  const [nativePlace, setNativePlace] = useState(staffData?.native_place || '');
  const [bloodGroup, setBloodGroup] = useState(staffData?.blood_group || 'O+ve');
  const [experienceYears, setExperienceYears] = useState(staffData?.experience_years || 5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/staff/manage', {
        id: staffData?.id,
        school_id: schoolId,
        teacher_name: teacherName,
        employee_id: employeeId,
        designation,
        subject_specialization: subjectSpecialization,
        contact_number: contactNumber,
        education_qualification: educationQualification,
        location,
        native_place: nativePlace,
        blood_group: bloodGroup,
        experience_years: experienceYears
      });

      alert(`Staff profile for ${teacherName} saved successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save staff profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-2xl w-full p-6 shadow-2xl border border-white/60 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#8B0000]" />
            <h3 className="text-base font-black text-[#650000]">
              {staffData ? 'Edit Staff Profile & Personal Info' : 'Add New Teaching Staff Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. S. Ravi Kumar M.Sc., B.Ed."
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Employee ID / Staff Code
              </label>
              <input
                type="text"
                placeholder="e.g. TCH-2026-042"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Designation
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold"
              >
                <option value="PG Assistant">PG Assistant (Higher Secondary)</option>
                <option value="B.T. Assistant">B.T. Assistant (High School)</option>
                <option value="Primary School HM">Primary School HM</option>
                <option value="Special Teacher">Special / Vocational Teacher</option>
                <option value="Physical Education Teacher">Physical Education Teacher (PET)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Handling Subject / Specialization
              </label>
              <input
                type="text"
                placeholder="e.g. Mathematics, Science, English"
                value={subjectSpecialization}
                onChange={(e) => setSubjectSpecialization(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-[#8B0000]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 9842109876"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Educational Qualification
              </label>
              <input
                type="text"
                placeholder="e.g. M.Sc., B.Ed., M.Phil."
                value={educationQualification}
                onChange={(e) => setEducationQualification(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Current Posting / Residential Location
              </label>
              <input
                type="text"
                placeholder="e.g. R.S. Puram, Coimbatore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Native Place / Hometown
              </label>
              <input
                type="text"
                placeholder="e.g. Pollachi, Coimbatore District"
                value={nativePlace}
                onChange={(e) => setNativePlace(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
              >
                <option value="O+ve">O +ve</option>
                <option value="O-ve">O -ve</option>
                <option value="A+ve">A +ve</option>
                <option value="A-ve">A -ve</option>
                <option value="B+ve">B +ve</option>
                <option value="B-ve">B -ve</option>
                <option value="AB+ve">AB +ve</option>
                <option value="AB-ve">AB -ve</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Teaching Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="primary-button px-6 py-2 rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-[#FFD700]" />
              {loading ? 'Saving...' : 'Save Staff Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
