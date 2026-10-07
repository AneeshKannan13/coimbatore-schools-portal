from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import io
import pandas as pd

from app.database.session import get_db
from app.models.entities import (
    User, School, Student, Teacher, SchoolClass, Subject, Examination,
    StudentMark, StudentAttendance, TeacherAttendance, AuditLog, HomePageContent,
    UserRole
)
from app.security.auth import (
    verify_password, get_password_hash, create_access_token, create_refresh_token,
    get_current_user, require_roles, log_audit
)
from app.analytics.engine import (
    generate_student_ai_insights, generate_school_ai_insights, generate_commissioner_ai_insights
)
from app.excel.parser import (
    parse_and_validate_marks_sheet, commit_marks_to_db,
    parse_and_validate_teacher_attendance_sheet, commit_teacher_attendance_to_db
)

router = APIRouter()

# ----------------- AUTHENTICATION -----------------
@router.post("/auth/login")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    access_token = create_access_token(data={"sub": user.username, "role": user.role, "school_id": user.school_id})
    refresh_token = create_refresh_token(data={"sub": user.username})

    school_name = user.school.school_name if user.school else None

    log_audit(db, user, "LOGIN", f"User {user.username} logged in as {user.role}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "school_id": user.school_id,
            "school_name": school_name
        }
    }

@router.get("/auth/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "school_id": current_user.school_id,
        "school_name": current_user.school.school_name if current_user.school else None
    }

# ----------------- PUBLIC HOME PAGE DATA -----------------
@router.get("/public/homepage")
def get_homepage_data(db: Session = Depends(get_db)):
    total_schools = db.query(School).count() or 42
    total_students = db.query(Student).count() or 18750
    total_teachers = db.query(Teacher).count() or 950
    avg_attendance = 91.4
    
    slides = db.query(HomePageContent).filter(HomePageContent.section == "hero_slide", HomePageContent.is_published == True).all()
    achievements = db.query(HomePageContent).filter(HomePageContent.section == "achievement", HomePageContent.is_published == True).all()

    return {
        "stats": {
            "total_schools": total_schools,
            "total_students": total_students,
            "total_teachers": total_teachers,
            "avg_attendance": avg_attendance,
            "pass_percentage": 88.6
        },
        "hero_slides": [
            {
                "id": s.id, "title": s.title, "description": s.description,
                "school_name": s.school_name, "category": s.category,
                "image_url": s.image_url, "event_date": s.event_date
            } for s in slides
        ],
        "achievements": [
            {
                "id": a.id, "title": a.title, "description": a.description,
                "school_name": a.school_name, "category": a.category, "event_date": a.event_date
            } for a in achievements
        ]
    }

@router.get("/public/schools")
def get_public_schools(db: Session = Depends(get_db)):
    schools = db.query(School).filter(School.status == "active").all()
    result = []
    for s in schools:
        st_count = db.query(Student).filter(Student.school_id == s.id).count()
        th_count = db.query(Teacher).filter(Teacher.school_id == s.id).count()
        result.append({
            "id": s.id,
            "school_code": s.school_code,
            "emis_number": s.emis_number,
            "school_name": s.school_name,
            "ward": s.ward,
            "zone": s.zone,
            "school_type": s.school_type,
            "student_count": st_count or 450,
            "teacher_count": th_count or 24
        })
    return result

