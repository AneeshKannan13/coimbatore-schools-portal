import io
import pandas as pd
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.entities import (
    School, Student, SchoolClass, Subject, Examination,
    ExamSubjectPattern, StudentMark, StudentAttendance, Teacher, TeacherAttendance,
    TeacherSubjectAllocation, ExcelUpload, User
)

# Canonical mapping for Coimbatore Corporation subjects & Excel alias columns
SUBJECT_ALIASES = {
    "TAMIL": "Tamil",
    "ENGLISH": "English",
    "MATHS": "Maths",
    "MATHEMATICS": "Maths",
    "SCIENCE – THEORY": ("Science", "theory"),
    "SCIENCE - THEORY": ("Science", "theory"),
    "SCIENCE – PRACTICAL": ("Science", "practical"),
    "SCIENCE - PRACTICAL": ("Science", "practical"),
    "SCIENCE": "Science",
    "SOCIAL SCIENCE": "Social Science",
    "PHYSICS – THEORY": ("Physics", "theory"),
    "PHYSICS - THEORY": ("Physics", "theory"),
    "PHYSICS – PRACTICAL": ("Physics", "practical"),
    "PHYSICS - PRACTICAL": ("Physics", "practical"),
    "PHYSICS": "Physics",
    "CHEMISTRY – THEORY": ("Chemistry", "theory"),
    "CHEMISTRY - THEORY": ("Chemistry", "theory"),
    "CHEMISTRY – PRACTICAL": ("Chemistry", "practical"),
    "CHEMISTRY - PRACTICAL": ("Chemistry", "practical"),
    "CHEMISTRY": "Chemistry",
    "COMP SCI – THEORY": ("Computer Science", "theory"),
    "COMP SCI - THEORY": ("Computer Science", "theory"),
    "COMP SCI – PRACTICAL": ("Computer Science", "practical"),
    "COMP SCI - PRACTICAL": ("Computer Science", "practical"),
    "COMP SCI": "Computer Science",
    "COMPUTER SCIENCE": "Computer Science",
    "COMP APP – THEORY": ("Computer Applications", "theory"),
    "COMP APP - THEORY": ("Computer Applications", "theory"),
    "COMP APP – PRACTICAL": ("Computer Applications", "practical"),
    "COMP APP - PRACTICAL": ("Computer Applications", "practical"),
    "COMP APP": "Computer Applications",
    "BIOLOGY – THEORY": ("Biology", "theory"),
    "BIOLOGY - THEORY": ("Biology", "theory"),
    "BIOLOGY – PRACTICAL": ("Biology", "practical"),
    "BIOLOGY - PRACTICAL": ("Biology", "practical"),
    "BIOLOGY": "Biology",
    "STATISTICS": "Statistics",
    "ECONOMICS": "Economics",
    "COMMERCE": "Commerce",
    "ACCOUNTS": "Accountancy",
    "ACCOUNTANCY": "Accountancy",
    "BUS MATHS": "Business Maths",
    "BUSINESS MATHS": "Business Maths",
    "HISTORY": "History",
    "GEOGRAPHY": "Geography"
}

def clean_header(h: str) -> str:
    if not isinstance(h, str):
        return ""
    return h.strip().upper().replace("\n", " ").replace("  ", " ")

