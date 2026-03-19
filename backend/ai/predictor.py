import os
import joblib
import numpy as np

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "vulnerability_model.pkl")

# Global variables for model
_model = None

def load_model():
    """Load the trained model into memory lazy-loading."""
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
        else:
            raise FileNotFoundError(f"AI Model not found at {MODEL_PATH}. Run train_model.py first.")
    return _model

def predict_vulnerability(http_code, response_time, response_size, keyword_matches):
    """
    Given the features extracted from an HTTP response,
    predicts if it is vulnerable.
    
    Returns: (is_vulnerable (bool), confidence_score (float))
    """
    model = load_model()
    
    # Feature array must match the training script: [http_code, response_time, response_size, keyword_matches]
    features = np.array([[http_code, response_time, response_size, keyword_matches]])
    
    # Predict vulnerability
    prediction = model.predict(features)[0]
    is_vulnerable = bool(prediction == 1.0)
    
    # Get probability/confidence
    probabilities = model.predict_proba(features)[0]
    confidence_score = float(probabilities[int(prediction)]) * 100.0 # Convert to percentage
    
    return is_vulnerable, confidence_score