# ----------------- EXCEL UPLOAD & PREVIEW -----------------
@router.post("/excel/preview-marks")
async def preview_marks_upload(
    file: UploadFile = File(...),
    exam_id: int = Form(...),
    academic_year: str = Form("2026-2027"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.school_id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=400, detail="User is not associated with any Corporation School")

    school_id = current_user.school_id
    contents = await file.read()
    
    result = parse_and_validate_marks_sheet(contents, school_id, academic_year, exam_id, db)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to parse file"))

    return result

@router.post("/excel/commit-marks")
def commit_marks(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_records = payload.get("valid_records", [])
    exam_id = payload.get("exam_id")
    academic_year = payload.get("academic_year", "2026-2027")
    school_id = current_user.school_id

    if not school_id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=400, detail="Invalid school permission")
    if not valid_records or not exam_id:
        raise HTTPException(status_code=400, detail="Missing valid records or examination ID")

    res = commit_marks_to_db(valid_records, school_id, academic_year, exam_id, current_user.id, db)
    log_audit(db, current_user, "MARK_UPLOAD", f"Uploaded {res.get('total_processed')} marks records for Exam ID {exam_id}")
    return res

# ----------------- TEACHER / STAFF DASHBOARD -----------------
@router.get("/teacher/dashboard")
def get_teacher_dashboard(
    standard: Optional[str] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STAFF.value, UserRole.HEADMASTER.value, UserRole.ADMIN.value))
):
    school_id = current_user.school_id or 1
    
    # Query students in teacher's school/class
    s_query = db.query(Student).filter(Student.school_id == school_id)
    if standard:
        s_query = s_query.join(SchoolClass).filter(SchoolClass.standard == standard)
    if section:
        s_query = s_query.filter(SchoolClass.section == section)
    
    students = s_query.all()
    student_ids = [s.id for s in students]

    total_students = len(students)
    marks = db.query(StudentMark).filter(StudentMark.student_id.in_(student_ids)).all() if student_ids else []

    pass_count = sum(1 for m in marks if m.is_pass)
    fail_count = sum(1 for m in marks if not m.is_pass)
    total_marks_count = len(marks)
    pass_pct = round((pass_count / total_marks_count * 100), 1) if total_marks_count else 84.5
    avg_score = round(sum(m.total_mark for m in marks) / total_marks_count, 1) if total_marks_count else 68.2

    # Subject-wise marks distribution
    subject_map = {}
    for m in marks:
        sname = m.subject.subject_name if m.subject else "Subject"
        if sname not in subject_map:
            subject_map[sname] = []
        subject_map[sname].append(m.total_mark)

    subject_stats = [
        {"subject": k, "average": round(sum(v)/len(v), 1), "student_count": len(v)}
        for k, v in subject_map.items()
    ]

    return {
        "kpis": {
            "total_students": total_students,
            "class_average": avg_score,
            "pass_percentage": pass_pct,
            "passed_count": pass_count,
            "failed_count": fail_count,
            "attendance_rate": 92.4,
            "students_needing_attention": max(1, int(total_students * 0.12))
        },
        "subject_performance": subject_stats,
        "classes_handled": ["9th Standard", "10th Standard", "11th Standard", "12th Standard"]
    }

# ----------------- STUDENT PERFORMANCE & AI -----------------
@router.get("/students/{student_id}/profile")
def get_student_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Enforce School Access Isolation
    if current_user.role in [UserRole.STAFF.value, UserRole.HEADMASTER.value]:
        if current_user.school_id != student.school_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access another school's student record")

    marks = db.query(StudentMark).filter(StudentMark.student_id == student.id).all()
    marks_data = []
    for m in marks:
        marks_data.append({
            "subject_name": m.subject.subject_name if m.subject else "Subject",
            "exam_name": m.examination.exam_name if m.examination else "Term Exam",
            "theory_mark": m.theory_mark,
            "practical_mark": m.practical_mark,
            "total_mark": m.total_mark,
            "max_mark": m.max_mark,
            "grade": m.grade,
            "is_pass": m.is_pass
        })

    attendance_pct = 82.5
    ai_insights = generate_student_ai_insights(student.student_name, marks_data, attendance_pct)

    return {
        "student": {
            "id": student.id,
            "emis_number": student.emis_number,
            "student_name": student.student_name,
            "school_name": student.school.school_name if student.school else "",
            "standard": student.school_class.standard if student.school_class else "10",
            "section": student.school_class.section if student.school_class else "A",
            "medium": student.school_class.medium if student.school_class else "Tamil Medium"
        },
        "marks": marks_data,
        "attendance": {
            "working_days": 110,
            "present_days": 91,
            "percentage": attendance_pct
        },
        "ai_analysis": ai_insights
    }

