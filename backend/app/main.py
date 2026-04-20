import html as html_module
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.database import Base, engine, get_db
from app.models import Post
from app.routes import BOT_AGENTS, STATIC_DIR, router

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

app.include_router(router, prefix="/api")


def is_bot(user_agent: str) -> bool:
    ua = user_agent.lower()
    return any(bot in ua for bot in BOT_AGENTS)


def og_html(post: Post, base_url: str) -> str:
    title = html_module.escape(post.title)
    description = html_module.escape(post.body or "Vote on the ChaoticMeter compass.")
    url = f"{base_url}/posts/{post.slug}"
    image = f"{base_url}/api/posts/{post.slug}/og-image"
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{title} — ChaoticMeter</title>
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="ChaoticMeter">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="{image}">
</head>
<body></body>
</html>"""


@app.get("/posts/{slug}")
def post_page(slug: str, request: Request):
    ua = request.headers.get("user-agent", "")
    if is_bot(ua):
        db = next(get_db())
        post = db.query(Post).filter(Post.slug == slug).first()
        if not post:
            return HTMLResponse("<h1>Not found</h1>", status_code=404)
        base_url = str(request.base_url).rstrip("/")
        return HTMLResponse(og_html(post, base_url))
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


try:
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
except RuntimeError:
    pass  # frontend not built yet
