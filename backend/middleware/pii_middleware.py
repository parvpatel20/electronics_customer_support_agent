from __future__ import annotations

from langchain.agents.middleware import PIIMiddleware


def build_pii_middlewares() -> list[PIIMiddleware]:
    return [
        PIIMiddleware("email", strategy="redact", apply_to_input=True),
        PIIMiddleware("credit_card", strategy="redact", apply_to_input=True),
        PIIMiddleware("phone", detector=r"(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,6})", strategy="redact"),
        PIIMiddleware("aadhaar", detector=r"\b\d{4}\s?\d{4}\s?\d{4}\b", strategy="redact"),
        PIIMiddleware("bank_account", detector=r"\b\d{9,18}\b", strategy="redact"),
        PIIMiddleware("upi", detector=r"\b[\w.-]+@[\w.-]+\b", strategy="redact"),
    ]

