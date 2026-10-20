from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from .models import Lead, Discussion, utcnow
from .schemas import LeadCreate, LeadUpdate, DiscussionCreate, LeadResponse, DiscussionResponse


def enrich_lead(lead: Lead) -> LeadResponse:
    """Helper to convert Lead model to LeadResponse with latest discussion note and timestamp."""
    # discussions are ordered desc by created_at in model relationship
    last_note = None
    last_at = None
    if lead.discussions:
        last_disc = lead.discussions[0]
        last_note = last_disc.note
        last_at = last_disc.created_at

    return LeadResponse(
        id=lead.id,
        name=lead.name,
        company=lead.company or "",
        phone=lead.phone or "",
        status=lead.status,
        follow_up_at=lead.follow_up_at,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
        last_discussion_note=last_note,
        last_discussion_at=last_at,
        discussions=[DiscussionResponse.model_validate(d) for d in lead.discussions]
    )


def get_leads(
    db: Session,
    status: Optional[str] = None,
    search: Optional[str] = None
) -> List[LeadResponse]:
    query = db.query(Lead)

    if status and status.lower() != "all":
        query = query.filter(Lead.status == status)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Lead.name.ilike(search_term),
                Lead.company.ilike(search_term)
            )
        )

    # Order by updated_at descending
    leads = query.order_by(Lead.updated_at.desc()).all()
    return [enrich_lead(lead) for lead in leads]


def get_lead(db: Session, lead_id: int) -> Optional[LeadResponse]:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return None
    return enrich_lead(lead)


def create_lead(db: Session, lead_in: LeadCreate) -> LeadResponse:
    new_lead = Lead(
        name=lead_in.name.strip(),
        company=lead_in.company.strip() if lead_in.company else "",
        phone=lead_in.phone.strip() if lead_in.phone else "",
        status=lead_in.status or "New",
        follow_up_at=lead_in.follow_up_at
    )
    db.add(new_lead)
    db.flush()  # assign new_lead.id

    # Create initial discussion entry
    initial_text = lead_in.initial_note.strip() if lead_in.initial_note else "Lead created via web form."
    initial_disc = Discussion(
        lead_id=new_lead.id,
        note=initial_text,
        follow_up_at=lead_in.follow_up_at
    )
    db.add(initial_disc)
    db.commit()
    db.refresh(new_lead)

    return enrich_lead(new_lead)


def update_lead(db: Session, lead_id: int, lead_in: LeadUpdate) -> Optional[LeadResponse]:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return None

    update_data = lead_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "name" and value is not None:
            lead.name = value.strip()
        elif field == "company" and value is not None:
            lead.company = value.strip()
        elif field == "phone" and value is not None:
            lead.phone = value.strip()
        elif field == "status" and value is not None:
            lead.status = value
        elif field == "follow_up_at":
            lead.follow_up_at = value

    lead.updated_at = utcnow()
    db.commit()
    db.refresh(lead)

    return enrich_lead(lead)


def add_discussion(db: Session, lead_id: int, disc_in: DiscussionCreate) -> Optional[DiscussionResponse]:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return None

    discussion = Discussion(
        lead_id=lead_id,
        note=disc_in.note.strip(),
        follow_up_at=disc_in.follow_up_at
    )
    db.add(discussion)

    # If follow_up_at was provided in discussion, update the lead's follow_up_at
    if disc_in.follow_up_at is not None:
        lead.follow_up_at = disc_in.follow_up_at

    lead.updated_at = utcnow()
    db.commit()
    db.refresh(discussion)

    return DiscussionResponse.model_validate(discussion)


def delete_lead(db: Session, lead_id: int) -> bool:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return False
    db.delete(lead)
    db.commit()
    return True
