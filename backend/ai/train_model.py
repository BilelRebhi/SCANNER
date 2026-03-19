import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "vulnerability_model.pkl")

def generate_synthetic_data(num_samples=1000):
    """
    Generates synthetic HTTP response data to train our initial model.
    In a real scenario, this would be real historic scan data.
    """
    np.random.seed(42)
    
    # Normal traffic: mostly 200/404, standard response sizes, low reflection of keywords
    normal_status = np.random.choice([200, 301, 302, 404, 401, 403], int(num_samples * 0.7), p=[0.7, 0.05, 0.05, 0.1, 0.05, 0.05])
    normal_time = np.random.normal(0.2, 0.1, int(num_samples * 0.7))
    normal_size = np.random.normal(5000, 2000, int(num_samples * 0.7))
    normal_keyword_matches = np.random.poisson(0, int(num_samples * 0.7)) # Almost 0 matches
    
    # Vulnerable traffic: often 500 (SQLi), or 200 but with reflected payloads (XSS)
    vuln_status = np.random.choice([200, 500], int(num_samples * 0.3), p=[0.6, 0.4])
    vuln_time = np.random.normal(0.8, 0.3, int(num_samples * 0.3)) # SQLi time-based or error delays
    vuln_size = np.random.normal(5200, 2200, int(num_samples * 0.3)) # slightly different size due to error messages
    vuln_keyword_matches = np.random.poisson(2, int(num_samples * 0.3)) # Reflection of payload or SQL error strings

    # Cleanup anomalies
    normal_time = np.clip(normal_time, 0.05, 2.0)
    vuln_time = np.clip(vuln_time, 0.1, 5.0)
    normal_size = np.clip(normal_size, 500, 20000)
    vuln_size = np.clip(vuln_size, 500, 20000)

    # Combine
    X_normal = np.column_stack((normal_status, normal_time, normal_size, normal_keyword_matches))
    y_normal = np.zeros(int(num_samples * 0.7))
    
    X_vuln = np.column_stack((vuln_status, vuln_time, vuln_size, vuln_keyword_matches))
    y_vuln = np.ones(int(num_samples * 0.3))
    
    X = np.concatenate((X_normal, X_vuln), axis=0)
    y = np.concatenate((y_normal, y_vuln), axis=0)
    
    df = pd.DataFrame(X, columns=['http_code', 'response_time', 'response_size', 'keyword_matches'])
    df['is_vulnerable'] = y
    
    return df

def train_and_save_model():
    print("Generating synthetic dataset...")
    df = generate_synthetic_data(2000)
    
    X = df[['http_code', 'response_time', 'response_size', 'keyword_matches']]
    y = df['is_vulnerable']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"Model Accuracy: {acc * 100:.2f}%")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    
    print(f"Saving model to {MODEL_PATH}")
    joblib.dump(model, MODEL_PATH)

    # Save to db
    try:
        from app import create_app
        from extensions import db
        from models import AIModel
        
        app = create_app()
        with app.app_context():
            # Update or create AIModel record
            existing_model = AIModel.query.filter_by(model_type='RandomForest').first()
            if not existing_model:
                m = AIModel(model_type='RandomForest', accuracy=acc, version='1.0')
                db.session.add(m)
            else:
                existing_model.accuracy = acc
                existing_model.version = str(float(existing_model.version) + 0.1)
            db.session.commit()
            print("AIModel updated in database.")
    except Exception as e:
        print(f"Could not update AIModel in db: {e}")

if __name__ == '__main__':
    train_and_save_model()
