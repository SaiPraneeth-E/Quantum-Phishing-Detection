import re
from urllib.parse import urlparse
import numpy as np


def extract_url_features(url: str) -> np.ndarray:
  """Simple deterministic URL feature extractor."""
  if not url:
    url = ''
  raw = url.strip()
  if not raw.startswith(('http://', 'https://')):
    raw = f'https://{raw}'
  parsed = urlparse(raw)
  host = parsed.netloc or ''
  path = parsed.path or ''
  query = parsed.query or ''

  feats = [
    len(raw),
    len(host),
    len(path),
    len(query),
    raw.count('.'),
    raw.count('-'),
    raw.count('@'),
    raw.count('?'),
    raw.count('&'),
    raw.count('='),
    sum(c.isdigit() for c in raw),
    1 if re.search(r'\d+\.\d+\.\d+\.\d+', host) else 0,
    1 if raw.startswith('https://') else 0,
  ]
  return np.array(feats, dtype=float).reshape(1, -1)
