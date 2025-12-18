from datetime import datetime
from flask import Blueprint, jsonify, session, request
from models import Resident, CheckupRecord, Appointment
from extensions import db

api_bp = Blueprint("api_bp", __name__)

@api_bp.route("/api/resident/appointments", methods=["POST"])
def resident_appointments():
    if "user_id" not in session or session.get("role") != "resident":
        return jsonify({"error": "Unauthorized"}), 401

    resident = Resident.query.get(session["user_id"])
    if not resident:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}

    # Required fields (must not be empty)
    required_fields = [
        "name", "dob", "age", "gender",
        "email", "phone", "address", "emergency",
        "reason", "type", "date", "time",
    ]

    missing = [f for f in required_fields if not str(data.get(f) or "").strip()]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    # Parse dates/times from strings
    dob_str = data.get("dob")
    date_str = data.get("date")
    time_str = data.get("time")

    try:
        dob_val = datetime.strptime(dob_str, "%Y-%m-%d").date() if dob_str else None
        date_val = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else None
        time_val = datetime.strptime(time_str, "%H:%M").time() if time_str else None

        appt = Appointment(
            resident_id=resident.id,
            name=data.get("name", "").strip(),
            dob=dob_val,                           # Date column
            age=int(data["age"]) if data.get("age") else None,
            gender=data.get("gender"),
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            emergency=data.get("emergency"),
            reason=data.get("reason"),
            type=data.get("type"),
            date=date_val,                         # Date column
            time=time_val,                         # Time column
            # Optional fields; may be empty or missing
            symptoms=data.get("symptoms"),
            history=data.get("history"),
            medications=data.get("medications"),
            lifestyle=data.get("lifestyle"),
        )
        db.session.add(appt)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        # Temporary: expose error while debugging
        return jsonify({"error": "Could not save appointment", "detail": str(exc)}), 400

    return jsonify({"message": "Created"}), 201

@api_bp.get("/api/resident/history")
def resident_history():
    if "user_id" not in session or session.get("role") != "resident":
        return jsonify({"error": "Unauthorized"}), 401

    resident = Resident.query.get(session["user_id"])
    if not resident:
        return jsonify({"error": "Not found"}), 404

    records = (
        CheckupRecord.query
        .filter_by(resident_id=resident.id)
        .order_by(CheckupRecord.date.desc(), CheckupRecord.time.desc())
        .all()
    )

    return jsonify([r.to_dict() for r in records])