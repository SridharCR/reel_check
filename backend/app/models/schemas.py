from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class Login(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class VideoBase(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    duration_seconds: Optional[int] = None
    thumbnail_url: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    channel_name: Optional[str] = None

class VideoCreate(VideoBase):
    pass

class Video(VideoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class ClaimBase(BaseModel):
    claim_text: str
    evidence_summary: Optional[str] = None
    score: Optional[float] = None

class ClaimCreate(ClaimBase):
    pass

class Claim(ClaimBase):
    id: int
    analysis_result_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class AnalysisResultBase(BaseModel):
    task_id: str
    status: str
    progress: float
    raw_text_extracted: Optional[str] = None
    factual_report_json: Optional[dict] = None
    reliability_score: Optional[float] = None
    error_message: Optional[str] = None
    domain_inferred: Optional[str] = None

class AnalysisResultCreate(BaseModel):
    url: str # This will be used to create a Video entry

class AnalysisResult(AnalysisResultBase):
    id: int
    owner_id: int
    video_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    video: Video
    claims: List[Claim] = []

    class Config:
        orm_mode = True

# New Pydantic schemas for agent output
class AgentClaimOutput(BaseModel):
    claim: str # The factual claim extracted.
    evidence_summary: str # A summary of the evidence found for the claim.
    score: float # A reliability score for the claim (0-100).

class AgentReportOutput(BaseModel):
    claims: List[AgentClaimOutput] # An array of analyzed claims.
    report: str # A string summarizing the overall findings.
    overall_score: float # A single float representing the overall reliability score.