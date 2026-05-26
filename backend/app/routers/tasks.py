from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.db.models import Task, TaskStatus
from app.schemas.api import TaskCreate, TaskUpdate, TaskResponse
from typing import List

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/simulation/{simulation_id}", response_model=List[TaskResponse])
async def list_tasks(simulation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task)
        .filter(Task.simulation_id == simulation_id)
        .order_by(Task.created_at.asc())
    )
    return result.scalars().all()

@router.post("/simulation/{simulation_id}", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(simulation_id: int, task_in: TaskCreate, db: AsyncSession = Depends(get_db)):
    db_task = Task(
        simulation_id=simulation_id,
        title=task_in.title,
        description=task_in.description,
        assignee_role=task_in.assignee_role,
        status=task_in.status
    )
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_in: TaskUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).filter(Task.id == task_id))
    db_task = result.scalars().first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    await db.commit()
    await db.refresh(db_task)
    return db_task
