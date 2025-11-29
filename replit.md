# Sistema de Gestión Inteligente de Espacios Físicos

## Overview

This is an intelligent physical space management system built with FastAPI. It provides complete CRUD operations for spaces, resources, and assignments, along with AI-powered optimization using Google Gemini, analytics, and notifications.

## Project Architecture

### Backend Stack
- **Framework**: FastAPI (async)
- **Database**: SQLite (development) with SQLAlchemy async ORM
- **Authentication**: OAuth2 with JWT tokens
- **AI Integration**: Google Gemini for optimization and predictions

### Directory Structure
```
/app
  main.py              - FastAPI application entry point
  config.py            - Environment configuration (Pydantic Settings)
  /core
    security.py        - JWT tokens, password hashing, role-based access
  /db
    base.py            - SQLAlchemy declarative base
    session.py         - Async engine and session management
    models.py          - Database models (User, Space, Resource, Assignment, etc.)
    crud.py            - CRUD operations for all models
  /schemas
    *.py               - Pydantic schemas for request/response validation
  /api/v1
    auth.py            - Authentication endpoints
    spaces.py          - Space management endpoints
    resources.py       - Resource management endpoints
    assignments.py     - Assignment endpoints with optimization
    analytics.py       - Analytics and predictions
    notifications.py   - Notification system
  /services
    ai_gemini.py       - Google Gemini AI integration
    optimizer.py       - Heuristic optimization algorithm
    notifications.py   - Notification service
/scripts
  start.sh             - Server startup script
/tests
  conftest.py          - Test fixtures
  test_auth.py         - Auth tests
  test_spaces.py       - Spaces tests
```

## Key Features

1. **Space Management**: Create, read, update, delete physical spaces
2. **Resource Management**: Manage assignable resources with categories
3. **Assignment Optimization**: AI-powered and heuristic-based optimization
4. **Analytics**: Usage metrics, efficiency calculations, AI predictions
5. **Notifications**: User notification preferences and alerts

## Default Credentials

- **Admin**: username=`admin`, password=`admin123`
- **Standard User**: username=`usuario`, password=`usuario123`

## API Documentation

- Swagger UI: `/docs`
- ReDoc: `/redoc`

## Recent Changes

- Initial project setup with complete FastAPI structure
- Implemented all database models and CRUD operations
- Created all API endpoints as specified in requirements
- Integrated Google Gemini for AI features
- Added JWT authentication with role-based access control
- Created initial seed data for testing

## User Preferences

- Language: Spanish (system messages and documentation)
- Database: SQLite for development, MySQL for production
- AI Provider: Google Gemini

## Environment Variables

- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: JWT signing key
- `GEMINI_API_KEY`: Google Gemini API key
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT access token expiry (default: 30)
- `REFRESH_TOKEN_EXPIRE_DAYS`: JWT refresh token expiry (default: 7)
