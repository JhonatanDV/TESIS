#!/bin/bash
echo "Initializing database..."
python -c "
import asyncio
from app.db.session import init_db
asyncio.run(init_db())
print('Database initialized successfully!')
"
