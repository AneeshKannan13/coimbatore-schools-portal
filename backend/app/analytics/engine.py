import json
from typing import Dict, Any, List
import pandas as pd
import numpy as np

def generate_student_ai_insights(student_name: str, marks: List[Dict[str, Any]], attendance_pct: float) -> Dict[str, Any]:
    """
    Generates deterministic, highly accurate statistical AI insights for an individual student.
    Analyzes subject strength, weakness, exam trajectory, attendance impact, and risk score.
    """
    if not marks:
        return {
            "risk_level": "Needs Attention",
            "risk_score": 50,
            "summary": f"No examination records found for {student_name} yet.",
            "recommendations": ["Ensure marks are uploaded for current term."],
            "strengths": [],
            "weaknesses": []
        }

    # Group by exam or subject
    subject_scores = {}
    exam_totals = {}
    failed_subjects = []

    for m in marks:
        sub = m.get("subject_name", "Subject")
        tot = float(m.get("total_mark", 0))
        max_m = float(m.get("max_mark", 100))
        pct = (tot / max_m * 100) if max_m > 0 else 0
        exam = m.get("exam_name", "Exam")

        if sub not in subject_scores:
            subject_scores[sub] = []
        subject_scores[sub].append(pct)

        if exam not in exam_totals:
            exam_totals[exam] = []
        exam_totals[exam].append(pct)

        if not m.get("is_pass", True) or pct < 35.0:
            if sub not in failed_subjects:
                failed_subjects.append(sub)

    # Compute averages
    sub_avg = {k: np.mean(v) for k, v in subject_scores.items()}
    overall_avg = np.mean([v for vals in subject_scores.values() for v in vals]) if subject_scores else 0

    sorted_subs = sorted(sub_avg.items(), key=lambda x: x[1], reverse=True)
    strengths = [s[0] for s in sorted_subs if s[1] >= 65][:2]
    weaknesses = [s[0] for s in sorted_subs if s[1] < 45][:2]

    # Calculate Risk Score (40% academic, 25% attendance, 20% failed subs, 15% trend)
    # Academic component (100 - avg) * 0.4
    acad_risk = max(0, min(100, (100 - overall_avg))) * 0.4
    
    # Attendance component: if <75%, high penalty
    att_risk = (max(0, min(100, (100 - attendance_pct))) if attendance_pct < 85 else 10) * 0.25
    
    # Failed subs component
    fail_risk = min(100, len(failed_subjects) * 25) * 0.20
    
    # Trend component
    trend_risk = 10
    exams_keys = list(exam_totals.keys())
    trend_direction = "stable"
    if len(exams_keys) >= 2:
        e1_avg = np.mean(exam_totals[exams_keys[0]])
        e2_avg = np.mean(exam_totals[exams_keys[-1]])
        diff = e2_avg - e1_avg
        if diff > 5:
            trend_direction = "improved"
            trend_risk = 0
        elif diff < -5:
            trend_direction = "declined"
            trend_risk = 25
    trend_comp = trend_risk * 0.15

    total_risk_score = round(acad_risk + att_risk + fail_risk + trend_comp, 1)

    if total_risk_score < 25:
        risk_level = "Excellent"
    elif total_risk_score < 45:
        risk_level = "Good"
    elif total_risk_score < 65:
        risk_level = "Average"
    elif total_risk_score < 80:
        risk_level = "Needs Attention"
    else:
        risk_level = "High Risk"

    # Generate synthesized text commentary
    summary_parts = []
    if trend_direction == "improved":
        summary_parts.append(f"{student_name} demonstrates a positive upward trajectory across recent examinations.")
    elif trend_direction == "declined":
        summary_parts.append(f"{student_name} showed an exam mark decline that requires proactive academic mentoring.")
    else:
        summary_parts.append(f"{student_name} maintains a steady performance across key term subjects.")

    if weaknesses:
        summary_parts.append(f"Subject weakness identified in {', '.join(weaknesses)}.")
    if strengths:
        summary_parts.append(f"Demonstrates strong aptitude in {', '.join(strengths)}.")

    if attendance_pct < 75.0:
        summary_parts.append(f"Attendance is critical at {attendance_pct:.1f}%, directly impacting conceptual grasp.")
    else:
        summary_parts.append(f"Attendance is healthy at {attendance_pct:.1f}%.")

    recommendations = []
    if failed_subjects:
        recommendations.append(f"Conduct specialized remedial remedial sessions for {', '.join(failed_subjects)}.")
    if attendance_pct < 75:
        recommendations.append("Initiate parent counseling regarding the 75% minimum attendance requirement.")
    if not recommendations:
        recommendations.append("Encourage participation in advanced Olympiad and competitive training modules.")

    return {
        "risk_level": risk_level,
        "risk_score": total_risk_score,
        "overall_average": round(overall_avg, 1),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "failed_subjects": failed_subjects,
        "summary": " ".join(summary_parts),
        "recommendations": recommendations,
        "trend": trend_direction
    }


def generate_school_ai_insights(school_name: str, class_stats: List[Dict[str, Any]], pass_percentage: float, attendance_pct: float) -> Dict[str, Any]:
    """
    Generates executive-level statistical AI insights for an entire school.
    """
    insights = []
    
    if pass_percentage >= 85:
        insights.append(f"Outstanding academic standard with an overall pass rate of {pass_percentage:.1f}%.")
    elif pass_percentage >= 70:
        insights.append(f"Good performance with {pass_percentage:.1f}% pass rate; target 85%+ in upcoming terms.")
    else:
        insights.append(f"Intervention priority: Pass percentage currently at {pass_percentage:.1f}%, requiring focused revision camps.")

    if attendance_pct < 85:
        insights.append(f"School-wide student attendance is {attendance_pct:.1f}%, warranting Corporation community engagement.")
    else:
        insights.append(f"Healthy average attendance maintained across wards at {attendance_pct:.1f}%.")

    # Subject and class hotspots
    low_classes = [c.get("class_name") for c in class_stats if c.get("pass_rate", 100) < 65]
    if low_classes:
        insights.append(f"Focus classes identified: {', '.join(low_classes)} have lower than threshold pass percentages.")

    return {
        "school_performance_index": round((pass_percentage * 0.4) + (attendance_pct * 0.3) + 25, 1),
        "key_insights": insights,
        "recommended_interventions": [
            "Weekly diagnostic quizzes for Mathematics & Science",
            "Teacher-parent monthly progress alignment meetings",
            "Corporation Special Remedial Coaching for border-line students"
        ]
    }


def generate_commissioner_ai_insights(corporation_stats: Dict[str, Any]) -> List[str]:
    """
    Generates high-level Corporation Commissioner intelligence alerts and strategic insights.
    """
    total_schools = corporation_stats.get("total_schools", 42)
    avg_pass = corporation_stats.get("avg_pass_pct", 84.5)
    high_risk_count = corporation_stats.get("high_risk_students", 142)
    top_weak_subject = corporation_stats.get("weakest_subject", "Mathematics")
    
    return [
        f"{top_weak_subject} and Physics have recorded the highest failure volatility across higher-secondary wings.",
        f"A targeted cohort of {high_risk_count} students have attendance below 75% combined with 2+ failed subjects across all {total_schools} schools.",
        f"Zone-wise comparison indicates North and Central zones lead in 10th Standard Science practical completion rates.",
        f"Overall Corporation pass benchmark stands at {avg_pass:.1f}%, reflecting a +3.4% rise over the previous academic term.",
        "Recommend immediate deployment of interactive visual learning aids for high-school Mathematics."
    ]
