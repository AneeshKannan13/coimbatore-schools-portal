from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import SessionLocal, engine, Base
from app.models.entities import (
    School, User, Teacher, Subject, Examination, ExamSubjectPattern,
    HomePageContent, SchoolClass, Student, StudentMark, TeacherAttendance,
    StudentAttendance, TeacherSubjectAllocation, UserRole
)
from app.security.auth import get_password_hash


def ensure_schema_columns(db: Session):
    """Ensure all tables and any newly added columns exist on the active database."""
    Base.metadata.create_all(bind=engine)
    try:
        for table_name, table_obj in Base.metadata.tables.items():
            res = db.execute(text(f"PRAGMA table_info({table_name});")).fetchall()
            existing_cols = {r[1] for r in res}
            for col in table_obj.columns:
                if col.name not in existing_cols:
                    col_type = str(col.type)
                    db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type};"))
        db.commit()
    except Exception as e:
        print("Schema check note:", e)



def seed_rich_school_data(db: Session):
    """Ensure every school has realistic teachers, classes, students, marks across all 5 ranges, and attendance."""
    schools = db.query(School).all()
    if not schools:
        return

    # Ensure core subjects exist
    core_subject_names = ["Tamil", "English", "Maths", "Science", "Social Science"]
    subject_map = {}
    for sname in core_subject_names:
        subj = db.query(Subject).filter(Subject.subject_name == sname).first()
        if not subj:
            subj = Subject(subject_code=sname.upper()[:10], subject_name=sname, has_practical=(sname == "Science"))
            db.add(subj)
            db.commit()
            db.refresh(subj)
        subject_map[sname] = subj

    # Ensure Quarterly exam exists
    exam = db.query(Examination).filter(Examination.exam_name == "Quarterly Examination").first()
    if not exam:
        exam = Examination(exam_name="Quarterly Examination", academic_year="2026-2027", is_active=True)
        db.add(exam)
        db.commit()
        db.refresh(exam)

    # Check if we already seeded rich marks
    if db.query(StudentMark).count() > 20:
        return

    # Clear existing partial students/marks so we have clean, consistent relationships
    db.query(StudentMark).delete()
    db.query(TeacherSubjectAllocation).delete()
    db.commit()

    staff_templates = [
        {
            "name": "S. Ravi Kumar",
            "desig": "B.T. Assistant",
            "subj": "Maths",
            "qual": "M.Sc., B.Ed., M.Phil.",
            "loc": "R.S. Puram, Coimbatore",
            "native": "Pollachi",
            "phone": "9842101101",
            "bg": "O+ve",
            "exp": 11,
            "cl": 1.0, "rh": 0.0, "el": 0.0, "ml": 0.0, "reason": "Personal Work"
        },
        {
            "name": "M. Lakshmi Devi",
            "desig": "B.T. Assistant",
            "subj": "Tamil",
            "qual": "M.A. (Tamil), B.Ed.",
            "loc": "Saibaba Colony, Coimbatore",
            "native": "Udumalpet",
            "phone": "9842101102",
            "bg": "B+ve",
            "exp": 14,
            "cl": 0.0, "rh": 0.0, "el": 0.0, "ml": 0.0, "reason": "Regular Duty"
        },
        {
            "name": "K. Anitha Grace",
            "desig": "B.T. Assistant",
            "subj": "English",
            "qual": "M.A. (English), B.Ed.",
            "loc": "Race Course, Coimbatore",
            "native": "Coonoor",
            "phone": "9842101103",
            "bg": "A+ve",
            "exp": 9,
            "cl": 1.0, "rh": 1.0, "el": 0.0, "ml": 0.0, "reason": "Family Function"
        },
        {
            "name": "Dr. P. Senthil Nathan",
            "desig": "PG Assistant",
            "subj": "Science",
            "qual": "M.Sc. (Physics), B.Ed., Ph.D.",
            "loc": "Peelamedu, Coimbatore",
            "native": "Erode",
            "phone": "9842101104",
            "bg": "AB+ve",
            "exp": 16,
            "cl": 0.0, "rh": 0.0, "el": 2.0, "ml": 0.0, "reason": "Science Expo Duty"
        },
        {
            "name": "V. Meenakshi Sundaram",
            "desig": "B.T. Assistant",
            "subj": "Social Science",
            "qual": "M.A. (History), B.Ed.",
            "loc": "Gandhipuram, Coimbatore",
            "native": "Palani",
            "phone": "9842101105",
            "bg": "O-ve",
            "exp": 8,
            "cl": 0.5, "rh": 0.0, "el": 0.0, "ml": 1.0, "reason": "Medical Checkup"
        },
        {
            "name": "R. Karthikeyan",
            "desig": "PG Assistant",
            "subj": "Maths",
            "qual": "M.Sc. (Maths), B.Ed.",
            "loc": "Singanallur, Coimbatore",
            "native": "Tiruppur",
            "phone": "9842101106",
            "bg": "B+ve",
            "exp": 12,
            "cl": 0.0, "rh": 0.0, "el": 0.0, "ml": 0.0, "reason": "Regular Duty"
        },
        {
            "name": "G. Saranya Priya",
            "desig": "PG Assistant",
            "subj": "Science",
            "qual": "M.Sc. (Chemistry), B.Ed.",
            "loc": "Vadavalli, Coimbatore",
            "native": "Mettupalayam",
            "phone": "9842101107",
            "bg": "A-ve",
            "exp": 7,
            "cl": 1.0, "rh": 0.0, "el": 0.0, "ml": 0.0, "reason": "Casual Leave"
        },
    ]

    # Student profiles with marks specifically designed to populate all 5 mark buckets:
    # 1. Above 90 (>90)
    # 2. 75 to 90 (75-90)
    # 3. 50 to 75 (50-75)
    # 4. 35 to 50 (35-50)
    # 5. Below 35 (<35) AND students with a single low subject mark!
    student_profiles = [
        # Above 90 bucket
        {"name": "Harini S", "gender": "Female", "std": "10", "sec": "A", "att": 98.2,
         "marks": {"Tamil": 95, "English": 92, "Maths": 98, "Science": 96, "Social Science": 94}},
        {"name": "Kavya Dharshini M", "gender": "Female", "std": "10", "sec": "A", "att": 97.0,
         "marks": {"Tamil": 91, "English": 94, "Maths": 96, "Science": 92, "Social Science": 95}},
        {"name": "Pranav Krishna R", "gender": "Male", "std": "10", "sec": "B", "att": 96.5,
         "marks": {"Tamil": 90, "English": 91, "Maths": 95, "Science": 93, "Social Science": 92}},
        {"name": "Divya Bharathi K", "gender": "Female", "std": "12", "sec": "A", "att": 99.0,
         "marks": {"Tamil": 94, "English": 93, "Maths": 97, "Science": 95, "Social Science": 96}},

        # 75 to 90 bucket
        {"name": "Bhuvaneshwari K", "gender": "Female", "std": "10", "sec": "A", "att": 95.5,
         "marks": {"Tamil": 86, "English": 84, "Maths": 88, "Science": 82, "Social Science": 89}},
        {"name": "Arun Kumar S", "gender": "Male", "std": "10", "sec": "A", "att": 94.2,
         "marks": {"Tamil": 80, "English": 78, "Maths": 82, "Science": 76, "Social Science": 85}},
        {"name": "Deepika R", "gender": "Female", "std": "10", "sec": "A", "att": 92.8,
         "marks": {"Tamil": 84, "English": 88, "Maths": 75, "Science": 80, "Social Science": 82}},
        {"name": "Santhosh Kumar V", "gender": "Male", "std": "10", "sec": "B", "att": 93.4,
         "marks": {"Tamil": 79, "English": 81, "Maths": 85, "Science": 78, "Social Science": 80}},
        {"name": "Lavanya M", "gender": "Female", "std": "11", "sec": "A", "att": 94.0,
         "marks": {"Tamil": 85, "English": 82, "Maths": 79, "Science": 84, "Social Science": 86}},
        {"name": "Manoj Kumar T", "gender": "Male", "std": "12", "sec": "A", "att": 91.5,
         "marks": {"Tamil": 78, "English": 76, "Maths": 84, "Science": 81, "Social Science": 79}},

        # 50 to 75 bucket (includes some with 1 low-ish or single-subject fail to demonstrate single-subject low mark highlight!)
        {"name": "Gowtham P", "gender": "Male", "std": "10", "sec": "B", "att": 88.5,
         "marks": {"Tamil": 68, "English": 64, "Maths": 58, "Science": 62, "Social Science": 70}},
        {"name": "Karthik N", "gender": "Male", "std": "11", "sec": "A", "att": 87.2,
         "marks": {"Tamil": 72, "English": 65, "Maths": 54, "Science": 60, "Social Science": 68}},
        {"name": "Nithya Sri B", "gender": "Female", "std": "10", "sec": "A", "att": 89.0,
         "marks": {"Tamil": 74, "English": 70, "Maths": 41, "Science": 66, "Social Science": 72}},  # Low mark in Maths (41)
        {"name": "Vigneshwaran D", "gender": "Male", "std": "10", "sec": "A", "att": 86.0,
         "marks": {"Tamil": 65, "English": 62, "Maths": 28, "Science": 64, "Social Science": 68}},  # Single subject FAIL in Maths (28)!
        {"name": "Keerthana S", "gender": "Female", "std": "10", "sec": "B", "att": 90.2,
         "marks": {"Tamil": 69, "English": 66, "Maths": 61, "Science": 31, "Social Science": 71}},  # Single subject FAIL in Science (31)!
        {"name": "Surya Prakash J", "gender": "Male", "std": "11", "sec": "A", "att": 85.4,
         "marks": {"Tamil": 58, "English": 55, "Maths": 52, "Science": 59, "Social Science": 62}},

        # 35 to 50 bucket (Borderline pass or single subject fail)
        {"name": "Chandran M", "gender": "Male", "std": "10", "sec": "A", "att": 76.0,
         "marks": {"Tamil": 46, "English": 42, "Maths": 38, "Science": 41, "Social Science": 48}},
        {"name": "Dinesh Babu K", "gender": "Male", "std": "10", "sec": "B", "att": 78.5,
         "marks": {"Tamil": 48, "English": 44, "Maths": 36, "Science": 39, "Social Science": 45}},
        {"name": "Pooja Devi R", "gender": "Female", "std": "11", "sec": "A", "att": 79.2,
         "marks": {"Tamil": 49, "English": 45, "Maths": 39, "Science": 42, "Social Science": 47}},
        {"name": "Ramesh Kannan S", "gender": "Male", "std": "12", "sec": "A", "att": 75.0,
         "marks": {"Tamil": 45, "English": 38, "Maths": 29, "Science": 44, "Social Science": 46}},  # Fail in Maths (29)

        # Below 35 bucket (Multiple subjects < 35 / Overall average < 35)
        {"name": "Elango V", "gender": "Male", "std": "10", "sec": "A", "att": 68.5,
         "marks": {"Tamil": 36, "English": 28, "Maths": 22, "Science": 29, "Social Science": 34}},
        {"name": "Saravanan M", "gender": "Male", "std": "10", "sec": "B", "att": 65.0,
         "marks": {"Tamil": 32, "English": 25, "Maths": 19, "Science": 27, "Social Science": 33}},
        {"name": "Tamilselvan A", "gender": "Male", "std": "11", "sec": "A", "att": 64.2,
         "marks": {"Tamil": 34, "English": 30, "Maths": 24, "Science": 26, "Social Science": 31}},
        {"name": "abitha Begum S", "gender": "Female", "std": "12", "sec": "A", "att": 70.0,
         "marks": {"Tamil": 38, "English": 29, "Maths": 21, "Science": 25, "Social Science": 32}},
    ]

    for s_idx, school in enumerate(schools):
        # Ensure classes exist for this school
        class_defs = [
            ("10", "A", "English Medium", "General"),
            ("10", "B", "Tamil Medium", "General"),
            ("11", "A", "English Medium", "Bio-Maths"),
            ("12", "A", "English Medium", "Comp-Sci"),
        ]
        school_classes = {}
        for std, sec, med, grp in class_defs:
            cls = db.query(SchoolClass).filter(
                SchoolClass.school_id == school.id,
                SchoolClass.standard == std,
                SchoolClass.section == sec
            ).first()
            if not cls:
                cls = SchoolClass(school_id=school.id, standard=std, section=sec, medium=med, group_code=grp)
                db.add(cls)
                db.commit()
                db.refresh(cls)
            school_classes[(std, sec)] = cls

        # Seed or update teachers for this school
        school_teachers_by_subj = {}
        existing_teachers = db.query(Teacher).filter(Teacher.school_id == school.id).all()
        
        for t_idx, tpl in enumerate(staff_templates):
            emp_code = f"TCH-{school.id:02d}-{t_idx+1:03d}"
            # If School 1 & first teacher, reuse existing teacher_ravi if present
            if s_idx == 0 and t_idx == 0 and existing_teachers:
                t_obj = existing_teachers[0]
                t_obj.teacher_name = tpl["name"]
                t_obj.designation = tpl["desig"]
                t_obj.subject_specialization = tpl["subj"]
                t_obj.education_qualification = tpl["qual"]
                t_obj.location = tpl["loc"]
                t_obj.native_place = tpl["native"]
                t_obj.contact_number = tpl["phone"]
                t_obj.blood_group = tpl["bg"]
                t_obj.experience_years = tpl["exp"]
                db.commit()
            else:
                t_obj = db.query(Teacher).filter(Teacher.employee_id == emp_code).first()
                if not t_obj:
                    t_obj = Teacher(
                        employee_id=emp_code,
                        school_id=school.id,
                        teacher_name=tpl["name"] if s_idx == 0 else f"{tpl['name']} ({school.zone[0]})",
                        designation=tpl["desig"],
                        subject_specialization=tpl["subj"],
                        education_qualification=tpl["qual"],
                        location=tpl["loc"],
                        native_place=tpl["native"],
                        contact_number=f"98421{school.id:02d}{t_idx+1:03d}",
                        blood_group=tpl["bg"],
                        experience_years=tpl["exp"]
                    )
                    db.add(t_obj)
                    db.commit()
                    db.refresh(t_obj)

            if tpl["subj"] not in school_teachers_by_subj:
                school_teachers_by_subj[tpl["subj"]] = []
            school_teachers_by_subj[tpl["subj"]].append(t_obj)

            # Ensure TeacherAttendance for SEPTEMBER
            working_days = 22
            tot_leave = tpl["cl"] + tpl["rh"] + tpl["el"] + tpl["ml"]
            present_days = working_days - tot_leave
            att_pct = round((present_days / working_days) * 100, 1)
            existing_att = db.query(TeacherAttendance).filter(
                TeacherAttendance.teacher_id == t_obj.id,
                TeacherAttendance.month == "SEPTEMBER"
            ).first()
            if not existing_att:
                db.add(TeacherAttendance(
                    teacher_id=t_obj.id,
                    academic_year="2026-2027",
                    month="SEPTEMBER",
                    working_days=working_days,
                    present_days=present_days,
                    casual_leave=tpl["cl"],
                    restricted_holiday=tpl["rh"],
                    earned_leave=tpl["el"],
                    medical_leave=tpl["ml"],
                    other_leave=0.0,
                    total_leave=tot_leave,
                    attendance_percentage=att_pct,
                    reason=tpl["reason"]
                ))
        db.commit()

        # Allocate teachers to classes & subjects
        for (std, sec), cls_obj in school_classes.items():
            for sname, subj_obj in subject_map.items():
                candidates = school_teachers_by_subj.get(sname, [])
                if candidates:
                    # Pick 2nd teacher for Higher Secondary (11/12) if available
                    chosen_teacher = candidates[-1] if std in ["11", "12"] and len(candidates) > 1 else candidates[0]
                    db.add(TeacherSubjectAllocation(
                        teacher_id=chosen_teacher.id,
                        class_id=cls_obj.id,
                        subject_id=subj_obj.id,
                        academic_year="2026-2027"
                    ))
        db.commit()

        # Remove old students for this school and re-seed full set
        db.query(Student).filter(Student.school_id == school.id).delete()
        db.commit()

        for st_idx, sp in enumerate(student_profiles):
            emis_no = f"33120{school.id:02d}{st_idx+1:04d}"
            cls_obj = school_classes[(sp["std"], sp["sec"])]
            student_name = sp["name"]
            if student_name[0].islower():
                student_name = "A" + student_name[1:]

            st_obj = Student(
                emis_number=emis_no,
                school_id=school.id,
                student_name=student_name,
                gender=sp["gender"],
                class_id=cls_obj.id,
                status="active"
            )
            db.add(st_obj)
            db.commit()
            db.refresh(st_obj)

            # Add StudentAttendance
            w_days = 110
            p_days = round(w_days * (sp["att"] / 100.0))
            db.add(StudentAttendance(
                student_id=st_obj.id,
                academic_year="2026-2027",
                month="SEPTEMBER",
                working_days=w_days,
                days_present=p_days,
                days_absent=w_days - p_days,
                percentage=sp["att"]
            ))

            # Add Marks for all 5 subjects
            for sname, base_mark in sp["marks"].items():
                subj_obj = subject_map[sname]
                # Small school offset so different schools have slightly varied marks while preserving bucket
                offset = ((s_idx + st_idx) % 3) - 1 if s_idx > 0 else 0
                final_mark = float(max(12, min(100, base_mark + offset)))
                # Keep fail marks < 35 and pass marks >= 35 faithful to the template
                if base_mark < 35 and final_mark >= 35:
                    final_mark = 33.0
                elif base_mark >= 35 and final_mark < 35:
                    final_mark = 35.0

                is_pass = final_mark >= 35.0
                grade = (
                    "A+" if final_mark >= 90 else
                    "A" if final_mark >= 75 else
                    "B" if final_mark >= 60 else
                    "C" if final_mark >= 50 else
                    "D" if final_mark >= 35 else "F"
                )
                db.add(StudentMark(
                    student_id=st_obj.id,
                    exam_id=exam.id,
                    subject_id=subj_obj.id,
                    theory_mark=final_mark,
                    practical_mark=0.0,
                    internal_mark=0.0,
                    total_mark=final_mark,
                    max_mark=100.0,
                    percentage=final_mark,
                    grade=grade,
                    is_pass=is_pass,
                    status="finalized"
                ))
        db.commit()
    print("Rich school, staff, student, and mark range data seeded successfully.")


