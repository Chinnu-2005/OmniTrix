from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
import io

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/": {"origins": "*"}}, supports_credentials=True)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Configure Google Generative AI API key
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

genai.configure(api_key=api_key)

# Define the secret token
SECRET_TOKEN = os.getenv("SECRET_TOKEN")

def clean_text(text):
    """Clean the text by removing special formatting characters."""
    cleaned_text = text.replace('*', '').strip()
    return "\n".join(line.strip() for line in cleaned_text.split('\n') if line.strip())

@app.route('/')
def home():
    return "AI Summary Service is Running!"

@app.route('/upload-image', methods=['POST'])
def upload_and_process_image():
    token = request.headers.get('Authorization')
    if token != f"Bearer {SECRET_TOKEN}":
        return jsonify({"error": "Unauthorized"}), 403

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    mime_type = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg"
    }.get(os.path.splitext(file.filename)[1].lower(), "image/png")

    if file and os.path.splitext(file.filename)[1].lower() in ('.png', '.jpg', '.jpeg'):
        try:
            image_bytes = file.read()
            sample_file = {
                "mime_type": mime_type,
                "data": image_bytes
            }

            model = genai.GenerativeModel(model_name="gemini-1.5-flash")
            response = model.generate_content([sample_file, "Analyze this whiteboard image and provide a summary of what's drawn or written on it. Be descriptive about shapes, text, and any content you can identify."])
            
            summary = response.text
            cleaned_summary = clean_text(summary)
            return jsonify({"summary": cleaned_summary})
            
        except Exception as e:
            app.logger.error(f"Error processing image: {e}")
            return jsonify({"error": f"Error processing image: {e}"}), 500

    return jsonify({"error": "Invalid file format. Only PNG, JPG, and JPEG images are allowed."}), 400

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)