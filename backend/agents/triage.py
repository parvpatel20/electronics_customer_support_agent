from __future__ import annotations

import re
from typing import Literal

from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from backend.models import get_fast_model


class TriageResult(BaseModel):
    route: Literal["billing", "technical", "returns", "supervisor"] = Field(description="Best route for the customer issue.")
    customer_id: str | None = None
    product_sku: str | None = None
    urgency: Literal["low", "medium", "high"] = "medium"
    confidence: float = Field(default=0.0, ge=0, le=1)
    summary: str
    detected_intents: list[str] = Field(default_factory=list)
    needs_clarification: bool = False
    escalation_reason: str | None = None


TRIAGE_SYSTEM_PROMPT = """You are TechCart's production triage classifier. Classify the customer's latest support turn, using the conversation context only to resolve pronouns, product references, order references, and follow-up intent.

Return exactly one route:
- billing: invoices, receipts, charges, double charges, payment failures, GST/tax invoice, disputes, refund eligibility, refund execution, payment method questions.
- technical: setup, troubleshooting, errors, product behaviour, firmware, connectivity, compatibility, product specs, manuals, warranty status, how-to guidance.
- returns: order tracking, shipment status, delivery ETA, courier/carrier issues, RMA/return status, return initiation, wrong item, damaged delivery, missing package.
- supervisor: unclear intent, equally strong multi-domain intent, policy conflict, legal threat, safety/privacy request, repeated dissatisfaction, or when the next best action requires a human decision.

Hard routing rules:
- RMA identifiers route to returns unless the customer is asking about a payment/refund for that RMA.
- Invoice identifiers route to billing unless the invoice is only incidental to a product troubleshooting request.
- An order id (ORD-...) alone never means returns. Use the customer's verb and surrounding words.
- Product failures, setup, compatibility, warranty, specs, and "how do I..." route technical even when an order id is present.
- Refund, charge, dispute, invoice, payment, debit, UPI, GST route billing even when an order id is present.
- Tracking, shipping, delivery, courier, package, "where is my order", missing delivery route returns.
- If the latest message clearly asks two domains at once, choose supervisor unless one request is explicitly primary or urgent.
- Do not infer customer_id or product_sku unless explicitly present in the latest message or unambiguously supplied in context.

Confidence:
- 0.90-1.00: explicit id or clear single-domain intent.
- 0.70-0.89: likely single-domain intent with minor ambiguity.
- 0.40-0.69: ambiguous, mixed, or missing key context; route supervisor.
- below 0.40: cannot classify; route supervisor and needs_clarification=true.

Urgency:
- high for legal threats, chargeback threats, angry escalation, broken critical use, safety issue, privacy/PII request, or repeated failed attempts.
- medium for normal support requests.
- low for informational, specs, compatibility, or general how-to requests.

Output a concise summary with the evidence you used. Fill detected_intents with one or more of billing, technical, returns, privacy, escalation, unclear."""

# Strong billing wording (checked before technical/returns heuristics).
_BILLING_CUES = re.compile(
    r"\b(refund|refunded|disput\w*|invoice|invoiced|charged|charge\s+twice|double\s+charg|"
    r"duplicate\s+(?:charg|debit|payment)|payment\s+failed|payment\s+declined|unpaid|"
    r"billing|subscription|gst\s+invoice|tax\s+receipt|upi|razorpay|bank\s+statement)\b",
    re.I,
)

# Product / support behaviour — if this matches, do not force the returns agent based on ORD- or vague "where" phrases.
_TECHNICAL_CUES = re.compile(
    r"\b(wifi|wi-?fi|firmware|router|modem|bluetooth|pairing|setup|troubleshoot|"
    r"not\s+working|won'?t\s+(?:work|turn|connect|charge)|doesn'?t\s+work|"
    r"error\s*(?:code)?|compatible|compatibility|specs?|warranty\s+(?:check|status|claim)|"
    r"how\s+do\s+i|how\s+to|reset|password|pin|dhcp|ipv6|dns|hdmi|display|driver|"
    r"overheat|overheating|charge|charging|battery|sync|app\s+crash|update\s+failed|"
    r"anc|noise\s+cancel|codec|lag|latency|mic|audio\s+cut|disconnect|drops?|slow\s+speed|"
    r"internet|offline|connection|connect|signal|spO2|heart\s+rate|earbud|smartwatch)\b",
    re.I,
)