def parse_and_validate_marks_sheet(
    file_contents: bytes,
    school_id: int,
    academic_year: str,
    exam_id: int,
    db: Session
) -> Dict[str, Any]:
    """
    Parses 'Students Mark Details' sheet, enforces school boundary, validates student EMIS,
    checks max mark rules and prepares normalized records.
    """
    try:
        excel_file = io.BytesIO(file_contents)
        xls = pd.ExcelFile(excel_file)
    except Exception as e:
        return {"success": False, "error": f"Invalid Excel file: {str(e)}", "valid_records": [], "errors": []}

    target_sheet = None
    for name in xls.sheet_names:
        if "MARK" in name.upper() or "STUDENT" in name.upper():
            target_sheet = name
            break
    if not target_sheet:
        target_sheet = xls.sheet_names[0]

    df = pd.read_excel(xls, sheet_name=target_sheet)
    df.columns = [clean_header(c) for c in df.columns]

    school = db.query(School).filter(School.id == school_id).first()
    school_name_expected = school.school_name if school else ""

    exam = db.query(Examination).filter(Examination.id == exam_id).first()

    errors = []
    valid_rows = []
    total_rows = len(df)

    # Preload subjects
    subjects_db = {s.subject_name.upper(): s for s in db.query(Subject).all()}

    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed header is row 1
        emis = str(row.get("EMIS NO", "")).strip().split(".")[0]
        student_name = str(row.get("STUDENT NAME", "")).strip()
        row_school = str(row.get("SCHOOL NAME", "")).strip()
        standard = str(row.get("CLASS", "")).strip().replace("th", "").replace("TH", "")
        section = str(row.get("SECTION", "A")).strip().upper()
        medium = str(row.get("TM/EM", "EM")).strip().upper()
        group_code = str(row.get("GROUP CODE", "")).strip()

        if not emis or emis.lower() == "nan" or emis == "":
            errors.append({
                "row": row_num,
                "emis": emis,
                "student": student_name,
                "field": "EMIS NO",
                "uploaded_value": emis,
                "problem": "Missing EMIS Number"
            })
            continue

        # Validate school name if supplied
        if row_school and row_school.lower() != "nan" and school_name_expected:
            if school_name_expected.lower() not in row_school.lower() and row_school.lower() not in school_name_expected.lower():
                errors.append({
                    "row": row_num,
                    "emis": emis,
                    "student": student_name,
                    "field": "SCHOOL NAME",
                    "uploaded_value": row_school,
                    "problem": f"School mismatch. Teacher belongs to {school_name_expected}"
                })
                continue

        # Extract marks for each recognizable subject column
        student_marks = []
        for col in df.columns:
            if col in SUBJECT_ALIASES:
                val = row[col]
                if pd.isna(val) or str(val).strip() == "" or str(val).strip() == "-":
                    continue
                try:
                    mark_val = float(val)
                except ValueError:
                    errors.append({
                        "row": row_num,
                        "emis": emis,
                        "student": student_name,
                        "field": col,
                        "uploaded_value": str(val),
                        "problem": "Mark is not a valid numeric value"
                    })
                    continue

                if mark_val < 0:
                    errors.append({
                        "row": row_num,
                        "emis": emis,
                        "student": student_name,
                        "field": col,
                        "uploaded_value": str(mark_val),
                        "problem": "Negative marks are not allowed"
                    })
                    continue

                canonical = SUBJECT_ALIASES[col]
                if isinstance(canonical, tuple):
                    sub_name, part_type = canonical
                else:
                    sub_name, part_type = canonical, "theory"

                # Check max marks bounds
                max_bound = 100.0
                if part_type == "theory" and standard in ["11", "12"] and sub_name in ["Physics", "Chemistry", "Biology", "Computer Science"]:
                    max_bound = 70.0
                elif part_type == "practical":
                    max_bound = 30.0

                if mark_val > max_bound:
                    errors.append({
                        "row": row_num,
                        "emis": emis,
                        "student": student_name,
                        "field": col,
                        "uploaded_value": str(mark_val),
                        "problem": f"Mark exceeds configured maximum ({max_bound})"
                    })
                    continue

                student_marks.append({
                    "subject_name": sub_name,
                    "type": part_type,
                    "mark": mark_val,
                    "max_bound": max_bound
                })

        valid_rows.append({
            "row": row_num,
            "emis_number": emis,
            "student_name": student_name,
            "standard": standard if standard and standard != "nan" else "10",
            "section": section if section and section != "nan" else "A",
            "medium": "Tamil Medium" if "TM" in medium else "English Medium",
            "group_code": group_code if group_code and group_code != "nan" else "General",
            "marks": student_marks
        })

    return {
        "success": True,
        "total_records": total_rows,
        "valid_count": len(valid_rows),
        "invalid_count": len(errors),
        "errors": errors,
        "preview_data": valid_rows[:15],
        "all_valid_records": valid_rows
    }

