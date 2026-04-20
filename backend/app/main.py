from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.database import Base, engine
from app.routes import STATIC_DIR, router

Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="ChaoticMeter API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

try:
    app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        return FileResponse(f"{STATIC_DIR}/index.html")
except RuntimeError:
    pass  # frontend/dist not built yet