# Initiating or discussing a return (not "refund" alone — billing handles refund policy execution).
_RETURN_CUES = re.compile(
    r"\b(return|returning|send\s+(?:it\s+)?back|wrong\s+item|not\s+what\s+i\s+ordered|"
    r"damaged\s+(?:in\s+)?(?:shipping|transit|delivery)|replacement\s+for)\b",
    re.I,
)

# ORD-... + clear logistics / delivery question (not bare mention of an order id).
_ORDER_LOGISTICS_CUES = re.compile(
    r"\b(track|tracking|shipped?|ship\w*|deliver\w*|package|parcel|courier|carrier|"
    r"not\s+received|haven'?t\s+received|still\s+waiting|out\s+for\s+delivery|in\s+transit|"
    r"where\s+is\s+(?:my|the)\s+order|where's\s+(?:my|the)\s+order|where\s+is\s+my\s+package|"
    r"where's\s+my\s+package|order\s+status|status\s+of\s+(?:my|the|this)\s+order|"
    r"when\s+will\s+(?:it|my|the)\s+(?:order|package|item|purchase)\s+arrive|"
    r"when\s+does\s+my\s+(?:order|package))\b",
    re.I,
)

_TECH_PROBLEM_CUES = re.compile(
    r"\b(drop(?:s|ping)?|cut(?:s|ting)?\s*out|dies?|not\s+working|won'?t\s+(?:work|turn|connect|charge)|"
    r"doesn'?t\s+work|error|black\s+screen|quiet|low\s+volume|buffer(?:s|ing)?|disconnect(?:s|ing)?|"
    r"slow|lag|latency|crash|failed|stuck|overheat|broken|blank|gaps?|reset|setup|pair(?:ing)?|"
    r"compatible|compatibility|specs?|warranty|firmware|how\s+(?:do\s+i|to))\b",
    re.I,
)

_ESCALATION_CUES = re.compile(
    r"\b(legal|lawyer|consumer\s+court|chargeback|fraud|scam|furious|angry|complaint|"
    r"manager|supervisor|human|agent|not\s+helping|third\s+time|again\s+and\s+again|"
    r"privacy|personal\s+data|email\s+address|phone\s+number|address\s+of)\b",
    re.I,
)

_NON_SUPPORT_CUES = re.compile(
    r"\b(write\s+(?:a\s+)?poem|tell\s+(?:me\s+)?a\s+joke|homework|recipe|weather|stock\s+price|"
    r"movie|dating|politics|news|sports|translate|summari[sz]e\s+this\s+article|code\s+for|"
    r"make\s+me\s+a\s+website|ignore\s+(?:all\s+)?(?:previous\s+)?instructions|system\s+prompt)\b",
    re.I,
)

_PRODUCT_SKU_RE = re.compile(r"\b[A-Z0-9]+(?:-[A-Z0-9]+){1,}\b")
_CUSTOMER_ID_RE = re.compile(r"\bCUST-[A-Z0-9-]+\b", re.I)


def _ord_with_status_or_tracking(text: str, low: str) -> bool:
    """ORD id plus status/tracking/carrier wording (any order in the sentence)."""
    if not _ord_id_present(text):
        return False
    if not re.search(r"\b(status|tracking|carrier)\b", low):
        return False
    return True

# Shipment questions that do not require an order id in the text.
_SHIPMENT_PHRASES = (
    "where is my order",
    "where's my order",
    "where is my package",
    "where's my package",
    "track my order",
    "track my package",
    "tracking number",
    "delivery status",
    "has my order shipped",
    "when will my order",
    "when does my order",
    "when will my package",
    "not received my order",
    "still waiting for my order",
    "shipment status",
)


