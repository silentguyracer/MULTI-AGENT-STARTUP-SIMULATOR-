from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class DocumentType(str, enum.Enum):
    PITCH_DECK = "pitch_deck"
    MARKET_RESEARCH = "market_research"
    CODE = "code"
    DESIGN = "design"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    simulations = relationship("Simulation", back_populates="user", cascade="all, delete-orphan")

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    idea = Column(Text, nullable=False)
    status = Column(String, default="brainstorming")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="simulations")
    agents = relationship("Agent", back_populates="simulation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="simulation", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="simulation", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="simulation", cascade="all, delete-orphan")

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=False)
    role = Column(String, nullable=False)  # CEO, CTO, PM, Designer, Marketer, Investor
    name = Column(String, nullable=False)
    system_prompt = Column(Text, nullable=False)
    personality = Column(Text, nullable=True)

    simulation = relationship("Simulation", back_populates="agents")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=False)
    sender_role = Column(String, nullable=False)  # user, CEO, CTO, etc.
    sender_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    simulation = relationship("Simulation", back_populates="messages")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=False)
    assignee_role = Column(String, nullable=True)  # CEO, CTO, PM, Designer, Marketer, Investor
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    simulation = relationship("Simulation", back_populates="tasks")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=False)
    title = Column(String, nullable=False)
    type = Column(SQLEnum(DocumentType), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    simulation = relationship("Simulation", back_populates="documents")
