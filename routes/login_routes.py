from flask import Blueprint, render_template, redirect, url_for, request, session
from models import BarangayOfficial, Resident, Announcement
from extensions import db


login_bp = Blueprint('login_bp', __name__)


# --- LOGIN ---
@login_bp.route('/login/<role>', methods=['GET', 'POST'])
def login(role):

    error = None
    
    if request.method == 'POST':
        email = request.form.get('email') 
        password = request.form.get('password')
        
        #check missing fields
        if not email or not password:
            error = 'Missing email or password'
            return render_template('login.html', role=role, error=error)
        
        # Select which user list to check based on role
        if role == 'official':
            user = BarangayOfficial.query.filter_by(email=email, password=password).first()
        
        else:
            user = Resident.query.filter_by(email=email, password=password).first()
        
        if user: #successful login
            session['user_id'] = user.id
            session['role'] = role
            if role == 'official':
                return redirect(url_for('homepage_bp.home_brgyofficial'))
            else:
                return redirect(url_for('homepage_bp.home_resident'))
        else:
            error = 'Invalid credentials'
            
        # If no match found
    return render_template('login.html', role=role, error=error)

# --- SIGN UP RESIDENT ---
@login_bp.route('/signup/resident', methods=['GET', 'POST'])
def signup_resident():
    if request.method == 'POST':
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # checks if email already exists
        if Resident.query.filter_by(email=email).first():
            error = 'Email already registered'
            return render_template('sign_up_resident.html', error=error)
        
        # Add resident to database
        new_resident = Resident(
            first_name=first_name, 
            last_name=last_name, 
            email=email, 
            password=password)
        db.session.add(new_resident)
        db.session.commit()
        
        return redirect(url_for('login_bp.login', role='resident'))
    return render_template('sign_up_resident.html')  

# --- SIGN UP BRGY OFFICIAL ---
@login_bp.route('/signup/official', methods=['GET', 'POST'])
def signup_brgy_official():
    if request.method == 'POST':
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        password = request.form.get('password')
        position = request.form.get('position')
        
        if not all([first_name, last_name, email, password, position]):
            error = 'All fields are required'
            return render_template('sign_up_brgy_official.html', error=error)
    
        # check if email already exists
        if BarangayOfficial.query.filter_by(email=email).first():
            error = 'Email already registered'
            return render_template('sign_up_brgy_official.html', error=error)
        
        # Add barangay official to database
        new_official = BarangayOfficial(
            first_name=first_name, 
            last_name=last_name, 
            email=email, 
            password=password,
            position=position
            )
        db.session.add(new_official)
        db.session.commit()
        
        return redirect(url_for('login_bp.login', role='official'))
    return render_template('sign_up_brgy_official.html')

# --- LOGOUT ---
@login_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()  # or: session.pop('user_id', None); session.pop('role', None)
    return '', 204
