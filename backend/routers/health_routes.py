from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])

class HealthCheck(BaseModel):
    status: str

@router.get("/api/health", response_model=HealthCheck)
def get_health():
    return {"status": "ok"}
