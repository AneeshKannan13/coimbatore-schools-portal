import os
import re
import json
import openpyxl
from datetime import datetime

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from app.models.entities import (
    School, User, Teacher, SchoolClass, Subject, TeacherSubjectAllocation,
    Student, Examination, StudentMark, StudentAttendance, TeacherAttendance,
    UserRole
)
from app.security.auth import get_password_hash
from seeds.seed_data import ensure_schema_columns

DATA_DIR = r"C:/Users/Aneesh/.gemini/antigravity/brain/aee4a868-5388-470e-a5f0-917c894d34d3/scratch/school_data"
FRONTEND_JSON_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend/src/realSchoolData.json'))


def parse_mark_val(v):
    if v is None:
        return 0.0, True
    s = str(v).strip().upper()
    if s in ["", "A", "AB", "ABSENT", "E", "--", "NIL", "NONE", "NAN"]:
        return 0.0, True
    # Remove any non-numeric characters except decimal
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    if m:
        return float(m.group(1)), False
    return 0.0, True


def clean_name(v):
    if v is None:
        return ""
    s = str(v).strip()
    s = re.sub(r"\s+", " ", s)
    return s


def norm_key(name):
    return re.sub(r"[^A-Z0-9]", "", str(name).upper())


def canonical_subject(raw_subj):
    s = str(raw_subj or "").strip().upper()
    if any(k in s for k in ["TAM", "LANG"]):
        return "Tamil"
    if "ENG" in s:
        return "English"
    if "STAT" in s and "MATH" not in s:
        return "Statistics"
    if "MAT" in s:
        return "Maths"
    if "PHY" in s:
        return "Physics"
    if "CHE" in s:
        return "Chemistry"
    if "BIO" in s:
        return "Biology"
    if any(k in s for k in ["COMP. APP", "C.APP", "CA", "COMPUTER APPLICATION"]):
        return "Computer Applications"
    if any(k in s for k in ["COMP", "C.SCI", "CS"]):
        return "Computer Science"
    if "ACC" in s:
        return "Accountancy"
    if "COMM" in s:
        return "Commerce"
    if "ECO" in s:
        return "Economics"
    if "GEO" in s:
        return "Geography"
    if "HIS" in s:
        return "History"
    if "SOC" in s:
        return "Social Science"
    if "SCI" in s:
        return "Science"
    return raw_subj.title() if raw_subj else "General"


def calculate_grade(mark):
    if mark < 35:
        return "F (Fail)"
    if mark >= 90:
        return "A1"
    if mark >= 80:
        return "A2"
    if mark >= 70:
        return "B1"
    if mark >= 60:
        return "B2"
    if mark >= 50:
        return "C1"
    return "C2"