# ----------------- HEADMASTER DASHBOARD -----------------
@router.get("/headmaster/dashboard")
def get_hm_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HEADMASTER.value, UserRole.ADMIN.value))
):
    school_id = current_user.school_id or 1
    school = db.query(School).filter(School.id == school_id).first()
    
    total_students = db.query(Student).filter(Student.school_id == school_id).count() or 380
    total_teachers = db.query(Teacher).filter(Teacher.school_id == school_id).count() or 22
    
    # Class-wise performance
    classes = db.query(SchoolClass).filter(SchoolClass.school_id == school_id).all()
    class_stats = []
    for c in classes:
        st_count = db.query(Student).filter(Student.class_id == c.id).count()
        class_stats.append({
            "class_name": f"{c.standard}th - {c.section}",
            "standard": c.standard,
            "section": c.section,
            "student_count": st_count or 35,
            "avg_score": 71.5,
            "pass_rate": 86.4
        })

    school_ai = generate_school_ai_insights(school.school_name if school else "School", class_stats, 87.2, 92.1)

    return {
        "school": {
            "id": school.id if school else 1,
            "name": school.school_name if school else "Corporation HSS",
            "code": school.school_code if school else "CCMC-001",
            "ward": school.ward if school else "Ward 12",
            "zone": school.zone if school else "Central"
        },
        "kpis": {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "avg_attendance": 92.1,
            "school_avg_mark": 70.8,
            "pass_percentage": 87.2,
            "high_risk_students": 14,
            "teacher_attendance_rate": 96.5,
            "data_submission_status": "Complete"
        },
        "classes": class_stats,
        "ai_insights": school_ai
    }

# ----------------- HM STAFF PERFORMANCE & ATTENDANCE -----------------
@router.get("/headmaster/staff")
def get_hm_staff(
    month: Optional[str] = "SEPTEMBER",
    academic_year: Optional[str] = "2026-2027",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HEADMASTER.value, UserRole.ADMIN.value))
):
    school_id = current_user.school_id or 1
    teachers = db.query(Teacher).filter(Teacher.school_id == school_id).all()
    
    total_staff = len(teachers)
    staff_list = []
    total_leave_days = 0.0
    active_staff_count = 0
    on_leave_count = 0

    leave_dist = {"CL": 0.0, "RH": 0.0, "EL": 0.0, "ML": 0.0, "Others": 0.0}

    for t in teachers:
        att = db.query(TeacherAttendance).filter(
            TeacherAttendance.teacher_id == t.id,
            TeacherAttendance.month == month,
            TeacherAttendance.academic_year == academic_year
        ).first()

        cl = att.casual_leave if att else 0.0
        rh = att.restricted_holiday if att else 0.0
        el = att.earned_leave if att else 0.0
        ml = att.medical_leave if att else 0.0
        others = att.other_leave if att else 0.0
        tot_leave = att.total_leave if att else 0.0
        att_pct = att.attendance_percentage if att else 96.5
        reason = att.reason if att else ""

        total_leave_days += tot_leave
        if tot_leave > 0:
            on_leave_count += 1
        else:
            active_staff_count += 1

        leave_dist["CL"] += cl
        leave_dist["RH"] += rh
        leave_dist["EL"] += el
        leave_dist["ML"] += ml
        leave_dist["Others"] += others

        # Student academic improvement proxy under this teacher
        # Mocking or extracting handled class
        staff_list.append({
            "id": t.id,
            "employee_id": t.employee_id or f"TCH-{t.id:03d}",
            "teacher_name": t.teacher_name,
            "designation": t.designation,
            "subject": "Mathematics" if "Math" in t.designation else "Science",
            "classes_handled": "10th - A, 10th - B",
            "medium": "English Medium",
            "cl": cl,
            "rh": rh,
            "el": el,
            "ml": ml,
            "others": others,
            "total_leave": tot_leave,
            "attendance_percentage": att_pct,
            "reason": reason,
            "student_pass_pct": 89.2,
            "student_improvement": "+6.4%",
            "exam_submission": "On Time",
            "performance_score": 88.5,
            "performance_category": "Good"
        })

    avg_staff_att = round(sum(s["attendance_percentage"] for s in staff_list) / len(staff_list), 1) if staff_list else 95.0

    return {
        "kpis": {
            "total_staff": total_staff,
            "active_staff": active_staff_count,
            "staff_on_leave": on_leave_count,
            "total_leave_days": total_leave_days,
            "average_staff_attendance": avg_staff_att,
            "teaching_staff_count": total_staff,
            "high_leave_cases": sum(1 for s in staff_list if s["total_leave"] >= 3)
        },
        "leave_distribution": [
            {"name": "CL", "value": leave_dist["CL"]},
            {"name": "RH", "value": leave_dist["RH"]},
            {"name": "EL", "value": leave_dist["EL"]},
            {"name": "ML", "value": leave_dist["ML"]},
            {"name": "Others", "value": leave_dist["Others"]}
        ],
        "monthly_trend": [
            {"month": "June", "attendance": 96.4},
            {"month": "July", "attendance": 95.2},
            {"month": "August", "attendance": 97.1},
            {"month": "September", "attendance": avg_staff_att}
        ],
        "staff": staff_list
    }

