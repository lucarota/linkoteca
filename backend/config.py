import os
import secrets

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
JWT_SECRET = None
ALLOWED_ORIGINS_ENV = ""
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if line.strip().startswith('JWT_SECRET='):
                JWT_SECRET = line.strip().split('=', 1)[1].strip()
            elif line.strip().startswith('ALLOWED_ORIGINS='):
                ALLOWED_ORIGINS_ENV = line.strip().split('=', 1)[1].strip()

if not JWT_SECRET:
    JWT_SECRET = secrets.token_hex(16)
    with open(env_path, 'a') as f:
        f.write(f"JWT_SECRET={JWT_SECRET}\n")

if ALLOWED_ORIGINS_ENV:
    frontend_origins = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(',')]
else:
    frontend_origins = ["http://localhost:5173", "http://localhost:3000"]
