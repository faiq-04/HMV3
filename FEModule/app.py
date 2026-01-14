from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import base64
import cv2
import numpy as np
import sys
import os

# --- 1. SETUP & IMPORTS ---
# Add the current directory to Python path to ensure imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from inference import predict_emotion, load_ai_resources
template_dir = os.path.abspath('../UI')

app = Flask(__name__, 
            template_folder=template_dir,
                        static_folder=template_dir, # Search UI folder for files
                        static_url_path='')  # Serve static files from root
CORS(app) # Allows your frontend (browser) to talk to this backend

# --- 2. INITIALIZATION ---
# Load the AI models immediately when the server starts
print(" Starting HealMind Server...")
load_ai_resources()

# --- 3. API ROUTES ---

@app.route("/", methods=["GET"])
def home():
    """Serves the main website HTML."""
    return render_template("index.html")

@app.route("/stress")
def stress():
    return render_template("stress.html")

@app.route("/mood")
def mood():
    return render_template("mood.html")

@app.route("/camera")
def camera():
    return render_template("camera.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/register")
def register():
    return render_template("register.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    """Receives an image from frontend, analyzes it, and returns emotion."""
    try:
        # 1. Get the data from the frontend
        data = request.json
        if 'image' not in data:
            return jsonify({"error": "No image provided"}), 400
            
        image_base64 = data["image"]

        # 2. Decode the Base64 image
        try:
            image_data = image_base64.split(",")[1]
            image_bytes = base64.b64decode(image_data)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f" Image Decoding Error: {e}")
            return jsonify({"error": "Invalid image format"}), 400

        # 3. Pass the image to our 'Brain' (inference.py)
        result = predict_emotion(frame)
        
        # 4. Return the result as JSON
        return jsonify(result)
        
    except Exception as e:
        print(f" Server Error: {e}")
        return jsonify({"error": "Internal processing error"}), 500

if __name__ == "__main__":
    # Run the server on Port 5000
    print(" Server is ready at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)