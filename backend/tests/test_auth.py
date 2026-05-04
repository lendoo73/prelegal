from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def _signup(email: str, password: str = "password123"):
    return client.post("/api/auth/signup", json={"email": email, "password": password})


class TestSignup:
    def test_signup_success(self):
        res = _signup("new_user@example.com")
        assert res.status_code == 200
        assert res.json()["email"] == "new_user@example.com"
        assert "auth_token" in res.cookies

    def test_signup_duplicate_email(self):
        _signup("dup@example.com")
        res = _signup("dup@example.com")
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"]

    def test_signup_sets_httponly_cookie(self):
        res = _signup("cookie_test@example.com")
        assert res.status_code == 200
        assert "auth_token" in res.cookies


class TestSignin:
    def test_signin_success(self):
        _signup("signin_ok@example.com", "pass1234")
        res = client.post("/api/auth/signin", json={"email": "signin_ok@example.com", "password": "pass1234"})
        assert res.status_code == 200
        assert "auth_token" in res.cookies

    def test_signin_wrong_password(self):
        _signup("signin_bad@example.com", "correct")
        res = client.post("/api/auth/signin", json={"email": "signin_bad@example.com", "password": "wrong"})
        assert res.status_code == 401

    def test_signin_unknown_email(self):
        res = client.post("/api/auth/signin", json={"email": "ghost@example.com", "password": "pass"})
        assert res.status_code == 401


class TestSignout:
    def test_signout_clears_cookie(self):
        _signup("signout@example.com")
        res = client.post("/api/auth/signout")
        assert res.status_code == 200
        assert res.json()["message"] == "Signed out"


class TestMe:
    def test_me_authenticated(self):
        res = _signup("me_test@example.com")
        token = res.cookies["auth_token"]
        res = client.get("/api/auth/me", cookies={"auth_token": token})
        assert res.status_code == 200
        assert res.json()["email"] == "me_test@example.com"

    def test_me_unauthenticated(self):
        fresh = TestClient(app)
        res = fresh.get("/api/auth/me")
        assert res.status_code == 401

    def test_me_invalid_token(self):
        fresh = TestClient(app)
        res = fresh.get("/api/auth/me", cookies={"auth_token": "invalid.token.here"})
        assert res.status_code == 401
