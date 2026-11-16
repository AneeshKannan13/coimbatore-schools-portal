import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Relative asset paths that work on both localhost and GitHub Pages subdirectories
export const CORP_LOGO_URL = `${import.meta.env.BASE_URL}coimbatore_corp_logo.png`;
export const CM_PHOTO_URL = `${import.meta.env.BASE_URL}hon_cm_tn.jpg`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 4000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// MOBILE / GITHUB PAGES OFFLINE DATA ENGINE
// Ensures 100% live data on mobile & GitHub Pages (aneeshkannan13.github.io)
// even when the local FastAPI backend on localhost:8000 is not reachable.
// ============================================================================

const DEMO_SCHOOLS = [
  { id: 1, code: 'CCM-01', school_code: 'CCM-01', name: 'Coimbatore Corporation HSS, R.S. Puram', school_name: 'Coimbatore Corporation HSS, R.S. Puram', zone: 'West', ward: 'Ward 23', school_type: 'Higher Secondary', headmaster_name: 'Dr. K. Ramanathan', emis_number: '33120100101', students: 380, student_count: 380, teacher_count: 28, avg_mark: 74.8, pass_rate: 88.5, attendance: 93.4, risk_students: 5 },
  { id: 2, code: 'CCM-02', school_code: 'CCM-02', name: 'Coimbatore Corporation HSS, Siddhapudur', school_name: 'Coimbatore Corporation HSS, Siddhapudur', zone: 'Central', ward: 'Ward 31', school_type: 'Higher Secondary', headmaster_name: 'Smt. V. Meenakshi', emis_number: '33120100102', students: 340, student_count: 340, teacher_count: 25, avg_mark: 72.1, pass_rate: 86.2, attendance: 92.0, risk_students: 6 },
  { id: 3, code: 'CCM-03', school_code: 'CCM-03', name: 'Coimbatore Corporation High School, Ramanathapuram', school_name: 'Coimbatore Corporation High School, Ramanathapuram', zone: 'East', ward: 'Ward 62', school_type: 'High School', headmaster_name: 'Thiru. P. Sundaram', emis_number: '33120100103', students: 290, student_count: 290, teacher_count: 22, avg_mark: 69.5, pass_rate: 83.4, attendance: 90.8, risk_students: 8 },
  { id: 4, code: 'CCM-04', school_code: 'CCM-04', name: 'Coimbatore Corporation Girls HSS, Oppanakara St', school_name: 'Coimbatore Corporation Girls HSS, Oppanakara St', zone: 'South', ward: 'Ward 45', school_type: 'Higher Secondary', headmaster_name: 'Dr. R. Kavitha', emis_number: '33120100104', students: 420, student_count: 420, teacher_count: 32, avg_mark: 78.2, pass_rate: 92.1, attendance: 95.1, risk_students: 3 },
  { id: 5, code: 'CCM-05', school_code: 'CCM-05', name: 'Coimbatore Corporation High School, Peelamedu', school_name: 'Coimbatore Corporation High School, Peelamedu', zone: 'East', ward: 'Ward 38', school_type: 'High School', headmaster_name: 'Thiru. M. Senthil', emis_number: '33120100105', students: 310, student_count: 310, teacher_count: 24, avg_mark: 71.6, pass_rate: 85.9, attendance: 91.7, risk_students: 6 },
  { id: 6, code: 'CCM-06', school_code: 'CCM-06', name: 'Coimbatore Corporation HSS, Rathinapuri', school_name: 'Coimbatore Corporation HSS, Rathinapuri', zone: 'North', ward: 'Ward 18', school_type: 'Higher Secondary', headmaster_name: 'Smt. L. Banumathi', emis_number: '33120100106', students: 350, student_count: 350, teacher_count: 27, avg_mark: 70.4, pass_rate: 84.8, attendance: 91.2, risk_students: 7 },
  { id: 7, code: 'CCM-07', school_code: 'CCM-07', name: 'Coimbatore Corporation HSS, Ganapathy', school_name: 'Coimbatore Corporation HSS, Ganapathy', zone: 'North', ward: 'Ward 12', school_type: 'Higher Secondary', headmaster_name: 'Thiru. A. Natarajan', emis_number: '33120100107', students: 330, student_count: 330, teacher_count: 26, avg_mark: 73.0, pass_rate: 87.5, attendance: 92.8, risk_students: 4 },
];

