import sqlite3

db_path = "coimbatore_schools.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

def get_columns(table):
    cur.execute(f"PRAGMA table_info({table});")
    return [r[1] for r in cur.fetchall()]

print("Teachers columns:", get_columns("teachers"))
print("Schools count:", cur.execute("SELECT count(*) FROM schools;").fetchone()[0])
print("Users count:", cur.execute("SELECT count(*) FROM users;").fetchone()[0])

# Add missing columns to teachers table if not present
teacher_cols = get_columns("teachers")
needed_cols = [
    ("location", "VARCHAR(255)"),
    ("native_place", "VARCHAR(255)"),
    ("contact_number", "VARCHAR(20)"),
    ("education_qualification", "VARCHAR(255)"),
    ("blood_group", "VARCHAR(10)"),
    ("experience_years", "INTEGER DEFAULT 5"),
    ("subject_specialization", "VARCHAR(100)")
]

for col_name, col_type in needed_cols:
    if col_name not in teacher_cols:
        print(f"Adding column {col_name} to teachers...")
        cur.execute(f"ALTER TABLE teachers ADD COLUMN {col_name} {col_type};")

conn.commit()
print("Updated Teachers columns:", get_columns("teachers"))
conn.close()
