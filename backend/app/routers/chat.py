import os
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException
from litellm import completion
from pydantic import BaseModel

router = APIRouter()

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """\
You are a helpful legal document assistant helping users create a Mutual Non-Disclosure Agreement (MNDA) based on the Common Paper Mutual NDA Standard Terms Version 1.0.

Your goal is to gather the required information through friendly, conversational questions — ask one or two questions at a time. Prioritize the most important missing fields: the two parties (names and companies), the purpose, and the governing jurisdiction.

FIELDS TO COLLECT:
- purpose: How Confidential Information may be used (e.g. "Evaluating a potential business partnership")
- effectiveDate: Agreement effective date in ISO format YYYY-MM-DD (default: {today})
- mndaTermType: Duration of the MNDA — "expires" (fixed term) or "continues" (until terminated)
- mndaTermYears: If mndaTermType is "expires", number of years 1–10 (default: 1)
- confidentialityTermType: How long confidentiality obligations last — "years" (N years) or "perpetuity" (forever)
- confidentialityTermYears: If confidentialityTermType is "years", number of years 1–10 (default: 1)
- governingLaw: US state governing this agreement (e.g. "Delaware")
- jurisdiction: City/county and state for courts (e.g. "New Castle, DE")
- mndaModifications: Any modifications to standard terms (optional, default: empty string)
- party1Name: Full name of the person signing for Party 1
- party1Title: Job title of the Party 1 signer
- party1Company: Company name of Party 1
- party1NoticeAddress: Email or postal address for Party 1 notices
- party1Date: Date Party 1 is signing, ISO format YYYY-MM-DD (default: {today})
- party2Name: Full name of the person signing for Party 2
- party2Title: Job title of the Party 2 signer
- party2Company: Company name of Party 2
- party2NoticeAddress: Email or postal address for Party 2 notices
- party2Date: Date Party 2 is signing, ISO format YYYY-MM-DD (default: {today})

DEFAULTS (apply these automatically if the user does not specify):
- effectiveDate, party1Date, party2Date: {today}
- mndaTermType: "expires", mndaTermYears: 1
- confidentialityTermType: "years", confidentialityTermYears: 1
- purpose: "Evaluating whether to enter into a business relationship with the other party."
- mndaModifications: ""

COMPLETION: Set is_complete to true when you have all of: party1Name, party1Company, party2Name, party2Company, governingLaw, jurisdiction.
When setting is_complete to true, your message MUST include: "Your document is ready for downloading."

IMPORTANT: If is_complete is false, you MUST end your message with at least one specific follow-on question about the next most important missing field.

You MUST respond with valid JSON in exactly this structure:
{{
  "message": "Your conversational response to show the user",
  "fields": {{
    "key": "extracted_value"
  }},
  "is_complete": false
}}

Only include in "fields" the keys extracted or inferred in this conversation turn. Use an empty object {{}} if nothing new was extracted.\
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class NdaFieldsExtracted(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[str] = None
    mndaTermYears: Optional[int] = None
    confidentialityTermType: Optional[str] = None
    confidentialityTermYears: Optional[int] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    mndaModifications: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1Company: Optional[str] = None
    party1NoticeAddress: Optional[str] = None
    party1Date: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2Company: Optional[str] = None
    party2NoticeAddress: Optional[str] = None
    party2Date: Optional[str] = None


class NdaChatLLMResponse(BaseModel):
    message: str
    fields: NdaFieldsExtracted
    is_complete: bool


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: dict


class ChatResponse(BaseModel):
    message: str
    fields: dict
    is_complete: bool


@router.post("/nda", response_model=ChatResponse)
def chat_nda(body: ChatRequest) -> ChatResponse:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

    today = date.today().isoformat()
    system_content = SYSTEM_PROMPT.format(today=today)

    # Ensure there is at least one user turn for the LLM
    if not body.messages:
        user_turns = [{"role": "user", "content": "Hello, I need to create a Mutual NDA."}]
    else:
        user_turns = [{"role": m.role, "content": m.content} for m in body.messages]

    llm_messages = [{"role": "system", "content": system_content}] + user_turns

    try:
        response = completion(
            model=MODEL,
            messages=llm_messages,
            response_format=NdaChatLLMResponse,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
            api_key=api_key,
        )
        raw_content = response.choices[0].message.content
        if not raw_content:
            raise HTTPException(status_code=502, detail="AI model returned no content")
        result = NdaChatLLMResponse.model_validate_json(raw_content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI model error: {str(e)}")

    # Merge newly extracted fields into the current document state
    merged = body.current_fields.copy()
    for key, value in result.fields.model_dump().items():
        if value is not None:
            merged[key] = value

    return ChatResponse(
        message=result.message,
        fields=merged,
        is_complete=result.is_complete,
    )
