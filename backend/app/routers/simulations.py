from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.database import get_db
from app.db.models import Simulation, Message, Document, Agent
from app.schemas.api import SimulationCreate, SimulationResponse, MessageResponse, DocumentResponse
from typing import List

from app.orchestration.engine import run_startup_simulation

router = APIRouter(prefix="/simulations", tags=["simulations"])

@router.post("/", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
async def create_simulation(
    user_id: int, 
    sim_in: SimulationCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # 1. Create Simulation Entry
    simulation = Simulation(
        user_id=user_id,
        name=sim_in.name,
        idea=sim_in.idea,
        status="initializing"
    )
    db.add(simulation)
    await db.commit()
    await db.refresh(simulation)

    # 2. Setup Default Agents for this simulation
    # (CEO, CTO, PM, Designer, Marketer, Investor)
    agents_to_create = [
        ("CEO", "Marcus", "You are the visionary CEO of the startup. You coordinate, resolve debates, and align the company's direction."),
        ("CTO", "Elena", "You are the CTO. You design architecture, write backend code, select the tech stack, and manage system reliability."),
        ("PM", "Sarah", "You are the Product Manager. You organize roadmap, write user stories, and track progress using the Kanban board."),
        ("Designer", "David", "You are the Lead Designer. You focus on user experience, UI aesthetics, mockups, and client interactions."),
        ("Marketer", "Zoe", "You are the Marketing Lead. You research the competition, plan marketing campaigns, and define product messaging."),
        ("Investor", "VC-1", "You are a demanding Venture Capital investor. You challenge the startup team on unit economics, TAM, and business model viability.")
    ]

    for role, name, system_prompt in agents_to_create:
        agent = Agent(
            simulation_id=simulation.id,
            role=role,
            name=name,
            system_prompt=system_prompt
        )
        db.add(agent)
    
    await db.commit()

    # 3. Queue the initial LangGraph brainstorming loop using BackgroundTasks
    background_tasks.add_task(run_startup_simulation, simulation.id)

    return simulation

@router.get("/user/{user_id}", response_model=List[SimulationResponse])
async def list_simulations(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Simulation).filter(Simulation.user_id == user_id).order_by(Simulation.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(simulation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Simulation).filter(Simulation.id == simulation_id))
    simulation = result.scalars().first()
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulation

@router.get("/{simulation_id}/messages", response_model=List[MessageResponse])
async def get_messages(simulation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Message)
        .filter(Message.simulation_id == simulation_id)
        .order_by(Message.timestamp.asc())
    )
    return result.scalars().all()

@router.get("/{simulation_id}/documents", response_model=List[DocumentResponse])
async def get_documents(simulation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document)
        .filter(Document.simulation_id == simulation_id)
        .order_by(Document.created_at.desc())
    )
    return result.scalars().all()
