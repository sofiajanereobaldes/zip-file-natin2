import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Resident, BarangayOfficial

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sqlite_path = os.path.join(BASE_DIR, "instance", "app.db")

# import your models
from models import Resident, BarangayOfficial   # adjust import if needed

# 1) Engines for both databases
sqlite_engine = create_engine("sqlite:///app.db")
mysql_engine = create_engine('mysql+pymysql://root@localhost/cares_db')

# 2) Sessions
SQLiteSession = sessionmaker(bind=sqlite_engine)
MySQLSession = sessionmaker(bind=mysql_engine)

sqlite_session = SQLiteSession()
mysql_session = MySQLSession()


def sync_residents():
    sqlite_residents = sqlite_session.query(Resident).all()

    for row in sqlite_residents:
        # Look for existing resident in MySQL by unique email
        existing = (
            mysql_session.query(Resident)
            .filter_by(email=row.email)
            .first()
        )

        if existing:
            # Update existing record
            existing.first_name = row.first_name
            existing.last_name = row.last_name
            existing.password = row.password
        else:
            # Insert new record
            copy = Resident(
                first_name=row.first_name,
                last_name=row.last_name,
                email=row.email,
                password=row.password,
            )
            mysql_session.add(copy)


def sync_officials():
    sqlite_officials = sqlite_session.query(BarangayOfficial).all()

    for row in sqlite_officials:
        existing = (
            mysql_session.query(BarangayOfficial)
            .filter_by(email=row.email)
            .first()
        )

        if existing:
            existing.first_name = row.first_name
            existing.last_name = row.last_name
            existing.position = row.position
            existing.password = row.password
        else:
            copy = BarangayOfficial(
                first_name=row.first_name,
                last_name=row.last_name,
                position=row.position,
                email=row.email,
                password=row.password,
            )
            mysql_session.add(copy)


if __name__ == "__main__":
    sync_residents()
    sync_officials()
    mysql_session.commit()
    sqlite_session.close()
    mysql_session.close()
    print("Sync from SQLite to MySQL completed.")
