import os
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db, SessionLocal
from .models import Lead
from .schemas import LeadCreate, LeadUpdate, LeadResponse, DiscussionCreate
from .crud import get_leads, get_lead, create_lead, update_lead, add_discussion, delete_lead
from .seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Auto-seed if database is empty
    db = SessionLocal()
    try:
        if db.query(Lead).count() == 0:
            print("Empty database detected. Running initial seed...")
            seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="LeadFlow API",
    description="High-performance backend for LeadFlow CRM by Pravar AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,*")
origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "LeadFlow API",
        "framework": "FastAPI",
        "version": "1.0.0"
    }


@app.get("/api/leads", response_model=List[LeadResponse], tags=["Leads"])
def list_leads(
    status: Optional[str] = Query(None, description="Filter leads by status (e.g. New, Contacted, Qualified, Proposal Sent, Won, Lost)"),
    search: Optional[str] = Query(None, description="Search leads by name or company"),
    db: Session = Depends(get_db)
):
    """Retrieve all leads with optional filtering by status and search keyword."""
    return get_leads(db=db, status=status, search=search)


@app.get("/api/leads/{lead_id}", response_model=LeadResponse, tags=["Leads"])
def retrieve_lead(lead_id: int, db: Session = Depends(get_db)):
    """Retrieve a single lead with full reverse-chronological discussion history."""
    lead = get_lead(db=db, lead_id=lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found."
        )
    return lead


@app.post("/api/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED, tags=["Leads"])
def add_new_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    """Create a new lead with required name and optional company, phone, and initial note."""
    return create_lead(db=db, lead_in=lead_in)


@app.patch("/api/leads/{lead_id}", response_model=LeadResponse, tags=["Leads"])
def modify_lead(lead_id: int, lead_in: LeadUpdate, db: Session = Depends(get_db)):
    """Update lead status or contact details. Reflects immediately."""
    updated = update_lead(db=db, lead_id=lead_id, lead_in=lead_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found."
        )
    return updated


@app.post("/api/leads/{lead_id}/discussions", response_model=LeadResponse, status_code=status.HTTP_201_CREATED, tags=["Discussions"])
def add_lead_discussion(lead_id: int, disc_in: DiscussionCreate, db: Session = Depends(get_db)):
    """Add a new discussion note to a lead, optionally scheduling a follow-up. Returns updated lead."""
    disc = add_discussion(db=db, lead_id=lead_id, disc_in=disc_in)
    if not disc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found."
        )
    # Return enriched updated lead so frontend gets complete refreshed state in 1 call
    refreshed_lead = get_lead(db=db, lead_id=lead_id)
    return refreshed_lead


@app.delete("/api/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Leads"])
def remove_lead(lead_id: int, db: Session = Depends(get_db)):
    """Delete a lead and its discussion timeline."""
    success = delete_lead(db=db, lead_id=lead_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found."
        )
    return None


@app.post("/api/seed", response_model=List[LeadResponse], tags=["System"])
def reset_seed(db: Session = Depends(get_db)):
    """Reset database with default seed data."""
    seed_database(db)
    return get_leads(db=db)
