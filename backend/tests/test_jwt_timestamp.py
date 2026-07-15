import jwt
from datetime import datetime, timedelta
import time

exp = datetime.utcnow() + timedelta(hours=1)
token = jwt.encode({"sub": "test", "exp": exp.timestamp()}, "secret", algorithm="HS256")
try:
    payload = jwt.decode(token, "secret", algorithms=["HS256"])
    print("Success:", payload)
except jwt.ExpiredSignatureError:
    print("Expired!")