def parse_all_excel_data():
    # Define the 4 real schools
    schools_meta = {
        "ANUPPARPALAYAM": {
            "id": 1,
            "code": "33120101505",
            "name": "Corporation High School, Anupparpalayam",
            "short_name": "CHS ANUPPARPALAYAM",
            "udise": "33120101505",
            "zone": "Central",
            "ward": "Ward 34 - Anupparpalayam",
            "school_type": "High School",
            "hm_name": "Headmaster (CHS Anupparpalayam)",
            "hm_username": "hm_anupparpalayam",
        },
        "RAMANATHAPURAM": {
            "id": 2,
            "code": "33120102201",
            "name": "Corporation Higher Secondary School, Ramanathapuram",
            "short_name": "CHSS RAMANATHAPURAM",
            "udise": "33120102201",
            "zone": "Central",
            "ward": "Ward 62 - Ramanathapuram",
            "school_type": "Higher Secondary",
            "hm_name": "Thangam M (Incharge HM)",
            "hm_username": "hm_ramanathapuram",
        },
        "RATHINAPURI": {
            "id": 3,
            "code": "33120401402",
            "name": "Corporation Higher Secondary School, Rathinapuri",
            "short_name": "CHSS RATHINAPURI",
            "udise": "33120401402",
            "zone": "Central",
            "ward": "Ward 18 - Rathinapuri",
            "school_type": "Higher Secondary",
            "hm_name": "Seethalakshmi D (HM)",
            "hm_username": "hm_rathinapuri",
        },
        "SELVAPURAM": {
            "id": 4,
            "code": "33120103104",
            "name": "Corporation Girls High School, Selvapuram",
            "short_name": "CGHS SELVAPURAM",
            "udise": "33120103104",
            "zone": "Central",
            "ward": "Ward 48 - Selvapuram",
            "school_type": "High School",
            "hm_name": "Headmistress (CGHS Selvapuram)",
            "hm_username": "hm_selvapuram",
        },
    }

    # 1. Parse Student Attendance files first so we can attach real June-Sept attendance to students
    student_attendance_lookup = {k: {} for k in schools_meta}

    att_files = [
        ("ANUPPARPALAYAM", "anuparpalayam student attendance.xlsx"),
        ("RAMANATHAPURAM", "ramanathapuram student attendance x & xii.xlsx"),
        ("RATHINAPURI", "rathinapuri student attendance.xlsx"),
        ("SELVAPURAM", "selvapuram ghs stu attendance.xlsx"),
    ]

    monthly_totals = {
        k: {"jun_p": 0.0, "jun_w": 0, "jul_p": 0.0, "jul_w": 0, "aug_p": 0.0, "aug_w": 0, "sep_p": 0.0, "sep_w": 0}
        for k in schools_meta
    }

    for skey, fname in att_files:
        fpath = os.path.join(DATA_DIR, fname)
        if not os.path.exists(fpath):
            continue
        wb = openpyxl.load_workbook(fpath, data_only=True)
        for sname in wb.sheetnames:
            ws = wb[sname]
            for r in range(2, ws.max_row + 1):
                st_name = clean_name(ws.cell(r, 6).value)
                if not st_name or st_name.upper() in ["NAME OF THE STUDENT", "NONE"]:
                    continue
                cls_raw = clean_name(ws.cell(r, 4).value).upper()
                med_raw = clean_name(ws.cell(r, 5).value).upper()
                sec_raw = clean_name(ws.cell(r, 7).value).upper()
                jun = parse_mark_val(ws.cell(r, 8).value)[0]
                jul = parse_mark_val(ws.cell(r, 9).value)[0]
                aug = parse_mark_val(ws.cell(r, 10).value)[0]
                sep = parse_mark_val(ws.cell(r, 11).value)[0]
                pres = parse_mark_val(ws.cell(r, 12).value)[0] or (jun + jul + aug + sep)
                work = parse_mark_val(ws.cell(r, 13).value)[0] or 79.0
                pct = parse_mark_val(ws.cell(r, 14).value)[0]
                if pct <= 0 and work > 0:
                    pct = round((pres / work) * 100, 1)
                else:
                    pct = round(pct, 1)

                if pres > 0:
                    monthly_totals[skey]["jun_p"] += jun
                    monthly_totals[skey]["jun_w"] += 18
                    monthly_totals[skey]["jul_p"] += jul
                    monthly_totals[skey]["jul_w"] += 23
                    monthly_totals[skey]["aug_p"] += aug
                    monthly_totals[skey]["aug_w"] += 20
                    monthly_totals[skey]["sep_p"] += sep
                    monthly_totals[skey]["sep_w"] += 18

                student_attendance_lookup[skey][norm_key(st_name)] = {
                    "june": jun,
                    "july": jul,
                    "aug": aug,
                    "sep": sep,
                    "present_days": pres,
                    "working_days": int(work),
                    "percentage": pct,
                    "medium": "Tamil Medium" if "TM" in med_raw else "English Medium",
                    "section": sec_raw,
                    "class": cls_raw,
                }

    # 2. Parse Teacher Attendance files
    teachers_by_school = {k: [] for k in schools_meta}
    teacher_files = [
        ("ANUPPARPALAYAM", "anuparpalayam teacher attendance.xlsx"),
        ("RAMANATHAPURAM", "ramanathapuram teacher attendance.xlsx"),
        ("RATHINAPURI", "rathinapuri teacher attendance.xlsx"),
        ("SELVAPURAM", "selvapuram ghs teacher attendance.xlsx"),
    ]

    for skey, fname in teacher_files:
        fpath = os.path.join(DATA_DIR, fname)
        if not os.path.exists(fpath):
            continue
        wb = openpyxl.load_workbook(fpath, data_only=True)
        seen_teachers = {}
        for sname in wb.sheetnames:
            ws = wb[sname]
            for r in range(2, ws.max_row + 1):
                t_name = clean_name(ws.cell(r, 4).value)
                if not t_name or t_name.upper() in ["TEACHER NAME", "NONE"]:
                    continue
                hm_col = clean_name(ws.cell(r, 5).value)
                subj_raw = clean_name(ws.cell(r, 6).value)
                cls_raw = clean_name(ws.cell(r, 7).value).upper()
                sec_raw = clean_name(ws.cell(r, 8).value).upper()
                cl = parse_mark_val(ws.cell(r, 9).value)[0]
                rh = parse_mark_val(ws.cell(r, 10).value)[0]
                el = parse_mark_val(ws.cell(r, 11).value)[0]
                ml = parse_mark_val(ws.cell(r, 12).value)[0]
                others = parse_mark_val(ws.cell(r, 13).value)[0]
                tot_col14 = parse_mark_val(ws.cell(r, 14).value)[0]
                tot_col15 = parse_mark_val(ws.cell(r, 15).value)[0]
                tot_leave = tot_col15 if tot_col15 > 0 else (tot_col14 if tot_col14 > 0 else (cl + rh + el + ml + others))
                reason = clean_name(ws.cell(r, 16).value) if ws.max_column >= 16 else ""
                if not reason or reason.upper() in ["NONE", "NIL"]:
                    reason = "Medical / Personal Leave" if ml > 0 else ("Casual Leave" if tot_leave > 0 else "Regular Duty")

                working_days = 79
                present_days = round(max(0.0, working_days - tot_leave), 1)
                att_pct = round((present_days / working_days) * 100, 1)

                std_handled = "12" if ("XII" in cls_raw or "12" in cls_raw or sname.lower() == "xii") else "10"
                desig = hm_col if hm_col else ("PG Assistant" if std_handled == "12" else "B.T. Assistant")
                canon_subj = canonical_subject(subj_raw) if subj_raw else "Administration"

                t_key = norm_key(t_name)
                if t_key in seen_teachers:
                    # Merge classes handled if same teacher appears in multiple rows
                    existing = seen_teachers[t_key]
                    if sec_raw and sec_raw not in existing["sections_raw"]:
                        existing["sections_raw"].append(sec_raw)
                    continue

                t_entry = {
                    "teacher_name": t_name,
                    "designation": desig,
                    "subject_raw": subj_raw or "Administration",
                    "subject_specialization": canon_subj,
                    "std_handled": std_handled,
                    "sections_raw": [sec_raw] if sec_raw else ["A", "B"],
                    "working_days": working_days,
                    "present_days": present_days,
                    "cl": cl,
                    "rh": rh,
                    "el": el,
                    "ml": ml,
                    "others": others,
                    "total_leave": round(tot_leave, 1),
                    "attendance_percentage": att_pct,
                    "reason": reason,
                    "location": f"{schools_meta[skey]['ward']}, Coimbatore",
                    "native_place": "Coimbatore",
                    "education_qualification": "M.Sc., B.Ed." if std_handled == "12" else "B.Sc., B.Ed.",
                    "blood_group": "O+ve",
                    "experience_years": 10,
                }
                seen_teachers[t_key] = t_entry
                teachers_by_school[skey].append(t_entry)

    # 3. Parse all Student Marks workbooks
    students_by_school = {k: [] for k in schools_meta}

    # Helper to add a parsed student
    def add_student(skey, std, sec, emis, name, marks_dict):
        name = clean_name(name)
        if not name or name.upper() in ["NAME", "STUDENT NAME", "STUDENTS NAME", "NAME OF THE STUDENT", "TOTAL", "AVERAGE", "PASS", "FAIL"]:
            return
        # Skip summary rows at the bottom of sheets
        if any(w in name.upper() for w in ["NO OF", "NUMBER OF", "PERCENTAGE", "SIGNATURE", "HEADMASTER", "CLASS TEACHER", "APPEARED", "PASSED", "FAILED"]):
            return
        # Filter out rows where name is just a number
        if re.match(r"^\d+$", name):
            return

        emis_str = clean_name(emis)
        if not emis_str or emis_str.upper() in ["NONE", "NAN", ""]:
            idx_num = len(students_by_school[skey]) + 1
            emis_str = f"{schools_meta[skey]['code'][-5:]}{std}{idx_num:04d}"
        else:
            emis_str = re.sub(r"\.0$", "", emis_str)

        att_info = student_attendance_lookup[skey].get(norm_key(name))
        att_pct = att_info["percentage"] if att_info else 91.5
        working_days = att_info["working_days"] if att_info else 79
        present_days = att_info["present_days"] if att_info else 72.0
        medium = att_info["medium"] if att_info else "English Medium"

        students_by_school[skey].append({
            "emis_number": emis_str,
            "student_name": name,
            "standard": str(std),
            "section": str(sec).upper().strip(),
            "medium": medium,
            "attendance_pct": att_pct,
            "working_days": working_days,
            "present_days": present_days,
            "marks": marks_dict,
        })

    # --- 3A. ANUPPARPALAYAM ---
    for fn, sec in [("annuparpalayam class 9 A.xlsx", "A"), ("annuparpalayam class 9 B.xlsx", "B")]:
        wb = openpyxl.load_workbook(os.path.join(DATA_DIR, fn), data_only=True)
        ws = wb.active
        for r in range(10, ws.max_row + 1):
            sno = ws.cell(r, 1).value
            emis = ws.cell(r, 2).value
            name = ws.cell(r, 3).value
            if not name:
                continue
            marks = {
                "Tamil": parse_mark_val(ws.cell(r, 4).value)[0],
                "English": parse_mark_val(ws.cell(r, 5).value)[0],
                "Maths": parse_mark_val(ws.cell(r, 6).value)[0],
                "Science": parse_mark_val(ws.cell(r, 7).value)[0],
                "Social Science": parse_mark_val(ws.cell(r, 8).value)[0],
            }
            add_student("ANUPPARPALAYAM", "9", sec, emis, name, marks)

    for fn, sec in [
        ("annuparpalayam Tenth Student Marks Register_export_1791539140817.xlsx", "A"),
        ("annuparpalayam Tenth Student Marks Register_export_1791539146816.xlsx", "B"),
    ]:
        wb = openpyxl.load_workbook(os.path.join(DATA_DIR, fn), data_only=True)
        ws = wb.active
        for r in range(10, ws.max_row + 1):
            name = ws.cell(r, 2).value
            if not name:
                continue
            sci_th = parse_mark_val(ws.cell(r, 6).value)[0]
            sci_pr = parse_mark_val(ws.cell(r, 7).value)[0]
            sci_tot = parse_mark_val(ws.cell(r, 8).value)[0] or (sci_th + sci_pr)
            marks = {
                "Tamil": parse_mark_val(ws.cell(r, 3).value)[0],
                "English": parse_mark_val(ws.cell(r, 4).value)[0],
                "Maths": parse_mark_val(ws.cell(r, 5).value)[0],
                "Science": sci_tot,
                "Social Science": parse_mark_val(ws.cell(r, 9).value)[0],
            }
            add_student("ANUPPARPALAYAM", "10", sec, None, name, marks)

    # --- 3B. RAMANATHAPURAM ---
    # 9th & 10th
    wb = openpyxl.load_workbook(os.path.join(DATA_DIR, "Ramanathapuram 9TH 10TH QUARTERLY EXAM 2026-27.xlsx"), data_only=True)
    for sname, sec in [("9A", "A"), ("9B", "B")]:
        ws = wb[sname]
        for r in range(2, ws.max_row + 1):
            emis = ws.cell(r, 2).value
            name = ws.cell(r, 3).value
            if not name:
                continue
            marks = {
                "Tamil": parse_mark_val(ws.cell(r, 4).value)[0],
                "English": parse_mark_val(ws.cell(r, 5).value)[0],
                "Maths": parse_mark_val(ws.cell(r, 6).value)[0],
                "Science": parse_mark_val(ws.cell(r, 7).value)[0],
                "Social Science": parse_mark_val(ws.cell(r, 8).value)[0],
            }
            add_student("RAMANATHAPURAM", "9", sec, emis, name, marks)

    for sname, sec in [("10A", "A"), ("10B", "B")]:
        ws = wb[sname]
        for r in range(3, ws.max_row + 1):
            name = ws.cell(r, 2).value
            if not name:
                continue
            sci_th = parse_mark_val(ws.cell(r, 6).value)[0]
            sci_pr = parse_mark_val(ws.cell(r, 7).value)[0]
            sci_tot = parse_mark_val(ws.cell(r, 8).value)[0] or (sci_th + sci_pr)
            marks = {
                "Tamil": parse_mark_val(ws.cell(r, 3).value)[0],
                "English": parse_mark_val(ws.cell(r, 4).value)[0],
                "Maths": parse_mark_val(ws.cell(r, 5).value)[0],
                "Science": sci_tot,
                "Social Science": parse_mark_val(ws.cell(r, 9).value)[0],
            }
            add_student("RAMANATHAPURAM", "10", sec, None, name, marks)

    # Ramanathapuram 11th
    wb = openpyxl.load_workbook(os.path.join(DATA_DIR, "Ramanathapuram 11TH QUARTERLY EXAMINATION  2026-27.xlsx"), data_only=True)
    for sname in wb.sheetnames:
        ws = wb[sname]
        sec = sname.replace("11", "").strip() or "A"
        # Find header row
        hdr_row = None
        for r in range(1, 12):
            row_vals = [str(ws.cell(r, c).value or "").upper() for c in range(1, 10)]
            if any("NAME" in x for x in row_vals) and any("TAM" in x for x in row_vals):
                hdr_row = r
                break
        if not hdr_row:
            continue
        headers = [clean_name(ws.cell(hdr_row, c).value) for c in range(1, 10)]
        for r in range(hdr_row + 1, ws.max_row + 1):
            name = ws.cell(r, 2).value
            if not name:
                continue
            marks = {}
            for c_idx in range(3, 9):
                if c_idx - 1 < len(headers) and headers[c_idx - 1]:
                    h = headers[c_idx - 1]
                    if "TOT" in h.upper():
                        continue
                    marks[canonical_subject(h)] = parse_mark_val(ws.cell(r, c_idx).value)[0]
            if marks:
                add_student("RAMANATHAPURAM", "11", sec, None, name, marks)

    # Ramanathapuram 12th
    wb = openpyxl.load_workbook(os.path.join(DATA_DIR, "Ramanathapuram 12TH QUARTERLY EXAMINATION  2026-27.xlsx"), data_only=True)
    for sname in wb.sheetnames:
        ws = wb[sname]
        sec = sname.replace("XII", "").replace("12", "").strip() or "A"
        if sname == "XIIB":
            # Row 2: ['STUDENTS NAME', None, 'TAMIL', 'ENGLISH', 'PHY', 'CHE', 'C.SCI', 'MATHS', 'TOTAL']
            for r in range(4, ws.max_row + 1):
                name = ws.cell(r, 2).value
                if not name:
                    continue
                marks = {
                    "Tamil": parse_mark_val(ws.cell(r, 3).value)[0],
                    "English": parse_mark_val(ws.cell(r, 4).value)[0],
                    "Physics": parse_mark_val(ws.cell(r, 5).value)[0],
                    "Chemistry": parse_mark_val(ws.cell(r, 6).value)[0],
                    "Computer Science": parse_mark_val(ws.cell(r, 7).value)[0],
                    "Maths": parse_mark_val(ws.cell(r, 8).value)[0],
                }
                add_student("RAMANATHAPURAM", "12", sec, None, name, marks)
        elif sname == "XIIC":
            # R3: ['S.No', 'Name', None, 'TAMIL ', 'ENG', 'ECO', 'COMM ', 'ACC', 'C.APP', 'Total']
            for r in range(4, ws.max_row + 1):
                n1 = clean_name(ws.cell(r, 2).value)
                n2 = clean_name(ws.cell(r, 3).value)
                name = f"{n1} {n2}".strip() if n2 and len(n2) <= 3 else n1
                if not name:
                    continue
                marks = {
                    "Tamil": parse_mark_val(ws.cell(r, 4).value)[0],
                    "English": parse_mark_val(ws.cell(r, 5).value)[0],
                    "Economics": parse_mark_val(ws.cell(r, 6).value)[0],
                    "Commerce": parse_mark_val(ws.cell(r, 7).value)[0],
                    "Accountancy": parse_mark_val(ws.cell(r, 8).value)[0],
                    "Computer Applications": parse_mark_val(ws.cell(r, 9).value)[0],
                }
                add_student("RAMANATHAPURAM", "12", sec, None, name, marks)
        else:
            hdr_row = 2 if sname == "XIIA1" else 3
            headers = [clean_name(ws.cell(hdr_row, c).value) for c in range(1, 10)]
            for r in range(hdr_row + 1, ws.max_row + 1):
                name = ws.cell(r, 2).value
                if not name:
                    continue
                marks = {}
                for c_idx in range(3, 9):
                    h = headers[c_idx - 1]
                    if h and "TOT" not in h.upper():
                        marks[canonical_subject(h)] = parse_mark_val(ws.cell(r, c_idx).value)[0]
                if marks:
                    add_student("RAMANATHAPURAM", "12", sec, None, name, marks)

    # --- 3C. RATHINAPURI ---
    # 9th
    wb = openpyxl.load_workbook(os.path.join(DATA_DIR, "Rathinapuri 9TH QUARTERLY MARK(2026-27).xlsx"), data_only=True)
    for sname in wb.sheetnames:
        ws = wb[sname]
        sec = sname.replace("9", "").strip() or "A"
        for r in range(10, ws.max_row + 1):
            emis = ws.cell(r, 2).value
            name = ws.cell(r, 3).value
            if not name:
                continue
            marks = {
                "Tamil": parse_mark_val(ws.cell(r, 4).value)[0],
                "English": parse_mark_val(ws.cell(r, 5).value)[0],
                "Maths": parse_mark_val(ws.cell(r, 6).value)[0],
                "Science": parse_mark_val(ws.cell(r, 7).value)[0],
                "Social Science": parse_mark_val(ws.cell(r, 8).value)[0],
            }
            add_student("RATHINAPURI", "9", sec, emis, name, marks)

    # 10th
    wb = openpyxl.load_workbook(os.path.join(DATA_DIR, "Rathinapuri 10TH QUARTERLY MARK(2026-27).xlsx"), data_only=True)
    for sname in wb.sheetnames:
        ws = wb[sname]
        sec = sname.replace("10", "").strip() or "A"
        for r in range(10, ws.max_row + 1):
            name = ws.cell(r, 2).value
            if not name:
                continue
            sci_th = parse_mark_val(ws.cell(r, 6).value)[0]
            sci_pr = parse_mark_val(ws.cell(r, 7).value)[0]
            sci_tot = parse_mark_val(ws.cell(r, 8).value)[0] or (sci_th + sci_pr)
            marks = {
                "Tamil": parse_mark_val(ws.cell(r, 3).value)[0],
                "English": parse_mark_val(ws.cell(r, 4).value)[0],
                "Maths": parse_mark_val(ws.cell(r, 5).value)[0],
                "Science": sci_tot,
                "Social Science": parse_mark_val(ws.cell(r, 9).value)[0],
            }
            add_student("RATHINAPURI", "10", sec, None, name, marks)

    # 11th
    wb = openpyxl.load_workbook(os.path.join(DATA_DIR, "Rathinapuri 11 TH QUATERLY MARKS EMIS (1).xlsx"), data_only=True)
    for sname in wb.sheetnames:
        ws = wb[sname]
        sec = sname.replace("11", "").strip() or "A"
        headers = [clean_name(ws.cell(7, c).value) for c in range(1, 11)]
        for r in range(8, ws.max_row + 1):
            emis = ws.cell(r, 2).value
            name = ws.cell(r, 3).value
            if not name:
                continue
            marks = {}
            for c_idx in range(4, 10):
                h = headers[c_idx - 1]
                if h and "TOT" not in h.upper():
                    marks[canonical_subject(h)] = parse_mark_val(ws.cell(r, c_idx).value)[0]
            if marks:
                add_student("RATHINAPURI", "11", sec, emis, name, marks)

    # 12th
    wb = openpyxl.load_workbook(os.path.join(DATA_DIR, "Rathinapuri 12TH Quarterly Mark(2026-27).xlsx"), data_only=True)
    for sname in wb.sheetnames:
        ws = wb[sname]
        sec = sname.replace("12", "").strip() or "A"
        headers = [clean_name(ws.cell(8, c).value) for c in range(1, 11)]
        for r in range(9, ws.max_row + 1):
            name = ws.cell(r, 2).value
            emis = ws.cell(r, 3).value
            if not name:
                continue
            marks = {}
            for c_idx in range(4, 10):
                h = headers[c_idx - 1]
                if h and "TOAL" not in h.upper() and "TOT" not in h.upper():
                    marks[canonical_subject(h)] = parse_mark_val(ws.cell(r, c_idx).value)[0]
            if marks:
                add_student("RATHINAPURI", "12", sec, emis, name, marks)

    # --- 3D. SELVAPURAM GHS ---
    for fn, sec in [("selvapuram ghs IXA QUARTERLY EXAM 2026.xlsx", "A"), ("selvapuram ghs IXB QUARTERLY EXAM 2026.xlsx", "B")]:
        wb = openpyxl.load_workbook(os.path.join(DATA_DIR, fn), data_only=True)
        ws = wb.active
        for r in range(2, ws.max_row + 1):
            name = ws.cell(r, 1).value
            emis = ws.cell(r, 2).value
            if not name:
                continue
            marks = {
                "Tamil": parse_mark_val(ws.cell(r, 7).value)[0],
                "English": parse_mark_val(ws.cell(r, 8).value)[0],
                "Maths": parse_mark_val(ws.cell(r, 9).value)[0],
                "Science": parse_mark_val(ws.cell(r, 10).value)[0],
                "Social Science": parse_mark_val(ws.cell(r, 11).value)[0],
            }
            add_student("SELVAPURAM", "9", sec, emis, name, marks)

    for fn, sec in [("selvapuram ghs XA QUARTERLY RESULT ANALYSIS 2026.xlsx", "A"), ("selvapuram ghs XB QUARTERLY EXAM 2026.xlsx", "B")]:
        wb = openpyxl.load_workbook(os.path.join(DATA_DIR, fn), data_only=True)
        ws = wb.active
        for r in range(2, ws.max_row + 1):
            name = ws.cell(r, 1).value
            emis = ws.cell(r, 2).value
            if not name:
                continue
            sci_th = parse_mark_val(ws.cell(r, 10).value)[0]
            sci_pr = parse_mark_val(ws.cell(r, 11).value)[0]
            marks = {
                "Tamil": parse_mark_val(ws.cell(r, 7).value)[0],
                "English": parse_mark_val(ws.cell(r, 8).value)[0],
                "Maths": parse_mark_val(ws.cell(r, 9).value)[0],
                "Science": sci_th + sci_pr,
                "Social Science": parse_mark_val(ws.cell(r, 12).value)[0],
            }
            add_student("SELVAPURAM", "10", sec, emis, name, marks)

    return schools_meta, teachers_by_school, students_by_school, monthly_totals


