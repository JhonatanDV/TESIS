import pytest
from httpx import AsyncClient

from app.db.crud import UserCRUD


@pytest.mark.asyncio
async def test_login_success(test_db, client):
    await UserCRUD.create(
        test_db,
        username="loginuser",
        password="password123",
        email="login@example.com",
        rol="standard"
    )
    await test_db.commit()
    
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "loginuser", "password": "password123"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent", "password": "wrongpass"}
    )
    
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_token(test_db, client):
    await UserCRUD.create(
        test_db,
        username="refreshuser",
        password="password123",
        email="refresh@example.com",
        rol="standard"
    )
    await test_db.commit()
    
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "refreshuser", "password": "password123"}
    )
    refresh_token = login_response.json()["refresh_token"]
    
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_logout(test_db, client, auth_headers):
    response = await client.post(
        "/api/v1/auth/logout",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"
