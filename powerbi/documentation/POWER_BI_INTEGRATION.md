# Microsoft Power BI Integration Guide
## Coimbatore Corporation Government School Performance Management & AI Analytics Portal

### Overview
This portal provides enterprise-grade reporting integration with Microsoft Power BI. Power BI desktop or cloud service can connect directly to the reporting database views or consume the REST API endpoints.

---

### Method 1: Direct Database Connection (Recommended for Desktop & Gateway)

1. Open **Power BI Desktop**.
2. Click **Get Data** -> **PostgreSQL Database** (or SQLite ODBC for local testing).
3. Enter Server Connection details:
   - **Server**: `db.coimbatorecorporation.gov.in:5432`
   - **Database**: `coimbatore_schools_db`
   - **Data Connectivity Mode**: `DirectQuery` (for real-time updates) or `Import` (for cached performance).
4. Select the pre-aggregated reporting views:
   - `vw_student_performance`
   - `vw_school_performance`
   - `vw_subject_performance`
   - `vw_student_risk_analysis`

---

### Method 2: REST API Web Data Feed (Power BI Power Query)

In Power BI Power Query, enter:
```powerquery
let
    Source = Json.Document(Web.Contents("https://api.schools.coimbatorecorporation.gov.in/api/v1/commissioner/dashboard", [Headers=[#"Authorization"="Bearer YOUR_BEARER_TOKEN"]])),
    schools = Source[schools],
    table = Table.FromList(schools, Splitter.SplitByNothing(), null, null, ExtraValues.Error)
in
    table
```

---

### Pre-built Dashboards & KPI Visualizations
1. **Corporation Commissioner Command View**:
   - Ward and Zone Geo-map of Corporation Schools
   - Pass Percentage Heatmap by Subject
   - Risk Alert Cards: Count of students with attendance < 75% + failed marks
2. **Subject Proficiency Matrix**:
   - Science Theory vs Practical score deviation
   - Quarterly vs Half-Yearly improvement index
3. **Teacher Compliance Tracker**:
   - On-time Mark Submission by School and Standard