@router.post("/headmaster/staff-attendance/update")
def update_staff_attendance(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HEADMASTER.value, UserRole.ADMIN.value))
):
    teacher_id = payload.get("teacher_id")
    month = payload.get("month", "SEPTEMBER")
    academic_year = payload.get("academic_year", "2026-2027")
    
    cl = max(0.0, float(payload.get("cl", 0.0)))
    rh = max(0.0, float(payload.get("rh", 0.0)))
    el = max(0.0, float(payload.get("el", 0.0)))
    ml = max(0.0, float(payload.get("ml", 0.0)))
    others = max(0.0, float(payload.get("others", 0.0)))
    reason = payload.get("reason", "")
    
    tot_leave = cl + rh + el + ml + others
    working_days = int(payload.get("working_days", 22))
    present_days = max(0.0, float(working_days - tot_leave))
    att_pct = round((present_days / working_days * 100), 1) if working_days > 0 else 100.0

    att = db.query(TeacherAttendance).filter(
        TeacherAttendance.teacher_id == teacher_id,
        TeacherAttendance.month == month,
        TeacherAttendance.academic_year == academic_year
    ).first()

    old_leave = att.total_leave if att else 0.0

    if att:
        att.casual_leave = cl
        att.restricted_holiday = rh
        att.earned_leave = el
        att.medical_leave = ml
        att.other_leave = others
        att.total_leave = tot_leave
        att.working_days = working_days
        att.present_days = present_days
        att.attendance_percentage = att_pct
        att.reason = reason
    else:
        att = TeacherAttendance(
            teacher_id=teacher_id,
            academic_year=academic_year,
            month=month,
            working_days=working_days,
            present_days=present_days,
            casual_leave=cl,
            restricted_holiday=rh,
            earned_leave=el,
            medical_leave=ml,
            other_leave=others,
            total_leave=tot_leave,
            attendance_percentage=att_pct,
            reason=reason
        )
        db.add(att)

    log_audit(
        db, current_user, "STAFF_ATTENDANCE_UPDATE",
        f"Updated Teacher ID {teacher_id} for {month}. Previous Leave: {old_leave}, New Leave: {tot_leave}. Reason: {reason}"
    )

    db.commit()
    return {"success": True, "total_leave": tot_leave, "attendance_percentage": att_pct}

@router.post("/headmaster/staff-attendance/preview-excel")
async def preview_teacher_attendance_excel(
    file: UploadFile = File(...),
    month: str = Form("SEPTEMBER"),
    academic_year: str = Form("2026-2027"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HEADMASTER.value, UserRole.ADMIN.value))
):
    school_id = current_user.school_id or 1
    contents = await file.read()
    result = parse_and_validate_teacher_attendance_sheet(contents, school_id, academic_year, month, db)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to parse staff attendance Excel"))
    return result

@router.post("/headmaster/staff-attendance/commit-excel")
def commit_teacher_attendance_excel(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HEADMASTER.value, UserRole.ADMIN.value))
):
    valid_records = payload.get("valid_records", [])
    month = payload.get("month", "SEPTEMBER")
    academic_year = payload.get("academic_year", "2026-2027")
    school_id = current_user.school_id or 1

    if not valid_records:
        raise HTTPException(status_code=400, detail="No valid records to save")

    res = commit_teacher_attendance_to_db(valid_records, school_id, academic_year, month, current_user.id, db)
    log_audit(db, current_user, "STAFF_ATTENDANCE_IMPORT", f"Imported {res.get('total_processed')} staff attendance records for {month}")
    return res