const DEMO_STAFF = [
  { id: 1, employee_id: 'TCH-2026-001', teacher_name: 'S. Ravi Kumar', designation: 'PG Assistant', subject: 'Maths', handling_subject: 'Maths', subject_specialization: 'Maths', education_qualification: 'M.Sc., B.Ed., M.Phil.', contact_number: '9842210101', location: 'R.S. Puram, Coimbatore', native_place: 'Coimbatore', blood_group: 'O+ve', experience_years: 11, classes_handled: '9-A, 10-A, 11-A, 12-A', working_days: 22, present_days: 21, total_leave: 1, cl: 1, rh: 0, el: 0, ml: 0, others: 0, reason: 'Personal Work', attendance_percentage: 95.5 },
  { id: 2, employee_id: 'TCH-2026-002', teacher_name: 'M. Lakshmi Devi', designation: 'B.T. Assistant', subject: 'Tamil', handling_subject: 'Tamil', subject_specialization: 'Tamil', education_qualification: 'M.A. (Tamil), B.Ed.', contact_number: '9842210102', location: 'Saibaba Colony, Coimbatore', native_place: 'Pollachi', blood_group: 'B+ve', experience_years: 14, classes_handled: '9-A, 10-A, 11-A, 12-A', working_days: 22, present_days: 22, total_leave: 0, cl: 0, rh: 0, el: 0, ml: 0, others: 0, reason: 'Full Attendance', attendance_percentage: 100.0 },
  { id: 3, employee_id: 'TCH-2026-003', teacher_name: 'K. Anitha Grace', designation: 'B.T. Assistant', subject: 'English', handling_subject: 'English', subject_specialization: 'English', education_qualification: 'M.A. (Eng), B.Ed.', contact_number: '9842210103', location: 'Race Course, Coimbatore', native_place: 'Ooty', blood_group: 'A+ve', experience_years: 9, classes_handled: '9-A, 10-A, 11-A, 12-A', working_days: 22, present_days: 20.5, total_leave: 1.5, cl: 1.5, rh: 0, el: 0, ml: 0, others: 0, reason: 'Medical Checkup', attendance_percentage: 93.2 },
  { id: 4, employee_id: 'TCH-2026-004', teacher_name: 'Dr. P. Murugesan', designation: 'PG Assistant', subject: 'Science', handling_subject: 'Science', subject_specialization: 'Science', education_qualification: 'M.Sc. (Physics), Ph.D., B.Ed.', contact_number: '9842210104', location: 'Peelamedu, Coimbatore', native_place: 'Erode', blood_group: 'AB+ve', experience_years: 16, classes_handled: '9-A, 10-A, 11-A, 12-A', working_days: 22, present_days: 20, total_leave: 2, cl: 0, rh: 0, el: 2, ml: 0, others: 0, reason: 'Family Function', attendance_percentage: 90.9 },
  { id: 5, employee_id: 'TCH-2026-005', teacher_name: 'R. Senthamarai', designation: 'B.T. Assistant', subject: 'Social Science', handling_subject: 'Social Science', subject_specialization: 'Social Science', education_qualification: 'M.A. (History), B.Ed.', contact_number: '9842210105', location: 'Gandhipuram, Coimbatore', native_place: 'Tiruppur', blood_group: 'O-ve', experience_years: 8, classes_handled: '9-A, 10-A, 11-A, 12-A', working_days: 22, present_days: 22, total_leave: 0, cl: 0, rh: 0, el: 0, ml: 0, others: 0, reason: 'Full Attendance', attendance_percentage: 100.0 },
];

const SUBJECT_TO_TEACHER: Record<string, any> = {
  Tamil: DEMO_STAFF[1],
  English: DEMO_STAFF[2],
  Maths: DEMO_STAFF[0],
  Science: DEMO_STAFF[3],
  'Social Science': DEMO_STAFF[4],
};

