from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from predict import predict_url  # adjust if needed

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Backend Running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    features = data.get("features")

    result = predict_url(features)

    return jsonify({"prediction": result})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
