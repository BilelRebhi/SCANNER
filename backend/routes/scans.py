from flask import Blueprint, jsonify, request
from extensions import db
from models import Scan, Vulnerability, ScanResult, User
from flask_jwt_extended import jwt_required, get_jwt_identity
import threading
from services.scanner import run_scan

scans_bp = Blueprint('scans', __name__)

@scans_bp.route('/', methods=['POST'])
@jwt_required()
def create_scan():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    url = data.get('url')
    scan_type = data.get('scanType') # XSS, SQLi, or BOTH
    
    if not url or not scan_type:
        return jsonify({'message': 'URL and Scan Type are required'}), 400
        
    new_scan = Scan(
        user_id=current_user_id,
        url=url,
        scan_type=scan_type,
        status='pending'
    )
    db.session.add(new_scan)
    db.session.commit()
    
    # Trigger scanner in background thread
    threading.Thread(target=run_scan, args=(new_scan.id,)).start()
    
    return jsonify({
        'message': 'Scan initiated successfully',
        'scan': {
            'id': new_scan.id,
            'url': new_scan.url,
            'scan_type': new_scan.scan_type,
            'status': new_scan.status,
            'date': new_scan.date.isoformat()
        }
    }), 201

@scans_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_scans():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Admin sees all scans, normal user sees only theirs
    if user.role == 'admin':
        scans = Scan.query.order_by(Scan.date.desc()).all()
    else:
        scans = Scan.query.filter_by(user_id=current_user_id).order_by(Scan.date.desc()).all()
        
    scans_data = []
    for scan in scans:
        scans_data.append({
            'id': scan.id,
            'user_id': scan.user_id,
            'url': scan.url,
            'scan_type': scan.scan_type,
            'status': scan.status,
            'date': scan.date.isoformat()
        })
        
    return jsonify(scans_data), 200

@scans_bp.route('/<int:scan_id>', methods=['GET'])
@jwt_required()
def get_scan_details(scan_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    scan = Scan.query.get(scan_id)
    
    if not scan:
        return jsonify({'message': 'Scan not found'}), 404
        
    if user.role != 'admin' and str(scan.user_id) != str(current_user_id):
        return jsonify({'message': 'Unauthorized to view this scan'}), 403
        
    vulnerabilities = Vulnerability.query.filter_by(scan_id=scan.id).all()
    vuln_data = []
    
    for v in vulnerabilities:
        result_data = None
        if v.result:
            result_data = {
                'http_code': v.result.http_code,
                'response_time': v.result.response_time,
                'response_size': v.result.response_size,
                'ai_score': v.result.ai_score,
                'is_vulnerable': v.result.is_vulnerable
            }
            
        vuln_data.append({
            'id': v.id,
            'type': v.type,
            'severity': v.severity,
            'payload_used': v.payload_used,
            'description': v.description,
            'recommendation': v.recommendation,
            'result': result_data
        })
        
    return jsonify({
        'scan': {
            'id': scan.id,
            'url': scan.url,
            'scan_type': scan.scan_type,
            'status': scan.status,
            'date': scan.date.isoformat()
        },
        'vulnerabilities': vuln_data
    }), 200

@scans_bp.route('/<int:scan_id>', methods=['DELETE'])
@jwt_required()
def delete_scan(scan_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    scan = Scan.query.get(scan_id)
    
    if not scan:
        return jsonify({'message': 'Scan not found'}), 404
        
    if user.role != 'admin' and str(scan.user_id) != str(current_user_id):
        return jsonify({'message': 'Unauthorized to delete this scan'}), 403
        
    # We must delete vulnerabilities and results due to relationships (if not handled by cascade)
    vulnerabilities = Vulnerability.query.filter_by(scan_id=scan.id).all()
    for v in vulnerabilities:
        if v.result:
            db.session.delete(v.result)
        db.session.delete(v)
        
    db.session.delete(scan)
    db.session.commit()
    
    return jsonify({'message': 'Scan deleted successfully'}), 200
