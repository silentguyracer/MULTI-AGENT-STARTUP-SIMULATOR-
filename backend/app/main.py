from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base
from app.routers import users, simulations, tasks
from app.core.websocket import manager

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(users.router, prefix="/api")
app.include_router(simulations.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")

@app.websocket("/ws/{simulation_id}")
async def websocket_endpoint(websocket: WebSocket, simulation_id: str):
    await manager.connect(websocket, simulation_id)
    try:
        while True:
            # We can handle text messages received from client (e.g. human prompts)
            data = await websocket.receive_json()
            if data.get("type") == "human_message":
                # Broadcast the message to all agents in this simulation room
                await manager.broadcast({
                    "type": "message",
                    "data": {
                        "sender_role": "user",
                        "sender_name": "Human",
                        "content": data["content"]
                    }
                }, simulation_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, simulation_id)
