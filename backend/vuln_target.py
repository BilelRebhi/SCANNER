"""
Vulnerable Test Target Application
=====================================
A deliberately vulnerable Flask app for testing the vulnerability scanner locally.
DO NOT deploy this in production - it contains intentional security flaws.

Run with: python vuln_target.py
Access at: http://localhost:5001
"""

from flask import Flask, request, render_template_string

app = Flask(__name__)

# -------------------------------------------------------
# HTML Templates with intentional vulnerabilities
# -------------------------------------------------------

HOME_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Vulnerable Bank App - Test Target</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: auto; background: white; padding: 30px; border-radius: 8px; }
        h1 { color: #c0392b; }
        .warning { background: #ffeaa7; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
        a { display: block; margin: 10px 0; color: #2980b9; }
        form { margin: 20px 0; }
        input, select { padding: 8px; margin: 5px; border: 1px solid #ccc; border-radius: 4px; }
        button { background: #c0392b; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="warning">⚠️ This is an intentionally vulnerable app for security testing only.</div>
        <h1>Vulnerable Bank App</h1>
        <p>Use this app as a scan target on <code>http://localhost:5001</code></p>
        <a href="/search">🔍 Product Search (XSS Vulnerable)</a>
        <a href="/login">🔐 Login Page (SQLi Vulnerable)</a>
        <a href="/comment">💬 Comment Section (XSS Vulnerable)</a>
        <a href="/user-info">👤 User Info (SQLi Vulnerable)</a>
    </div>
</body>
</html>
"""

SEARCH_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><title>Product Search</title></head>
<body>
    <h2>Search Products</h2>
    <form method="GET" action="/search">
        <input type="text" name="q" placeholder="Search products..." value="{{ query }}">
        <button type="submit">Search</button>
    </form>
    {% if query %}
    <!-- INTENTIONAL XSS: query is rendered unescaped -->
    <p>Results for: {{ query | safe }}</p>
    <p>No products found matching your search.</p>
    {% endif %}
</body>
</html>
"""

LOGIN_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><title>Login</title></head>
<body>
    <h2>User Login</h2>
    <form method="POST" action="/login">
        <label>Username:</label><br>
        <input type="text" name="username" placeholder="Enter username"><br><br>
        <label>Password:</label><br>
        <input type="password" name="password" placeholder="Enter password"><br><br>
        <button type="submit">Login</button>
    </form>
    {% if error %}
    <!-- INTENTIONAL SQLi error disclosure -->
    <p style="color:red;">{{ error | safe }}</p>
    {% endif %}
</body>
</html>
"""

COMMENT_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><title>Comments</title></head>
<body>
    <h2>Leave a Comment</h2>
    <form method="POST" action="/comment">
        <label>Name:</label><br>
        <input type="text" name="name" placeholder="Your name"><br><br>
        <label>Comment:</label><br>
        <textarea name="comment" rows="4" cols="40" placeholder="Your comment..."></textarea><br><br>
        <button type="submit">Submit Comment</button>
    </form>
    {% if name %}
    <!-- INTENTIONAL XSS: both name and comment rendered unescaped -->
    <hr>
    <p><strong>{{ name | safe }}</strong> says:</p>
    <p>{{ comment | safe }}</p>
    {% endif %}
</body>
</html>
"""

USER_INFO_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><title>User Info</title></head>
<body>
    <h2>User Information Lookup</h2>
    <form method="GET" action="/user-info">
        <label>User ID:</label><br>
        <input type="text" name="id" placeholder="Enter user ID (e.g., 1)"><br><br>
        <button type="submit">Lookup</button>
    </form>
    {% if error %}
    <!-- INTENTIONAL SQL error disclosed to client -->
    <p style="color:red;">Database error: {{ error | safe }}</p>
    {% elif user_data %}
    <p>User: {{ user_data }}</p>
    {% endif %}
</body>
</html>
"""

# -------------------------------------------------------
# Routes
# -------------------------------------------------------

@app.route('/')
def home():
    return render_template_string(HOME_TEMPLATE)


@app.route('/search')
def search():
    # VULNERABLE: reflects user input directly without escaping (XSS)
    query = request.args.get('q', '')
    return render_template_string(SEARCH_TEMPLATE, query=query)


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')

        # VULNERABLE: simulates SQL injection by disclosing a fake SQL error
        # In a real vulnerable app this would be an unsanitized DB query
        if "'" in username or '"' in username or '--' in username or ';' in username:
            error = (
                f"You have an error in your SQL syntax near "
                f"'<b>{username}</b>' at line 1 — "
                f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
            )
        else:
            error = "Invalid credentials."

    return render_template_string(LOGIN_TEMPLATE, error=error)


@app.route('/comment', methods=['GET', 'POST'])
def comment():
    # VULNERABLE: reflects form inputs directly without escaping (Stored-XSS simulation)
    name = ''
    comment_text = ''
    if request.method == 'POST':
        name = request.form.get('name', '')
        comment_text = request.form.get('comment', '')
    return render_template_string(COMMENT_TEMPLATE, name=name, comment=comment_text)


@app.route('/user-info')
def user_info():
    user_id = request.args.get('id', '')
    error = None
    user_data = None

    if user_id:
        # VULNERABLE: simulates SQL injection by disclosing fake SQL error messages
        if any(c in user_id for c in ["'", '"', '--', ';', '=']):
            error = (
                f"You have an error in your SQL syntax near '{user_id}' — "
                f"Warning: mysql_fetch_array() expects parameter 1 to be resource. "
                f"Query: SELECT * FROM users WHERE id={user_id}"
            )
        else:
            user_data = f"User #{user_id}: John Doe (john@example.com)"

    return render_template_string(USER_INFO_TEMPLATE, error=error, user_data=user_data)


if __name__ == '__main__':
    print("=" * 60)
    print("  Vulnerable Test Target is running!")
    print("  URL: http://localhost:5001")
    print("  Use this URL in your scanner for testing.")
    print("  Press CTRL+C to stop.")
    print("=" * 60)
    app.run(port=5001, debug=False)
