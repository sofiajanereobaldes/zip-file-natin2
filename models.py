from datetime import datetime
from extensions import db

class Resident(db.Model):
    __tablename__ = 'residents'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<Resident {self.first_name} {self.last_name}>'
    
class BarangayOfficial(db.Model):
    __tablename__ = 'barangay_officials'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<BarangayOfficial {self.first_name} {self.last_name} - {self.position}>'
    
class Announcement(db.Model):
    __tablename__ = 'announcements'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default="general")
    is_pinned = db.Column(db.Boolean, default=False)
    image_url = db.Column(db.String(300))
    link = db.Column(db.String(300))
    date_posted = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "is_pinned": self.is_pinned,
            "image_url": self.image_url,
            "link": self.link,
            "created_at": self.date_posted.isoformat() if self.date_posted else None
        }
        
class CheckupRecord(db.Model):
    __tablename__ = "checkup_records"

    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey("residents.id"), nullable=False)

    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)

    bp = db.Column(db.String(20))        # e.g. "120/80"
    hr = db.Column(db.Integer)           # heart rate
    temp = db.Column(db.String(20))      # e.g. "36.7 °C"
    weight = db.Column(db.String(20))    # e.g. "60 kg"

    symptoms = db.Column(db.Text)
    prescription = db.Column(db.Text)
    doctor = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "date": self.date.strftime("%Y-%m-%d"),
            "time": self.time.strftime("%H:%M"),
            "vitals": {
                "bp": self.bp,
                "hr": self.hr,
                "temp": self.temp,
                "weight": self.weight,
            },
            "symptoms": self.symptoms,
            "prescription": self.prescription,
            "doctor": self.doctor,
        }


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey("residents.id"), nullable=False)

    name = db.Column(db.String(200), nullable=False)
    dob = db.Column(db.Date, nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(20))

    email = db.Column(db.String(120))
    phone = db.Column(db.String(50))
    address = db.Column(db.String(255))
    emergency = db.Column(db.String(255))

    reason = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(80), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)

    symptoms = db.Column(db.Text)
    history = db.Column(db.Text)
    medications = db.Column(db.Text)
    lifestyle = db.Column(db.Text)

    status = db.Column(db.String(20), default="pending")  # pending / approved / done
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)