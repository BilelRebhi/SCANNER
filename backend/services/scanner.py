import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

from app import create_app
from extensions import db
from models import Scan, Vulnerability, ScanResult, Payload

try:
    from ai.predictor import predict_vulnerability
except ImportError:
    # If it fails to import (e.g., model not trained yet), provide wrapper
    pass

def get_forms(url):
    """Crawl a URL and return a list of BeautifulSoup form objects."""
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        return soup.find_all("form")
    except Exception as e:
        print(f"Error crawling {url}: {e}")
        return []

def form_details(form):
    """Extract all useful information from an HTML form."""
    details = {}
    
    action = form.attrs.get("action", "").lower()
    method = form.attrs.get("method", "get").lower()
    
    inputs = []
    for input_tag in form.find_all("input"):
        input_type = input_tag.attrs.get("type", "text")
        input_name = input_tag.attrs.get("name")
        inputs.append({"type": input_type, "name": input_name})
        
    details["action"] = action
    details["method"] = method
    details["inputs"] = inputs
    return details

def count_keywords(response_text, payload):
    """Simple heuristic to check if payload is reflected, or SQL error appeared."""
    text = response_text.lower()
    count = text.count(payload.lower())
    
    # Common SQL errors
    sql_errors = ["sql syntax", "mysql_fetch_array()", "you have an error in your sql syntax", "unclosed quotation mark after the character string"]
    for err in sql_errors:
        if err in text:
            count += 3 # High weight for actual SQL errors
            
    return count

def run_scan(scan_id):
    """
    Main function to run the vulnerability scan asynchronously.
    """
    app = create_app()
    with app.app_context():
        scan = Scan.query.get(scan_id)
        if not scan:
            return
            
        print(f"Starting scan {scan_id} for URL: {scan.url}")
        scan.status = 'running'
        db.session.commit()
        
        target_url = scan.url
        
        # Load payloads from database
        payloads = Payload.query.all()
        if scan.scan_type != 'BOTH':
            payloads = [p for p in payloads if p.type == scan.scan_type]
            
        forms = get_forms(target_url)
        print(f"Found {len(forms)} forms on {target_url}.")
        
        for form in forms:
            form_info = form_details(form)
            action_url = urljoin(target_url, form_info["action"])
            method = form_info["method"]
            
            for payload in payloads:
                # Prepare data to submt
                data = {}
                for input_info in form_info["inputs"]:
                    if input_info["type"] == "text" or input_info["type"] == "search" and input_info["name"]:
                        data[input_info["name"]] = payload.content
                    elif input_info["name"]:
                        data[input_info["name"]] = "test" # Dummy value for other fields
                
                # If no textual inputs were found that we populated with a payload, skip
                if not any(v == payload.content for v in data.values()):
                    continue
                
                # Send the request and measure time
                start_time = time.time()
                try:
                    if method == "post":
                        res = requests.post(action_url, data=data, timeout=10)
                    else:
                        res = requests.get(action_url, params=data, timeout=10)
                except Exception as e:
                    print(f"Request failed: {e}")
                    continue
                    
                response_time = time.time() - start_time
                http_code = res.status_code
                response_size = len(res.content)
                keyword_matches = count_keywords(res.text, payload.content)
                
                # Predict Vulnerability with AI Model
                try:
                    is_vulnerable, score = predict_vulnerability(http_code, response_time, response_size, keyword_matches)
                except Exception as e:
                    print(f"AI Prediction failed, defaulting to rules. {e}")
                    # Basic fallback
                    is_vulnerable = (keyword_matches > 0 and payload.type == 'XSS') or (keyword_matches > 1 and payload.type == 'SQLi')
                    score = 0.0
                
                if is_vulnerable:
                    print(f"[!] Vulnerability detected at {action_url} with payload {payload.content}")
                    
                    # Store Vulnerability
                    vuln = Vulnerability(
                        scan_id=scan.id,
                        type=payload.type,
                        severity='High' if score > 80 else 'Medium',
                        payload_used=payload.content,
                        description=f"AI model predicted {payload.type} vulnerability with {score:.1f}% confidence. Input was reflected or caused an error.",
                        recommendation="Sanitize input and use parameterized queries."
                    )
                    db.session.add(vuln)
                    db.session.flush() # To get vuln.id
                    
                    scan_res = ScanResult(
                        vulnerability_id=vuln.id,
                        http_code=http_code,
                        response_time=response_time,
                        response_size=response_size,
                        ai_score=score,
                        is_vulnerable=is_vulnerable
                    )
                    db.session.add(scan_res)
                    db.session.commit()
        
        # Mark scan as complete
        scan.status = 'completed'
        db.session.commit()
        print(f"Scan {scan_id} completed.")

if __name__ == '__main__':
    # For testing, grab the latest scan and run it
    app = create_app()
    with app.app_context():
        latest_scan = Scan.query.order_by(Scan.id.desc()).first()
        if latest_scan:
            run_scan(latest_scan.id)
        else:
            print("No scans found in database.")
