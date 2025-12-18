from app import app, db
from extensions import db

with app.app_context():
    db.create_all()
    print("Tables created/updated.")
    # db.session.execute("ALTER TABLE announcements ADD COLUMN date_posted DATETIME;")
    # db.session.execute("UPDATE announcements SET date_posted = CURRENT_TIMESTAMP WHERE date_posted IS NULL;")
    # db.session.commit()