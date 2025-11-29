import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_space(client, auth_headers):
    space_data = {
        "nombre": "Test Office",
        "tipo": "oficina",
        "capacidad": 10,
        "ubicacion": "Building A, Floor 1",
        "caracteristicas": {"aire_acondicionado": True},
        "estado": "disponible"
    }
    
    response = await client.post(
        "/api/v1/spaces",
        json=space_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == "Test Office"
    assert data["tipo"] == "oficina"
    assert data["capacidad"] == 10


@pytest.mark.asyncio
async def test_get_spaces(client, auth_headers):
    space_data = {
        "nombre": "List Test Office",
        "tipo": "oficina",
        "capacidad": 5
    }
    await client.post("/api/v1/spaces", json=space_data, headers=auth_headers)
    
    response = await client.get("/api/v1/spaces", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_space_by_id(client, auth_headers):
    space_data = {
        "nombre": "Get By ID Office",
        "tipo": "oficina",
        "capacidad": 8
    }
    create_response = await client.post(
        "/api/v1/spaces",
        json=space_data,
        headers=auth_headers
    )
    space_id = create_response.json()["id"]
    
    response = await client.get(
        f"/api/v1/spaces/{space_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == space_id
    assert data["nombre"] == "Get By ID Office"


@pytest.mark.asyncio
async def test_update_space(client, auth_headers):
    space_data = {
        "nombre": "Update Test Office",
        "tipo": "oficina",
        "capacidad": 10
    }
    create_response = await client.post(
        "/api/v1/spaces",
        json=space_data,
        headers=auth_headers
    )
    space_id = create_response.json()["id"]
    
    update_data = {
        "nombre": "Updated Office Name",
        "capacidad": 15
    }
    response = await client.put(
        f"/api/v1/spaces/{space_id}",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Updated Office Name"
    assert data["capacidad"] == 15


@pytest.mark.asyncio
async def test_delete_space(client, auth_headers):
    space_data = {
        "nombre": "Delete Test Office",
        "tipo": "oficina",
        "capacidad": 5
    }
    create_response = await client.post(
        "/api/v1/spaces",
        json=space_data,
        headers=auth_headers
    )
    space_id = create_response.json()["id"]
    
    response = await client.delete(
        f"/api/v1/spaces/{space_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 204
    
    get_response = await client.get(
        f"/api/v1/spaces/{space_id}",
        headers=auth_headers
    )
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_get_available_spaces(client, auth_headers):
    space_data = {
        "nombre": "Available Test Office",
        "tipo": "oficina",
        "capacidad": 10,
        "estado": "disponible"
    }
    await client.post("/api/v1/spaces", json=space_data, headers=auth_headers)
    
    response = await client.get(
        "/api/v1/spaces/available",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for space in data:
        assert space["disponible"] == True


@pytest.mark.asyncio
async def test_unauthorized_access(client):
    response = await client.get("/api/v1/spaces")
    
    assert response.status_code == 401