def _ord_id_present(text: str) -> bool:
    return bool(re.search(r"\bORD-[A-Z0-9-]+\b", text, re.I))


def _where_is_purchase_question(low: str) -> bool:
    """'Where is my soundbar?' style — usually shipping when paired with ORD- in the same message."""
    return bool(re.search(r"\bwhere\s+is\s+my\s+\w+", low)) or bool(re.search(r"\bwhere's\s+my\s+\w+", low))


def _urgency(message: str) -> Literal["low", "medium", "high"]:
    low = message.lower()
    if _ESCALATION_CUES.search(message) or any(
        phrase in low
        for phrase in (
            "cannot work",
            "can't work",
            "completely broken",
            "urgent",
            "asap",
            "immediately",
            "danger",
            "burning smell",
            "overheating",
        )
    ):
        return "high"
    if re.search(r"\b(specs?|compatible|compatibility|how\s+to|manual)\b", message, re.I):
        return "low"
    return "medium"


def _extract_product_sku(message: str) -> str | None:
    for match in _PRODUCT_SKU_RE.findall(message):
        upper = match.upper()
        if upper.startswith(("ORD-", "INV-", "RMA-", "CUST-")):
            continue
        # Avoid treating short carrier/order-like fragments as SKUs.
        if len(upper) >= 6:
            return upper
    return None


def _extract_customer_id(message: str) -> str | None:
    match = _CUSTOMER_ID_RE.search(message)
    return match.group(0).upper() if match else None


def _score_intents(message: str) -> dict[str, float]:
    text = message.strip()
    low = text.lower()
    scores = {"billing": 0.0, "technical": 0.0, "returns": 0.0}

    if re.search(r"\bINV-[A-Z0-9-]+\b", text, re.I):
        scores["billing"] += 0.55
    if re.search(r"\bRMA-[A-Z0-9-]+\b", text, re.I):
        scores["returns"] += 0.55
    if _BILLING_CUES.search(text):
        scores["billing"] += 0.45
    if _TECHNICAL_CUES.search(text):
        scores["technical"] += 0.45
    if _RETURN_CUES.search(text):
        scores["returns"] += 0.35
    if _ORDER_LOGISTICS_CUES.search(text) or any(p in low for p in _SHIPMENT_PHRASES):
        scores["returns"] += 0.45
    if _ord_id_present(text) and _where_is_purchase_question(low):
        scores["returns"] += 0.35
    if re.search(r"\b(warranty|guarantee)\b", text, re.I):
        scores["technical"] += 0.35
    return {key: min(value, 1.0) for key, value in scores.items()}


