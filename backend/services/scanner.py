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
    predict_vulnerability = None


def get_all_links(url, base_url):
    """Crawl a URL and return all unique internal links."""
    links = set()
    links.add(url)
    try:
        response = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, "html.parser")
        for a_tag in soup.find_all("a", href=True):
            full_url = urljoin(base_url, a_tag["href"])
            # Only follow links within the same domain
            if urlparse(full_url).netloc == urlparse(base_url).netloc:
                links.add(full_url.split("#")[0])  # Remove anchors
    except Exception as e:
        print(f"Error getting links from {url}: {e}")
    return links


def get_forms(url):
    """Crawl a URL and return a list of (form, page_url) tuples."""
    forms_found = []
    try:
        response = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, "html.parser")
        for form in soup.find_all("form"):
            forms_found.append((form, url))
    except Exception as e:
        print(f"Error crawling {url}: {e}")
    return forms_found


def form_details(form):
    """Extract all useful information from an HTML form."""
    details = {}
    action = form.attrs.get("action", "").lower()
    method = form.attrs.get("method", "get").lower()
    inputs = []
    for input_tag in form.find_all(["input", "textarea"]):
        input_type = input_tag.attrs.get("type", "text")
        input_name = input_tag.attrs.get("name")
        if input_name:
            inputs.append({"type": input_type, "name": input_name})
    details["action"] = action
    details["method"] = method
    details["inputs"] = inputs
    return details


def count_keywords(response_text, payload, payload_type):
    """
    Improved heuristic to detect successful injection.
    Returns a count that the AI model uses to classify vulnerability.
    """
    count = 0
    text = response_text.lower()

    if payload_type == 'XSS':
        # Check if the script tag or key XSS markers are reflected
        xss_markers = ["<script", "alert(", "onerror=", "onload=", "javascript:", "prompt(", "confirm("]
        for marker in xss_markers:
            if marker.lower() in text:
                count += 2
        # Check if the raw payload string appears in the response
        if payload.lower() in text:
            count += 3

    elif payload_type == 'SQLi':
        # Common SQL error strings that indicate injection
        sql_errors = [
            "you have an error in your sql syntax",
            "warning: mysql",
            "unclosed quotation mark",
            "quoted string not properly terminated",
            "mysql_fetch_array()",
            "mysql_fetch_assoc()",
            "supplied argument is not a valid mysql",
            "error in your sql syntax",
            "sqlite_exception",
            "pg_query()",
            "error occurred in",
            "odbc_exec()",
            "syntax error",
        ]
        for err in sql_errors:
            if err in text:
                count += 4  # High weight for actual SQL error strings

        # Also check for payload reflection
        if payload.lower() in text:
            count += 1

    return count


def run_scan(scan_id):
    """
    Main function to run the vulnerability scan asynchronously.
    Crawls up to MAX_PAGES pages, finds all forms, and tests each with payloads.
    """
    MAX_PAGES = 5  # Limit crawling depth
    app = create_app()
    with app.app_context():
        scan = Scan.query.get(scan_id)
        if not scan:
            return

        print(f"Starting scan {scan_id} for URL: {scan.url}")
        scan.status = 'running'
        db.session.commit()

        target_url = scan.url

        # Load payloads from database based on scan type
        payloads = Payload.query.all()
        if scan.scan_type != 'BOTH':
            payloads = [p for p in payloads if p.type == scan.scan_type]

        if not payloads:
            print(f"[!] No payloads found for scan type: {scan.scan_type}. Did you run seed.py?")
            scan.status = 'failed'
            db.session.commit()
            return

        # Phase 1: Crawl site to collect pages with forms
        print(f"[*] Crawling site to find pages with forms...")
        pages_to_scan = get_all_links(target_url, target_url)
        pages_to_scan = list(pages_to_scan)[:MAX_PAGES]
        print(f"[*] Will scan {len(pages_to_scan)} pages.")

        # Phase 2: Collect all forms across discovered pages
        all_forms = []
        for page_url in pages_to_scan:
            page_forms = get_forms(page_url)
            all_forms.extend(page_forms)
        print(f"[*] Found {len(all_forms)} forms total across all pages.")

        # Track already-tested combinations to avoid duplicates
        tested_combos = set()
        vulns_found = 0

        # Phase 3: Test each form with each payload
        for (form, page_url) in all_forms:
            form_info = form_details(form)
            action_url = urljoin(page_url, form_info["action"]) if form_info["action"] else page_url
            method = form_info["method"]

            for payload in payloads:
                # Skip if no text-type inputs available to inject into
                has_injectable = any(
                    inp["type"] in ("text", "search", "email", "url", "textarea", "password")
                    for inp in form_info["inputs"]
                )
                if not has_injectable:
                    continue

                combo_key = (action_url, payload.id)
                if combo_key in tested_combos:
                    continue
                tested_combos.add(combo_key)

                # Build the form submission data
                data = {}
                for inp in form_info["inputs"]:
                    if inp["type"] in ("text", "search", "email", "url", "textarea", "password"):
                        data[inp["name"]] = payload.content
                    elif inp["name"]:
                        data[inp["name"]] = "test"

                # Send the request and measure time
                start_time = time.time()
                try:
                    if method == "post":
                        res = requests.post(action_url, data=data, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
                    else:
                        res = requests.get(action_url, params=data, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
                except Exception as e:
                    print(f"Request failed for {action_url}: {e}")
                    continue

                response_time = time.time() - start_time
                http_code = res.status_code
                response_size = len(res.content)
                keyword_matches = count_keywords(res.text, payload.content, payload.type)

                # Predict Vulnerability with AI Model
                is_vulnerable = False
                score = 0.0
                try:
                    if predict_vulnerability:
                        is_vulnerable, score = predict_vulnerability(
                            http_code, response_time, response_size, keyword_matches
                        )
                        # score is 0-100 from predictor
                    else:
                        raise Exception("Predictor not loaded")
                except Exception as e:
                    print(f"AI Prediction failed, using rule-based fallback: {e}")
                    # Fallback: rule-based detection
                    is_vulnerable = keyword_matches > 0
                    score = min(keyword_matches * 20.0, 95.0)

                if is_vulnerable:
                    vulns_found += 1
                    print(f"[!] Vulnerability detected! Type={payload.type} URL={action_url} Score={score:.1f}%")

                    vuln = Vulnerability(
                        scan_id=scan.id,
                        type=payload.type,
                        severity='High' if score > 80 else 'Medium',
                        payload_used=payload.content,
                        description=f"AI model detected {payload.type} vulnerability with {score:.1f}% confidence.",
                        recommendation="Sanitize all user inputs. Use parameterized queries for SQL and output encoding for XSS."
                    )
                    db.session.add(vuln)
                    db.session.flush()

                    scan_res = ScanResult(
                        vulnerability_id=vuln.id,
                        http_code=http_code,
                        response_time=response_time,
                        response_size=response_size,
                        ai_score=score,
                        is_vulnerable=True
                    )
                    db.session.add(scan_res)
                    db.session.commit()

        # Mark scan as complete
        scan.status = 'completed'
        db.session.commit()
        print(f"Scan {scan_id} completed. Found {vulns_found} vulnerabilities.")


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        latest_scan = Scan.query.order_by(Scan.id.desc()).first()
        if latest_scan:
            run_scan(latest_scan.id)
        else:
            print("No scans found in database.")