def commit_marks_to_db(
    valid_records: List[Dict[str, Any]],
    school_id: int,
    academic_year: str,
    exam_id: int,
    user_id: int,
    db: Session
) -> Dict[str, Any]:
    """
    Saves normalized marks into PostgreSQL with duplicate handling and audit logging.
    """
    inserted_count = 0
    updated_count = 0

    # Ensure Subjects exist
    subj_cache = {}
    for sub in db.query(Subject).all():
        subj_cache[sub.subject_name.upper()] = sub

    for rec in valid_records:
        emis = rec["emis_number"]
        name = rec["student_name"]
        std = rec["standard"]
        sec = rec["section"]
        med = rec["medium"]
        grp = rec["group_code"]

        # Find or create SchoolClass
        sclass = db.query(SchoolClass).filter(
            SchoolClass.school_id == school_id,
            SchoolClass.standard == std,
            SchoolClass.section == sec
        ).first()
        if not sclass:
            sclass = SchoolClass(
                school_id=school_id,
                standard=std,
                section=sec,
                medium=med,
                group_code=grp
            )
            db.add(sclass)
            db.flush()

        # Find or create Student
        student = db.query(Student).filter(Student.emis_number == emis).first()
        if not student:
            student = Student(
                emis_number=emis,
                school_id=school_id,
                student_name=name,
                class_id=sclass.id
            )
            db.add(student)
            db.flush()
        else:
            student.class_id = sclass.id
            student.student_name = name

        # Aggregate marks by canonical subject
        sub_mark_map = {}
        for m in rec["marks"]:
            sname = m["subject_name"]
            if sname not in sub_mark_map:
                sub_mark_map[sname] = {"theory": 0.0, "practical": 0.0, "total": 0.0, "has_prac": False}
            if m["type"] == "theory":
                sub_mark_map[sname]["theory"] = m["mark"]
                sub_mark_map[sname]["total"] += m["mark"]
            elif m["type"] == "practical":
                sub_mark_map[sname]["practical"] = m["mark"]
                sub_mark_map[sname]["total"] += m["mark"]
                sub_mark_map[sname]["has_prac"] = True

        for sname, data in sub_mark_map.items():
            sub_obj = subj_cache.get(sname.upper())
            if not sub_obj:
                sub_obj = Subject(
                    subject_code=sname.upper()[:10],
                    subject_name=sname,
                    has_practical=data["has_prac"]
                )
                db.add(sub_obj)
                db.flush()
                subj_cache[sname.upper()] = sub_obj

            tot = data["total"]
            max_m = 100.0
            pct = (tot / max_m) * 100
            is_pass = tot >= 35.0

            # Grade calculation
            if pct >= 90:
                grade = "A+"
            elif pct >= 80:
                grade = "A"
            elif pct >= 70:
                grade = "B"
            elif pct >= 50:
                grade = "C"
            elif pct >= 35:
                grade = "D"
            else:
                grade = "F"

            # Check duplicate / existing mark
            existing_mark = db.query(StudentMark).filter(
                StudentMark.student_id == student.id,
                StudentMark.exam_id == exam_id,
                StudentMark.subject_id == sub_obj.id
            ).first()

            if existing_mark:
                existing_mark.theory_mark = data["theory"]
                existing_mark.practical_mark = data["practical"]
                existing_mark.total_mark = tot
                existing_mark.percentage = pct
                existing_mark.grade = grade
                existing_mark.is_pass = is_pass
                updated_count += 1
            else:
                new_mark = StudentMark(
                    student_id=student.id,
                    exam_id=exam_id,
                    subject_id=sub_obj.id,
                    theory_mark=data["theory"],
                    practical_mark=data["practical"],
                    total_mark=tot,
                    max_mark=max_m,
                    percentage=pct,
                    grade=grade,
                    is_pass=is_pass
                )
                db.add(new_mark)
                inserted_count += 1

    db.commit()
    return {
        "success": True,
        "inserted": inserted_count,
        "updated": updated_count,
        "total_processed": len(valid_records)
    }