def heuristic_triage(message: str) -> TriageResult | None:
    """Deterministic first pass for explicit ids, clear intents, and mixed-domain escalation."""
    text = message.strip()
    low = text.lower()
    urgency = _urgency(text)
    product_sku = _extract_product_sku(text)
    customer_id = _extract_customer_id(text)

    if not text:
        return TriageResult(
            route="supervisor",
            urgency="low",
            confidence=0.1,
            summary="Empty message cannot be classified.",
            detected_intents=["unclear"],
            needs_clarification=True,
        )

    if re.fullmatch(r"\s*ORD-[A-Z0-9-]+\s*[?.!]?\s*", text, re.I):
        return TriageResult(
            route="supervisor",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency="low",
            confidence=0.35,
            summary="Bare order id without a support intent.",
            detected_intents=["unclear"],
            needs_clarification=True,
        )

    if _ESCALATION_CUES.search(text):
        return TriageResult(
            route="supervisor",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency=urgency,
            confidence=0.88,
            summary="Message contains escalation, legal, privacy, or human-agent wording.",
            detected_intents=["escalation"],
            escalation_reason="Customer language requires supervisor review.",
        )

    if _NON_SUPPORT_CUES.search(text):
        return TriageResult(
            route="supervisor",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency="low",
            confidence=0.92,
            summary="Message appears outside TechCart customer-support scope.",
            detected_intents=["out_of_scope"],
            needs_clarification=False,
            escalation_reason="Out-of-scope request should receive a support-scope redirect.",
        )

    scores = _score_intents(text)
    if _BILLING_CUES.search(text) and not _TECH_PROBLEM_CUES.search(text):
        return TriageResult(
            route="billing",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency=urgency,
            confidence=0.94,
            summary="Clear billing, refund, invoice, payment, or dispute wording detected.",
            detected_intents=["billing"],
        )
    active = [intent for intent, score in scores.items() if score >= 0.35]
    if len(active) >= 2:
        top_scores = sorted(scores.values(), reverse=True)
        if top_scores[0] - top_scores[1] < 0.3:
            return TriageResult(
                route="supervisor",
                customer_id=customer_id,
                product_sku=product_sku,
                urgency=urgency,
                confidence=0.58,
                summary=f"Mixed support intent detected: {', '.join(active)}.",
                detected_intents=active,
                needs_clarification=True,
            )

    if re.search(r"\bRMA-[A-Z0-9-]+\b", text, re.I):
        return TriageResult(
            route="returns",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency="medium",
            confidence=0.99,
            summary="Message references a return authorization (RMA) id.",
            detected_intents=["returns"],
        )

    if re.search(r"\bINV-[A-Z0-9-]+\b", text, re.I):
        return TriageResult(
            route="billing",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency="medium",
            confidence=0.99,
            summary="Message references an invoice id.",
            detected_intents=["billing"],
        )

    if _BILLING_CUES.search(message):
        return TriageResult(
            route="billing",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency=urgency,
            confidence=0.94,
            summary="Billing or payment-related wording detected.",
            detected_intents=["billing"],
        )

    if scores["technical"] > 0 and scores["billing"] == 0 and scores["returns"] == 0:
        return TriageResult(
            route="technical",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency=urgency,
            confidence=0.9,
            summary="Product troubleshooting, setup, compatibility, warranty, or how-to wording detected.",
            detected_intents=["technical"],
        )

    if _ord_id_present(text) and _RETURN_CUES.search(message):
        return TriageResult(
            route="returns",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency=urgency,
            confidence=0.96,
            summary="Return intent with an order reference.",
            detected_intents=["returns"],
        )

    if _ord_with_status_or_tracking(text, low):
        return TriageResult(
            route="returns",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency=urgency,
            confidence=0.96,
            summary="Order id with status or tracking wording.",
            detected_intents=["returns"],
        )

    if _ord_id_present(text) and (_ORDER_LOGISTICS_CUES.search(message) or _where_is_purchase_question(low)):
        return TriageResult(
            route="returns",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency=urgency,
            confidence=0.97,
            summary="Order id with shipment, tracking, or where-is-my-item intent.",
            detected_intents=["returns"],
        )

    if any(p in low for p in _SHIPMENT_PHRASES):
        return TriageResult(
            route="returns",
            customer_id=customer_id,
            product_sku=product_sku,
            urgency=urgency,
            confidence=0.92,
            summary="Shipment or tracking inquiry.",
            detected_intents=["returns"],
        )

    return None


async def run_triage(message: str, customer_id: str | None = None, conversation_context: str | None = None) -> TriageResult:
    sys = TRIAGE_SYSTEM_PROMPT
    if customer_id:
        sys += f"\n\nAuthenticated customer_id for this session: {customer_id}"
    if conversation_context:
        sys += f"\n\nConversation context for disambiguation only:\n{conversation_context}"
    model = get_fast_model().with_structured_output(TriageResult)
    result = await model.ainvoke([("system", sys), HumanMessage(content=message)])
    return result if isinstance(result, TriageResult) else TriageResult.model_validate(result)
