from typing import TypedDict, List, Annotated
import operator
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.orchestration.prompts import (
    CEO_PROMPT, CTO_PROMPT, PM_PROMPT, DESIGNER_PROMPT, MARKETER_PROMPT, INVESTOR_PROMPT
)
from app.db.database import async_session
from app.db.models import Message, Task, TaskStatus, Document, DocumentType, Simulation
from sqlalchemy.future import select
from app.core.websocket import manager

class AgentMessage(TypedDict):
    role: str
    name: str
    content: str

class GraphState(TypedDict):
    simulation_id: int
    startup_idea: str
    chat_history: Annotated[List[AgentMessage], operator.add]
    tasks: List[dict]
    market_research: str
    pitch_deck: str
    code_artifacts: List[dict]
    current_speaker: str
    step_count: int

# Utility to log and broadcast messages to WebSocket room
async def broadcast_agent_message(simulation_id: int, role: str, name: str, content: str):
    # Save to database
    async with async_session() as session:
        db_msg = Message(
            simulation_id=simulation_id,
            sender_role=role,
            sender_name=name,
            content=content
        )
        session.add(db_msg)
        await session.commit()
    
    # Broadcast via WS
    await manager.broadcast({
        "type": "message",
        "data": {
            "sender_role": role,
            "sender_name": name,
            "content": content
        }
    }, str(simulation_id))

# Base LLM initialization
def get_llm():
    # If key is mock, we fall back to a dummy but functional class to prevent crashes
    import os
    api_key = os.getenv("OPENAI_API_KEY", "")
    if api_key == "mock_key" or not api_key:
        # Dummy mock LLM that generates static/semi-dynamic outputs for testing
        class MockLLM:
            def invoke(self, messages):
                content = "Mock response: Let's focus on building out the MVP. What do you guys think?"
                last_msg = messages[-1].content.lower()
                if "cto" in last_msg or "code" in last_msg:
                    content = "Mock response (CTO): I have scaffolded the React-Next.js application and tested the APIs. Everything compile perfectly."
                elif "tasks" in last_msg or "kanban" in last_msg:
                    content = "Mock response (PM): I have created 3 tickets in the Todo column: Backend scaffolding, DB schemas, and Frontend UI design."
                return type('obj', (object,), {'content': content})()
        return MockLLM()
    return ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

# LangGraph Nodes
async def ceo_node(state: GraphState) -> dict:
    llm = get_llm()
    # Format messages
    history = [SystemMessage(content=CEO_PROMPT.format(idea=state["startup_idea"]))]
    for msg in state["chat_history"][-10:]: # Limit context window to last 10 messages
        history.append(HumanMessage(content=f"{msg['name']} ({msg['role']}): {msg['content']}"))
    
    response = llm.invoke(history)
    await broadcast_agent_message(state["simulation_id"], "CEO", "Marcus", response.content)
    
    return {
        "chat_history": [{"role": "CEO", "name": "Marcus", "content": response.content}],
        "current_speaker": "CEO",
        "step_count": state["step_count"] + 1
    }

async def cto_node(state: GraphState) -> dict:
    llm = get_llm()
    history = [SystemMessage(content=CTO_PROMPT.format(idea=state["startup_idea"]))]
    for msg in state["chat_history"][-10:]:
        history.append(HumanMessage(content=f"{msg['name']} ({msg['role']}): {msg['content']}"))
    
    response = llm.invoke(history)
    await broadcast_agent_message(state["simulation_id"], "CTO", "Elena", response.content)
    
    # Simulate code artifact creation if CTO outputs markdown code blocks
    if "```" in response.content:
        # Write to document artifacts
        async with async_session() as session:
            doc = Document(
                simulation_id=state["simulation_id"],
                title="CTO System Architecture & Code",
                type=DocumentType.CODE,
                content=response.content
            )
            session.add(doc)
            await session.commit()
            
            await manager.broadcast({
                "type": "artifact",
                "data": {
                    "title": doc.title,
                    "type": "code",
                    "content": doc.content
                }
            }, str(state["simulation_id"]))

    return {
        "chat_history": [{"role": "CTO", "name": "Elena", "content": response.content}],
        "current_speaker": "CTO",
        "step_count": state["step_count"] + 1
    }

