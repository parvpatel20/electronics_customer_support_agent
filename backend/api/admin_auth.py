from __future__ import annotations

import hashlib
import hmac
import time

from fastapi import HTTPException

from backend.config import settings

ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60
LOGIN_MAX_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 15 * 60

_login_failures: dict[str, list[float]] = {}


def _sign(expires_at: int) -> str:
    return hmac.new(settings.ADMIN_PASSWORD.encode(), str(expires_at).encode(), hashlib.sha256).hexdigest()


def issue_admin_token() -> tuple[str, int]:
    expires_at = int(time.time()) + ADMIN_SESSION_TTL_SECONDS
    return f"{expires_at}.{_sign(expires_at)}", expires_at


def verify_admin_token(token: str | None) -> bool:
    if not token or "." not in token:
        return False
    expires_at_str, signature = token.split(".", 1)
    if not expires_at_str.isdigit():
        return False
    expires_at = int(expires_at_str)
    if time.time() > expires_at:
        return False
    return hmac.compare_digest(signature, _sign(expires_at))


def verify_admin_password(password: str) -> bool:
    return hmac.compare_digest(password, settings.ADMIN_PASSWORD)


def check_login_rate_limit(client_key: str) -> None:
    now = time.time()
    attempts = [t for t in _login_failures.get(client_key, []) if now - t < LOGIN_WINDOW_SECONDS]
    _login_failures[client_key] = attempts
    if len(attempts) >= LOGIN_MAX_ATTEMPTS:
        retry_after = int(LOGIN_WINDOW_SECONDS - (now - attempts[0]))
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Try again later.",
            headers={"Retry-After": str(max(retry_after, 1))},
        )


def record_login_failure(client_key: str) -> None:
    _login_failures.setdefault(client_key, []).append(time.time())


def clear_login_failures(client_key: str) -> None:
    _login_failures.pop(client_key, None)
