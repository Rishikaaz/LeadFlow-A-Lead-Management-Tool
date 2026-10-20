from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator

LeadStatus = Literal["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"]
ALLOWED_STATUSES = {"New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"}


class DiscussionBase(BaseModel):
    note: str = Field(..., min_length=1, description="Discussion note content")
    follow_up_at: Optional[datetime] = Field(None, description="Optional follow-up date and time")


class DiscussionCreate(DiscussionBase):
    pass


class DiscussionResponse(DiscussionBase):
    id: int
    lead_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the lead")
    company: Optional[str] = Field(default="", max_length=255, description="Company name")
    phone: Optional[str] = Field(default="", max_length=50, description="Phone number")


class LeadCreate(LeadBase):
    status: Optional[str] = Field(default="New", description="Initial lead status")
    initial_note: Optional[str] = Field(default=None, description="Optional initial discussion note")
    follow_up_at: Optional[datetime] = Field(default=None, description="Optional initial follow-up date")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> str:
        if v is None:
            return "New"
        if v not in ALLOWED_STATUSES:
            raise ValueError(f"Invalid status '{v}'. Allowed statuses: {', '.join(sorted(ALLOWED_STATUSES))}")
        return v


class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = None
    follow_up_at: Optional[datetime] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_STATUSES:
            raise ValueError(f"Invalid status '{v}'. Allowed statuses: {', '.join(sorted(ALLOWED_STATUSES))}")
        return v


class LeadResponse(LeadBase):
    id: int
    status: str
    follow_up_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    last_discussion_note: Optional[str] = None
    last_discussion_at: Optional[datetime] = None
    discussions: List[DiscussionResponse] = []

    class Config:
        from_attributes = True