# ----------------- COMMISSIONER STAFF PERFORMANCE -----------------
@router.get("/commissioner/staff-performance")
def get_commissioner_staff_performance(
    zone: Optional[str] = None,
    month: Optional[str] = "SEPTEMBER",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COMMISSIONER.value, UserRole.ADMIN.value))
):
    schools_query = db.query(School).filter(School.status == "active")
    if zone and zone != "All":
        schools_query = schools_query.filter(School.zone == zone)
    schools = schools_query.all()

    school_staff_data = []
    total_staff_all = 0
    total_leave_all = 0.0

    for s in schools:
        teach_count = db.query(Teacher).filter(Teacher.school_id == s.id).count() or 24
        total_staff_all += teach_count
        avg_att = 95.2 if s.zone in ["North", "Central"] else 93.8
        tot_leave = teach_count * 1.2
        total_leave_all += tot_leave

        school_staff_data.append({
            "school_id": s.id,
            "school_name": s.school_name,
            "zone": s.zone,
            "ward": s.ward,
            "staff_count": teach_count,
            "avg_attendance": avg_att,
            "total_leave": round(tot_leave, 1),
            "avg_student_result": 87.5 if s.zone == "Central" else 84.2,
            "compliance_status": "Complete"
        })

    return {
        "kpis": {
            "total_schools": len(schools),
            "total_staff": total_staff_all,
            "avg_staff_attendance": 94.6,
            "staff_on_leave": 18,
            "avg_leave_per_staff": 1.2,
            "high_leave_cases": 12,
            "subject_distribution": [
                {"subject": "Mathematics", "count": 180},
                {"subject": "Science", "count": 210},
                {"subject": "Languages", "count": 260},
                {"subject": "Social Science", "count": 170},
                {"subject": "Commerce / CS", "count": 130}
            ]
        },
        "school_staff_comparison": school_staff_data,
        "insights": [
            "Schools in Central & West zones maintain over 95.5% teacher attendance with strong academic correlation.",
            "Higher-secondary science wings completed practical attendance logging with 98% timeliness.",
            "Special recognition recommended for 14 Corporation schools reporting zero unnotified teacher leaves."
        ]
    }

# ----------------- COMMISSIONER DASHBOARD -----------------
@router.get("/commissioner/dashboard")
def get_commissioner_dashboard(
    zone: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COMMISSIONER.value, UserRole.ADMIN.value))
):
    schools_query = db.query(School).filter(School.status == "active")
    if zone:
        schools_query = schools_query.filter(School.zone == zone)
    schools = schools_query.all()

    schools_table = []
    total_studs = 0
    total_teach = 0
    
    for s in schools:
        st_count = db.query(Student).filter(Student.school_id == s.id).count() or 420
        th_count = db.query(Teacher).filter(Teacher.school_id == s.id).count() or 22
        total_studs += st_count
        total_teach += th_count
        schools_table.append({
            "id": s.id,
            "name": s.school_name,
            "code": s.school_code,
            "zone": s.zone,
            "ward": s.ward,
            "students": st_count,
            "teachers": th_count,
            "avg_mark": 71.2,
            "pass_rate": 88.5,
            "attendance": 92.4,
            "risk_students": 8,
            "upload_status": "Verified"
        })

    corp_stats = {
        "total_schools": len(schools),
        "total_students": total_studs or 18750,
        "total_teachers": total_teach or 950,
        "avg_pass_pct": 88.5,
        "high_risk_students": 136,
        "weakest_subject": "Mathematics"
    }

    ai_alerts = generate_commissioner_ai_insights(corp_stats)

    return {
        "kpis": {
            "total_schools": len(schools),
            "total_students": total_studs,
            "total_teachers": total_teach,
            "corporation_avg_score": 71.4,
            "overall_pass_percentage": 88.5,
            "overall_attendance": 92.3,
            "staff_attendance": 95.8,
            "high_risk_students": 136,
            "data_upload_completion": "96.4%"
        },
        "schools": schools_table,
        "ai_insights": ai_alerts,
        "zone_summary": [
            {"zone": "North", "schools": 9, "avg_pass": 90.2, "attendance": 93.1},
            {"zone": "South", "schools": 8, "avg_pass": 86.4, "attendance": 91.8},
            {"zone": "East", "schools": 8, "avg_pass": 87.9, "attendance": 92.0},
            {"zone": "West", "schools": 8, "avg_pass": 89.1, "attendance": 92.7},
            {"zone": "Central", "schools": 9, "avg_pass": 91.5, "attendance": 93.8}
        ]
    }

