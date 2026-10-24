from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import SessionLocal
from app.db.models import RuleReference, KnowledgeDocument


def search_rules(query: str, db: Optional[Session] = None) -> List[Dict[str, Any]]:
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        q_clean = query.strip().lower()
        if not q_clean:
            rules = db.query(RuleReference).all()
        else:
            search_pattern = f"%{q_clean}%"
            rules = db.query(RuleReference).filter(
                or_(
                    RuleReference.title_en.ilike(search_pattern),
                    RuleReference.title_ar.ilike(search_pattern),
                    RuleReference.summary_en.ilike(search_pattern),
                    RuleReference.summary_ar.ilike(search_pattern),
                    RuleReference.full_text_en.ilike(search_pattern),
                    RuleReference.relevance_keywords.ilike(search_pattern),
                    RuleReference.law_number.ilike(search_pattern)
                )
            ).all()

        results = []
        for r in rules:
            # Calculate simple relevance score
            score = 1.0
            if q_clean in r.title_en.lower():
                score += 2.0
            if r.relevance_keywords and q_clean in r.relevance_keywords.lower():
                score += 1.5

            results.append({
                "id": r.id,
                "law_number": r.law_number,
                "section": r.section,
                "title_en": r.title_en,
                "title_ar": r.title_ar,
                "summary_en": r.summary_en,
                "summary_ar": r.summary_ar,
                "full_text_en": r.full_text_en,
                "full_text_ar": r.full_text_ar,
                "official_source_url": r.official_source_url,
                "edition": r.edition,
                "relevance_score": round(score, 2)
            })

        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results
    finally:
        if close_db:
            db.close()


def get_rule_by_id(rule_id: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        r = db.query(RuleReference).filter_by(id=rule_id).first()
        if not r:
            return None
        return {
            "id": r.id,
            "law_number": r.law_number,
            "section": r.section,
            "title_en": r.title_en,
            "title_ar": r.title_ar,
            "summary_en": r.summary_en,
            "summary_ar": r.summary_ar,
            "full_text_en": r.full_text_en,
            "full_text_ar": r.full_text_ar,
            "official_source_url": r.official_source_url,
            "edition": r.edition
        }
    finally:
        if close_db:
            db.close()


def get_knowledge_documents(db: Optional[Session] = None) -> List[Dict[str, Any]]:
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        docs = db.query(KnowledgeDocument).all()
        return [
            {
                "id": d.id,
                "document_type": d.document_type,
                "title": d.title,
                "title_ar": d.title_ar,
                "edition": d.edition,
                "source_url": d.source_url,
                "section": d.section,
                "content_en": d.content_en,
                "content_ar": d.content_ar,
                "indexed_at": d.indexed_at.isoformat() if d.indexed_at else None
            }
            for d in docs
        ]
    finally:
        if close_db:
            db.close()
