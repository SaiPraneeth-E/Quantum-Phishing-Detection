import os
from pathlib import Path
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from features import extract_url_features
from typing import Any

app = FastAPI(title='Quantum Phishing ML Service')
BASE_DIR = Path(__file__).resolve().parent


def load_or_none(path: Path):
  try:
    if path.exists():
      return joblib.load(path)
  except Exception:
    return None
  return None


def load_keras_model(path: Path):
  try:
    if not path.exists():
      return None
    from tensorflow.keras.models import load_model  # lazy import
    return load_model(path)
  except Exception:
    return None


SCALER = load_or_none(BASE_DIR / 'scaler.pkl')
QUANTUM_MODEL = load_or_none(BASE_DIR / 'quantum_model.pkl')
QUANTUM_SCALER = load_or_none(BASE_DIR / 'quantum_scaler.pkl')
PHISHING_MODEL_PKL = load_or_none(BASE_DIR / 'phishing_model.pkl')
PHISHING_MODEL_H5 = load_keras_model(BASE_DIR / 'phishing_model.h5')


class PredictRequest(BaseModel):
  url: str


@app.get('/health')
def health():
  return {'status': 'ok'}


def align_features(X: np.ndarray, expected_dim: int) -> np.ndarray:
  if expected_dim <= 0:
    return X
  current = X.shape[1]
  if current == expected_dim:
    return X
  if current > expected_dim:
    return X[:, :expected_dim]
  pad = np.zeros((X.shape[0], expected_dim - current), dtype=float)
  return np.hstack([X, pad])


def model_expected_dim(model: Any) -> int:
  if model is None:
    return 0
  if hasattr(model, 'n_features_in_'):
    try:
      return int(model.n_features_in_)
    except Exception:
      return 0
  # Keras model
  if hasattr(model, 'input_shape') and model.input_shape is not None:
    try:
      shape = model.input_shape
      if isinstance(shape, list):
        shape = shape[0]
      return int(shape[-1])
    except Exception:
      return 0
  return 0


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


def transform_quantum_features(X_scaled: np.ndarray) -> np.ndarray:
  if QUANTUM_MODEL is None:
    return X_scaled
  try:
    if hasattr(QUANTUM_MODEL, 'transform'):
      q = QUANTUM_MODEL.transform(X_scaled)
    elif hasattr(QUANTUM_MODEL, 'predict'):
      q = QUANTUM_MODEL.predict(X_scaled)
    else:
      q = X_scaled
    q = np.array(q, dtype=float)
    if q.ndim == 1:
      q = q.reshape(1, -1)
    if QUANTUM_SCALER is not None and hasattr(QUANTUM_SCALER, 'transform'):
      q = QUANTUM_SCALER.transform(q)
    return np.hstack([X_scaled, q])
  except Exception:
    return X_scaled


def predict_with_model(X_final: np.ndarray):
  """
  Tries Keras .h5 first, then sklearn .pkl.
  Returns: (label, confidence)
  """
  # 1) H5 model
  if PHISHING_MODEL_H5 is not None:
    expected = model_expected_dim(PHISHING_MODEL_H5)
    X_h5 = align_features(X_final, expected) if expected else X_final
    out = PHISHING_MODEL_H5.predict(X_h5, verbose=0)
    out = np.array(out)
    if out.ndim == 2 and out.shape[1] > 1:
      proba = out[0]
      idx = int(np.argmax(proba))
      conf = float(np.max(proba))
      label = 'phishing' if idx == 1 else 'legitimate'
      return label, conf
    p = float(out.reshape(-1)[0])
    label = 'phishing' if p >= 0.5 else 'legitimate'
    conf = p if p >= 0.5 else (1.0 - p)
    return label, float(conf)

  # 2) PKL model
  if PHISHING_MODEL_PKL is not None:
    expected = model_expected_dim(PHISHING_MODEL_PKL)
    X_pkl = align_features(X_final, expected) if expected else X_final
    pred = PHISHING_MODEL_PKL.predict(X_pkl)[0]
    if hasattr(PHISHING_MODEL_PKL, 'predict_proba'):
      proba = PHISHING_MODEL_PKL.predict_proba(X_pkl)[0]
      conf = float(np.max(proba))
    else:
      conf = 0.75
    label = 'phishing' if str(pred).lower() in ('1', 'phishing', 'true') else 'legitimate'
    return label, conf

  return None, None


@app.post('/predict')
def predict(req: PredictRequest):
  if not req.url or not req.url.strip():
    raise HTTPException(status_code=400, detail='URL is required')

  url = req.url.strip()
  if PHISHING_MODEL_H5 is None and PHISHING_MODEL_PKL is None:
    pred, conf, factors = heuristic_predict(url)
    return {'prediction': pred, 'confidence': conf, 'risk_factors': factors}

  # 1) Extract deterministic URL features
  X = extract_url_features(url)

  # 2) Scale
  if SCALER is not None:
    expected = model_expected_dim(SCALER)
    X_scaled_in = align_features(X, expected) if expected else X
    X_scaled = SCALER.transform(X_scaled_in)
  else:
    X_scaled = X

  # 3) Quantum feature module
  X_final = transform_quantum_features(X_scaled)

  # 4) Final phishing model (.h5 preferred)
  label, confidence = predict_with_model(X_final)
  if label is None:
    pred, conf, factors = heuristic_predict(url)
    return {'prediction': pred, 'confidence': conf, 'risk_factors': factors}

  # Lightweight risk factor hints for UX
  risk_factors = []
  if '@' in url:
    risk_factors.append("Contains '@' symbol")
  if url.count('.') > 4:
    risk_factors.append('Too many subdomains')
  if url.lower().startswith('http://'):
    risk_factors.append('Not using HTTPS')
  if any(k in url.lower() for k in ['login', 'verify', 'secure', 'account']):
    risk_factors.append('Contains potentially deceptive keywords')

  return {'prediction': label, 'confidence': float(confidence), 'risk_factors': risk_factors}


if __name__ == '__main__':
  import uvicorn
  uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PORT', '8000')))
