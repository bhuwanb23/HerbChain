"""
Hybrid plant-recognition re-ranker.

The mobile client runs a generic plant TFLite model on-device and gets back
some top-N candidates like::

    [
        {"label": "Holy Basil",       "score": 0.71},
        {"label": "Ocimum sanctum",   "score": 0.18},
        {"label": "Sweet Basil",      "score": 0.07},
        ...
    ]

We don't trust those labels directly. Instead, we re-rank them against the
admin-curated HerbCatalogue (common name + scientific name + synonyms),
combining the on-device confidence with how strongly each candidate matches
a known AYUSH species. Output is the top-3 best AYUSH matches.

The function is pure (no I/O beyond the DB query) so it's trivially testable.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

from models.herb_catalogue import HerbCatalogue


@dataclass
class Candidate:
    """One model-emitted candidate (label + score 0..1)."""

    label: str
    score: float


@dataclass
class RankedSpecies:
    species_id: str
    common_name: str
    scientific_name: str
    image_url: str | None
    medicinal_uses: str | None
    confidence: float          # combined 0..1
    matched_via: list[str]     # which labels contributed


_WORD_RE = re.compile(r"[A-Za-z0-9]+")


def _normalize(text: str) -> str:
    if not text:
        return ""
    return " ".join(_WORD_RE.findall(text.lower()))


def _name_tokens(species: HerbCatalogue) -> list[str]:
    pool = [species.common_name or "", species.scientific_name or ""]
    pool.extend(species.synonyms or [])
    return [_normalize(t) for t in pool if t]


def _label_match_strength(label_norm: str, name_norm: str) -> float:
    """
    Cheap fuzzy match: exact-substring beats token-overlap beats nothing.
    Returns a score in [0, 1].
    """
    if not label_norm or not name_norm:
        return 0.0
    if label_norm == name_norm:
        return 1.0
    if label_norm in name_norm or name_norm in label_norm:
        return 0.85
    label_tokens = set(label_norm.split())
    name_tokens = set(name_norm.split())
    if not label_tokens or not name_tokens:
        return 0.0
    inter = label_tokens & name_tokens
    union = label_tokens | name_tokens
    return 0.6 * (len(inter) / len(union))


def rerank(
    candidates: Iterable[Candidate | dict],
    top_k: int = 3,
) -> list[RankedSpecies]:
    """
    Given on-device candidates, return the top-K matching AYUSH species.

    The combination formula is::

        confidence = on_device_score * 0.4 + name_match_strength * 0.6

    so a poor on-device score can still win if the label is unambiguously an
    AYUSH herb, and a confident on-device label that doesn't match anything
    in our catalogue is dropped.
    """
    norm_candidates: list[Candidate] = []
    for c in candidates:
        if isinstance(c, dict):
            norm_candidates.append(
                Candidate(label=str(c.get("label", "")), score=float(c.get("score", 0.0)))
            )
        else:
            norm_candidates.append(c)

    species_rows = HerbCatalogue.query.filter_by(is_active=True).all()
    if not species_rows:
        return []

    scored: dict[str, RankedSpecies] = {}
    for cand in norm_candidates:
        label_norm = _normalize(cand.label)
        if not label_norm:
            continue
        for sp in species_rows:
            best_match = 0.0
            for name in _name_tokens(sp):
                match = _label_match_strength(label_norm, name)
                if match > best_match:
                    best_match = match
            if best_match <= 0:
                continue
            combined = max(0.0, min(1.0, cand.score * 0.4 + best_match * 0.6))
            existing = scored.get(sp.species_id)
            if existing is None or combined > existing.confidence:
                scored[sp.species_id] = RankedSpecies(
                    species_id=sp.species_id,
                    common_name=sp.common_name,
                    scientific_name=sp.scientific_name,
                    image_url=sp.image_url,
                    medicinal_uses=sp.medicinal_uses,
                    confidence=round(combined, 3),
                    matched_via=[cand.label],
                )
            else:
                if cand.label not in existing.matched_via:
                    existing.matched_via.append(cand.label)

    ranked = sorted(scored.values(), key=lambda r: r.confidence, reverse=True)
    return ranked[: max(1, top_k)]
