from flask import Blueprint, jsonify, request
from extensions import db
from models import User
from flask_jwt_extended import jwt_required, get_jwt_identity

users_bp = Blueprint('users', __name__)

def is_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'admin'

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin privileges required'}), 403
        
    users = User.query.all()
    users_data = []
    for user in users:
        users_data.append({
            'id': user.id,
            'fullname': user.fullname,
            'email': user.email,
            'role': user.role
        })
        
    return jsonify(users_data), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin privileges required'}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200