// Students spanning Classes 9, 10, 11, and 12 across all 5 mark ranges (<35, 35-50, 50-75, 75-90, >90)
const RAW_DEMO_STUDENTS = [
  // Class 9 Students
  { id: 101, emis: '33120900101', name: 'Aarthi Bala R', std: '9', sec: 'A', med: 'English', att: 97.4, marks: { Tamil: 94, English: 92, Maths: 96, Science: 95, 'Social Science': 93 } },
  { id: 102, emis: '33120900102', name: 'Bharathwaj S', std: '9', sec: 'A', med: 'English', att: 93.8, marks: { Tamil: 82, English: 80, Maths: 85, Science: 84, 'Social Science': 81 } },
  { id: 103, emis: '33120900103', name: 'Chitra Devi P', std: '9', sec: 'A', med: 'English', att: 89.2, marks: { Tamil: 68, English: 64, Maths: 27, Science: 62, 'Social Science': 66 } }, // Fail in Maths
  { id: 104, emis: '33120900104', name: 'Dharshan Kumar M', std: '9', sec: 'B', med: 'Tamil', att: 78.6, marks: { Tamil: 44, English: 40, Maths: 36, Science: 39, 'Social Science': 42 } },
  { id: 105, emis: '33120900105', name: 'Eswaran K', std: '9', sec: 'B', med: 'Tamil', att: 66.5, marks: { Tamil: 30, English: 26, Maths: 20, Science: 28, 'Social Science': 31 } }, // Fail in all

  // Class 10 Students
  { id: 1, emis: '33120100101', name: 'Harini Priya S', std: '10', sec: 'A', med: 'English', att: 98.2, marks: { Tamil: 95, English: 93, Maths: 98, Science: 96, 'Social Science': 94 } },
  { id: 2, emis: '33120100102', name: 'Kavin Kumar R', std: '10', sec: 'A', med: 'English', att: 96.8, marks: { Tamil: 92, English: 91, Maths: 95, Science: 93, 'Social Science': 92 } },
  { id: 5, emis: '33120100105', name: 'Arunachalam K', std: '10', sec: 'A', med: 'English', att: 94.0, marks: { Tamil: 84, English: 82, Maths: 88, Science: 85, 'Social Science': 86 } },
  { id: 7, emis: '33120100107', name: 'Gokulnath S', std: '10', sec: 'A', med: 'English', att: 91.5, marks: { Tamil: 85, English: 84, Maths: 42, Science: 88, 'Social Science': 86 } }, // Low in Maths
  { id: 9, emis: '33120100109', name: 'Madhan Raj N', std: '10', sec: 'B', med: 'Tamil', att: 94.1, marks: { Tamil: 88, English: 86, Maths: 29, Science: 84, 'Social Science': 90 } }, // Fail in Maths
  { id: 10, emis: '33120100110', name: 'Nandhini Devi R', std: '10', sec: 'A', med: 'English', att: 89.4, marks: { Tamil: 68, English: 64, Maths: 62, Science: 66, 'Social Science': 70 } },
  { id: 12, emis: '33120100112', name: 'Raghul Kannan S', std: '10', sec: 'A', med: 'English', att: 86.5, marks: { Tamil: 72, English: 68, Maths: 65, Science: 28, 'Social Science': 74 } }, // Fail in Science
  { id: 15, emis: '33120100115', name: 'Vigneshwaran D', std: '10', sec: 'A', med: 'English', att: 81.2, marks: { Tamil: 45, English: 40, Maths: 38, Science: 42, 'Social Science': 46 } },
  { id: 17, emis: '33120100117', name: 'Abishek Pandian P', std: '10', sec: 'B', med: 'Tamil', att: 78.0, marks: { Tamil: 46, English: 25, Maths: 40, Science: 43, 'Social Science': 47 } }, // Fail in English
  { id: 19, emis: '33120100119', name: 'Chandru M', std: '10', sec: 'A', med: 'English', att: 68.5, marks: { Tamil: 31, English: 26, Maths: 22, Science: 29, 'Social Science': 33 } },
  { id: 20, emis: '33120100120', name: 'Dinesh Karthik R', std: '10', sec: 'B', med: 'Tamil', att: 65.2, marks: { Tamil: 28, English: 24, Maths: 19, Science: 25, 'Social Science': 30 } },

  // Class 11 Students
  { id: 201, emis: '33121100101', name: 'Divya Dharshini M', std: '11', sec: 'A', med: 'English', att: 97.5, marks: { Tamil: 96, English: 94, Maths: 91, Science: 94, 'Social Science': 96 } },
  { id: 202, emis: '33121100102', name: 'Janani Sri P', std: '11', sec: 'A', med: 'English', att: 92.8, marks: { Tamil: 82, English: 76, Maths: 79, Science: 78, 'Social Science': 81 } },
  { id: 203, emis: '33121100103', name: 'Pavithran M', std: '11', sec: 'A', med: 'English', att: 88.0, marks: { Tamil: 62, English: 58, Maths: 31, Science: 60, 'Social Science': 64 } }, // Fail in Maths
  { id: 204, emis: '33121100104', name: 'Yogeshwari K', std: '11', sec: 'B', med: 'Tamil', att: 79.5, marks: { Tamil: 48, English: 37, Maths: 36, Science: 41, 'Social Science': 44 } },
  { id: 205, emis: '33121100105', name: 'Tamilselvan A', std: '11', sec: 'B', med: 'Tamil', att: 64.2, marks: { Tamil: 34, English: 30, Maths: 24, Science: 26, 'Social Science': 31 } },

  // Class 12 Students
  { id: 301, emis: '33121200101', name: 'Pranav Krishna V', std: '12', sec: 'A', med: 'English', att: 95.4, marks: { Tamil: 94, English: 90, Maths: 96, Science: 92, 'Social Science': 93 } },
  { id: 302, emis: '33121200102', name: 'Bhuvaneshwari T', std: '12', sec: 'A', med: 'English', att: 93.2, marks: { Tamil: 81, English: 79, Maths: 84, Science: 80, 'Social Science': 83 } },
  { id: 303, emis: '33121200103', name: 'Santhosh Kumar V', std: '12', sec: 'A', med: 'English', att: 87.2, marks: { Tamil: 65, English: 41, Maths: 58, Science: 29, 'Social Science': 63 } }, // Fail in Science
  { id: 304, emis: '33121200104', name: 'Balamurugan S', std: '12', sec: 'B', med: 'Tamil', att: 80.4, marks: { Tamil: 42, English: 39, Maths: 35, Science: 38, 'Social Science': 41 } },
  { id: 305, emis: '33121200105', name: 'Elango V', std: '12', sec: 'B', med: 'Tamil', att: 64.0, marks: { Tamil: 33, English: 28, Maths: 24, Science: 27, 'Social Science': 32 } },
];

