# index.py
from python_api.app import app
from flask import request, jsonify

# This line is required for Vercel
app = app

@app.route('/api/test')
def test():
    return {"message": "API is working!"}

@app.route('/api/send-transcript', methods=['POST'])
def send_transcript():
    data = request.json
    # Process the data and send the email
    # You'll need to implement the email sending logic here
    return jsonify({"message": "Email sent successfully"}), 200

# Add other routes as needed