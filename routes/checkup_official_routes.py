from datetime import datetime
from flask import Blueprint, jsonify, session, request
from extensions import db
from models import Resident, BarangayOfficial, Appointment, CheckupRecord

official_api_bp = Blueprint("official_api_bp", __name__)

@official_api_bp.route("/api/official/me")
def official_me():
    if "user_id" not in session or session.get("role") != "official":
        return jsonify({"error": "Unauthorized"}), 401

    official = BarangayOfficial.query.get(session["user_id"])
    if not official:
        return jsonify({"error": "Not found"}), 404

    return jsonify({
        "id": official.id,
        "name": f"{official.first_name} {official.last_name}",
        "role": official.position,
    })

@official_api_bp.route("/api/official/patients")
def official_patients():
    if "user_id" not in session or session.get("role") != "official":
        return jsonify({"error": "Unauthorized"}), 401

    # residents who have at least one checkup record
    q = (
        db.session.query(
            Resident.id,
            Resident.first_name,
            Resident.last_name,
            db.func.count(CheckupRecord.id).label("records_count"),
        )
        .join(CheckupRecord, CheckupRecord.resident_id == Resident.id)
        .group_by(Resident.id)
        .order_by(Resident.last_name, Resident.first_name)
    )

    patients = []
    for rid, fn, ln, records_count in q:
        latest_appt = (
            Appointment.query
            .filter_by(resident_id=rid)
            .order_by(Appointment.date.desc(), Appointment.time.desc())
            .first()
        )

        patients.append({
            "id": rid,
            "name": f"{fn} {ln}",
            "age": latest_appt.age if latest_appt and latest_appt.age is not None else None,
            "gender": latest_appt.gender if latest_appt else "",
            "phone": latest_appt.phone if latest_appt else "",
            "email": latest_appt.email if latest_appt else "",
            "records_count": records_count,
        })

    return jsonify(patients)

@official_api_bp.route("/api/official/patients/<int:resident_id>/records")
def official_patient_records(resident_id):
    if "user_id" not in session or session.get("role") != "official":
        return jsonify({"error": "Unauthorized"}), 401

    resident = Resident.query.get_or_404(resident_id)

    records = (
        CheckupRecord.query
        .filter_by(resident_id=resident.id)
        .order_by(CheckupRecord.date.desc(), CheckupRecord.time.desc())
        .all()
    )

    history = [
        {
            "date": r.date.strftime("%Y-%m-%d"),
            "time": r.time.strftime("%H:%M"),
            "summary": f"{r.symptoms or 'Check-up'} – {r.prescription or 'No prescription'}",
        }
        for r in records
    ]

    latest = records[0] if records else None
    latest_visit = None
    if latest:
        latest_visit = {
            "date": latest.date.strftime("%Y-%m-%d"),
            "time": latest.time.strftime("%H:%M"),
            "doctor": latest.doctor or "",
            "status": "Completed",
            "vitals": {
                "bp": latest.bp or "",
                "hr": latest.hr or "",
                "temp": latest.temp or "",
                "weight": latest.weight or "",
            },
            "symptoms": latest.symptoms or "",
            "diagnosis": "",   # you can extend CheckupRecord later
            "treatment": "",
            "medications": latest.prescription or "",
            "notes": "",
        }

    latest_appt = (
        Appointment.query
        .filter_by(resident_id=resident.id)
        .order_by(Appointment.date.desc(), Appointment.time.desc())
        .first()
    )

    patient_info = {
        "id": resident.id,
        "name": f"{resident.first_name} {resident.last_name}",
        "age": latest_appt.age if latest_appt and latest_appt.age is not None else None,
        "gender": latest_appt.gender if latest_appt else "",
        "phone": latest_appt.phone if latest_appt else "",
        "email": resident.email,
        "address": latest_appt.address if latest_appt else "",
        "emergency_contact": latest_appt.emergency if latest_appt else "",
    }

    return jsonify({
        "patient": patient_info,
        "history": history,
        "latest_visit": latest_visit,
    })

@official_api_bp.route("/api/official/appointments")
def official_appointments():
    if "user_id" not in session or session.get("role") != "official":
        return jsonify({"error": "Unauthorized"}), 401

    appts = (
        Appointment.query
        .filter(Appointment.status != "completed")
        .order_by(Appointment.date.asc(), Appointment.time.asc())
        .all()
    )

    result = []
    for a in appts:
        resident = Resident.query.get(a.resident_id)
        result.append({
            "id": a.id,
            "date": a.date.strftime("%Y-%m-%d"),
            "time": a.time.strftime("%H:%M"),
            "reason": a.reason,
            "status": a.status.capitalize(),
            "doctor": "Clinic Doctor",          # you can add doctor field later
            "patient": {
                "id": resident.id if resident else None,
                "name": f"{resident.first_name} {resident.last_name}" if resident else a.name,
                "phone": "",                    # fill when Resident has phone
                "email": resident.email if resident else a.email,
            },
        })

    return jsonify(result)

@official_api_bp.route("/api/official/appointments/<int:appointment_id>")
def official_appointment_detail(appointment_id):
    if "user_id" not in session or session.get("role") != "official":
        return jsonify({"error": "Unauthorized"}), 401

    a = Appointment.query.get_or_404(appointment_id)
    resident = Resident.query.get(a.resident_id)

    return jsonify({
        "id": a.id,
        "date": a.date.strftime("%Y-%m-%d"),
        "time": a.time.strftime("%H:%M"),
        "reason": a.reason,
        "status": a.status.capitalize(),
        "doctor": "Clinic Doctor",
        "symptoms": a.symptoms or "",
        "diagnosis": "",    # extend Appointment later if needed
        "treatment": "",
        "medications": a.medications or "",
        "notes": "",
        "patient": {
            "id": resident.id if resident else None,
            "name": f"{resident.first_name} {resident.last_name}" if resident else a.name,
            "phone": "",
            "email": resident.email if resident else a.email,
        },
        "vitals": None,
    })

@official_api_bp.route("/api/official/appointments/<int:appointment_id>/complete", methods=["POST"])
def official_complete_appointment(appointment_id):
    if "user_id" not in session or session.get("role") != "official":
        return jsonify({"error": "Unauthorized"}), 401

    a = Appointment.query.get_or_404(appointment_id)
    data = request.get_json() or {}

    vitals = data.get("vitals") or {}
    symptoms = data.get("symptoms") or ""
    diagnosis = data.get("diagnosis") or ""
    treatment = data.get("treatment") or ""
    medications = data.get("medications") or ""
    notes = data.get("notes") or ""

    # create history record
    record = CheckupRecord(
        resident_id=a.resident_id,
        date=a.date,
        time=a.time,
        bp=vitals.get("bp"),
        hr=int(vitals["hr"]) if vitals.get("hr") else None,
        temp=vitals.get("temp"),
        weight=vitals.get("weight"),
        symptoms=symptoms,
        prescription=medications,
        doctor="Clinic Doctor",
    )
    a.status = "completed"

    db.session.add(record)
    db.session.delete(a)
    db.session.commit()

    return jsonify({"message": "Check-up completed"})