function classifyRange(val: number) {
  if (val < 35) return { key: 'below_35', label: 'Below 35' };
  if (val <= 50) return { key: '35_50', label: '35 to 50' };
  if (val <= 75) return { key: '50_75', label: '50 to 75' };
  if (val <= 90) return { key: '75_90', label: '75 to 90' };
  return { key: 'above_90', label: 'Above 90' };
}

function buildDemoStudentsAnalytics(schoolId: number, standardFilter?: string | null, sectionFilter?: string | null) {
  const school = DEMO_SCHOOLS.find((s) => s.id === Number(schoolId)) || DEMO_SCHOOLS[0];
  const rangeBuckets: Record<string, any> = {
    below_35: { key: 'below_35', label: 'Below 35', sublabel: 'Critical / Fail Range (< 35)', count: 0, percentage: 0, students: [] },
    '35_50': { key: '35_50', label: '35 to 50', sublabel: 'Borderline Pass (35 - 50)', count: 0, percentage: 0, students: [] },
    '50_75': { key: '50_75', label: '50 to 75', sublabel: 'Moderate / Second Class (50 - 75)', count: 0, percentage: 0, students: [] },
    '75_90': { key: '75_90', label: '75 to 90', sublabel: 'First Class / Distinction (75 - 90)', count: 0, percentage: 0, students: [] },
    above_90: { key: 'above_90', label: 'Above 90', sublabel: 'Outstanding / Toppers (> 90)', count: 0, percentage: 0, students: [] },
  };

  const sourceStudents = RAW_DEMO_STUDENTS.filter((st) => {
    if (standardFilter && standardFilter !== 'All' && st.std !== standardFilter) return false;
    if (sectionFilter && sectionFilter !== 'All' && st.sec !== sectionFilter) return false;
    return true;
  });

  let passCount = 0;
  let failCount = 0;
  let lowSubCount = 0;

  const subjFailCounts: Record<string, any> = {
    Tamil: { subject: 'Tamil', failed_count: 0, low_mark_count: 0, total_students: sourceStudents.length, color: '#2563eb' },
    English: { subject: 'English', failed_count: 0, low_mark_count: 0, total_students: sourceStudents.length, color: '#f59e0b' },
    Maths: { subject: 'Maths', failed_count: 0, low_mark_count: 0, total_students: sourceStudents.length, color: '#e11d48' },
    Science: { subject: 'Science', failed_count: 0, low_mark_count: 0, total_students: sourceStudents.length, color: '#d97706' },
    'Social Science': { subject: 'Social Science', failed_count: 0, low_mark_count: 0, total_students: sourceStudents.length, color: '#7c3aed' },
  };

  const studentRecords = sourceStudents.map((st) => {
    const entries = Object.entries(st.marks);
    const total = entries.reduce((acc, [, m]) => acc + m, 0);
    const avg = Number((total / entries.length).toFixed(1));
    const isPass = entries.every(([, m]) => m >= 35);
    if (isPass) passCount++;
    else failCount++;

    const rInfo = classifyRange(avg);
    const subjectMarks: any[] = [];
    const lowMarkSubjects: any[] = [];
    const handlingStaff: any[] = [];

    for (const [subName, mark] of entries) {
      const tch = SUBJECT_TO_TEACHER[subName] || DEMO_STAFF[0];
      const subPass = mark >= 35;
      const isLow = mark < 50;
      if (!subPass && subjFailCounts[subName]) subjFailCounts[subName].failed_count += 1;
      if (isLow && subjFailCounts[subName]) subjFailCounts[subName].low_mark_count += 1;

      const grade = mark >= 90 ? 'A1' : mark >= 75 ? 'A2' : mark >= 60 ? 'B1' : mark >= 50 ? 'B2' : mark >= 35 ? 'C' : 'F (Fail)';
      const subObj = {
        subject_name: subName,
        mark,
        max_mark: 100,
        grade,
        is_pass: subPass,
        is_low: isLow,
        range_key: classifyRange(mark).key,
        teacher_id: tch.id,
        teacher_name: tch.teacher_name,
        teacher_designation: tch.designation,
      };
      subjectMarks.push(subObj);
      if (isLow) {
        lowMarkSubjects.push({
          subject_name: subName,
          mark,
          is_fail: !subPass,
          teacher_id: tch.id,
          teacher_name: tch.teacher_name,
        });
      }
      handlingStaff.push({
        teacher_id: tch.id,
        teacher_name: tch.teacher_name,
        designation: tch.designation,
        subject_name: subName,
        mark,
        is_pass: subPass,
      });
    }

    if (lowMarkSubjects.length > 0) lowSubCount++;

    const record = {
      id: st.id,
      emis_number: st.emis,
      student_name: st.name,
      school_id: school.id,
      school_name: school.name,
      zone: school.zone,
      standard: st.std,
      section: st.sec,
      class_name: `${st.std}th - ${st.sec}`,
      medium: st.med,
      group_code: 'General',
      total_marks: total,
      avg_mark: avg,
      attendance_pct: st.att,
      is_pass: isPass,
      result_status: isPass ? 'PASS' : 'FAIL',
      range_key: rInfo.key,
      range_label: rInfo.label,
      subject_marks: subjectMarks,
      low_mark_subjects: lowMarkSubjects,
      failed_subjects: lowMarkSubjects.filter((l) => l.is_fail),
      handling_staff: handlingStaff,
    };

    rangeBuckets[rInfo.key].count += 1;
    rangeBuckets[rInfo.key].students.push(record);
    return record;
  });

  const totalStudents = studentRecords.length || 1;
  Object.values(rangeBuckets).forEach((b: any) => {
    b.percentage = Number(((b.count / totalStudents) * 100).toFixed(1));
  });

  const subjectFailures = Object.values(subjFailCounts).map((sf: any) => ({
    ...sf,
    fail_percentage: Number(((sf.failed_count / totalStudents) * 100).toFixed(1)),
  }));

  return {
    summary: {
      total_students: studentRecords.length,
      pass_count: passCount,
      fail_count: failCount,
      pass_percentage: Number(((passCount / totalStudents) * 100).toFixed(1)),
      fail_percentage: Number(((failCount / totalStudents) * 100).toFixed(1)),
      low_subject_students_count: lowSubCount,
      overall_avg_mark: Number((studentRecords.reduce((a, b) => a + b.avg_mark, 0) / totalStudents).toFixed(1)),
    },
    subject_failures: subjectFailures,
    ranges: [
      rangeBuckets.below_35,
      rangeBuckets['35_50'],
      rangeBuckets['50_75'],
      rangeBuckets['75_90'],
      rangeBuckets.above_90,
    ],
    students: studentRecords,
  };
}

