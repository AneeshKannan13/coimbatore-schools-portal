from sqlalchemy import (
    Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Enum
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database.session import Base

class UserRole(str, enum.Enum):
    STAFF = "STAFF"
    HEADMASTER = "HEADMASTER"
    COMMISSIONER = "COMMISSIONER"
    ADMIN = "ADMIN"

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    school_code = Column(String(50), unique=True, index=True, nullable=False)
    emis_number = Column(String(50), unique=True, index=True, nullable=True)
    school_name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    ward = Column(String(50), nullable=True)
    zone = Column(String(50), nullable=True) # North, South, East, West, Central
    school_type = Column(String(50), default="Higher Secondary") # High School, Higher Secondary
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="school")
    teachers = relationship("Teacher", back_populates="school")
    students = relationship("Student", back_populates="school")
    classes = relationship("SchoolClass", back_populates="school")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.STAFF.value, nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("School", back_populates="users")
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    teacher_name = Column(String(255), nullable=False)
    designation = Column(String(100), default="B.T. Assistant") # PG Assistant, B.T. Assistant, HM
    location = Column(String(255), nullable=True) # Current posting location / Address
    native_place = Column(String(255), nullable=True) # Native town / district
    contact_number = Column(String(20), nullable=True) # Phone number
    education_qualification = Column(String(255), nullable=True) # e.g. M.Sc., B.Ed., M.Phil
    blood_group = Column(String(10), nullable=True) # e.g. O+ve, B+ve
    experience_years = Column(Integer, default=5)
    subject_specialization = Column(String(100), nullable=True) # Mathematics, Science, etc.
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="teacher_profile")
    school = relationship("School", back_populates="teachers")
    allocations = relationship("TeacherSubjectAllocation", back_populates="teacher")
    attendance_records = relationship("TeacherAttendance", back_populates="teacher")

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    year_label = Column(String(20), unique=True, nullable=False) # e.g. "2026-2027"
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(50), unique=True, index=True, nullable=False)
    subject_name = Column(String(100), nullable=False) # Tamil, English, Maths, Physics, etc.
    aliases = Column(String(255), nullable=True) # JSON or comma-separated e.g. "COMP SCI,CS,COMPUTER"
    has_practical = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

class SchoolClass(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    standard = Column(String(20), nullable=False) # "9", "10", "11", "12"
    section = Column(String(10), nullable=False) # "A", "B", "C"
    medium = Column(String(50), default="Tamil Medium") # Tamil Medium, English Medium
    group_code = Column(String(50), nullable=True) # e.g. "Bio-Maths", "Comp-Sci", "Commerce"

    school = relationship("School", back_populates="classes")
    students = relationship("Student", back_populates="school_class")
    allocations = relationship("TeacherSubjectAllocation", back_populates="school_class")

class TeacherSubjectAllocation(Base):
    __tablename__ = "teacher_subject_allocations"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    academic_year = Column(String(20), nullable=False)

    teacher = relationship("Teacher", back_populates="allocations")
    school_class = relationship("SchoolClass", back_populates="allocations")
    subject = relationship("Subject")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    emis_number = Column(String(50), unique=True, index=True, nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    student_name = Column(String(255), nullable=False)
    gender = Column(String(20), nullable=True) # Male, Female
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("School", back_populates="students")
    school_class = relationship("SchoolClass", back_populates="students")
    marks = relationship("StudentMark", back_populates="student")
    attendance = relationship("StudentAttendance", back_populates="student")

class Examination(Base):
    __tablename__ = "examinations"

    id = Column(Integer, primary_key=True, index=True)
    exam_name = Column(String(100), nullable=False) # Quarterly, Half-Yearly, Annual, Mid-Term 1
    academic_year = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)

    marks = relationship("StudentMark", back_populates="examination")
    patterns = relationship("ExamSubjectPattern", back_populates="examination")

class ExamSubjectPattern(Base):
    __tablename__ = "exam_subject_patterns"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("examinations.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    standard = Column(String(20), nullable=False) # "9", "10", "11", "12"
    theory_max = Column(Float, default=100.0)
    practical_max = Column(Float, default=0.0)
    internal_max = Column(Float, default=0.0)
    total_max = Column(Float, default=100.0)
    pass_mark = Column(Float, default=35.0)

    examination = relationship("Examination", back_populates="patterns")
    subject = relationship("Subject")

class StudentMark(Base):
    __tablename__ = "student_marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    exam_id = Column(Integer, ForeignKey("examinations.id"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    theory_mark = Column(Float, nullable=True)
    practical_mark = Column(Float, nullable=True)
    internal_mark = Column(Float, nullable=True)
    total_mark = Column(Float, nullable=False)
    max_mark = Column(Float, default=100.0)
    percentage = Column(Float, nullable=True)
    grade = Column(String(10), nullable=True) # A+, A, B, C, D, E, F
    is_pass = Column(Boolean, default=True)
    is_absent = Column(Boolean, default=False)
    status = Column(String(20), default="finalized") # draft, submitted, hm_verified, finalized
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="marks")
    examination = relationship("Examination", back_populates="marks")
    subject = relationship("Subject")

class StudentAttendance(Base):
    __tablename__ = "student_attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    academic_year = Column(String(20), nullable=False)
    month = Column(String(20), nullable=False) # "JUNE", "JULY", "AUG", "SEP", "OCT", etc.
    working_days = Column(Integer, default=22)
    days_present = Column(Float, default=22)
    days_absent = Column(Float, default=0)
    percentage = Column(Float, default=100.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="attendance")

class TeacherAttendance(Base):
    __tablename__ = "teacher_attendance"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False, index=True)
    academic_year = Column(String(20), nullable=False)
    month = Column(String(20), nullable=False)
    working_days = Column(Integer, default=22)
    present_days = Column(Float, default=22.0)
    casual_leave = Column(Float, default=0.0) # CL
    restricted_holiday = Column(Float, default=0.0) # RH
    earned_leave = Column(Float, default=0.0) # EL
    medical_leave = Column(Float, default=0.0) # ML
    other_leave = Column(Float, default=0.0)
    total_leave = Column(Float, default=0.0)
    attendance_percentage = Column(Float, default=100.0)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("Teacher", back_populates="attendance_records")

class ExcelUpload(Base):
    __tablename__ = "excel_uploads"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    upload_type = Column(String(50), nullable=False) # MARKS, ATTENDANCE_STUDENT, ATTENDANCE_TEACHER, TEACHER_ALLOCATION
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    status = Column(String(30), default="completed") # pending, preview, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(100), nullable=True)
    role = Column(String(50), nullable=True)
    school_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class HomePageContent(Base):
    __tablename__ = "home_page_content"

    id = Column(Integer, primary_key=True, index=True)
    section = Column(String(50), nullable=False) # hero_slide, achievement, event, notice, gallery
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    school_name = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    event_date = Column(String(50), nullable=True)
    priority = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
