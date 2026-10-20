from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import Lead, Discussion


def get_current_utc():
    return datetime.now(timezone.utc)


def seed_database(db: Session):
    """Seed the database with rich, realistic sample leads and discussions."""
    # Create tables if not exist
    Base.metadata.create_all(bind=engine)

    # Clear existing data for fresh seed
    db.query(Discussion).delete()
    db.query(Lead).delete()
    db.commit()

    now = get_current_utc()

    # 1. Sarah Connor (Acme Corp) - Proposal Sent, follow-up scheduled for TODAY at 2:00 PM local
    # Set follow up for today at 14:00 (2:00 PM)
    today_2pm = now.replace(hour=14, minute=0, second=0, microsecond=0)
    # If 14:00 has already passed today, set it to now + 2 hours so it's guaranteed to be today
    if today_2pm < now:
        today_2pm = now + timedelta(hours=2)

    lead1 = Lead(
        name="Sarah Connor",
        company="Acme Corp",
        phone="555-0199",
        status="Proposal Sent",
        follow_up_at=today_2pm,
        created_at=now - timedelta(days=6),
        updated_at=now - timedelta(days=2)
    )
    db.add(lead1)
    db.flush()

    d1_1 = Discussion(
        lead_id=lead1.id,
        note="Lead created via web form.",
        created_at=now - timedelta(days=6)
    )
    d1_2 = Discussion(
        lead_id=lead1.id,
        note="Initial discovery call. They need a CRM for 50 reps. Pain points include dropping leads and no follow-up tracking.",
        created_at=now - timedelta(days=5)
    )
    d1_3 = Discussion(
        lead_id=lead1.id,
        note="Sent pricing tier PDF. Said she would review with her boss.",
        follow_up_at=today_2pm,
        created_at=now - timedelta(days=2)
    )
    db.add_all([d1_1, d1_2, d1_3])

    # 2. Hank Scorpio (Globex) - New, 2 hours ago
    lead2 = Lead(
        name="Hank Scorpio",
        company="Globex",
        phone="555-0842",
        status="New",
        follow_up_at=None,
        created_at=now - timedelta(hours=2),
        updated_at=now - timedelta(hours=2)
    )
    db.add(lead2)
    db.flush()

    d2_1 = Discussion(
        lead_id=lead2.id,
        note="Inbound lead from website contact form. Inquired about financial planning automation.",
        created_at=now - timedelta(hours=2)
    )
    db.add(d2_1)

    # 3. Bill Lumbergh (Initech) - Contacted, 1 week ago
    lead3 = Lead(
        name="Bill Lumbergh",
        company="Initech",
        phone="555-0371",
        status="Contacted",
        follow_up_at=now + timedelta(days=3),
        created_at=now - timedelta(days=8),
        updated_at=now - timedelta(days=7)
    )
    db.add(lead3)
    db.flush()

    d3_1 = Discussion(
        lead_id=lead3.id,
        note="Lead imported from LinkedIn campaign.",
        created_at=now - timedelta(days=8)
    )
    d3_2 = Discussion(
        lead_id=lead3.id,
        note="Left a voicemail with his assistant. Follow up on wealth management integrations.",
        follow_up_at=now + timedelta(days=3),
        created_at=now - timedelta(days=7)
    )
    db.add_all([d3_1, d3_2])

    # 4. Bruce Wayne (Wayne Ent) - Won, 3 weeks ago
    lead4 = Lead(
        name="Bruce Wayne",
        company="Wayne Ent",
        phone="555-0999",
        status="Won",
        follow_up_at=None,
        created_at=now - timedelta(days=25),
        updated_at=now - timedelta(days=21)
    )
    db.add(lead4)
    db.flush()

    d4_1 = Discussion(
        lead_id=lead4.id,
        note="Enterprise demonstration of portfolio advisory suite.",
        created_at=now - timedelta(days=24)
    )
    d4_2 = Discussion(
        lead_id=lead4.id,
        note="Contract signed! Sending welcome package and scheduling onboarding session.",
        created_at=now - timedelta(days=21)
    )
    db.add_all([d4_1, d4_2])

    # 5. Tony Stark (Stark Industries) - Qualified, OVERDUE follow-up (yesterday)
    yesterday_3pm = now - timedelta(days=1, hours=3)
    lead5 = Lead(
        name="Tony Stark",
        company="Stark Industries",
        phone="555-3000",
        status="Qualified",
        follow_up_at=yesterday_3pm,
        created_at=now - timedelta(days=4),
        updated_at=now - timedelta(days=1)
    )
    db.add(lead5)
    db.flush()

    d5_1 = Discussion(
        lead_id=lead5.id,
        note="Met at FinTech Summit. Interested in scaling multi-advisor portfolio insights.",
        created_at=now - timedelta(days=4)
    )
    d5_2 = Discussion(
        lead_id=lead5.id,
        note="Shared security architecture whitepaper. Awaiting feedback from engineering leads.",
        follow_up_at=yesterday_3pm,
        created_at=now - timedelta(days=1)
    )
    db.add_all([d5_1, d5_2])

    # 6. Miles Morales (Brooklyn Visions) - Lost, 2 weeks ago
    lead6 = Lead(
        name="Miles Morales",
        company="Brooklyn Visions",
        phone="555-0456",
        status="Lost",
        follow_up_at=None,
        created_at=now - timedelta(days=20),
        updated_at=now - timedelta(days=14)
    )
    db.add(lead6)
    db.flush()

    d6_1 = Discussion(
        lead_id=lead6.id,
        note="Decided to postpone software evaluation until next fiscal year due to internal restructuring.",
        created_at=now - timedelta(days=14)
    )
    db.add(d6_1)

    db.commit()
    print("Seed data successfully inserted: 6 leads with discussions!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
