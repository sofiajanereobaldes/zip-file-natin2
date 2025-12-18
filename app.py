from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy

from extensions import db
from models import Announcement

from routes.login_routes import login_bp
from routes.homepage_routes import homepage_bp
from routes.announcement_routes import announcement_bp
from routes.checkup_routes import checkup_bp
from routes.checkup_resident_routes import api_bp
from routes.checkup_official_routes import official_api_bp


app = Flask(__name__)
app.secret_key = 'secret_key'

# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db' #sqlite database (old)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost:3306/cares_db' #mysql database (new)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app) #initialize database with app

#register blueprints
app.register_blueprint(login_bp)
app.register_blueprint(homepage_bp)
app.register_blueprint(announcement_bp)
app.register_blueprint(checkup_bp)
app.register_blueprint(api_bp)
app.register_blueprint(official_api_bp)

@app.route('/')
def account_type():
    return render_template('account_type.html')

@app.get("/api/announcements")
def get_announcements():
    category = request.args.get("category", "all")

    q = Announcement.query
    if category != "all":
        q = q.filter_by(category=category)
    
    announcements = (
        q.order_by(Announcement.date_posted.desc())
        .all()
    )
    
    announcements = q.order_by(Announcement.date_posted.desc()).all()
    return jsonify([a.to_dict() for a in announcements])  # ensure fields match JS expectations [web:68][web:74]

@app.post("/api/announcements")
def create_announcement():
    # Only officials can create announcements
    if session.get("role") != "official":
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    ann = Announcement(
        title=title,
        content=content,
        category=data.get("category") or "general",
        is_pinned=bool(data.get("pinned")),
        image_url=data.get("image_url"),
        link=data.get("link"),
    )
    db.session.add(ann)
    db.session.commit()

    return jsonify(ann.to_dict()), 201

@app.post("/api/logout")
def api_logout():
    # Clear session / token then return JSON
    session.clear()
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True)