from flask import Flask, jsonify
from config import Config
from extensions import db, jwt, cors, bcrypt

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    bcrypt.init_app(app)

    # Register blueprints 
    from routes.auth import auth_bp
    from routes.scans import scans_bp
    from routes.users import users_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(scans_bp, url_prefix='/api/scans')
    app.register_blueprint(users_bp, url_prefix='/api/users')

    # Create tables automatically inside app context (for dev purposes)
    with app.app_context():
        import models
        db.create_all()

    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'API is running'})

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
