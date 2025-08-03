import json
import logging

from celery import Celery
from sqlalchemy.orm import Session

from backend.ai_core import get_video_metadata, process_video, run_analysis
from backend.database import AnalysisResult, Claim, SessionLocal, Video

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

celery_app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    broker_transport_options={"visibility_timeout": 3600},
    broker_connection_retry_on_startup=True,
)


def _update_video_metadata(db: Session, video: Video):
    """Fetches and updates video metadata in the database."""
    try:
        logger.info(f"Updating metadata for video ID {video.id} from URL: {video.url}")
        metadata = get_video_metadata(video.url)
        if metadata:
            video.title = metadata.get("title")
            video.description = metadata.get("description")
            video.duration_seconds = metadata.get("duration")
            video.thumbnail_url = metadata.get("thumbnail")
            video.uploaded_at = metadata.get("upload_date")
            video.channel_name = metadata.get("channel")
            db.commit()
            logger.info(f"Successfully updated metadata for video ID {video.id}")
    except Exception as e:
        logger.error(f"Error updating metadata for video ID {video.id}: {e}")
        db.rollback()


def _extract_text_from_video(video_url: str) -> (str, str):
    """Extracts text from the video, ensuring it's not empty."""
    logger.info(f"Starting text extraction for video: {video_url}")
    extracted_text, error = process_video(video_url)
    if error:
        logger.error(f"Error during text extraction for {video_url}: {error}")
        return None, error
    if not extracted_text or not extracted_text.strip():
        error_msg = "No text could be extracted from the video."
        logger.warning(f"{error_msg} URL: {video_url}")
        return None, error_msg
    logger.info(f"Successfully extracted text from video: {video_url}")
    return extracted_text, None


def _save_analysis_results(
    db: Session, analysis: AnalysisResult, analysis_results: dict
):
    """Saves the analysis results to the database."""
    logger.info(f"Saving analysis results for analysis ID {analysis.id}")
    analysis.factual_report_json = json.dumps(
        {"report": analysis_results.get("report", "")}
    )
    analysis.reliability_score = analysis_results.get("overall_score", 0.0)

    # Clear existing claims to ensure idempotency
    db.query(Claim).filter(Claim.analysis_result_id == analysis.id).delete()
    db.flush()

    for claim_data in analysis_results.get("claims", []):
        claim = Claim(
            claim_text=claim_data.get("claim"),
            evidence_summary=claim_data.get("evidence_summary"),
            score=claim_data.get("score"),
            analysis_result_id=analysis.id,
        )
        db.add(claim)
    logger.info(f"Successfully saved analysis results for analysis ID {analysis.id}")


@celery_app.task(bind=True)
def analyze_video_task(self, analysis_id: int):
    """
    Celery task to analyze a video.
    Orchestrates metadata fetching, text extraction, AI analysis, and result storage.
    """
    db = SessionLocal()
    try:
        analysis = (
            db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
        )
        if not analysis:
            logger.error(f"Analysis with ID {analysis_id} not found.")
            return

        analysis.status = "processing"
        db.commit()

        if analysis.video:
            _update_video_metadata(db, analysis.video)

        # Step 1: Extract text from video
        extracted_text, error = _extract_text_from_video(analysis.video.url)
        if error:
            raise ValueError(error)

        analysis.raw_text_extracted = extracted_text
        analysis.progress = 0.5
        db.commit()

        # Step 2: Run analysis on the extracted text
        logger.info(f"Running AI analysis for analysis ID {analysis_id}")
        analysis_results = run_analysis(extracted_text)
        if not analysis_results:
            raise ValueError("AI analysis returned no results.")

        # Step 3: Save the analysis results
        _save_analysis_results(db, analysis, analysis_results)

        analysis.status = "completed"
        analysis.progress = 1.0
        db.commit()
        logger.info(f"Analysis task {analysis_id} completed successfully.")

    except Exception as e:
        logger.error(f"Task for analysis ID {analysis_id} failed: {e}", exc_info=True)
        db.rollback()
        # Fetch analysis again to update status, as session was rolled back
        analysis_to_fail = (
            db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
        )
        if analysis_to_fail:
            analysis_to_fail.status = "failed"
            analysis_to_fail.error_message = str(e)
            db.commit()
        # Update Celery task state for monitoring
        self.update_state(
            state="FAILURE", meta={"exc_type": type(e).__name__, "exc_message": str(e)}
        )
    finally:
        db.close()


if __name__ == "__main__":
    # This block allows for direct execution of the script for testing purposes.
    # It simulates the behavior of a Celery worker for a single task.
    # NOTE: This is for testing and debugging ONLY. Do not run in production.

    # --- Test Configuration ---
    # IMPORTANT: Replace with a valid video URL for testing.
    TEST_VIDEO_URL = "https://youtube.com/shorts/C2jFjr4AkKI"  # Example: Rick Astley
    # --- End Test Configuration ---

    logger.info("--- Starting Test Run ---")
    test_db = SessionLocal()

    # 1. Set up mock Celery task object
    class MockTask:
        def update_state(self, state, meta):
            logger.info(f"Mock Task State Update: {state}, Meta: {meta}")

    mock_task_instance = MockTask()

    # 2. Create temporary test data
    test_video = Video(url=TEST_VIDEO_URL)  # Assuming a user_id of 1
    test_db.add(test_video)
    test_db.commit()
    test_db.refresh(test_video)

    test_analysis = AnalysisResult(
        video_id=test_video.id, status="pending"
    )
    test_db.add(test_analysis)
    test_db.commit()
    test_db.refresh(test_analysis)

    logger.info(f"Created temporary video (ID: {test_video.id}) and analysis (ID: {test_analysis.id}) for testing.")

    try:
        # 3. Execute the task function directly
        logger.info(f"Executing 'analyze_video_task' for Analysis ID: {test_analysis.id}")
        analyze_video_task.func(mock_task_instance, test_analysis.id) # Use .func to call the original function

        # 4. Fetch and print results
        final_analysis = test_db.query(AnalysisResult).filter(AnalysisResult.id == test_analysis.id).one()
        logger.info(f"--- Test Run Finished ---")
        logger.info(f"Final Status: {final_analysis.status}")
        logger.info(f"Reliability Score: {final_analysis.reliability_score}")
        logger.info(f"Error Message: {final_analysis.error_message or 'None'}")
        logger.info(f"Extracted Text Length: {len(final_analysis.raw_text_extracted or '')}")
        logger.info(f"Report: {final_analysis.factual_report_json}")

    except Exception as e:
        logger.error(f"An error occurred during the test run: {e}", exc_info=True)

    finally:
        # 5. Clean up temporary test data
        logger.info("Cleaning up temporary test data...")
        test_db.delete(test_analysis)
        test_db.delete(test_video)
        test_db.commit()
        test_db.close()
        logger.info("Cleanup complete.")