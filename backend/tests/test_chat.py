from unittest.mock import MagicMock, patch

from datetime import date

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

TODAY = date.today().isoformat()

SAMPLE_FIELDS = {
    "purpose": "Evaluating whether to enter into a business relationship with the other party.",
    "effectiveDate": TODAY,
    "mndaTermType": "expires",
    "mndaTermYears": 1,
    "confidentialityTermType": "years",
    "confidentialityTermYears": 1,
    "governingLaw": "",
    "jurisdiction": "",
    "mndaModifications": "",
    "party1Name": "",
    "party1Title": "",
    "party1Company": "",
    "party1NoticeAddress": "",
    "party1Date": TODAY,
    "party2Name": "",
    "party2Title": "",
    "party2Company": "",
    "party2NoticeAddress": "",
    "party2Date": TODAY,
}


def _make_llm_response(message: str, fields: dict | None = None, is_complete: bool = False) -> MagicMock:
    """Build a mock litellm completion response."""
    import json

    payload = {"message": message, "fields": fields or {}, "is_complete": is_complete}
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(payload)
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    return mock_response


class TestChatNdaEndpoint:
    def test_initial_greeting_with_no_messages(self):
        mock_resp = _make_llm_response("Hello! Let's start. What's the purpose of the NDA?")
        with patch("app.routers.chat.completion", return_value=mock_resp) as mock_llm:
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat/nda",
                    json={"messages": [], "current_fields": SAMPLE_FIELDS},
                )
        assert resp.status_code == 200
        data = resp.json()
        assert "Hello" in data["message"]
        assert "fields" in data
        assert data["is_complete"] is False
        # Verify the LLM was called with a synthetic first user message
        call_args = mock_llm.call_args
        messages_sent = call_args.kwargs["messages"]
        user_turns = [m for m in messages_sent if m["role"] == "user"]
        assert len(user_turns) == 1

    def test_field_extraction_merged_into_current_fields(self):
        extracted = {"party1Name": "Alice Smith", "party1Company": "Acme Corp"}
        mock_resp = _make_llm_response("Got it! What about Party 2?", fields=extracted)
        with patch("app.routers.chat.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat/nda",
                    json={
                        "messages": [{"role": "user", "content": "I'm Alice Smith from Acme Corp."}],
                        "current_fields": SAMPLE_FIELDS,
                    },
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["fields"]["party1Name"] == "Alice Smith"
        assert data["fields"]["party1Company"] == "Acme Corp"

    def test_is_complete_true_when_llm_returns_complete(self):
        all_fields = {
            "party1Name": "Alice", "party1Company": "Acme",
            "party2Name": "Bob", "party2Company": "Beta",
            "governingLaw": "Delaware", "jurisdiction": "New Castle, DE",
        }
        mock_resp = _make_llm_response("Your NDA is ready!", fields=all_fields, is_complete=True)
        with patch("app.routers.chat.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat/nda",
                    json={
                        "messages": [{"role": "user", "content": "All done."}],
                        "current_fields": SAMPLE_FIELDS,
                    },
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_complete"] is True

    def test_conversation_history_forwarded_to_llm(self):
        mock_resp = _make_llm_response("Thanks! What jurisdiction?")
        with patch("app.routers.chat.completion", return_value=mock_resp) as mock_llm:
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat/nda",
                    json={
                        "messages": [
                            {"role": "user", "content": "We're evaluating a partnership."},
                            {"role": "assistant", "content": "Great! Which state?"},
                            {"role": "user", "content": "Delaware."},
                        ],
                        "current_fields": SAMPLE_FIELDS,
                    },
                )
        assert resp.status_code == 200
        call_args = mock_llm.call_args
        messages_sent = call_args.kwargs["messages"]
        # Should include system prompt + 3 conversation turns
        assert len(messages_sent) == 4
        assert messages_sent[0]["role"] == "system"

    def test_missing_api_key_returns_500(self):
        with patch.dict("os.environ", {}, clear=True):
            # Remove OPENROUTER_API_KEY if present
            import os
            os.environ.pop("OPENROUTER_API_KEY", None)
            resp = client.post(
                "/api/chat/nda",
                json={"messages": [], "current_fields": SAMPLE_FIELDS},
            )
        assert resp.status_code == 500
        assert "API key" in resp.json()["detail"]

    def test_existing_fields_preserved_when_llm_extracts_nothing(self):
        existing = {**SAMPLE_FIELDS, "governingLaw": "Texas", "jurisdiction": "Austin, TX"}
        mock_resp = _make_llm_response("Great! Now tell me about Party 1.", fields={})
        with patch("app.routers.chat.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat/nda",
                    json={"messages": [{"role": "user", "content": "Yes."}], "current_fields": existing},
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["fields"]["governingLaw"] == "Texas"
        assert data["fields"]["jurisdiction"] == "Austin, TX"
