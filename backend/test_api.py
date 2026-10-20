import os
import sys
from fastapi.testclient import TestClient

# Ensure backend package is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app
from backend.app.database import Base, engine, SessionLocal
from backend.app.seed import seed_database

client = TestClient(app)


def test_full_leadflow_workflow():
    print("Testing 1: Database Seed and Health Check...")
    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # Seed fresh data
    db = SessionLocal()
    seed_database(db)
    db.close()

    # 2. List leads
    print("Testing 2: List leads...")
    res = client.get("/api/leads")
    assert res.status_code == 200
    leads = res.json()
    assert len(leads) >= 5
    first_lead = next(l for l in leads if l["name"] == "Sarah Connor")
    assert first_lead["company"] == "Acme Corp"
    assert first_lead["status"] == "Proposal Sent"
    assert first_lead["last_discussion_note"] is not None
    assert "pricing" in first_lead["last_discussion_note"].lower()

    # 3. Status filter
    print("Testing 3: Filter by status...")
    res = client.get("/api/leads?status=Proposal+Sent")
    assert res.status_code == 200
    filtered = res.json()
    assert all(l["status"] == "Proposal Sent" for l in filtered)
    assert any(l["name"] == "Sarah Connor" for l in filtered)

    # 4. Search by name
    print("Testing 4: Search leads...")
    res = client.get("/api/leads?search=Wayne")
    assert res.status_code == 200
    searched = res.json()
    assert len(searched) == 1
    assert searched[0]["name"] == "Bruce Wayne"

    # 5. Retrieve lead with discussions
    print("Testing 5: Retrieve single lead with reverse chronological timeline...")
    sarah_id = first_lead["id"]
    res = client.get(f"/api/leads/{sarah_id}")
    assert res.status_code == 200
    lead_detail = res.json()
    assert len(lead_detail["discussions"]) == 3
    # Check reverse chronological order: latest discussion first
    d_dates = [d["created_at"] for d in lead_detail["discussions"]]
    assert d_dates == sorted(d_dates, reverse=True)

    # 6. Add new lead
    print("Testing 6: Create new lead...")
    new_lead_payload = {
        "name": "Diana Prince",
        "company": "Themyscira Global",
        "phone": "555-7777",
        "initial_note": "Inquired about institutional wealth management."
    }
    res = client.post("/api/leads", json=new_lead_payload)
    assert res.status_code == 201
    created = res.json()
    assert created["name"] == "Diana Prince"
    assert created["status"] == "New"
    diana_id = created["id"]

    # 7. Update status from dialog
    print("Testing 7: Update lead status...")
    res = client.patch(f"/api/leads/{diana_id}", json={"status": "Contacted"})
    assert res.status_code == 200
    updated = res.json()
    assert updated["status"] == "Contacted"

    # 8. Add discussion note with follow-up
    print("Testing 8: Add discussion note with follow-up date...")
    follow_up_iso = "2026-10-25T14:30:00Z"
    disc_payload = {
        "note": "Had a great demo call. Follow-up scheduled for next week.",
        "follow_up_at": follow_up_iso
    }
    res = client.post(f"/api/leads/{diana_id}/discussions", json=disc_payload)
    assert res.status_code == 201
    updated_lead = res.json()
    assert updated_lead["follow_up_at"] is not None
    assert updated_lead["last_discussion_note"] == disc_payload["note"]
    assert len(updated_lead["discussions"]) == 2

    # 9. Verify invalid status throws 422
    print("Testing 9: Validation error on invalid status...")
    res = client.patch(f"/api/leads/{diana_id}", json={"status": "InvalidStatus"})
    assert res.status_code == 422

    # 10. Verify 404 for non-existent lead
    print("Testing 10: 404 error handling...")
    res = client.get("/api/leads/999999")
    assert res.status_code == 404

    print("ALL 10 TESTS PASSED SUCCESSFULLY! Clean status codes and error handling verified.")


if __name__ == "__main__":
    test_full_leadflow_workflow()
