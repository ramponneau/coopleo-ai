import sys
import os

# Add the python_api directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python_api')))

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "API is working!"})

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({"message": "Hello from Flask!"})

# Import and register other routes from app.py
from python_api.app import register_routes
register_routes(app)

print("Flask app initialized", file=sys.stderr)

# This is for local testing
if __name__ == '__main__':
    app.run(debug=True)