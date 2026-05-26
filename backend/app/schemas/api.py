from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional
from app.db.models import TaskStatus, DocumentType

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    sender_role: str
    sender_name: str
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    simulation_id: int
    timestamp: datetime
    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_role: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_role: Optional[str] = None
    status: Optional[TaskStatus] = None

class TaskResponse(TaskBase):
    id: int
    simulation_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    title: str
    type: DocumentType
    content: str

class DocumentResponse(DocumentBase):
    id: int
    simulation_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Simulation Schemas
class SimulationBase(BaseModel):
    name: str
    idea: str

class SimulationCreate(SimulationBase):
    pass

class SimulationResponse(SimulationBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True
