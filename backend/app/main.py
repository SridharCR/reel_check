import json
from typing import List
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
import uuid
from app.worker.celery_worker import analyze_video_task
from app.db.session import engine, Base, SessionLocal
from app.db.session import AnalysisResult, User, Video
from app.api import user, authentication, websocket
from app.models import schemas
from app.core import oauth2
from app.db import session as database
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis

import os

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    r = redis.from_url(redis_url, decode_responses=True)
    await FastAPILimiter.init(r)
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000", # Assuming frontend runs on port 3000
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authentication.router)
app.include_router(user.router)
app.include_router(websocket.router)

class AnalyzeRequest(BaseModel):
    url: str

@app.post("/analyze", status_code=201, dependencies=[Depends(RateLimiter(times=5, seconds=60))]) # 5 requests per minute
async def analyze_content(request: AnalyzeRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), current_user: User = Depends(oauth2.get_current_user)):
    # Check if video already exists
    video = db.query(Video).filter(Video.url == request.url).first()
    if not video:
        video = Video(url=request.url)
        db.add(video)
        db.commit()
        db.refresh(video)

    new_analysis = AnalysisResult(
        task_id=str(uuid.uuid4()),
        owner_id=current_user.id,
        video_id=video.id,
        status="starting"
    )
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)
    background_tasks.add_task(analyze_video_task.delay, new_analysis.id)
    return {"status": "processing", "task_id": new_analysis.task_id}


@app.get("/status/{task_id}", response_model=schemas.AnalysisResult)
async def get_status(task_id: str, db: Session = Depends(database.get_db), current_user: User = Depends(oauth2.get_current_user)):
    result = db.query(AnalysisResult).filter(AnalysisResult.task_id == task_id).first()
    if result:
        if result.owner_id == current_user.id:
            if result.status == "completed":
                result.factual_report_json = json.loads(result.factual_report_json)
            return result
        else:
            raise HTTPException(status_code=403, detail="Not authorized to access this task")
    raise HTTPException(status_code=404, detail="Analysis not found")

@app.get("/history", response_model=List[schemas.AnalysisResult])
async def get_history(db: Session = Depends(database.get_db), current_user: User = Depends(oauth2.get_current_user)):
    history = db.query(AnalysisResult).filter(AnalysisResult.owner_id == current_user.id).all()
    final = []
    if history:
        for result in history:
            if result.status == "completed":
                result.factual_report_json = json.loads(result.factual_report_json)
            final.append(result)
    return final

@app.get("/analysis/{analysis_id}", response_model=schemas.AnalysisResult)
async def get_analysis_details(analysis_id: int, db: Session = Depends(database.get_db), current_user: User = Depends(oauth2.get_current_user)):
    result = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
    if result:
        if result.owner_id == current_user.id:
            result.factual_report_json = json.loads(result.factual_report_json)
            return result
        else:
            raise HTTPException(status_code=403, detail="Not authorized to access this analysis")
    raise HTTPException(status_code=404, detail="Analysis not found")
