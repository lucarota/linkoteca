from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send

from config import frontend_origins
from database import init_db
from routers import auth_routes, collections_routes, settings_routes, links_routes, health_routes

init_db()

app = FastAPI(
    title="Linkoteca API",
    description="Backend API for Linkoteca, a self-hosted bookmarking tool to save your favorite links in collections. Organize, search and preview your web links with ease.",
    version="1.0.0",
    openapi_tags=[
        {"name": "Authentication", "description": "Operations for registration and login."},
        {"name": "Collections", "description": "Operations for fetching collection details."},
        {"name": "Settings", "description": "Operations for collection settings and access tokens."},
        {"name": "Links", "description": "Operations to manage and search saved links."}
    ]
)

class DynamicCORSMiddleware:
    def __init__(self, app: ASGIApp):
        """Initializes the DynamicCORSMiddleware with different CORS policies."""
        self.app = app
        
        self.frontend_cors = CORSMiddleware(
            app=app,
            allow_origins=frontend_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        self.public_cors = CORSMiddleware(
            app=app,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Dynamically applies public or frontend CORS based on the request path."""
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path == "/api/link":
                await self.public_cors(scope, receive, send)
                return
        await self.frontend_cors(scope, receive, send)

app.add_middleware(DynamicCORSMiddleware)

app.include_router(auth_routes.router)
app.include_router(collections_routes.router)
app.include_router(settings_routes.router)
app.include_router(links_routes.router)
app.include_router(health_routes.router)
