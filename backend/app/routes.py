from datetime import datetime
import random
import re
import string

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Post, Vote
from app.schemas import PostCreate, PostDetailResponse, PostResponse, VoteCreate, VoteResponse

router = APIRouter()


def generate_slug(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    base = base[:40].strip("-") or "post"
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{base}-{suffix}"


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.get("/posts", response_model=list[PostResponse])
def list_posts(
    sort: str = Query(default="new"),
    search: str = Query(default=""),
    db: Session = Depends(get_db),
):
    vote_count = func.count(Vote.id)

    query = (
        db.query(
            Post.id,
            Post.slug,
            Post.title,
            Post.body,
            Post.created_at,
            vote_count.label("vote_count"),
        )
        .outerjoin(Vote, Vote.post_id == Post.id)
    )

    if search.strip():
        query = query.filter(Post.title.ilike(f"%{search.strip()}%"))

    query = query.group_by(Post.id)

    if sort == "top":
        query = query.order_by(vote_count.desc(), Post.created_at.desc())
    else:
        query = query.order_by(Post.created_at.desc())

    rows = query.limit(50).all()

    return [
        PostResponse(
            id=row.id,
            slug=row.slug,
            title=row.title,
            body=row.body or "",
            created_at=row.created_at,
            vote_count=row.vote_count,
        )
        for row in rows
    ]


@router.post("/posts", response_model=PostResponse)
def create_post(payload: PostCreate, db: Session = Depends(get_db)):
    post = Post(
        slug=generate_slug(payload.title),
        title=payload.title.strip(),
        body=payload.body.strip(),
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    return PostResponse(
        id=post.id,
        slug=post.slug,
        title=post.title,
        body=post.body or "",
        created_at=post.created_at,
        vote_count=0,
    )


@router.get("/posts/{slug}", response_model=PostDetailResponse)
def get_post(slug: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.slug == slug).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return post


@router.post("/posts/{slug}/vote", response_model=VoteResponse)
def create_or_update_vote(slug: str, payload: VoteCreate, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.slug == slug).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    vote = (
        db.query(Vote)
        .filter(Vote.post_id == post.id, Vote.voter_id == payload.voter_id)
        .first()
    )

    now = datetime.utcnow()

    if vote:
        vote.x = payload.x
        vote.y = payload.y
        vote.updated_at = now
    else:
        vote = Vote(
            post_id=post.id,
            voter_id=payload.voter_id,
            x=payload.x,
            y=payload.y,
            created_at=now,
            updated_at=now,
        )
        db.add(vote)

    db.commit()
    db.refresh(vote)

    return vote