def init_db_seeds():
    db: Session = SessionLocal()
    try:
        ensure_schema_columns(db)
        # Check if users already seeded
        if db.query(User).count() > 0:
            seed_rich_school_data(db)
            return


        # 1. Seed Corporation Schools
        schools_data = [
            {"code": "CCMC-HSS-01", "emis": "331201001", "name": "Coimbatore Corporation Higher Secondary School, R.S. Puram", "ward": "Ward 23", "zone": "West", "type": "Higher Secondary"},
            {"code": "CCMC-HSS-02", "emis": "331201002", "name": "Coimbatore Corporation Girls HSS, R.N. Puram", "ward": "Ward 64", "zone": "Central", "type": "Higher Secondary"},
            {"code": "CCMC-HSS-03", "emis": "331201003", "name": "Coimbatore Corporation Boys HSS, Ramanathapuram", "ward": "Ward 65", "zone": "South", "type": "Higher Secondary"},
            {"code": "CCMC-HSS-04", "emis": "331201004", "name": "Coimbatore Corporation HSS, Oppanakara Street", "ward": "Ward 72", "zone": "South", "type": "Higher Secondary"},
            {"code": "CCMC-HSS-05", "emis": "331201005", "name": "Coimbatore Corporation HSS, Maniakarampalayam", "ward": "Ward 12", "zone": "North", "type": "Higher Secondary"},
            {"code": "CCMC-HSS-06", "emis": "331201006", "name": "Coimbatore Corporation HSS, Peelamedu", "ward": "Ward 38", "zone": "East", "type": "Higher Secondary"},
            {"code": "CCMC-HSS-07", "emis": "331201007", "name": "Coimbatore Corporation HSS, Singanallur", "ward": "Ward 58", "zone": "East", "type": "Higher Secondary"},
        ]
        
        created_schools = []
        for s in schools_data:
            sch = School(
                school_code=s["code"],
                emis_number=s["emis"],
                school_name=s["name"],
                ward=s["ward"],
                zone=s["zone"],
                school_type=s["type"],
                status="active"
            )
            db.add(sch)
            created_schools.append(sch)
        db.commit()

        # 2. Seed Users
        # Commissioner
        commissioner = User(
            username="commissioner",
            email="commissioner@ccmc.gov.in",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.COMMISSIONER.value,
            school_id=None
        )
        # Admin
        admin = User(
            username="admin",
            email="admin@ccmc.gov.in",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.ADMIN.value,
            school_id=None
        )
        # Headmaster for School 1
        hm = User(
            username="hm_rspuram",
            email="hm.rspuram@ccmc.gov.in",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.HEADMASTER.value,
            school_id=created_schools[0].id
        )
        # Teacher for School 1
        teacher_user = User(
            username="teacher_ravi",
            email="ravi.maths@ccmc.gov.in",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.STAFF.value,
            school_id=created_schools[0].id
        )
        db.add_all([commissioner, admin, hm, teacher_user])
        db.commit()

        # Teacher Profile
        teacher_profile = Teacher(
            employee_id="TCH-2026-001",
            user_id=teacher_user.id,
            school_id=created_schools[0].id,
            teacher_name="Ravi Kumar M.Sc., B.Ed.",
            designation="B.T. Assistant (Mathematics)"
        )
        db.add(teacher_profile)
        db.commit()

        # 3. Seed Subjects matching Tamil Nadu Board & Excel Reference
        subjects_data = [
            ("Tamil", False),
            ("English", False),
            ("Maths", False),
            ("Science", True),
            ("Social Science", False),
            ("Physics", True),
            ("Chemistry", True),
            ("Biology", True),
            ("Computer Science", True),
            ("Commerce", False),
            ("Accountancy", False),
            ("Economics", False),
            ("Business Maths", False),
            ("Computer Applications", True)
        ]
        created_subjects = []
        for name, has_prac in subjects_data:
            subj = Subject(
                subject_code=name.upper()[:10],
                subject_name=name,
                has_practical=has_prac
            )
            db.add(subj)
            created_subjects.append(subj)
        db.commit()

        # 4. Seed Examinations
        exams_data = [
            ("Quarterly Examination", "2026-2027"),
            ("Half-Yearly Examination", "2026-2027"),
            ("Annual Examination", "2026-2027"),
            ("First Mid-Term", "2026-2027")
        ]
        created_exams = []
        for name, yr in exams_data:
            ex = Examination(exam_name=name, academic_year=yr, is_active=True)
            db.add(ex)
            created_exams.append(ex)
        db.commit()

        # 5. Seed Classes & Students for School 1
        c10a = SchoolClass(school_id=created_schools[0].id, standard="10", section="A", medium="English Medium")
        c10b = SchoolClass(school_id=created_schools[0].id, standard="10", section="B", medium="Tamil Medium")
        c11a = SchoolClass(school_id=created_schools[0].id, standard="11", section="A", medium="English Medium", group_code="Bio-Maths")
        c12a = SchoolClass(school_id=created_schools[0].id, standard="12", section="A", medium="English Medium", group_code="Comp-Sci")
        db.add_all([c10a, c10b, c11a, c12a])
        db.commit()

        students_seed = [
            ("331201001001", "Arun Kumar S", c10a),
            ("331201001002", "Bhuvaneshwari K", c10a),
            ("331201001003", "Chandran M", c10a),
            ("331201001004", "Deepika R", c10a),
            ("331201001005", "Elango V", c10a),
            ("331201001006", "Gowtham P", c10b),
            ("331201001007", "Harini S", c10b),
            ("331201001008", "Karthik N", c11a),
            ("331201001009", "Lavanya M", c11a),
            ("331201001010", "Manoj Kumar T", c12a)
        ]
        for emis, sname, cls in students_seed:
            st = Student(
                emis_number=emis,
                school_id=created_schools[0].id,
                student_name=sname,
                class_id=cls.id
            )
            db.add(st)
        db.commit()

        # 6. Seed Home Page Content (Hero slider, achievements)
        slides = [
            HomePageContent(
                section="hero_slide",
                title="Empowering Future Leaders in Corporation Schools",
                description="Coimbatore City Municipal Corporation educational institutions deliver smart classrooms, AI analytics, and state-of-the-art laboratory infrastructure.",
                school_name="Coimbatore Corporation HSS, R.S. Puram",
                category="Infrastructure & Academics",
                image_url="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80",
                event_date="Academic Year 2026-27"
            ),
            HomePageContent(
                section="hero_slide",
                title="State Level Science & Innovation Expo 2026",
                description="Corporation school students bagged 1st prize in IoT-based green city smart models.",
                school_name="Coimbatore Corporation Girls HSS, R.N. Puram",
                category="Science & Innovation",
                image_url="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
                event_date="September 2026"
            ),
            HomePageContent(
                section="hero_slide",
                title="Inter-School Athletics Championship Victories",
                description="Historic victory in district relay and athletics championships by Corporation student sprinters.",
                school_name="Coimbatore Corporation Boys HSS, Ramanathapuram",
                category="Sports & Athletics",
                image_url="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
                event_date="August 2026"
            )
        ]
        achievements = [
            HomePageContent(
                section="achievement",
                title="100% Pass Milestone in Higher Secondary Board",
                description="Seven Corporation schools achieved 100% pass percentages in Tamil Nadu State Board examinations.",
                school_name="Peelamedu & Singanallur Wings",
                category="Board Results",
                event_date="2026"
            ),
            HomePageContent(
                section="achievement",
                title="Corporation Robotics & Coding Labs Installed",
                description="Modern coding, robotic kit and STEM labs fully operational across all high and higher secondary corporation schools.",
                school_name="All 42 Corporation Schools",
                category="Technological Advancement",
                event_date="2026"
            )
        ]
        db.add_all(slides + achievements)
        db.commit()

        seed_rich_school_data(db)
        print("Database initialized and seeded successfully.")
    finally:
        db.close()
