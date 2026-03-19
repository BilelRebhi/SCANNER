from extensions import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user') # 'user' or 'admin'
    scans = db.relationship('Scan', backref='user', lazy=True)

class Scan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    url = db.Column(db.String(255), nullable=False)
    scan_type = db.Column(db.String(50), nullable=False) # 'XSS', 'SQLi', 'BOTH'
    date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending') # 'pending', 'running', 'completed', 'failed'
    vulnerabilities = db.relationship('Vulnerability', backref='scan', lazy=True)

class Vulnerability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey('scan.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False) # 'XSS', 'SQLi'
    severity = db.Column(db.String(20), nullable=False) # 'Low', 'Medium', 'High'
    payload_used = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=True)
    recommendation = db.Column(db.Text, nullable=True)
    result = db.relationship('ScanResult', backref='vulnerability', uselist=False, lazy=True)

class ScanResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vulnerability_id = db.Column(db.Integer, db.ForeignKey('vulnerability.id'), nullable=False)
    http_code = db.Column(db.Integer, nullable=True)
    response_time = db.Column(db.Float, nullable=True)
    response_size = db.Column(db.Integer, nullable=True)
    ai_score = db.Column(db.Float, nullable=True)
    is_vulnerable = db.Column(db.Boolean, default=False)

class Payload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False) # 'XSS', 'SQLi'
    content = db.Column(db.Text, nullable=False)

class AIModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    model_type = db.Column(db.String(50), nullable=False)
    accuracy = db.Column(db.Float, nullable=True)
    version = db.Column(db.String(20), nullable=False)
