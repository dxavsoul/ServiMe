import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def conversation_data():
    return {
        "customer_id": 1,
        "company_id": 1,
        "appointment_id": 1
    }

@pytest.fixture
def company_availability_data():
    return {
        "company_id": 1,
        "is_available": True
    }

def test_set_company_availability(company_availability_data):
    response = client.post("/messaging/company-availability/", json=company_availability_data)
    assert response.status_code == 200
    assert response.json()["is_available"] is True

def test_create_conversation(conversation_data):
    response = client.post("/messaging/conversation/", json=conversation_data)
    assert response.status_code == 200
    assert response.json()["customer_id"] == 1
    assert response.json()["company_id"] == 1
    assert response.json()["appointment_id"] == 1
    return response.json()["id"]

def test_send_and_get_messages(conversation_data):
    # Set company available
    client.post("/messaging/company-availability/", json={"company_id": 1, "is_available": True})
    # Create conversation
    conv_resp = client.post("/messaging/conversation/", json=conversation_data)
    conv_id = conv_resp.json()["id"]
    # Send message as customer
    msg_resp = client.post("/messaging/message/", json={"conversation_id": conv_id, "sender": "customer", "content": "Hello!"})
    assert msg_resp.status_code == 200
    # Send message as company
    msg_resp2 = client.post("/messaging/message/", json={"conversation_id": conv_id, "sender": "company", "content": "Hi, how can I help you?"})
    assert msg_resp2.status_code == 200
    # Get messages
    get_resp = client.get(f"/messaging/conversation/{conv_id}/messages/")
    assert get_resp.status_code == 200
    messages = get_resp.json()
    assert len(messages) == 2
    assert messages[0]["content"] == "Hello!"
    assert messages[1]["content"] == "Hi, how can I help you?"

def test_company_unavailable_blocks_message(conversation_data):
    # Set company unavailable
    client.post("/messaging/company-availability/", json={"company_id": 1, "is_available": False})
    # Create conversation
    conv_resp = client.post("/messaging/conversation/", json=conversation_data)
    conv_id = conv_resp.json()["id"]
    # Try to send message as company
    msg_resp = client.post("/messaging/message/", json={"conversation_id": conv_id, "sender": "company", "content": "Sorry, I'm unavailable."})
    assert msg_resp.status_code == 400
    assert "not available" in msg_resp.json()["detail"]

