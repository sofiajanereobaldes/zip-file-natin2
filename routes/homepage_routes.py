from flask import Blueprint, render_template, session, redirect, url_for
from models import BarangayOfficial, Resident, Announcement
from sqlalchemy import desc

homepage_bp = Blueprint('homepage_bp', __name__, url_prefix='/home')

@homepage_bp.route('/brgyofficial')
def home_brgyofficial():
    if 'user_id' not in session or session.get('role') != 'official':
        return redirect(url_for('login_bp.login', role='official'))
    
    user_id = session['user_id']
    official = BarangayOfficial.query.get(user_id)
    
    if not official:
        return redirect(url_for('login_bp.login', role='official'))
    
    announcements = (
        Announcement.query
        .order_by(Announcement.is_pinned.desc(), Announcement.date_posted.desc())
        .limit(4)
        .all()
    )
     
    return render_template('home_brgyofficial.html', user=official, announcements=announcements)


@homepage_bp.route('/resident')
def home_resident():
    if 'user_id' not in session or session.get('role') != 'resident':
        return redirect(url_for('login_bp.login', role='resident'))
    
    user_id = session['user_id']    
    resident = Resident.query.get(user_id)
    
    if not resident:
        return redirect(url_for('login_bp.login', role='resident'))
    
    return render_template('home_resident.html', user = resident)
