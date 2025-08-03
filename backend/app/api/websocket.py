from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, AnalysisResult, User
from app.core import oauth2
import json
import asyncio

router = APIRouter(
    tags=['WebSockets']
)

@router.websocket("/ws/status/{task_id}")
async def websocket_status_updates(
    websocket: WebSocket,
    task_id: str,
    token: str,
    db: Session = Depends(SessionLocal)
):
    try:
        user = oauth2.get_current_user(token=token, db=db)
    except Exception as e:
        await websocket.close(code=1008, reason=f"Authentication failed: {e}")
        return

    analysis = db.query(AnalysisResult).filter(AnalysisResult.task_id == task_id).first()

    if not analysis or analysis.owner_id != user.id:
        await websocket.close(code=1008, reason="Analysis not found or not authorized")
        return

    await websocket.accept()
    try:
        while True:
            db.refresh(analysis)
            await websocket.send_json({
                "task_id": analysis.task_id,
                "analysis": {
                    "id": analysis.id,
                    "task_id": analysis.task_id,
                    "status": analysis.status,
                    "progress": analysis.progress,
                    "raw_text_extracted": analysis.raw_text_extracted,
                    "factual_report_json": analysis.factual_report_json,
                    "reliability_score": analysis.reliability_score,
                    "error_message": analysis.error_message,
                    "domain_inferred": analysis.domain_inferred,
                    "owner_id": analysis.owner_id,
                    "video_id": analysis.video_id,
                    "created_at": analysis.created_at.isoformat(),
                    "updated_at": analysis.updated_at.isoformat() if analysis.updated_at else None,
                    "video": {
                        "id": analysis.video.id,
                        "url": analysis.video.url,
                        "title": analysis.video.title,
                        "description": analysis.video.description,
                        "duration_seconds": analysis.video.duration_seconds,
                        "thumbnail_url": analysis.video.thumbnail_url,
                        "uploaded_at": analysis.video.uploaded_at.isoformat() if analysis.video.uploaded_at else None,
                        "channel_name": analysis.video.channel_name,
                        "created_at": analysis.video.created_at.isoformat(),
                        "updated_at": analysis.video.updated_at.isoformat() if analysis.video.updated_at else None,
                    },
                    "claims": [
                        {
                            "id": claim.id,
                            "claim_text": claim.claim_text,
                            "evidence_summary": claim.evidence_summary,
                            "score": claim.score,
                            "analysis_result_id": claim.analysis_result_id,
                            "created_at": claim.created_at.isoformat(),
                            "updated_at": claim.updated_at.isoformat() if claim.updated_at else None,
                        }
                        for claim in analysis.claims
                    ]
                }
            })
            if analysis.status == "completed" or analysis.status == "failed":
                break
            await asyncio.sleep(2) # Send updates every 2 seconds
    except WebSocketDisconnect:
        print(f"Client disconnected from task {task_id}")
    except Exception as e:
        print(f"WebSocket error for task {task_id}: {e}")
