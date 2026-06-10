from collections.abc import Iterator
from functools import lru_cache

from groq import Groq

from app.config import settings


@lru_cache(maxsize=1)
def _client() -> Groq:
    return Groq(api_key=settings.groq_api_key)


def _require_key() -> None:
    if not settings.groq_api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Copy backend/.env.example to backend/.env "
            "and add your Groq API key, then restart the server."
        )


def complete(system: str, user: str) -> str:
    _require_key()
    response = _client().chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return response.choices[0].message.content or ""


def stream(system: str, messages: list[dict]) -> Iterator[str]:
    _require_key()
    response = _client().chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "system", "content": system}, *messages],
        stream=True,
    )
    for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


def complete_json(system: str, user: str) -> str:
    _require_key()
    response = _client().chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
    )
    return response.choices[0].message.content or "{}"
