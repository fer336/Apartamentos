import hashlib
import hmac
import secrets

# Shared by app/routers/auth.py and the Alembic migration that seeds the
# demo account, so the hash format must stay stable across both.

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), 100_000)
    return f"{salt}${digest.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split('$', 1)
    except ValueError:
        return False
    expected = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt_hex), 100_000)
    return hmac.compare_digest(expected.hex(), digest_hex)
