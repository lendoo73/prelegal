import os
import sqlite3
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from passlib.context import CryptContext
from pydantic import BaseModel

from app.database import get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24


def _secret_key() -> str:
    return os.getenv("SECRET_KEY", "dev-secret-change-in-production")


class UserCredentials(BaseModel):
    email: str
    password: str


def _create_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": str(user_id), "email": email, "exp": expire},
        _secret_key(),
        algorithm=ALGORITHM,
    )


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, _secret_key(), algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        "auth_token",
        token,
        httponly=True,
        samesite="lax",
        max_age=TOKEN_EXPIRE_HOURS * 3600,
    )


@router.post("/signup")
def signup(
    credentials: UserCredentials,
    response: Response,
    db: sqlite3.Connection = Depends(get_db),
):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (credentials.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = pwd_context.hash(credentials.password)
    cursor.execute(
        "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
        (credentials.email, hashed),
    )
    token = _create_token(cursor.lastrowid, credentials.email)
    _set_auth_cookie(response, token)
    return {"email": credentials.email}


@router.post("/signin")
def signin(
    credentials: UserCredentials,
    response: Response,
    db: sqlite3.Connection = Depends(get_db),
):
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, hashed_password FROM users WHERE email = ?", (credentials.email,)
    )
    row = cursor.fetchone()
    if not row or not pwd_context.verify(credentials.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _create_token(row["id"], credentials.email)
    _set_auth_cookie(response, token)
    return {"email": credentials.email}


@router.post("/signout")
def signout(response: Response):
    response.delete_cookie("auth_token")
    return {"message": "Signed out"}


def get_current_user(auth_token: str = Cookie(default=None)) -> dict:
    if not auth_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _decode_token(auth_token)


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"email": user["email"], "id": user["sub"]}
