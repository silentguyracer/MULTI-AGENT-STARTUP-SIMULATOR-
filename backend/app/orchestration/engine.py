from langgraph.graph import StateGraph, END
from app.orchestration.graph import (
    GraphState, ceo_node, cto_node, pm_node, designer_node, marketer_node, investor_node
)
from app.db.database import async_session
from app.db.models import Simulation, Message
from sqlalchemy.future import select
import asyncio

# Routing function
def router(state: GraphState) -> str:
    # Stop condition (e.g. 12 steps)
    if state.get("step_count", 0) >= 12:
        return END

    speaker = state.get("current_speaker")
    if not speaker:
        return "ceo"
    elif speaker == "CEO":
        return "pm"
    elif speaker == "PM":
        return "cto"
    elif speaker == "CTO":
        return "designer"
    elif speaker == "Designer":
        return "marketer"
    elif speaker == "Marketer":
        return "investor"
    elif speaker == "Investor":
        return "ceo"
    return END

# Build the LangGraph workflow
workflow = StateGraph(GraphState)

# Add Nodes
workflow.add_node("ceo", ceo_node)
workflow.add_node("cto", cto_node)
workflow.add_node("pm", pm_node)
workflow.add_node("designer", designer_node)
workflow.add_node("marketer", marketer_node)
workflow.add_node("investor", investor_node)

# Set Entry Point
workflow.set_entry_point("ceo")

# Add Conditional Edges
workflow.add_conditional_edges(
    "ceo",
    router,
    {"pm": "pm", "end": END}
)
workflow.add_conditional_edges(
    "pm",
    router,
    {"cto": "cto", "end": END}
)
workflow.add_conditional_edges(
    "cto",
    router,
    {"designer": "designer", "end": END}
)
workflow.add_conditional_edges(
    "designer",
    router,
    {"marketer": "marketer", "end": END}
)
workflow.add_conditional_edges(
    "marketer",
    router,
    {"investor": "investor", "end": END}
)
workflow.add_conditional_edges(
    "investor",
    router,
    {"ceo": "ceo", "end": END}
)

app_graph = workflow.compile()

# Async execution runner
async def run_startup_simulation(simulation_id: int):
    # 1. Load Simulation context
    async with async_session() as session:
        result = await session.execute(select(Simulation).filter(Simulation.id == simulation_id))
        sim = result.scalars().first()
        if not sim:
            return
        
        sim.status = "running"
        await session.commit()
        
        idea = sim.idea

        # Load previous history if any
        history_result = await session.execute(
            select(Message).filter(Message.simulation_id == simulation_id).order_by(Message.timestamp.asc())
        )
        db_messages = history_result.scalars().all()
        chat_history = [
            {"role": msg.sender_role, "name": msg.sender_name, "content": msg.content}
            for msg in db_messages
        ]

    # Initialize State
    initial_state: GraphState = {
        "simulation_id": simulation_id,
        "startup_idea": idea,
        "chat_history": chat_history,
        "tasks": [],
        "market_research": "",
        "pitch_deck": "",
        "code_artifacts": [],
        "current_speaker": "",
        "step_count": len(chat_history)
    }

    # 2. Run graph asynchronously step-by-step to allow live web sockets
    try:
        async for output in app_graph.astream(initial_state):
            # We can run brief sleep between agent steps to make the UI look premium and human-like
            await asyncio.sleep(2)
        
        # Once complete, update simulation status to completed
        async with async_session() as session:
            result = await session.execute(select(Simulation).filter(Simulation.id == simulation_id))
            sim = result.scalars().first()
            if sim:
                sim.status = "completed"
                await session.commit()
    except Exception as e:
        # Fail gracefully
        async with async_session() as session:
            result = await session.execute(select(Simulation).filter(Simulation.id == simulation_id))
            sim = result.scalars().first()
            if sim:
                sim.status = f"error: {str(e)}"
                await session.commit()
