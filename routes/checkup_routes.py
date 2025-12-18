from flask import Blueprint, render_template, session, redirect, url_for
from models import BarangayOfficial, Resident

checkup_bp = Blueprint("checkup_bp", __name__, url_prefix="/check_up_log")


@checkup_bp.route("/official")
def check_up_log_official():
    # Only officials can access
    if "user_id" not in session or session.get("role") != "official":
        return redirect(url_for("login_bp.login", role="official"))

    official = BarangayOfficial.query.get(session["user_id"])
    if not official:
        return redirect(url_for("login_bp.login", role="official"))

    return render_template("check_up_official.html", user=official)


@checkup_bp.route("/resident")
def check_up_log_resident():
    # Only residents can access
    if "user_id" not in session or session.get("role") != "resident":
        return redirect(url_for("login_bp.login", role="resident"))

    resident = Resident.query.get(session["user_id"])
    if not resident:
        return redirect(url_for("login_bp.login", role="resident"))

    # change template if you have a separate one, e.g. check_up_resident.html
    return render_template("check_up_resident.html", user=resident)