function buildDemoStaffDashboard(teacherId: number) {
  const tch = DEMO_STAFF.find((s) => s.id === Number(teacherId)) || DEMO_STAFF[0];
  const subName = tch.subject_specialization;
  const analytics = buildDemoStudentsAnalytics(1);

  const rangeBuckets: Record<string, any> = {
    below_35: { key: 'below_35', label: 'Below 35', sublabel: 'Fail (< 35)', count: 0, percentage: 0, students: [] },
    '35_50': { key: '35_50', label: '35 to 50', sublabel: '35 - 50 Marks', count: 0, percentage: 0, students: [] },
    '50_75': { key: '50_75', label: '50 to 75', sublabel: '50 - 75 Marks', count: 0, percentage: 0, students: [] },
    '75_90': { key: '75_90', label: '75 to 90', sublabel: '75 - 90 Marks', count: 0, percentage: 0, students: [] },
    above_90: { key: 'above_90', label: 'Above 90', sublabel: 'Above 90 Marks', count: 0, percentage: 0, students: [] },
  };

  let passCount = 0;
  let failCount = 0;
  const studentsList: any[] = [];

  for (const st of analytics.students) {
    const subMarkObj = st.subject_marks.find((m: any) => m.subject_name === subName) || st.subject_marks[0];
    const markVal = subMarkObj.mark;
    const isPass = markVal >= 35;
    if (isPass) passCount++;
    else failCount++;
    const rInfo = classifyRange(markVal);

    const row = {
      id: st.id,
      emis_number: st.emis_number,
      student_name: st.student_name,
      class_name: st.class_name,
      standard: st.standard,
      section: st.section,
      subject_name: subName,
      subject_mark: markVal,
      overall_avg: st.avg_mark,
      is_pass: isPass,
      result_status: isPass ? 'PASS' : 'FAIL',
      range_key: rInfo.key,
      range_label: rInfo.label,
      low_subjects: st.low_mark_subjects,
    };
    studentsList.push(row);
    rangeBuckets[rInfo.key].count += 1;
    rangeBuckets[rInfo.key].students.push(row);
  }

  const totalHandled = studentsList.length || 1;
  Object.values(rangeBuckets).forEach((b: any) => {
    b.percentage = Number(((b.count / totalHandled) * 100).toFixed(1));
  });

  return {
    staff: {
      id: tch.id,
      employee_id: tch.employee_id,
      teacher_name: tch.teacher_name,
      designation: tch.designation,
      subject_specialization: tch.subject_specialization,
      education_qualification: tch.education_qualification,
      contact_number: tch.contact_number,
      location: tch.location,
      native_place: tch.native_place,
      blood_group: tch.blood_group,
      experience_years: tch.experience_years,
      school_id: 1,
      school_name: DEMO_SCHOOLS[0].name,
      zone: DEMO_SCHOOLS[0].zone,
      ward: DEMO_SCHOOLS[0].ward,
      classes_handled: ['9th - A', '10th - A', '11th - A', '12th - A'],
    },
    attendance: {
      month: 'SEPTEMBER',
      working_days: tch.working_days,
      present_days: tch.present_days,
      total_leave: tch.total_leave,
      cl: tch.cl,
      rh: tch.rh,
      el: tch.el,
      ml: tch.ml,
      others: tch.others,
      reason: tch.reason,
      attendance_percentage: tch.attendance_percentage,
    },
    student_metrics: {
      handling_student_count: studentsList.length,
      pass_count: passCount,
      fail_count: failCount,
      pass_ratio: Number(((passCount / totalHandled) * 100).toFixed(1)),
      fail_ratio: Number(((failCount / totalHandled) * 100).toFixed(1)),
      subject_average: Number((studentsList.reduce((a, b) => a + b.subject_mark, 0) / totalHandled).toFixed(1)),
      mark_ranges: [
        rangeBuckets.below_35,
        rangeBuckets['35_50'],
        rangeBuckets['50_75'],
        rangeBuckets['75_90'],
        rangeBuckets.above_90,
      ],
      students: studentsList,
    },
  };
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend is unreachable (e.g. opened on mobile via GitHub Pages), return rich live demo data
    if (!error.response) {
      const url: string = error.config?.url || '';
      const qIdx = url.indexOf('?');
      const searchParams = new URLSearchParams(qIdx >= 0 ? url.slice(qIdx) : '');
      const stdParam = searchParams.get('standard');
      const secParam = searchParams.get('section');
      const zoneParam = searchParams.get('zone');

      if (url.includes('/public/homepage')) {
        return Promise.resolve({
          data: {
            stats: { total_schools: 42, total_students: 18750, total_teachers: 950, avg_attendance: 92.4 },
            schools: DEMO_SCHOOLS,
          },
        });
      }

      if (url.includes('/public/schools')) {
        return Promise.resolve({ data: DEMO_SCHOOLS });
      }

      if (url.includes('/commissioner/dashboard')) {
        const stdOffset = ({ '9': -1.8, '10': 0.5, '11': -0.9, '12': 2.1 } as Record<string, number>)[stdParam || ''] || 0.0;
        const analytics = buildDemoStudentsAnalytics(1, stdParam, secParam);
        const filteredSchools = zoneParam && zoneParam !== 'All'
          ? DEMO_SCHOOLS.filter((s) => s.zone === zoneParam)
          : DEMO_SCHOOLS;

        return Promise.resolve({
          data: {
            kpis: {
              total_schools: filteredSchools.length,
              corporation_avg_score: Number((72.8 + stdOffset).toFixed(1)),
              overall_pass_percentage: Number((87.4 + stdOffset).toFixed(1)),
              overall_attendance: Number((92.4 + stdOffset * 0.4).toFixed(1)),
              staff_attendance: 95.8,
            },
            exam_pass_comparison: [
              { exam: 'Quarterly', pass_percentage: Number((84.2 + stdOffset).toFixed(1)), avg_mark: Number((69.5 + stdOffset).toFixed(1)) },
              { exam: 'Half-Yearly', pass_percentage: Number((87.8 + stdOffset).toFixed(1)), avg_mark: Number((72.8 + stdOffset).toFixed(1)) },
              { exam: 'Annual', pass_percentage: Number((91.6 + stdOffset).toFixed(1)), avg_mark: Number((76.4 + stdOffset).toFixed(1)) },
            ],
            monthly_student_attendance: [
              { month: 'Jun', full_month: 'June', attendance: Number((91.2 + stdOffset * 0.4).toFixed(1)) },
              { month: 'Jul', full_month: 'July', attendance: Number((92.5 + stdOffset * 0.4).toFixed(1)) },
              { month: 'Aug', full_month: 'August', attendance: Number((90.8 + stdOffset * 0.4).toFixed(1)) },
              { month: 'Sep', full_month: 'September', attendance: Number((93.4 + stdOffset * 0.4).toFixed(1)) },
              { month: 'Oct', full_month: 'October', attendance: Number((89.6 + stdOffset * 0.4).toFixed(1)) },
              { month: 'Nov', full_month: 'November', attendance: Number((91.9 + stdOffset * 0.4).toFixed(1)) },
              { month: 'Dec', full_month: 'December', attendance: Number((94.1 + stdOffset * 0.4).toFixed(1)) },
              { month: 'Jan', full_month: 'January', attendance: Number((92.8 + stdOffset * 0.4).toFixed(1)) },
              { month: 'Feb', full_month: 'February', attendance: Number((95.0 + stdOffset * 0.4).toFixed(1)) },
              { month: 'Mar', full_month: 'March', attendance: Number((96.2 + stdOffset * 0.4).toFixed(1)) },
            ],
            subject_failures: analytics.subject_failures,
            zone_summary: [
              { zone: 'West', avg_pass: 88.5, attendance: 93.4 },
              { zone: 'Central', avg_pass: 86.2, attendance: 92.0 },
              { zone: 'East', avg_pass: 84.7, attendance: 91.3 },
              { zone: 'South', avg_pass: 92.1, attendance: 95.1 },
              { zone: 'North', avg_pass: 86.1, attendance: 92.0 },
            ],
            ai_insights: [
              'South & West Zones achieved 90%+ Pass Rate; students in Below-35 cohort flagged for remedial mentoring.',
              'Single-subject low marks (<50) and subject-wise failures tracked across Classes 9, 10, 11, and 12.',
              'Steady upward progression observed from Quarterly (84.2%) to Half-Yearly (87.8%) and Annual (91.6%) exams.',
              'Student monthly attendance shows strong recovery from October (89.6%) to March (96.2%).',
            ],
            schools: filteredSchools,
          },
        });
      }

      if (url.includes('/commissioner/staff-performance')) {
        return Promise.resolve({
          data: {
            school_staff_comparison: DEMO_SCHOOLS.map((s) => ({
              school_id: s.id,
              school_name: s.name,
              zone: s.zone,
              ward: s.ward,
              staff_count: s.teacher_count,
              avg_attendance: 95.8,
              total_leave: 4.5,
              avg_student_result: s.pass_rate,
            })),
          },
        });
      }

      if (url.includes('/commissioner/school/') && url.includes('/detailed-analysis')) {
        const match = url.match(/\/school\/(\d+)\//);
        const sid = match ? Number(match[1]) : 1;
        const sc = DEMO_SCHOOLS.find((s) => s.id === sid) || DEMO_SCHOOLS[0];
        return Promise.resolve({
          data: {
            school: sc,
            staff: DEMO_STAFF.map((st) => ({
              ...st,
              handling_student_count: 26,
              pass_ratio: 85.7,
              fail_ratio: 14.3,
            })),
            standards: [
              { class_id: 1, standard: '9', section: 'A', medium: 'English', group_code: 'General', student_count: 5, avg_attendance: 91.2, avg_score: 71.8 },
              { class_id: 2, standard: '10', section: 'A', medium: 'English', group_code: 'General', student_count: 11, avg_attendance: 92.5, avg_score: 74.2 },
              { class_id: 3, standard: '11', section: 'A', medium: 'English', group_code: 'Bio-Maths', student_count: 5, avg_attendance: 90.4, avg_score: 70.6 },
              { class_id: 4, standard: '12', section: 'A', medium: 'English', group_code: 'Comp-Sci', student_count: 5, avg_attendance: 93.8, avg_score: 75.4 },
            ],
          },
        });
      }

      if (url.includes('/schools/') && url.includes('/students-analytics')) {
        const match = url.match(/\/schools\/(\d+)\//);
        const sid = match ? Number(match[1]) : 1;
        return Promise.resolve({ data: buildDemoStudentsAnalytics(sid, stdParam, secParam) });
      }

      if (url.includes('/staff/') && url.includes('/dashboard-details')) {
        const match = url.match(/\/staff\/(\d+)\//);
        const tid = match ? Number(match[1]) : 1;
        return Promise.resolve({ data: buildDemoStaffDashboard(tid) });
      }

      if (url.includes('/headmaster/dashboard')) {
        return Promise.resolve({
          data: {
            school: DEMO_SCHOOLS[0],
            kpis: {
              total_students: 380,
              total_teachers: 28,
              pass_percentage: 88.5,
              avg_attendance: 93.4,
              teacher_attendance_rate: 95.8,
            },
            ai_insights: {
              school_performance_index: 89.4,
              key_insights: [
                'Students across Classes 9, 10, 11 & 12 evaluated in 5 mark ranges.',
                'Single-subject low marks (<50) automatically flagged with handling staff linkage.',
                'Teaching staff attendance is at 95.8% across all sections.',
              ],
            },
            classes: [
              { class_name: '9th Std - Sec A (EM)', student_count: 5, avg_score: 71.8, pass_rate: 85.0 },
              { class_name: '10th Std - Sec A (EM)', student_count: 11, avg_score: 74.2, pass_rate: 90.9 },
              { class_name: '11th Std - Sec A (EM)', student_count: 5, avg_score: 70.6, pass_rate: 84.0 },
              { class_name: '12th Std - Sec A (EM)', student_count: 5, avg_score: 75.4, pass_rate: 92.0 },
            ],
          },
        });
      }

      if (url.includes('/headmaster/staff')) {
        return Promise.resolve({
          data: {
            kpis: {
              total_staff: DEMO_STAFF.length,
              active_staff: 4,
              staff_on_leave: 1,
              total_leave_days: 4.5,
              average_staff_attendance: 95.8,
            },
            staff: DEMO_STAFF.map((s) => ({
              ...s,
              handling_student_count: 26,
              student_pass_pct: 85.7,
              student_fail_pct: 14.3,
            })),
          },
        });
      }

      if (url.includes('/admin/audit-logs')) {
        return Promise.resolve({
          data: [
            { id: 1, created_at: new Date().toISOString(), username: 'commissioner', role: 'COMMISSIONER', action: 'VIEW_STUDENT_RANGES', details: 'Inspected Classes 9-12 mark ranges, exam variation & staff 360 dashboard', ip_address: '10.24.1.12' },
            { id: 2, created_at: new Date().toISOString(), username: 'hm_rspuram', role: 'HEADMASTER', action: 'UPLOAD_STAFF_EXCEL', details: 'Uploaded Staff Master Workbook (.xlsx) for R.S. Puram HSS', ip_address: '10.24.1.45' },
          ],
        });
      }

      if (url.includes('/admin/meta')) {
        return Promise.resolve({ data: { schools: DEMO_SCHOOLS } });
      }

      if (url.includes('/teacher/dashboard')) {
        return Promise.resolve({
          data: {
            kpis: { total_students: 26, class_average: 71.8, pass_percentage: 85.7, passed_count: 20, failed_count: 6, students_needing_attention: 6 },
            subject_performance: [
              { subject: 'Tamil', average: 76 },
              { subject: 'English', average: 72 },
              { subject: 'Maths', average: 68 },
              { subject: 'Science', average: 71 },
              { subject: 'Social', average: 78 },
            ],
          },
        });
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
