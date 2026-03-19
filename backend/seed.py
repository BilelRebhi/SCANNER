import json
from app import create_app
from extensions import db
from models import Payload

# Standard lightweight payloads for testing
PAYLOADS = [
    # XSS Payloads
    {'type': 'XSS', 'content': '<script>alert(1)</script>'},
    {'type': 'XSS', 'content': '"><img src=x onerror=alert(1)>'},
    {'type': 'XSS', 'content': "javascript:alert(1)"},
    {'type': 'XSS', 'content': "'-alert(1)-'"},
    
    # SQLi Payloads
    {'type': 'SQLi', 'content': "' OR '1'='1"},
    {'type': 'SQLi', 'content': "1' OR '1'='1"},
    {'type': 'SQLi', 'content': "' UNION SELECT NULL--"},
    {'type': 'SQLi', 'content': "admin' --"},
    {'type': 'SQLi', 'content': "' OR 1=1;--"},
]

def seed_database():
    app = create_app()
    with app.app_context():
        print("Seeding database with standard payloads...")
        added_count = 0
        
        for p in PAYLOADS:
            # Check if payload already exists
            existing = Payload.query.filter_by(content=p['content']).first()
            if not existing:
                new_payload = Payload(type=p['type'], content=p['content'])
                db.session.add(new_payload)
                added_count += 1
                
        db.session.commit()
        print(f"Added {added_count} new payloads to database.")

if __name__ == '__main__':
    seed_database()