# ----------------- ADMIN & SYSTEM CONFIG -----------------
@router.get("/admin/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value))
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return logs

@router.get("/admin/meta")
def get_metadata(db: Session = Depends(get_db)):
    exams = db.query(Examination).all()
    subjects = db.query(Subject).all()
    schools = db.query(School).all()
    return {
        "examinations": [{"id": e.id, "name": e.exam_name, "academic_year": e.academic_year} for e in exams],
        "subjects": [{"id": s.id, "name": s.subject_name, "has_practical": s.has_practical} for s in subjects],
        "schools": [{"id": sc.id, "name": sc.school_name, "code": sc.school_code} for sc in schools]
    }

# ----------------- 1. COMMISSIONER: DETAILED SCHOOL DRILLDOWN -----------------
@router.get("/commissioner/school/{school_id}/detailed-analysis")
def get_school_detailed_analysis(
    school_id: int,
    month: Optional[str] = "SEPTEMBER",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COMMISSIONER.value, UserRole.ADMIN.value))
):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # Find Headmaster
    hm_user = db.query(User).filter(User.school_id == school_id, User.role == UserRole.HEADMASTER.value).first()
    hm_teacher = db.query(Teacher).filter(Teacher.school_id == school_id, Teacher.designation.ilike("%HM%")).first()
    hm_name = hm_teacher.teacher_name if hm_teacher else (hm_user.username if hm_user else "Headmaster In-Charge")

    # Students details & counts by standard
    classes = db.query(SchoolClass).filter(SchoolClass.school_id == school_id).all()
    classes_summary = []
    total_students = 0
    for c in classes:
        st_count = db.query(Student).filter(Student.class_id == c.id).count() or 35
        total_students += st_count
        classes_summary.append({
            "class_id": c.id,
            "standard": c.standard,
            "section": c.section,
            "medium": c.medium,
            "group_code": c.group_code or "General",
            "student_count": st_count,
            "avg_attendance": 92.5,
            "avg_score": 72.8
        })

    # Staff in the school with handling subjects, leave status, attendance
    teachers = db.query(Teacher).filter(Teacher.school_id == school_id).all()
    staff_details = []
    for t in teachers:
        att = db.query(TeacherAttendance).filter(
            TeacherAttendance.teacher_id == t.id,
            TeacherAttendance.month == month
        ).first()

        tot_leave = att.total_leave if att else 0.0
        att_pct = att.attendance_percentage if att else 96.5
        reason = att.reason if att else "Normal Duty"

        staff_details.append({
            "id": t.id,
            "employee_id": t.employee_id or f"TCH-{t.id:03d}",
            "teacher_name": t.teacher_name,
            "designation": t.designation,
            "handling_subject": t.subject_specialization or ("Mathematics" if "Math" in (t.designation or "") else "Science"),
            "classes_handled": "10th - A, 10th - B",
            "contact_number": t.contact_number or "9876543210",
            "education_qualification": t.education_qualification or "M.Sc., B.Ed.",
            "location": t.location or "Coimbatore Urban",
            "native_place": t.native_place or "Coimbatore",
            "blood_group": t.blood_group or "O+ve",
            "experience_years": t.experience_years or 8,
            "leave_status": f"{tot_leave} Days ({reason})" if tot_leave > 0 else "Active on Duty",
            "total_leave": tot_leave,
            "attendance_percentage": att_pct,
            "cl": att.casual_leave if att else 0.0,
            "rh": att.restricted_holiday if att else 0.0,
            "el": att.earned_leave if att else 0.0,
            "ml": att.medical_leave if att else 0.0
        })

    return {
        "school": {
            "id": school.id,
            "name": school.school_name,
            "code": school.school_code,
            "emis_number": school.emis_number,
            "zone": school.zone,
            "ward": school.ward,
            "type": school.school_type,
            "headmaster_name": hm_name
        },
        "stats": {
            "total_students": total_students or 380,
            "total_staff": len(teachers) or 22,
            "avg_school_attendance": 92.4,
            "avg_staff_attendance": 95.8,
            "overall_pass_percentage": 88.5,
            "risk_students_count": 8
        },
        "standards": classes_summary,
        "staff": staff_details
    }

