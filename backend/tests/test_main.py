import pytest
from fastapi.testclient import TestClient
from main import app
from sqlalchemy.orm import sessionmaker
import jwt
import string, random
from config import JWT_SECRET

client = TestClient(app)

def test_login_and_get_collection():
    name = "".join(random.choices(string.ascii_letters, k=8))
    client.post("/api/register", json={"name": name, "password": "pass"})
    res = client.post("/api/login", json={"name": name, "password": "pass"})
    token = res.json()["token"]
    
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    print("DECODED PAYLOAD:", payload)
    
    res = client.get(f"/api/collection/{name}", headers={"Authorization": f"Bearer {token}"})
    print("RESPONSE:", res.json())

if __name__ == "__main__":
    test_login_and_get_collection()
