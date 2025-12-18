from flask import Blueprint, render_template, session, redirect, url_for, request, jsonify
from models import Resident, BarangayOfficial, Announcement
from extensions import db

announcement_bp = Blueprint('announcement_bp', __name__, url_prefix='/announcement')

@announcement_bp.route('/')
def announcement():
    role = session.get('role')

    if role == 'official':
        user_id = session.get('user_id')
        if not user_id:
            return redirect(url_for('login_bp.login', role='official'))

        official = BarangayOfficial.query.get(user_id)
        if not official:
            return redirect(url_for('login_bp.login', role='official'))

        return render_template('announcement_official.html', user=official)
    
    elif role == 'resident':
        user_id = session.get('user_id')
        if not user_id:
            return redirect(url_for('login_bp.login', role='resident'))

        resident = Resident.query.get(user_id)
        if not resident:
            return redirect(url_for('login_bp.login', role='resident'))

        return render_template('announcement_resident.html', user=resident)

    else:
        return redirect(url_for('account_type'))
    
# --- Helper to require official role ---
def require_official():
    return session.get("role") == "official"


@announcement_bp.post("/api/<int:ann_id>/pin")
def api_pin_announcement(ann_id):
    if not require_official():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    is_pinned = bool(data.get("is_pinned"))

    ann = Announcement.query.get_or_404(ann_id)
    ann.is_pinned = is_pinned
    db.session.commit()
    return jsonify({"id": ann.id, "is_pinned": ann.is_pinned})


@announcement_bp.delete("/api/<int:ann_id>")
def api_delete_announcement(ann_id):
    if not require_official():
        return jsonify({"error": "Unauthorized"}), 401

    ann = Announcement.query.get_or_404(ann_id)
    db.session.delete(ann)
    db.session.commit()
    return jsonify({"status": "deleted", "id": ann_id})

