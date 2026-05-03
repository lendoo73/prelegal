import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def _make_detection_response(message: str, doc_type: str | None = None) -> MagicMock:
    payload = {"message": message, "doc_type": doc_type, "is_complete": False}
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(payload)
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    return mock_response


def _make_collection_response(
    message: str, fields: dict | None = None, is_complete: bool = False
) -> MagicMock:
    # fields must be the full UniversalDocumentFields shape (all keys Optional)
    all_fields = {
        "purpose": None, "mndaTermType": None, "mndaTermYears": None,
        "confidentialityTermType": None, "confidentialityTermYears": None,
        "mndaModifications": None, "party1Name": None, "party1Title": None,
        "party1NoticeAddress": None, "party1Date": None,
        "party2Name": None, "party2Title": None, "party2NoticeAddress": None,
        "party2Date": None, "party1Company": None, "party2Company": None,
        "effectiveDate": None, "governingLaw": None, "jurisdiction": None,
        "subscriptionPeriod": None, "generalCapAmount": None,
        "technicalSupportLevel": None, "dpa": None, "term": None,
        "programDescription": None, "fees": None, "targetUptime": None,
        "targetResponseTime": None, "supportChannel": None,
        "scheduledDowntime": None, "categoriesOfPersonalData": None,
        "categoriesOfDataSubjects": None, "natureAndPurpose": None,
        "durationOfProcessing": None, "approvedSubprocessors": None,
        "governingMemberState": None, "services": None,
        "breachNotificationPeriod": None, "limitations": None,
        "trainingPermitted": None, "trainingPurposes": None,
        "trainingRestrictions": None, "improvementRestrictions": None,
        "deliverables": None, "paymentPeriod": None, "permittedUses": None,
        "licenseLimits": None, "paymentProcess": None, "warrantyPeriod": None,
        "obligations": None, "territory": None, "endDate": None,
        "pilotStartDate": None, "pilotEndDate": None, "noticeAddress": None,
    }
    if fields:
        all_fields.update(fields)
    payload = {"message": message, "fields": all_fields, "is_complete": is_complete}
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(payload)
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    return mock_response


