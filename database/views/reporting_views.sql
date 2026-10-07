-- Power BI Reporting Views for Coimbatore Corporation Education Department

-- 1. vw_student_performance
CREATE VIEW IF NOT EXISTS vw_student_performance AS
SELECT 
    s.emis_number,
    s.student_name,
    sc.school_name,
    sc.zone,
    sc.ward,
    c.standard,
    c.section,
    c.medium,
    c.group_code,
    e.exam_name,
    e.academic_year,
    sub.subject_name,
    m.theory_mark,
    m.practical_mark,
    m.total_mark,
    m.max_mark,
    m.percentage,
    m.grade,
    m.is_pass
FROM student_marks m
JOIN students s ON m.student_id = s.id
JOIN schools sc ON s.school_id = sc.id
JOIN classes c ON s.class_id = c.id
JOIN examinations e ON m.exam_id = e.id
JOIN subjects sub ON m.subject_id = sub.id;

-- 2. vw_school_performance
CREATE VIEW IF NOT EXISTS vw_school_performance AS
SELECT 
    sc.id AS school_id,
    sc.school_name,
    sc.zone,
    sc.ward,
    COUNT(DISTINCT s.id) AS total_enrolled_students,
    AVG(m.percentage) AS school_average_mark,
    SUM(CASE WHEN m.is_pass = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(m.id) AS pass_percentage,
    COUNT(DISTINCT t.id) AS total_teachers
FROM schools sc
LEFT JOIN students s ON s.school_id = sc.id
LEFT JOIN student_marks m ON m.student_id = s.id
LEFT JOIN teachers t ON t.school_id = sc.id
GROUP BY sc.id, sc.school_name, sc.zone, sc.ward;

-- 3. vw_subject_performance
CREATE VIEW IF NOT EXISTS vw_subject_performance AS
SELECT 
    sub.subject_name,
    c.standard,
    AVG(m.total_mark) AS subject_average,
    SUM(CASE WHEN m.is_pass = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(m.id) AS subject_pass_rate,
    COUNT(m.id) AS total_evaluations
FROM student_marks m
JOIN subjects sub ON m.subject_id = sub.id
JOIN students s ON m.student_id = s.id
JOIN classes c ON s.class_id = c.id
GROUP BY sub.subject_name, c.standard;

-- 4. vw_student_risk_analysis
CREATE VIEW IF NOT EXISTS vw_student_risk_analysis AS
SELECT 
    s.id AS student_id,
    s.emis_number,
    s.student_name,
    sc.school_name,
    sc.zone,
    c.standard,
    c.section,
    AVG(m.percentage) AS student_avg,
    SUM(CASE WHEN m.is_pass = 0 THEN 1 ELSE 0 END) AS failed_subjects_count,
    CASE 
        WHEN AVG(m.percentage) < 40 OR SUM(CASE WHEN m.is_pass = 0 THEN 1 ELSE 0 END) >= 2 THEN 'HIGH RISK'
        WHEN AVG(m.percentage) < 55 THEN 'NEEDS ATTENTION'
        WHEN AVG(m.percentage) >= 75 THEN 'EXCELLENT'
        ELSE 'AVERAGE'
    END AS risk_classification
FROM students s
JOIN schools sc ON s.school_id = sc.id
JOIN classes c ON s.class_id = c.id
LEFT JOIN student_marks m ON m.student_id = s.id
GROUP BY s.id, s.emis_number, s.student_name, sc.school_name, sc.zone, c.standard, c.section;
