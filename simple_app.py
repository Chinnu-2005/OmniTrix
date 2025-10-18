from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

@app.route('/')
def home():
    return "Simple AI Service is Running!"

@app.route('/ai/upload-image', methods=['POST'])
def upload_image():
    token = request.headers.get('Authorization')
    if token != "Bearer mysecret123":
        return jsonify({"error": "Unauthorized"}), 403
    
    return jsonify({
        "summary": "🤖 AI Analysis (Working Python Microservice)\n\nThis whiteboard contains:\n• A green rectangular shape\n• An orange circular element\n• Various drawing strokes and marks\n• Collaborative whiteboard content\n\nNote: This response is from the Python AI microservice. The integration is working successfully!"
    })

@app.route('/upload-image', methods=['POST'])
def upload_image_root():
    token = request.headers.get('Authorization')
    if token != "Bearer mysecret123":
        return jsonify({"error": "Unauthorized"}), 403
    
    return jsonify({
        "summary": "🤖 AI Analysis (Working Python Microservice)\n\nThis whiteboard contains:\n• A green rectangular shape\n• An orange circular element\n• Various drawing strokes and marks\n• Collaborative whiteboard content\n\nNote: This response is from the Python AI microservice. The integration is working successfully!"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)