class TestMultiDocChatDetectionPhase:
    def test_greeting_with_no_messages_returns_null_doc_type(self):
        mock_resp = _make_detection_response(
            "Hello! What type of legal document do you need to create?"
        )
        with patch("app.routers.chat_multi.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat",
                    json={"messages": [], "doc_type": None, "current_fields": {}},
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["doc_type"] is None
        assert data["is_complete"] is False
        assert "message" in data

    def test_detects_mutual_nda(self):
        mock_resp = _make_detection_response(
            "Great, I'll help you create a Mutual NDA! What companies are involved?",
            doc_type="Mutual NDA",
        )
        with patch("app.routers.chat_multi.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat",
                    json={
                        "messages": [{"role": "user", "content": "I need a Mutual NDA."}],
                        "doc_type": None,
                        "current_fields": {},
                    },
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["doc_type"] == "Mutual NDA"
        assert data["is_complete"] is False

    def test_detects_pilot_agreement(self):
        mock_resp = _make_detection_response(
            "I'll help you create a Pilot Agreement! Which company is trialing the product?",
            doc_type="Pilot Agreement",
        )
        with patch("app.routers.chat_multi.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat",
                    json={
                        "messages": [{"role": "user", "content": "I need a pilot agreement."}],
                        "doc_type": None,
                        "current_fields": {},
                    },
                )
        assert resp.status_code == 200
        assert resp.json()["doc_type"] == "Pilot Agreement"

    def test_invalid_doc_type_from_llm_is_nulled(self):
        # LLM returns a doc_type not in SUPPORTED_DOC_TYPES
        mock_resp = _make_detection_response(
            "I'm not sure what you need. Could you clarify?",
            doc_type="Unknown Contract Type",
        )
        with patch("app.routers.chat_multi.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat",
                    json={"messages": [], "doc_type": None, "current_fields": {}},
                )
        assert resp.status_code == 200
        assert resp.json()["doc_type"] is None

    def test_missing_api_key_returns_500(self):
        import os
        os.environ.pop("OPENROUTER_API_KEY", None)
        with patch.dict("os.environ", {}, clear=True):
            resp = client.post(
                "/api/chat",
                json={"messages": [], "doc_type": None, "current_fields": {}},
            )
        assert resp.status_code == 500
        assert "API key" in resp.json()["detail"]


class TestMultiDocChatCollectionPhase:
    def test_csa_field_extraction(self):
        extracted = {"party1Company": "Acme Corp", "party2Company": "CloudCo"}
        mock_resp = _make_collection_response(
            "Got it! What US state should govern this agreement?",
            fields=extracted,
        )
        with patch("app.routers.chat_multi.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat",
                    json={
                        "messages": [
                            {"role": "user", "content": "Customer is Acme Corp, provider is CloudCo."}
                        ],
                        "doc_type": "Cloud Service Agreement",
                        "current_fields": {},
                    },
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["fields"]["party1Company"] == "Acme Corp"
        assert data["fields"]["party2Company"] == "CloudCo"
        assert data["doc_type"] == "Cloud Service Agreement"

    def test_pilot_agreement_completion(self):
        extracted = {
            "party1Company": "Acme",
            "party2Company": "TechCorp",
            "pilotStartDate": "2026-05-01",
            "pilotEndDate": "2026-08-01",
            "governingLaw": "Delaware",
            "jurisdiction": "New Castle, DE",
        }
        mock_resp = _make_collection_response(
            "Your document is ready for downloading.",
            fields=extracted,
            is_complete=True,
        )
        with patch("app.routers.chat_multi.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat",
                    json={
                        "messages": [{"role": "user", "content": "All done."}],
                        "doc_type": "Pilot Agreement",
                        "current_fields": {},
                    },
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_complete"] is True
        assert "ready for downloading" in data["message"]
        assert data["fields"]["pilotEndDate"] == "2026-08-01"

    def test_existing_fields_preserved_across_turns(self):
        existing = {"party1Company": "Acme Corp", "governingLaw": "Delaware"}
        mock_resp = _make_collection_response(
            "Great! What is the pilot end date?",
            fields={},
        )
        with patch("app.routers.chat_multi.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat",
                    json={
                        "messages": [{"role": "user", "content": "Nothing new to add."}],
                        "doc_type": "Pilot Agreement",
                        "current_fields": existing,
                    },
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["fields"]["party1Company"] == "Acme Corp"
        assert data["fields"]["governingLaw"] == "Delaware"

    def test_unsupported_doc_type_returns_400(self):
        with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
            resp = client.post(
                "/api/chat",
                json={
                    "messages": [{"role": "user", "content": "hello"}],
                    "doc_type": "Employment Contract",
                    "current_fields": {},
                },
            )
        assert resp.status_code == 400
        assert "Unsupported document type" in resp.json()["detail"]

    def test_nda_fields_extracted_via_multi_endpoint(self):
        extracted = {
            "party1Name": "Alice Smith",
            "party1Company": "Acme Corp",
            "party2Name": "Bob Jones",
            "party2Company": "Beta Inc",
        }
        mock_resp = _make_collection_response(
            "Got it! What state should govern this agreement?",
            fields=extracted,
        )
        with patch("app.routers.chat_multi.completion", return_value=mock_resp):
            with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                resp = client.post(
                    "/api/chat",
                    json={
                        "messages": [
                            {"role": "user", "content": "Party 1 is Alice Smith at Acme Corp, Party 2 is Bob Jones at Beta Inc."}
                        ],
                        "doc_type": "Mutual NDA",
                        "current_fields": {},
                    },
                )
        assert resp.status_code == 200
        data = resp.json()
        assert data["fields"]["party1Name"] == "Alice Smith"
        assert data["fields"]["party2Company"] == "Beta Inc"
        assert data["doc_type"] == "Mutual NDA"

    def test_all_supported_doc_types_accepted(self):
        from app.routers.chat_multi import SUPPORTED_DOC_TYPES
        mock_resp = _make_collection_response("Tell me more about the parties.")

        for doc_type in SUPPORTED_DOC_TYPES:
            with patch("app.routers.chat_multi.completion", return_value=mock_resp):
                with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
                    resp = client.post(
                        "/api/chat",
                        json={
                            "messages": [{"role": "user", "content": "hi"}],
                            "doc_type": doc_type,
                            "current_fields": {},
                        },
                    )
            assert resp.status_code == 200, f"Expected 200 for {doc_type}, got {resp.status_code}"
            assert resp.json()["doc_type"] == doc_type
