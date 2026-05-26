from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Maps simulation_id (as str) to a list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, simulation_id: str):
        await websocket.accept()
        if simulation_id not in self.active_connections:
            self.active_connections[simulation_id] = []
        self.active_connections[simulation_id].append(websocket)

    def disconnect(self, websocket: WebSocket, simulation_id: str):
        if simulation_id in self.active_connections:
            self.active_connections[simulation_id].remove(websocket)
            if not self.active_connections[simulation_id]:
                del self.active_connections[simulation_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict, simulation_id: str):
        if simulation_id in self.active_connections:
            for connection in self.active_connections[simulation_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Connection might be closed, we'll clean it up during disconnect
                    pass

manager = ConnectionManager()
