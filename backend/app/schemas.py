from datetime import datetime

from pydantic import BaseModel, Field


class VoteCreate(BaseModel):
    voter_id: str
    x: float = Field(ge=-100, le=100)
    y: float = Field(ge=-100, le=100)


class VoteResponse(BaseModel):
    id: int
    voter_id: str
    x: float
    y: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=60)
    body: str = Field(default="", max_length=500)


class PostResponse(BaseModel):
    id: int
    slug: str
    title: str
    body: str
    created_at: datetime
    vote_count: int

    class Config:
        from_attributes = True


class PostDetailResponse(BaseModel):
    id: int
    slug: str
    title: str
    body: str
    created_at: datetime
    votes: list[VoteResponse]

    class Config:
        from_attributes = True