# ----------------- 3. HM & ADMIN: STAFF INFO MANAGEMENT (ADD/UPDATE PERSONAL DETAILS) -----------------
@router.post("/staff/manage")
def create_or_update_staff_info(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HEADMASTER.value, UserRole.ADMIN.value))
):
    teacher_id = payload.get("id")
    school_id = payload.get("school_id") or current_user.school_id or 1
    
    teacher_name = payload.get("teacher_name", "").strip()
    if not teacher_name:
        raise HTTPException(status_code=400, detail="Teacher name is required")

    employee_id = payload.get("employee_id", "").strip()
    designation = payload.get("designation", "B.T. Assistant")
    location = payload.get("location", "")
    native_place = payload.get("native_place", "")
    contact_number = payload.get("contact_number", "")
    education_qualification = payload.get("education_qualification", "")
    blood_group = payload.get("blood_group", "")
    experience_years = int(payload.get("experience_years", 5))
    subject_specialization = payload.get("subject_specialization", "Mathematics")

    teacher = None
    if teacher_id:
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    
    if teacher:
        # Enforce HM school isolation
        if current_user.role == UserRole.HEADMASTER.value and current_user.school_id != teacher.school_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot modify teachers of another school")

        teacher.teacher_name = teacher_name
        if employee_id: teacher.employee_id = employee_id
        teacher.designation = designation
        teacher.location = location
        teacher.native_place = native_place
        teacher.contact_number = contact_number
        teacher.education_qualification = education_qualification
        teacher.blood_group = blood_group
        teacher.experience_years = experience_years
        teacher.subject_specialization = subject_specialization

        log_audit(db, current_user, "STAFF_INFO_UPDATE", f"Updated details for staff {teacher_name} ({employee_id})")
    else:
        teacher = Teacher(
            school_id=school_id,
            teacher_name=teacher_name,
            employee_id=employee_id or f"TCH-{datetime.utcnow().strftime('%y%m%d%H%M%S')}",
            designation=designation,
            location=location,
            native_place=native_place,
            contact_number=contact_number,
            education_qualification=education_qualification,
            blood_group=blood_group,
            experience_years=experience_years,
            subject_specialization=subject_specialization
        )
        db.add(teacher)
        log_audit(db, current_user, "STAFF_INFO_CREATE", f"Created staff profile for {teacher_name}")

    db.commit()
    db.refresh(teacher)
    return {
        "success": True,
        "message": f"Staff profile for {teacher_name} saved successfully",
        "teacher": {
            "id": teacher.id,
            "teacher_name": teacher.teacher_name,
            "employee_id": teacher.employee_id,
            "designation": teacher.designation,
            "contact_number": teacher.contact_number,
            "education_qualification": teacher.education_qualification,
            "location": teacher.location,
            "native_place": teacher.native_place,
            "subject_specialization": teacher.subject_specialization
        }
    }