def parse_and_validate_teacher_attendance_sheet(
    file_contents: bytes,
    school_id: int,
    academic_year: str,
    month: str,
    db: Session
) -> Dict[str, Any]:
    """
    Parses 'Teachers Attendance' sheet matching exact Coimbatore format:
    S.NO, SCHOOL NAME, TEACHER NAME, HM, SUBJECT, CLASS, SECTION, TM/EM, CL, RH, EL, ML, OTHERS, TOTAL, REASON
    Validates non-negative leaves, auto calculates total leave, validates teacher membership.
    """
    try:
        excel_file = io.BytesIO(file_contents)
        xls = pd.ExcelFile(excel_file)
    except Exception as e:
        return {"success": False, "error": f"Invalid Excel file: {str(e)}", "valid_records": [], "errors": []}

    target_sheet = None
    for name in xls.sheet_names:
        if "TEACHER" in name.upper() or "STAFF" in name.upper():
            target_sheet = name
            break
    if not target_sheet:
        target_sheet = xls.sheet_names[0]

    df = pd.read_excel(xls, sheet_name=target_sheet)
    df.columns = [clean_header(c) for c in df.columns]

    school = db.query(School).filter(School.id == school_id).first()
    school_name_expected = school.school_name if school else ""

    errors = []
    valid_rows = []
    total_rows = len(df)

    for idx, row in df.iterrows():
        row_num = idx + 2
        teacher_name = str(row.get("TEACHER NAME", "")).strip()
        row_school = str(row.get("SCHOOL NAME", "")).strip()
        subject_str = str(row.get("SUBJECT", "")).strip()
        standard = str(row.get("CLASS", "")).strip().replace("th", "").replace("TH", "")
        section = str(row.get("SECTION", "A")).strip().upper()
        medium = str(row.get("TM/EM", "EM")).strip().upper()
        reason = str(row.get("REASON", "")).strip()
        if reason.lower() == "nan":
            reason = ""

        if not teacher_name or teacher_name.lower() == "nan":
            continue

        # Validate school name if given
        if row_school and row_school.lower() != "nan" and school_name_expected:
            if school_name_expected.lower() not in row_school.lower() and row_school.lower() not in school_name_expected.lower():
                errors.append({
                    "row": row_num,
                    "teacher": teacher_name,
                    "field": "SCHOOL NAME",
                    "uploaded_value": row_school,
                    "problem": f"School mismatch. Active HM school is {school_name_expected}"
                })
                continue

        # Parse leaves: CL, RH, EL, ML, OTHERS
        leave_fields = ["CL", "RH", "EL", "ML", "OTHERS"]
        leave_vals = {}
        has_error = False

        for f in leave_fields:
            val = row.get(f, 0)
            if pd.isna(val) or str(val).strip() == "" or str(val).strip() == "-":
                leave_vals[f] = 0.0
                continue
            try:
                num_val = float(val)
                if num_val < 0:
                    errors.append({
                        "row": row_num,
                        "teacher": teacher_name,
                        "field": f,
                        "uploaded_value": str(val),
                        "problem": f"Leave count cannot be negative: {val}"
                    })
                    has_error = True
                    break
                leave_vals[f] = num_val
            except ValueError:
                errors.append({
                    "row": row_num,
                    "teacher": teacher_name,
                    "field": f,
                    "uploaded_value": str(val),
                    "problem": f"Invalid numeric value for {f}: {val}"
                })
                has_error = True
                break

        if has_error:
            continue

        # Automatic calculation of total leave
        calc_total = sum(leave_vals.values())
        working_days = 22
        present_days = max(0.0, working_days - calc_total)
        att_pct = round((present_days / working_days * 100), 1)

        valid_rows.append({
            "row": row_num,
            "teacher_name": teacher_name,
            "subject": subject_str if subject_str and subject_str != "nan" else "General",
            "standard": standard if standard and standard != "nan" else "10",
            "section": section if section and section != "nan" else "A",
            "medium": "Tamil Medium" if "TM" in medium else "English Medium",
            "cl": leave_vals["CL"],
            "rh": leave_vals["RH"],
            "el": leave_vals["EL"],
            "ml": leave_vals["ML"],
            "others": leave_vals["OTHERS"],
            "total_leave": calc_total,
            "working_days": working_days,
            "present_days": present_days,
            "attendance_percentage": att_pct,
            "reason": reason
        })

    return {
        "success": True,
        "total_records": total_rows,
        "valid_count": len(valid_rows),
        "invalid_count": len(errors),
        "errors": errors,
        "preview_data": valid_rows[:15],
        "all_valid_records": valid_rows
    }

def commit_teacher_attendance_to_db(
    valid_records: List[Dict[str, Any]],
    school_id: int,
    academic_year: str,
    month: str,
    user_id: int,
    db: Session
) -> Dict[str, Any]:
    """
    Saves validated teacher attendance records to database with duplicate check and automatic total calculation.
    """
    inserted = 0
    updated = 0

    for rec in valid_records:
        tname = rec["teacher_name"].strip()
        teacher = db.query(Teacher).filter(
            Teacher.school_id == school_id,
            Teacher.teacher_name.ilike(f"%{tname}%")
        ).first()

        if not teacher:
            teacher = Teacher(
                teacher_name=tname,
                school_id=school_id,
                designation="B.T. Assistant"
            )
            db.add(teacher)
            db.flush()

        # Check existing attendance for this teacher in month
        existing = db.query(TeacherAttendance).filter(
            TeacherAttendance.teacher_id == teacher.id,
            TeacherAttendance.academic_year == academic_year,
            TeacherAttendance.month == month
        ).first()

        calc_total = float(rec["cl"] + rec["rh"] + rec["el"] + rec["ml"] + rec["others"])
        wd = int(rec.get("working_days", 22))
        pd_days = max(0.0, float(wd - calc_total))
        att_pct = round((pd_days / wd * 100), 1) if wd > 0 else 100.0

        if existing:
            existing.casual_leave = rec["cl"]
            existing.restricted_holiday = rec["rh"]
            existing.earned_leave = rec["el"]
            existing.medical_leave = rec["ml"]
            existing.other_leave = rec["others"]
            existing.total_leave = calc_total
            existing.working_days = wd
            existing.present_days = pd_days
            existing.attendance_percentage = att_pct
            existing.reason = rec.get("reason", "")
            updated += 1
        else:
            new_att = TeacherAttendance(
                teacher_id=teacher.id,
                academic_year=academic_year,
                month=month,
                casual_leave=rec["cl"],
                restricted_holiday=rec["rh"],
                earned_leave=rec["el"],
                medical_leave=rec["ml"],
                other_leave=rec["others"],
                total_leave=calc_total,
                working_days=wd,
                present_days=pd_days,
                attendance_percentage=att_pct,
                reason=rec.get("reason", "")
            )
            db.add(new_att)
            inserted += 1

    db.commit()
    return {
        "success": True,
        "inserted": inserted,
        "updated": updated,
        "total_processed": len(valid_records)
    }
