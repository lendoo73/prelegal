import json
import sqlite3

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter()


class SaveDocumentRequest(BaseModel):
    title: str
    doc_type: str
    fields: dict


@router.post("")
def save_document(
    body: SaveDocumentRequest,
    user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    user_id = int(user["sub"])
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO documents (user_id, title, doc_type, fields) VALUES (?, ?, ?, ?)",
        (user_id, body.title, body.doc_type, json.dumps(body.fields)),
    )
    doc_id = cursor.lastrowid
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    return _row_to_dict(row)


@router.get("")
def list_documents(
    user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    user_id = int(user["sub"])
    cursor = db.cursor()
    cursor.execute(
        "SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC",
        (user_id,),
    )
    rows = cursor.fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/{doc_id}")
def get_document(
    doc_id: int,
    user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    user_id = int(user["sub"])
    cursor = db.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return _row_to_dict(row)


@router.put("/{doc_id}")
def update_document(
    doc_id: int,
    body: SaveDocumentRequest,
    user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    user_id = int(user["sub"])
    cursor = db.cursor()
    cursor.execute("SELECT id FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Document not found")
    cursor.execute(
        "UPDATE documents SET title = ?, doc_type = ?, fields = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (body.title, body.doc_type, json.dumps(body.fields), doc_id),
    )
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    return _row_to_dict(cursor.fetchone())


@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    user_id = int(user["sub"])
    cursor = db.cursor()
    cursor.execute("SELECT id FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Document not found")
    cursor.execute("DELETE FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
    return {"message": "Deleted"}


def _row_to_dict(row) -> dict:
    d = dict(row)
    d["fields"] = json.loads(d["fields"])
    return d
