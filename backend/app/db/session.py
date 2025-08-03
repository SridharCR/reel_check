import os

from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime, Float, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://user:password@localhost/reelcheck")

echo_logs = True

engine = create_engine(
    DATABASE_URL, echo=echo_logs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    analyses = relationship("AnalysisResult", back_populates="owner")

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime, nullable=True)
    channel_name = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    analysis_results = relationship("AnalysisResult", back_populates="video")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, nullable=False)
    progress = Column(Float, default=0.0, nullable=False)
    raw_text_extracted = Column(Text, nullable=True)
    factual_report_json = Column(JSON, nullable=True)
    reliability_score = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    domain_inferred = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="analyses")

    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    video = relationship("Video", back_populates="analysis_results")

    claims = relationship("Claim", back_populates="analysis_result")
    agent_logs = relationship("AgentLog", back_populates="analysis_result")

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_text = Column(Text, nullable=False)
    evidence_summary = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    analysis_result_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=False)
    analysis_result = relationship("AnalysisResult", back_populates="claims")

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String, nullable=False)
    log_message = Column(Text, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())

    analysis_result_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=False)
    analysis_result = relationship("AnalysisResult", back_populates="agent_logs")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
