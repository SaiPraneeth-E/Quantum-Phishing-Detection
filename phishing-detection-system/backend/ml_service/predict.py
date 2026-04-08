import os
from pathlib import Path
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from features import extract_url_features

app = FastAPI(title='Quantum Phishing ML Service')
BASE_DIR = Path(__file__).resolve().parent


def load_or_none(path: Path):
  try:
    if path.exists():
      return joblib.load(path)
  except Exception:
    return None
  return None


SCALER = load_or_none(BASE_DIR / 'scaler.pkl')
QUANTUM_MODEL = load_or_none(BASE_DIR / 'quantum_model.pkl')
QUANTUM_SCALER = load_or_none(BASE_DIR / 'quantum_scaler.pkl')
PHISHING_MODEL = load_or_none(BASE_DIR / 'phishing_model.pkl')


class PredictRequest(BaseModel):
  url: str


@app.get('/health')
def health():
  return {'status': 'ok'}


def heuristic_predict(url: str):
  score = 0
  if '@' in url:
    score += 2
  if url.count('.') > 4:
    score += 1
  if 'login' in url.lower() or 'verify' in url.lower():
    score += 1
  if url.startswith('http://'):
    score += 1
  pred = 'phishing' if score >= 2 else 'legitimate'
  conf = min(0.98, 0.55 + 0.1 * score)
  factors = []
  if '@' in url:
    factors.append("Contains '@' symbol")
  if url.count('.') > 4:
    factors.append('Too many subdomains')
  if 'login' in url.lower() or 'verify' in url.lower():
    factors.append('Contains suspicious keywords')
  if url.startswith('http://'):
    factors.append('Not using HTTPS')
  return pred, conf, factors


@app.post('/predict')
def predict(req: PredictRequest):
  if not req.url or not req.url.strip():
    raise HTTPException(status_code=400, detail='URL is required')

  url = req.url.strip()
  if not PHISHING_MODEL:
    pred, conf, factors = heuristic_predict(url)
    return {'prediction': pred, 'confidence': conf, 'risk_factors': factors}

  X = extract_url_features(url)
  if SCALER is not None:
    X = SCALER.transform(X)
  if QUANTUM_MODEL is not None:
    Q = QUANTUM_MODEL.transform(X) if hasattr(QUANTUM_MODEL, 'transform') else X
    if QUANTUM_SCALER is not None:
      Q = QUANTUM_SCALER.transform(Q)
    X = np.hstack([X, Q])

  pred = PHISHING_MODEL.predict(X)[0]
  proba = PHISHING_MODEL.predict_proba(X)[0] if hasattr(PHISHING_MODEL, 'predict_proba') else [0.5, 0.5]
  label = 'phishing' if str(pred).lower() in ('1', 'phishing', 'true') else 'legitimate'
  confidence = float(np.max(proba))
  return {'prediction': label, 'confidence': confidence, 'risk_factors': []}


if __name__ == '__main__':
  import uvicorn
  uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PORT', '8000')))
