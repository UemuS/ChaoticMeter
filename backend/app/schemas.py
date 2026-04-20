import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


URL_PATTERN = re.compile(r"https?://|www\.\S+|\S+\.(com|net|org|io|co|me|ly|gg|tv|app)\b", re.IGNORECASE)

def strip_tags(value: str) -> str:
    return re.sub(r"<[^>]*>", "", value).strip()

def reject_links(value: str) -> str:
    if URL_PATTERN.search(value):
        raise ValueError("Links are not allowed")
    return value


class VoteCreate(BaseModel):
    voter_id: str = Field(min_length=1, max_length=64)
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

    @field_validator("title", "body")
    @classmethod
    def sanitize(cls, v: str) -> str:
        v = strip_tags(v)
        return reject_links(v)


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