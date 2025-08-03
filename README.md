# ReelCheck: AI-Powered Content Analysis Platform

![ReelCheck Logo](extension/icons/icon128.png)

## Project Overview

ReelCheck is a full-stack application designed to analyze video content (specifically YouTube Shorts/Reels) for factual claims, verify them using AI agents, and present a comprehensive report. It consists of a FastAPI backend, a React-based Chrome Extension frontend, and utilizes Celery for asynchronous task processing, Redis as a message broker, and PostgreSQL for data storage.

## Features

*   **Video Analysis:** Submit YouTube Shorts/Reels URLs for analysis.
*   **AI-Powered Claim Verification:** Utilizes Autogen multi-agent system to extract, research, and verify factual claims from video content.
*   **Detailed Reports:** Generates comprehensive reports including individual claims, supporting evidence summaries, and veracity scores.
*   **Asynchronous Processing:** Celery workers handle video processing and AI analysis in the background to ensure a responsive user experience.
*   **Authentication:** Secure user login and registration.
*   **Analysis History:** Users can view their past analysis reports.
*   **Chrome Extension:** Seamless integration into the browser for easy access and submission of video URLs.

## Technologies Used

### Backend (Python FastAPI)
*   **FastAPI:** Web framework for building APIs.
*   **SQLAlchemy:** ORM for database interactions (PostgreSQL).
*   **Celery:** Asynchronous task queue for background processing.
*   **Redis:** Message broker for Celery and rate limiting.
*   **Autogen:** Multi-agent framework for AI-powered claim verification.
*   **yt-dlp:** For downloading video metadata and content.
*   **Whisper:** OpenAI's speech-to-text model for audio transcription.
*   **OpenCV (cv2):** For video frame processing.
*   **Pytesseract:** OCR tool for extracting text from video frames.
*   **MoviePy:** For audio extraction from video.
*   **FastAPI-Limiter:** For API rate limiting.

### Frontend (React Chrome Extension)
*   **React:** JavaScript library for building user interfaces.
*   **Tailwind CSS:** For styling and responsive design.
*   **Chrome Extension APIs:** For browser integration and local storage.

### Database & Infrastructure
*   **PostgreSQL:** Relational database for storing analysis results, user data, and video information.
*   **Docker & Docker Compose:** For containerization and orchestration of services (optional, but recommended for easy setup).

## Setup Instructions

This project requires several services to run concurrently: the FastAPI backend, a PostgreSQL database, a Redis instance, and a Celery worker. Docker Compose is highly recommended for a streamlined setup.

### Prerequisites

*   **Docker & Docker Compose:** [Install Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose).
*   **Python 3.9+:** [Install Python](https://www.python.org/downloads/).
*   **Node.js & npm:** [Install Node.js](https://nodejs.org/en/download/) (npm is included).
*   **Tesseract OCR:** [Install Tesseract](https://tesseract-ocr.github.io/tessdoc/Installation.html). Make sure it's added to your system's PATH, or update the `pytesseract.pytesseract.tesseract_cmd` variable in `backend/ai_core.py` to point to your Tesseract executable.

### 1. Clone the Repository

```bash
git clone <repository_url>
cd reel_check
```

### 2. Backend Setup (FastAPI & Celery)

#### Using Docker Compose (Recommended)

This is the easiest way to get all backend services (PostgreSQL, Redis, FastAPI, Celery) up and running.

1.  **Create `.env` file:**
    Create a `.env` file in the project root (`reel_check/`) with your PostgreSQL credentials.
    ```
    POSTGRES_USER=your_db_user
    POSTGRES_PASSWORD=your_db_password
    POSTGRES_DB=your_db_name
    ```
2.  **Build and run services:**
    ```bash
    docker-compose up --build -d
    ```
    This will:
    *   Build Docker images for the backend and Celery worker.
    *   Start PostgreSQL, Redis, FastAPI, and Celery worker containers.
    *   The FastAPI application will be accessible at `http://localhost:8000`.

#### Manual Setup (Alternative)

If you prefer not to use Docker Compose for the backend:

1.  **Install PostgreSQL & Redis:** Ensure you have PostgreSQL and Redis installed and running on your system.
2.  **Backend Python Environment:**
    ```bash
    cd backend
    python -m venv .venv
    source .venv/Scripts/activate   # On Windows
    # source .venv/bin/activate    # On macOS/Linux
    pip install -r requirements.txt
    ```
3.  **Database Migrations (if applicable):**
    If you are using Alembic for migrations, run:
    ```bash
    # (Assuming Alembic is set up and configured)
    alembic upgrade head
    ```
    Otherwise, ensure your database schema is created (e.g., by running the FastAPI app once, as `Base.metadata.create_all(bind=engine)` is called).
4.  **Run FastAPI Application:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
5.  **Run Celery Worker:**
    In a separate terminal, from the `backend` directory:
    ```bash
    celery -A celery_worker worker --loglevel=info
    ```

### 3. Frontend Setup (Chrome Extension)

1.  **Install Dependencies:**
    ```bash
    cd extension
    npm install
    ```
2.  **Build the Extension:**
    ```bash
    npm run build
    ```
    This will create a `build` directory inside `extension/`.
3.  **Load into Chrome/Brave:**
    *   Open Chrome/Brave browser.
    *   Go to `chrome://extensions/`.
    *   Enable "Developer mode" (top right corner).
    *   Click "Load unpacked".
    *   Navigate to the `extension/build` directory and select it.
    *   The extension should now appear in your browser's toolbar.

## Usage

1.  **Ensure all services are running:** Backend (FastAPI), Celery worker, PostgreSQL, and Redis.
2.  **Open the Chrome Extension:** Click on the extension icon in your browser toolbar.
3.  **Login/Signup:** If you're a new user, sign up. Otherwise, log in with your credentials.
4.  **Submit URL:** In the dashboard, paste a YouTube Shorts/Reel URL into the input field and click "Analyze".
5.  **View Analysis:** The analysis will be processed in the background. You can see the status update on the dashboard. Once completed, the detailed report with claims, evidence, and scores will be displayed. You can also view past analyses in the "Past Analyses" section.

## Project Structure

```
.
├── autobuild_basic.ipynb
├── docker-compose.yml          # Docker Compose configuration
├── main.py                     # Main project entry (not used in this setup)
├── OAI_CONFIG_LIST             # Autogen configuration for LLMs
├── README.md                   # This file
├── backend/                    # FastAPI backend and Celery worker
│   ├── ai_core.py              # Core AI logic (video processing, Autogen setup)
│   ├── celery_worker.py        # Celery task definitions
│   ├── database.py             # Database models and session management
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── routers/                # FastAPI route definitions (auth, user, websocket)
│   └── ...
├── extension/                  # React Chrome Extension frontend
│   ├── public/                 # Public assets
│   ├── src/                    # React source code
│   │   ├── api/api.js          # API calls to backend
│   │   ├── components/         # React components (Login, Dashboard, History etc.)
│   │   ├── contexts/           # React contexts (AuthContext)
│   │   └── ...
│   ├── package.json            # Node.js dependencies
│   └── ...
└── frontend/                   # (Potentially a separate React Native/Web frontend, not primary for this project)
    └── ...
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.