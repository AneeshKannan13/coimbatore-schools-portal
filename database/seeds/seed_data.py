from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.entities import (
    School, User, Teacher, Subject, Examination, ExamSubjectPattern,
    HomePageContent, SchoolClass, Student, StudentMark, UserRole
)
from app.security.auth import get_password_hash

def init_db_seeds():
    db: Session = SessionLocal()
    try:
        # Check if users already seeded
        if db.query(User).count() > 0:
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

        print("Database initialized and seeded successfully.")
    finally:
        db.close()
