import re
from urllib.parse import urlparse
import numpy as np


SUSPICIOUS_WORDS = [
  'login', 'signin', 'verify', 'secure', 'update', 'account',
  'bank', 'paypal', 'wallet', 'otp', 'password', 'confirm',
]


def extract_url_features(url: str) -> np.ndarray:
  """
  Build a robust URL feature vector for phishing detection.
  Returns shape (1, 30).
  """
  raw = (url or '').strip().lower()
  if not raw.startswith(('http://', 'https://')):
    raw = f'https://{raw}'

  parsed = urlparse(raw)
  host = parsed.netloc or ''
  path = parsed.path or ''
  query = parsed.query or ''
  full = raw

  host_parts = [x for x in host.split('.') if x]
  path_parts = [x for x in path.split('/') if x]

  digit_count = sum(ch.isdigit() for ch in full)
  alpha_count = sum(ch.isalpha() for ch in full)
  special_count = sum(not ch.isalnum() for ch in full)

  features = [
    len(full),                              # 0
    len(host),                              # 1
    len(path),                              # 2
    len(query),                             # 3
    full.count('.'),                        # 4
    full.count('-'),                        # 5
    full.count('@'),                        # 6
    full.count('?'),                        # 7
    full.count('&'),                        # 8
    full.count('='),                        # 9
    full.count('%'),                        # 10
    digit_count,                            # 11
    alpha_count,                            # 12
    special_count,                          # 13
    digit_count / max(len(full), 1),        # 14
    alpha_count / max(len(full), 1),        # 15
    special_count / max(len(full), 1),      # 16
    1 if re.search(r'\d+\.\d+\.\d+\.\d+', host) else 0,  # 17
    1 if full.startswith('https://') else 0,             # 18
    max(len(host_parts) - 2, 0),            # 19 subdomain depth
    len(path_parts),                         # 20
    max((len(x) for x in path_parts), default=0),  # 21
    1 if ':' in host else 0,                 # 22 custom port
    1 if 'xn--' in host else 0,              # 23 punycode
    sum(1 for w in SUSPICIOUS_WORDS if w in full),  # 24
    1 if re.search(r'(.)\1{3,}', full) else 0,      # 25 repeated chars
    len(set(full)) / max(len(full), 1),      # 26 character diversity
    host.count('.'),                          # 27
    len(host_parts[0]) if host_parts else 0, # 28
    1 if len(full) > 75 else 0,              # 29 long URL flag
  ]

  return np.array(features, dtype=float).reshape(1, -1)
