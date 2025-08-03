Project: ReelCheck - Universal AI-Powered Content Verification
Goal: Build a mobile app (iOS/Android) that integrates with the native share sheet, allowing users to submit social media video URLs (e.g., YouTube Shorts) for AI-driven, multi-domain factual analysis. The backend, powered by Autogen agents and multimodal AI, will provide a transparent "Reliability Scorecard" and detailed explanations for any claims, regardless of subject matter.

Overall Architecture (Remains the Same - it's robust for expansion):
+-------------------+      +-------------------+
|                   |      |                   |
|   Mobile App      |      |   Cloud Backend   |
| (iOS/Android)     |      | (FastAPI/Flask)   |
|                   |      |                   |
| - Share Sheet Ext.|      | - API Gateway     |
| - UI/UX           |<---->| - Task Queue      |
| - Result Display  |      | - Worker Pool     |
+-------------------+      | - Database        |
           ^               | - Storage (S3/GCS)|
           |               +--------^----------+
           |                        |
           |                        |
           |                  +-----+-----+
           |                  |           |
           |                  | AI Core   |
           |                  |           |
           |                  | - YT Data API   |
           |                  | - yt-dlp        |
           |                  | - STT (Whisper) |
           |                  | - OCR (Tesseract)|
           |                  | - Autogen Agents|
           |                  |   (Gemini Pro)  |
           |                  | - Diverse Data  |
           |                  |   Sources/APIs  |
           +------------------+-----------------+
           |
+-------------------------------------------------+
|                                                 |
|     External Services (Social Media, APIs)      |
|                                                 |
+-------------------------------------------------+
Phase 1: Core Backend & API Design (Python)
(No significant changes needed here, as the architecture is designed to be domain-agnostic.)

1. Project Setup:
* Language: Python 3.9+
* Framework: FastAPI (highly recommended for performance, async support, and automatic API documentation with OpenAPI/Swagger UI) or Flask.
* Virtual Environment: Use venv or conda.
* Dependency Management: pip with requirements.txt.
* Version Control: Initialize a Git repository (git init) and connect it to GitHub/GitLab/Bitbucket.

2. API Design (FastAPI):
* Main Endpoint:
* POST /analyze_content:
* Input: {"url": "social_media_video_url_here"}
* Output: Initial response {"status": "processing", "task_id": "unique_id"}
* Asynchronous Processing: Hands off heavy AI analysis to a background worker.
* Status Endpoint:
* GET /status/{task_id}:
* Input: task_id
* Output: {"status": "...", "progress": "...", "results": { ... }}
* Security: Implement API Key authentication for backend endpoints; consider rate limiting.

3. Task Queuing & Asynchronous Workers:
* Solution: Celery with Redis (as a message broker) for robust background task management.
* Implementation: /analyze_content dispatches a Celery task (e.g., analyze_video_task.delay(url)). Celery workers run separately.

4. Data Storage (Initial):
* Database: PostgreSQL or MongoDB.
* ORM/ODM: SQLAlchemy (for PostgreSQL) or MongoEngine/Pymongo (for MongoDB).
* Schema: Design tables/collections to store:
* analysis_results: task_id, url, status, progress, raw_text_extracted, extracted_claims, factual_report_json, reliability_score, creation_timestamp, last_updated_timestamp, domain_inferred (optional, for categorization).
* agent_logs: Detailed logs of each agent's activity for XAI.

Phase 2: AI Core Components (Python)
This is the phase most impacted by the "all domains" requirement.

1. Video Ingestion & Processing:
* YouTube API Integration: Use google-api-python-client to optionally fetch metadata for a given YouTube Shorts URL.
* Video Download: Use yt-dlp to download video (or audio stream) to temporary cloud object storage (AWS S3, Google Cloud Storage, Azure Blob Storage).

2. Multimodal AI (Extraction):
* Speech-to-Text (STT): OpenAI Whisper (self-hosted or API) or Google Cloud Speech-to-Text. Process audio from video using moviepy or ffmpeg.
* Optical Character Recognition (OCR): Tesseract OCR (with pytesseract) and OpenCV (cv2) for text in video frames.
* Content Aggregation: Combine STT transcription and OCR text into a coherent textual representation of the video's content.

3. Autogen Multi-Agent System (The Universal Verifier):
* Core LLM: Gemini 1.5 Pro or similar advanced LLMs for all agents due to their strong reasoning and generalization capabilities across domains.
* Agents (Refined for Multi-Domain):
* 'Claim Extractor' Agent:
* Role: Analyzes the raw text from STT/OCR.
* Prompt Focus: "Identify all explicit factual claims made in the text. Focus on statements that can be objectively verified as true or false, regardless of the subject matter (e.g., historical dates, scientific principles, policy statements, common knowledge). Distinguish facts from opinions."
* Output: A structured list of verifiable claims.
* 'Knowledge Seeker' (formerly 'Scientific Researcher') Agent:
* Role: Takes identified claims and queries diverse, authoritative sources.
* Tools: Python functions for querying external APIs and general web search.
* Sources (Expanded):
* Academic Databases: PubMed (for health), arXiv (for broad science/tech), JSTOR (for humanities/social sciences), Semantic Scholar.
* Reputable Institutions/Organizations: Official government archives (.gov sites), established educational institutions (.edu sites), international organizations (UN, World Bank), scientific bodies (NASA, NOAA, CERN).
* Fact-Checking Organizations: APIs (if available) or programmatic search of established fact-checkers (e.g., PolitiFact, FactCheck.org, Snopes, Reuters Fact Check – often indexed by organizations like the International Fact-Checking Network).
* High-Quality News Archives: Reputable news sources with strong journalistic standards (e.g., AP, Reuters archives, major newspapers) for current events/historical claims.
* Curated Knowledge Bases: Wikipedia (as a starting point for general context, then verify its sources), Wikidata, DBPedia (for structured data).
* 'Evidence Synthesizer' Agent:
* Role: Analyzes retrieved information from diverse sources.
* Prompt Focus: "Synthesize the information from the provided sources related to the claim. Identify points of consensus, conflicting evidence, and any gaps or nuances in understanding. Evaluate the credibility of each source based on its authority and relevance to the claim."
* 'Verdict Generator' Agent:
* Role: Determines the veracity of the claim.
* Prompt Focus: "Based on the synthesized evidence, assign a 'Reliability Score' (e.g., 0-100) and categorize the claim (e.g., 'True,' 'Mostly True,' 'Partially True,' 'False,' 'Misleading,' 'Unsubstantiated'). Provide a clear, concise justification for your verdict, referencing the evidence."
* 'Contextual Explainer' (formerly 'Misinformation Explainer') Agent:
* Role: If a claim is found to be anything other than "True" or "Mostly True," this agent provides a clear explanation.
* Prompt Focus: "If the claim is false, misleading, or unsubstantiated, explain in simple, neutral terms why it is incorrect, incomplete, or lacks sufficient evidence. Provide the accurate factual context or the consensus view on the matter, citing the underlying evidence."
* Explainable AI (XAI) Logging: Crucially, every agent's thought process, tool calls, and LLM responses are meticulously logged to your database for full transparency.

Phase 3: Mobile App (Frontend)
(No changes needed here, as the mobile app provides a universal interface to the backend.)

Choice of Framework: React Native / Flutter (recommended for cross-platform) or Native (SwiftUI/Kotlin).

Share Sheet Integration: Set up your app to register as a share target for URLs on both iOS (Action Extension) and Android (Share Sheet Target/ACTION_SEND intent).

User Interface (UI/UX):

Clean and Intuitive: Adhere to platform design guidelines.

Loading State: Clear visual feedback (progress bar, text updates).

Result Display:

"Reliability Scorecard": Prominent visual score/category.

Summary: Concise, easy-to-read factual summary.

Expandable Details: Allow users to tap to see full analysis (claims extracted, evidence found, direct citations with links, the agent trace/logs for XAI).

"Why it's [False/Misleading/Unsubstantiated]" section (if applicable).

Phase 4: Deployment & DevOps Considerations
(No changes needed here; standard practices apply regardless of domain.)

Containerization: Docker for FastAPI app and Celery workers.

Cloud Hosting: AWS, Google Cloud Platform (GCP), or Azure. Services: Compute (Cloud Run, Fargate, EC2), Database (RDS, Cloud SQL), Message Broker (Redis).

CI/CD: GitHub Actions, GitLab CI/CD, etc., for automated testing, Docker builds, and deployment.

Phase 5: Iterative Development & Best Practices
Start Small (MVP):

Backend MVP: FastAPI, yt-dlp, simple STT/OCR, return raw text.

Mobile MVP: Share sheet works, sends URL, displays raw text.

Generalize First: When implementing agents, aim for generalizable prompts and tools before specializing. For example, a "Knowledge Seeker" that uses a general search engine is a good first step, then add specific academic databases.

Testing: Unit, Integration, End-to-End Tests.

Monitoring & Logging: Structured logging, cloud monitoring.