def import_into_sqlite_and_export_json():
    schools_meta, teachers_by_school, students_by_school, monthly_totals = parse_all_excel_data()

    for k in schools_meta:
        print(f"Parsed {k}: {len(students_by_school[k])} students, {len(teachers_by_school[k])} teachers")

    db = SessionLocal()
    ensure_schema_columns(db)

    # Clear all old placeholder data so only the 4 real schools exist
    db.query(StudentMark).delete()
    db.query(StudentAttendance).delete()
    db.query(TeacherSubjectAllocation).delete()
    db.query(TeacherAttendance).delete()
    db.query(Student).delete()
    db.query(SchoolClass).delete()
    db.query(Teacher).delete()
    db.query(User).delete()
    db.query(School).delete()
    db.commit()

    # Ensure all subjects exist
    all_subject_names = [
        ("Tamil", "TAM", False, 100, 0),
        ("English", "ENG", False, 100, 0),
        ("Maths", "MAT", False, 100, 0),
        ("Science", "SCI", True, 75, 25),
        ("Social Science", "SOC", False, 100, 0),
        ("Physics", "PHY", True, 70, 30),
        ("Chemistry", "CHE", True, 70, 30),
        ("Biology", "BIO", True, 70, 30),
        ("Computer Science", "CS", True, 70, 30),
        ("Commerce", "COM", False, 100, 0),
        ("Accountancy", "ACC", False, 100, 0),
        ("Economics", "ECO", False, 100, 0),
        ("Computer Applications", "CA", True, 70, 30),
        ("History", "HIS", False, 100, 0),
        ("Geography", "GEO", False, 100, 0),
        ("Statistics", "STA", False, 100, 0),
    ]
    subj_db_map = {}
    for sname, scode, has_p, th_max, pr_max in all_subject_names:
        sobj = db.query(Subject).filter(Subject.subject_name == sname).first()
        if not sobj:
            sobj = Subject(
                subject_name=sname,
                subject_code=scode,
                has_practical=has_p,
                is_active=True,
            )
            db.add(sobj)
            db.flush()
        subj_db_map[sname] = sobj

    # Ensure Quarterly Examination exists
    exam_q = db.query(Examination).filter(Examination.exam_name.ilike("%Quarterly%")).first()
    if not exam_q:
        exam_q = Examination(exam_name="Quarterly Examination", academic_year="2026-2027")
        db.add(exam_q)
        db.flush()

    default_pw = get_password_hash("Admin@123")

    # Create Commissioner & Admin users
    db.add(User(username="commissioner", password_hash=default_pw, role=UserRole.COMMISSIONER.value))
    db.add(User(username="admin", password_hash=default_pw, role=UserRole.ADMIN.value))

    json_schools = []
    json_staff_by_school = {}
    json_students_by_school = {}

    global_teacher_id = 1
    global_student_id = 1

    for skey, smeta in schools_meta.items():
        school_obj = School(
            id=smeta["id"],
            school_code=smeta["code"],
            school_name=smeta["name"],
            emis_number=smeta["udise"],
            zone=smeta["zone"],
            ward=smeta["ward"],
            school_type=smeta["school_type"],
            status="active",
        )
        db.add(school_obj)
        db.flush()

        # Create HM user for this school
        db.add(User(
            username=smeta["hm_username"],
            password_hash=default_pw,
            role=UserRole.HEADMASTER.value,
            school_id=school_obj.id,
        ))
        if skey == "RAMANATHAPURAM":
            db.add(User(username="hm_raman", password_hash=default_pw, role=UserRole.HEADMASTER.value, school_id=school_obj.id))

        # Create Classes discovered in students
        class_keys = sorted({(st["standard"], st["section"]) for st in students_by_school[skey]})
        class_db_map = {}
        for std, sec in class_keys:
            cobj = SchoolClass(
                school_id=school_obj.id,
                standard=std,
                section=sec,
                medium="English Medium",
                group_code="General" if std in ["9", "10"] else "Higher Secondary",
            )
            db.add(cobj)
            db.flush()
            class_db_map[(std, sec)] = cobj

        # Insert Teachers & TeacherAttendance
        school_teacher_objs = []
        subj_to_teachers = {}
        json_staff_list = []

        for idx, tdata in enumerate(teachers_by_school[skey]):
            emp_id = f"CCMC-{school_obj.id:02d}-{idx+1:03d}"
            phone_num = f"9842{school_obj.id:01d}{idx+101:05d}"

            staff_user = None
            if global_teacher_id == 1:
                staff_user = User(username="teacher_ravi", password_hash=default_pw, role=UserRole.STAFF.value, school_id=school_obj.id)
                db.add(staff_user)
                db.flush()

            tobj = Teacher(
                id=global_teacher_id,
                user_id=staff_user.id if staff_user else None,
                employee_id=emp_id,
                teacher_name=tdata["teacher_name"],
                designation=tdata["designation"],
                subject_specialization=tdata["subject_specialization"],
                education_qualification=tdata["education_qualification"],
                contact_number=phone_num,
                location=tdata["location"],
                native_place=tdata["native_place"],
                blood_group=tdata["blood_group"],
                experience_years=tdata["experience_years"],
                school_id=school_obj.id,
            )
            db.add(tobj)
            db.flush()

            db.add(TeacherAttendance(
                teacher_id=tobj.id,
                academic_year="2026-2027",
                month="SEPTEMBER",
                working_days=tdata["working_days"],
                present_days=tdata["present_days"],
                casual_leave=tdata["cl"],
                restricted_holiday=tdata["rh"],
                earned_leave=tdata["el"],
                medical_leave=tdata["ml"],
                other_leave=tdata["others"],
                total_leave=tdata["total_leave"],
                attendance_percentage=tdata["attendance_percentage"],
                reason=tdata["reason"],
            ))

            school_teacher_objs.append((tobj, tdata))
            subj_to_teachers.setdefault(tdata["subject_specialization"], []).append((tobj, tdata))

            json_staff_list.append({
                "id": tobj.id,
                "employee_id": emp_id,
                "school_id": school_obj.id,
                "school_name": school_obj.school_name,
                "zone": school_obj.zone,
                "ward": school_obj.ward,
                "teacher_name": tobj.teacher_name,
                "designation": tobj.designation,
                "subject": tdata["subject_specialization"],
                "handling_subject": tdata["subject_specialization"],
                "subject_specialization": tdata["subject_specialization"],
                "education_qualification": tobj.education_qualification,
                "contact_number": phone_num,
                "location": tobj.location,
                "native_place": tobj.native_place,
                "blood_group": tobj.blood_group,
                "experience_years": tobj.experience_years,
                "classes_handled": ", ".join(tdata["sections_raw"]),
                "working_days": tdata["working_days"],
                "present_days": tdata["present_days"],
                "total_leave": tdata["total_leave"],
                "cl": tdata["cl"],
                "rh": tdata["rh"],
                "el": tdata["el"],
                "ml": tdata["ml"],
                "others": tdata["others"],
                "reason": tdata["reason"],
                "attendance_percentage": tdata["attendance_percentage"],
            })
            global_teacher_id += 1

        # Link teachers to classes & subjects
        for (std, sec), cobj in class_db_map.items():
            for sname, sobj in subj_db_map.items():
                candidates = subj_to_teachers.get(sname, [])
                if not candidates and sname in ["Physics", "Chemistry", "Biology"]:
                    candidates = subj_to_teachers.get("Science", [])
                if not candidates and sname in ["History", "Geography", "Economics"]:
                    candidates = subj_to_teachers.get("Social Science", [])
                if not candidates and sname in ["Accountancy", "Computer Applications"]:
                    candidates = subj_to_teachers.get("Commerce", []) or subj_to_teachers.get("Computer Science", [])
                if not candidates and school_teacher_objs:
                    candidates = [school_teacher_objs[0]]

                chosen_tobj = None
                for tobj, tdata in candidates:
                    raw_secs = " ".join(tdata["sections_raw"])
                    if sec in raw_secs or "ALL" in raw_secs:
                        chosen_tobj = tobj
                        break
                if not chosen_tobj and candidates:
                    chosen_tobj = candidates[0][0]

                if chosen_tobj:
                    db.add(TeacherSubjectAllocation(
                        teacher_id=chosen_tobj.id,
                        class_id=cobj.id,
                        subject_id=sobj.id,
                        academic_year="2026-2027",
                    ))

        # Insert Students, Marks, and Attendance
        json_students_list = []
        school_pass_cnt = 0
        school_total_avg = 0.0
        school_risk_cnt = 0
        school_att_sum = 0.0

        for st_data in students_by_school[skey]:
            cobj = class_db_map[(st_data["standard"], st_data["section"])]
            st_obj = Student(
                id=global_student_id,
                emis_number=f"{st_data['emis_number']}_{global_student_id}" if db.query(Student).filter(Student.emis_number == st_data["emis_number"]).first() else st_data["emis_number"],
                student_name=st_data["student_name"],
                gender="Female" if skey == "SELVAPURAM" else "Student",
                school_id=school_obj.id,
                class_id=cobj.id,
            )
            db.add(st_obj)
            db.flush()

            db.add(StudentAttendance(
                student_id=st_obj.id,
                academic_year="2026-2027",
                month="SEPTEMBER",
                working_days=st_data["working_days"],
                days_present=round(st_data["present_days"], 1),
                days_absent=round(max(0.0, st_data["working_days"] - st_data["present_days"]), 1),
                percentage=st_data["attendance_pct"],
            ))

            marks_entries = st_data["marks"]
            for sname, mval in marks_entries.items():
                sobj = subj_db_map.get(sname) or subj_db_map["Science"]
                db.add(StudentMark(
                    student_id=st_obj.id,
                    subject_id=sobj.id,
                    exam_id=exam_q.id,
                    theory_mark=mval,
                    practical_mark=0.0,
                    total_mark=mval,
                    max_mark=100.0,
                    percentage=mval,
                    grade=calculate_grade(mval),
                    is_pass=(mval >= 35.0),
                    status="finalized",
                ))

            vals = list(marks_entries.values())
            avg_m = round(sum(vals) / len(vals), 1) if vals else 0.0
            is_pass = len(vals) > 0 and all(v >= 35.0 for v in vals)
            if is_pass:
                school_pass_cnt += 1
            if avg_m < 35.0:
                school_risk_cnt += 1
            school_total_avg += avg_m
            school_att_sum += st_data["attendance_pct"]

            json_students_list.append({
                "id": st_obj.id,
                "emis": st_data["emis_number"],
                "name": st_data["student_name"],
                "school_id": school_obj.id,
                "std": st_data["standard"],
                "sec": st_data["section"],
                "med": st_data["medium"],
                "att": st_data["attendance_pct"],
                "marks": marks_entries,
            })
            global_student_id += 1

        st_total = len(json_students_list) or 1
        json_schools.append({
            "id": school_obj.id,
            "code": school_obj.school_code,
            "school_code": school_obj.school_code,
            "name": school_obj.school_name,
            "school_name": school_obj.school_name,
            "zone": school_obj.zone,
            "ward": school_obj.ward,
            "school_type": school_obj.school_type,
            "headmaster_name": smeta["hm_name"],
            "emis_number": school_obj.emis_number,
            "students": len(json_students_list),
            "student_count": len(json_students_list),
            "teacher_count": len(json_staff_list),
            "avg_mark": round(school_total_avg / st_total, 1),
            "pass_rate": round((school_pass_cnt / st_total) * 100, 1),
            "attendance": round(school_att_sum / st_total, 1),
            "risk_students": school_risk_cnt,
        })
        json_staff_by_school[str(school_obj.id)] = json_staff_list
        json_students_by_school[str(school_obj.id)] = json_students_list

    db.commit()
    db.close()

    # Export JSON for frontend offline/GitHub Pages mode
    export_payload = {
        "schools": json_schools,
        "staff_by_school": json_staff_by_school,
        "students_by_school": json_students_by_school,
    }
    with open(FRONTEND_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(export_payload, f, ensure_ascii=False, indent=2)

    print("Successfully imported all 4 real schools into SQLite and exported frontend/src/realSchoolData.json!")
    for s in json_schools:
        print(f" -> {s['name']} ({s['code']}): {s['students']} students, {s['teacher_count']} staff, Avg={s['avg_mark']}%, Pass={s['pass_rate']}%, Att={s['attendance']}%")


if __name__ == "__main__":
    import_into_sqlite_and_export_json()