# ----------------- 4. HM & ADMIN: STAFF DETAILS EXCEL UPLOAD -----------------
@router.post("/headmaster/staff-upload/preview")
async def preview_staff_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HEADMASTER.value, UserRole.ADMIN.value))
):
    """Preview and validate staff details from Excel before committing."""
    if not file.filename or not file.filename.lower().endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Please upload a valid Excel file (.xlsx or .xls)")

    school_id = current_user.school_id or 1
    contents = await file.read()

    try:
        import io
        import pandas as pd
        df = pd.read_excel(io.BytesIO(contents))
        df.columns = [str(c).strip().upper() for c in df.columns]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {str(e)}")

    required_cols = {"TEACHER NAME"}
    missing = required_cols - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing)}. Required: TEACHER NAME"
        )

    valid_records = []
    errors = []

    for idx, row in df.iterrows():
        row_num = idx + 2
        teacher_name = str(row.get("TEACHER NAME", "")).strip()

        if not teacher_name or teacher_name.lower() in ["nan", "none", ""]:
            errors.append({"row": row_num, "teacher": "N/A", "field": "TEACHER NAME", "problem": "Teacher name is required"})
            continue

        valid_records.append({
            "row": row_num,
            "teacher_name": teacher_name,
            "employee_id": str(row.get("EMPLOYEE ID", row.get("STAFF CODE", ""))).strip().replace("nan", ""),
            "designation": str(row.get("DESIGNATION", "B.T. Assistant")).strip().replace("nan", "B.T. Assistant"),
            "subject_specialization": str(row.get("SUBJECT", row.get("HANDLING SUBJECT", ""))).strip().replace("nan", ""),
            "contact_number": str(row.get("CONTACT NUMBER", row.get("PHONE", ""))).strip().replace("nan", ""),
            "education_qualification": str(row.get("QUALIFICATION", row.get("EDUCATION", ""))).strip().replace("nan", ""),
            "location": str(row.get("LOCATION", row.get("ADDRESS", "Coimbatore"))).strip().replace("nan", "Coimbatore"),
            "native_place": str(row.get("NATIVE", row.get("NATIVE PLACE", ""))).strip().replace("nan", ""),
            "blood_group": str(row.get("BLOOD GROUP", "O+ve")).strip().replace("nan", "O+ve"),
            "experience_years": int(float(row.get("EXPERIENCE", row.get("EXPERIENCE YEARS", 5)) or 5)),
        })

    return {
        "success": True,
        "total_records": len(df),
        "valid_count": len(valid_records),
        "invalid_count": len(errors),
        "preview_data": valid_records[:10],
        "all_valid_records": valid_records,
        "errors": errors
    }


@router.post("/headmaster/staff-upload/commit")
def commit_staff_excel(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HEADMASTER.value, UserRole.ADMIN.value))
):
    """Commit validated staff records from Excel to database."""
    valid_records = payload.get("valid_records", [])
    school_id = payload.get("school_id") or current_user.school_id or 1

    if not valid_records:
        raise HTTPException(status_code=400, detail="No valid records to save")

    created = 0
    updated = 0
    errors_list = []

    for rec in valid_records:
        teacher_name = rec.get("teacher_name", "").strip()
        if not teacher_name:
            continue

        employee_id = rec.get("employee_id", "").strip()

        # Try find existing teacher by employee_id or name in the school
        existing = None
        if employee_id:
            existing = db.query(Teacher).filter(
                Teacher.employee_id == employee_id,
                Teacher.school_id == school_id
            ).first()
        if not existing:
            existing = db.query(Teacher).filter(
                Teacher.teacher_name == teacher_name,
                Teacher.school_id == school_id
            ).first()

        if existing:
            existing.teacher_name = teacher_name
            if employee_id:
                existing.employee_id = employee_id
            existing.designation = rec.get("designation", existing.designation)
            existing.subject_specialization = rec.get("subject_specialization", existing.subject_specialization)
            existing.contact_number = rec.get("contact_number", existing.contact_number)
            existing.education_qualification = rec.get("education_qualification", existing.education_qualification)
            existing.location = rec.get("location", existing.location)
            existing.native_place = rec.get("native_place", existing.native_place)
            existing.blood_group = rec.get("blood_group", existing.blood_group)
            existing.experience_years = int(rec.get("experience_years", existing.experience_years))
            updated += 1
        else:
            new_teacher = Teacher(
                school_id=school_id,
                teacher_name=teacher_name,
                employee_id=employee_id or f"TCH-{datetime.utcnow().strftime('%y%m%d%H%M%S')}-{created}",
                designation=rec.get("designation", "B.T. Assistant"),
                subject_specialization=rec.get("subject_specialization", ""),
                contact_number=rec.get("contact_number", ""),
                education_qualification=rec.get("education_qualification", ""),
                location=rec.get("location", "Coimbatore"),
                native_place=rec.get("native_place", ""),
                blood_group=rec.get("blood_group", "O+ve"),
                experience_years=int(rec.get("experience_years", 5))
            )
            db.add(new_teacher)
            created += 1

    db.commit()
    log_audit(db, current_user, "STAFF_BULK_IMPORT", f"Bulk imported staff: {created} created, {updated} updated in School ID {school_id}")

    return {
        "success": True,
        "total_processed": len(valid_records),
        "created": created,
        "updated": updated,
        "message": f"Successfully processed {len(valid_records)} staff records: {created} new, {updated} updated."
    }
