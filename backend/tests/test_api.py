import pytest
from fastapi.testclient import TestClient
import string, random

from main import app
from database import get_db, engine
from models import Base

# Ensure we use a clean DB or just keep creating new collections for isolation.
client = TestClient(app)

def random_string(k=8):
    return "".join(random.choices(string.ascii_letters, k=k))

@pytest.fixture(scope="module")
def setup_collection():
    name = random_string()
    password = "pass"
    # Register
    res = client.post("/api/register", json={"name": name, "password": password})
    assert res.status_code == 200
    token = res.json()["token"]
    
    return {"name": name, "password": password, "token": token}

def test_register_duplicate(setup_collection):
    name = setup_collection["name"]
    res = client.post("/api/register", json={"name": name, "password": "pass"})
    assert res.status_code == 400

def test_login(setup_collection):
    res = client.post("/api/login", json={"name": setup_collection["name"], "password": setup_collection["password"]})
    assert res.status_code == 200
    assert "token" in res.json()

def test_login_invalid():
    res = client.post("/api/login", json={"name": "invalid", "password": "pass"})
    assert res.status_code == 400

def test_get_collection_info(setup_collection):
    name = setup_collection["name"]
    token = setup_collection["token"]
    res = client.get(f"/api/collection/{name}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == name
    assert data["is_owner"] == True

def test_get_settings(setup_collection):
    token = setup_collection["token"]
    res = client.get("/api/settings", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == setup_collection["name"]

def test_update_settings(setup_collection):
    token = setup_collection["token"]
    res = client.put("/api/settings", headers={"Authorization": f"Bearer {token}"}, json={
        "is_public": True,
        "display_images": False,
        "display_mode": "grid",
        "links_per_page": 50
    })
    assert res.status_code == 200
    
    res2 = client.get("/api/settings", headers={"Authorization": f"Bearer {token}"})
    assert res2.json()["is_public"] == True
    assert res2.json()["display_images"] == False

def test_access_tokens_crud(setup_collection):
    token = setup_collection["token"]
    # create
    res = client.post("/api/settings/access_token", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    new_token_id = res.json()["id"]
    
    # get
    res2 = client.get("/api/settings/access_tokens", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200
    tokens = res2.json()
    assert len(tokens) >= 1
    assert any(t["id"] == new_token_id for t in tokens)
    
    # delete
    res3 = client.delete(f"/api/settings/access_token/{new_token_id}", headers={"Authorization": f"Bearer {token}"})
    assert res3.status_code == 200

def test_links_crud_and_tags(setup_collection):
    token = setup_collection["token"]
    name = setup_collection["name"]
    
    # Create Link
    link_url = "https://example.com/" + random_string(4)
    res = client.post("/api/link", headers={"Authorization": f"Bearer {token}"}, json={
        "url": link_url,
        "title": "Example",
        "description": "An example link",
        "tags": "test, api"
    })
    assert res.status_code == 200
    link_data = res.json()
    link_id = link_data["id"]
    assert link_data["url"] == link_url
    assert "test" in link_data["tags"]
    
    # Get Single Link
    res2 = client.get(f"/api/link/{link_id}", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200
    assert res2.json()["url"] == link_url
    
    # Update Link
    res3 = client.put(f"/api/link/{link_id}", headers={"Authorization": f"Bearer {token}"}, json={
        "url": link_url,
        "title": "Example Updated",
        "description": "An example link updated",
        "tags": "test2"
    })
    assert res3.status_code == 200
    assert res3.json()["title"] == "Example Updated"
    assert "test2" in res3.json()["tags"]
    
    # Get Collection Tags
    res_tags = client.get(f"/api/collection/{name}/tags", headers={"Authorization": f"Bearer {token}"})
    assert res_tags.status_code == 200
    tags = res_tags.json()
    assert "test2" in tags
    
    # Get Collection Links
    res4 = client.get(f"/api/links/{name}", headers={"Authorization": f"Bearer {token}"})
    assert res4.status_code == 200
    paginated = res4.json()
    assert paginated["total"] >= 1
    assert any(item["id"] == link_id for item in paginated["items"])
    
    # Get single link (pop) - requires unarchived
    res_pop = client.get(f"/api/link?tags=test2", headers={"Authorization": f"Bearer {token}"})
    assert res_pop.status_code == 200
    
    # Archive Link
    res5 = client.post(f"/api/link/{link_id}/archive?archived=true", headers={"Authorization": f"Bearer {token}"})
    assert res5.status_code == 200
    
    # Delete Link
    res6 = client.delete(f"/api/link/{link_id}", headers={"Authorization": f"Bearer {token}"})
    assert res6.status_code == 200
    
    # Verify deletion
    res7 = client.get(f"/api/link/{link_id}", headers={"Authorization": f"Bearer {token}"})
    assert res7.status_code == 404

def test_private_collection_access_unauthenticated(setup_collection):
    name = setup_collection["name"]
    # Ensure it is private first (by default it is, but let's be sure)
    token = setup_collection["token"]
    client.put("/api/settings", headers={"Authorization": f"Bearer {token}"}, json={
        "is_public": False,
        "display_images": True,
        "display_mode": "list",
        "links_per_page": 20
    })

    # Try to access without token
    res = client.get(f"/api/collection/{name}")
    assert res.status_code == 403

def test_private_collection_access_wrong_user(setup_collection):
    name1 = setup_collection["name"]
    # Ensure it is private
    token1 = setup_collection["token"]
    client.put("/api/settings", headers={"Authorization": f"Bearer {token1}"}, json={
        "is_public": False,
        "display_images": True,
        "display_mode": "list",
        "links_per_page": 20
    })

    # Create a second user
    name2 = random_string()
    res2 = client.post("/api/register", json={"name": name2, "password": "pass"})
    token2 = res2.json()["token"]

    # Try to access first user's collection with second user's token
    res = client.get(f"/api/collection/{name1}", headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 403