async def pm_node(state: GraphState) -> dict:
    llm = get_llm()
    history = [SystemMessage(content=PM_PROMPT.format(idea=state["startup_idea"]))]
    for msg in state["chat_history"][-10:]:
        history.append(HumanMessage(content=f"{msg['name']} ({msg['role']}): {msg['content']}"))
    
    response = llm.invoke(history)
    await broadcast_agent_message(state["simulation_id"], "PM", "Sarah", response.content)
    
    # PM parses tasks. If structured task tags like [TASK: Title | Desc | Assignee] exist, add to DB
    # For now, let's dynamically create a few tasks based on the simulation state
    async with async_session() as session:
        # Example dummy tasks to populate Kanban
        if state["step_count"] < 3:
            t1 = Task(simulation_id=state["simulation_id"], title="Backend API Setup", description="Scaffold FastAPI models and endpoints", assignee_role="CTO", status=TaskStatus.TODO)
            t2 = Task(simulation_id=state["simulation_id"], title="Landing Page Mockup", description="Design modern dark theme layout", assignee_role="Designer", status=TaskStatus.TODO)
            session.add_all([t1, t2])
            await session.commit()
            
            await manager.broadcast({
                "type": "task_created",
                "data": {"title": t1.title, "assignee": t1.assignee_role, "status": t1.status}
            }, str(state["simulation_id"]))

    return {
        "chat_history": [{"role": "PM", "name": "Sarah", "content": response.content}],
        "current_speaker": "PM",
        "step_count": state["step_count"] + 1
    }

async def designer_node(state: GraphState) -> dict:
    llm = get_llm()
    history = [SystemMessage(content=DESIGNER_PROMPT.format(idea=state["startup_idea"]))]
    for msg in state["chat_history"][-10:]:
        history.append(HumanMessage(content=f"{msg['name']} ({msg['role']}): {msg['content']}"))
    
    response = llm.invoke(history)
    await broadcast_agent_message(state["simulation_id"], "Designer", "David", response.content)
    
    return {
        "chat_history": [{"role": "Designer", "name": "David", "content": response.content}],
        "current_speaker": "Designer",
        "step_count": state["step_count"] + 1
    }

async def marketer_node(state: GraphState) -> dict:
    llm = get_llm()
    history = [SystemMessage(content=MARKETER_PROMPT.format(idea=state["startup_idea"]))]
    for msg in state["chat_history"][-10:]:
        history.append(HumanMessage(content=f"{msg['name']} ({msg['role']}): {msg['content']}"))
    
    response = llm.invoke(history)
    await broadcast_agent_message(state["simulation_id"], "Marketer", "Zoe", response.content)
    
    return {
        "chat_history": [{"role": "Marketer", "name": "Zoe", "content": response.content}],
        "current_speaker": "Marketer",
        "step_count": state["step_count"] + 1
    }

async def investor_node(state: GraphState) -> dict:
    llm = get_llm()
    history = [SystemMessage(content=INVESTOR_PROMPT.format(idea=state["startup_idea"]))]
    for msg in state["chat_history"][-10:]:
        history.append(HumanMessage(content=f"{msg['name']} ({msg['role']}): {msg['content']}"))
    
    response = llm.invoke(history)
    await broadcast_agent_message(state["simulation_id"], "Investor", "VC-1", response.content)
    
    return {
        "chat_history": [{"role": "Investor", "name": "VC-1", "content": response.content}],
        "current_speaker": "Investor",
        "step_count": state["step_count"] + 1
    }
