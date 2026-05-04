from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def _create_user_and_get_token(email: str) -> str:
    res = client.post("/api/auth/signup", json={"email": email, "password": "password123"})
    assert res.status_code == 200
    return res.cookies["auth_token"]


def _auth_cookies(token: str) -> dict:
    return {"auth_token": token}


def _save_doc(token: str, title: str = "Test NDA", doc_type: str = "Mutual NDA", fields: dict | None = None):
    return client.post(
        "/api/documents",
        json={"title": title, "doc_type": doc_type, "fields": fields or {"party1Company": "Acme"}},
        cookies=_auth_cookies(token),
    )


class TestSaveDocument:
    def test_save_document_success(self):
        token = _create_user_and_get_token("doc_save@example.com")
        res = _save_doc(token)
        assert res.status_code == 200
        body = res.json()
        assert body["title"] == "Test NDA"
        assert body["doc_type"] == "Mutual NDA"
        assert body["fields"]["party1Company"] == "Acme"
        assert "id" in body

    def test_save_document_requires_auth(self):
        fresh = TestClient(app)
        res = fresh.post(
            "/api/documents",
            json={"title": "T", "doc_type": "Mutual NDA", "fields": {}},
        )
        assert res.status_code == 401


class TestListDocuments:
    def test_list_documents_empty(self):
        token = _create_user_and_get_token("doc_list_empty@example.com")
        res = client.get("/api/documents", cookies=_auth_cookies(token))
        assert res.status_code == 200
        assert res.json() == []

    def test_list_documents_returns_own_docs_only(self):
        token1 = _create_user_and_get_token("list_user1@example.com")
        token2 = _create_user_and_get_token("list_user2@example.com")
        _save_doc(token1, title="User1 Doc")
        _save_doc(token2, title="User2 Doc")

        res = client.get("/api/documents", cookies=_auth_cookies(token1))
        assert res.status_code == 200
        titles = [d["title"] for d in res.json()]
        assert "User1 Doc" in titles
        assert "User2 Doc" not in titles

    def test_list_requires_auth(self):
        fresh = TestClient(app)
        res = fresh.get("/api/documents")
        assert res.status_code == 401


class TestGetDocument:
    def test_get_document_success(self):
        token = _create_user_and_get_token("doc_get@example.com")
        save_res = _save_doc(token)
        doc_id = save_res.json()["id"]

        res = client.get(f"/api/documents/{doc_id}", cookies=_auth_cookies(token))
        assert res.status_code == 200
        assert res.json()["id"] == doc_id

    def test_get_document_not_found(self):
        token = _create_user_and_get_token("doc_get_404@example.com")
        res = client.get("/api/documents/99999", cookies=_auth_cookies(token))
        assert res.status_code == 404

    def test_get_document_other_users_doc(self):
        token1 = _create_user_and_get_token("get_u1@example.com")
        token2 = _create_user_and_get_token("get_u2@example.com")
        save_res = _save_doc(token1)
        doc_id = save_res.json()["id"]

        res = client.get(f"/api/documents/{doc_id}", cookies=_auth_cookies(token2))
        assert res.status_code == 404


class TestUpdateDocument:
    def test_update_document_success(self):
        token = _create_user_and_get_token("doc_update@example.com")
        doc_id = _save_doc(token).json()["id"]

        res = client.put(
            f"/api/documents/{doc_id}",
            json={"title": "Updated", "doc_type": "Mutual NDA", "fields": {"party1Company": "NewCo"}},
            cookies=_auth_cookies(token),
        )
        assert res.status_code == 200
        assert res.json()["title"] == "Updated"
        assert res.json()["fields"]["party1Company"] == "NewCo"

    def test_update_other_users_doc(self):
        token1 = _create_user_and_get_token("upd_u1@example.com")
        token2 = _create_user_and_get_token("upd_u2@example.com")
        doc_id = _save_doc(token1).json()["id"]

        res = client.put(
            f"/api/documents/{doc_id}",
            json={"title": "Hacked", "doc_type": "Mutual NDA", "fields": {}},
            cookies=_auth_cookies(token2),
        )
        assert res.status_code == 404


class TestDeleteDocument:
    def test_delete_document_success(self):
        token = _create_user_and_get_token("doc_del@example.com")
        doc_id = _save_doc(token).json()["id"]

        res = client.delete(f"/api/documents/{doc_id}", cookies=_auth_cookies(token))
        assert res.status_code == 200

        # Confirm it's gone
        get_res = client.get(f"/api/documents/{doc_id}", cookies=_auth_cookies(token))
        assert get_res.status_code == 404

    def test_delete_not_found(self):
        token = _create_user_and_get_token("doc_del_404@example.com")
        res = client.delete("/api/documents/99999", cookies=_auth_cookies(token))
        assert res.status_code == 404

    def test_delete_requires_auth(self):
        fresh = TestClient(app)
        res = fresh.delete("/api/documents/1")
        assert res.status_code == 401
