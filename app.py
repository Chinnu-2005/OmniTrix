from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
import io
from PIL import Image

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

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

@app.route('/ai/test', methods=['GET'])
def test():
    return jsonify({"status": "success", "message": "AI server is working!"})

@app.route('/ai/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "AI Summary Service"})

@app.route('/test', methods=['GET'])
def test_root():
    return jsonify({"status": "success", "message": "AI server is working!"})

@app.route('/health', methods=['GET'])
def health_root():
    return jsonify({"status": "healthy", "service": "AI Summary Service"})

@app.route('/ai/models', methods=['GET'])
def list_models():
    try:
        models = genai.list_models()
        vision_models = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                vision_models.append({
                    'name': model.name,
                    'display_name': model.display_name,
                    'methods': model.supported_generation_methods
                })
        return jsonify({"vision_models": vision_models})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ai/upload-image', methods=['POST', 'OPTIONS'])
def upload_and_process_image():
    if request.method == 'OPTIONS':
        return '', 200
    token = request.headers.get('Authorization')
    if token != f"Bearer {SECRET_TOKEN}":
        return jsonify({"error": "Unauthorized"}), 403

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read the image file
        image_data = file.read()
        
        # Create a PIL Image from the uploaded file
        from PIL import Image
        image = Image.open(io.BytesIO(image_data))
        
        # Use available Gemini models that support vision
        model_names = [
            'gemini-2.5-flash',
            'gemini-2.0-flash', 
            'gemini-flash-latest',
            'gemini-2.5-pro'
        ]
        model = None
        
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                logging.info(f"Successfully initialized model: {model_name}")
                break
            except Exception as e:
                logging.warning(f"Model {model_name} not available: {e}")
                continue
        
        if not model:
            raise Exception("No suitable Gemini model available for vision tasks")
        
        # Generate content with the image
        prompt = "Provide a brief summary of this whiteboard in 2-3 sentences. Focus on the main elements: shapes, text, drawings, and colors."
        response = model.generate_content([image, prompt])
        
        # Clean and format the response
        summary = clean_text(response.text)
        
        return jsonify({"summary": summary})
        
    except Exception as e:
        logging.error(f"Error processing image: {str(e)}")
        return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)