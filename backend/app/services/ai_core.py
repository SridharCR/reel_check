import logging
import yt_dlp
import whisper
import cv2
import pytesseract
import os
import autogen
from autogen import AssistantAgent, UserProxyAgent
import json
from datetime import datetime
from google.genai.types import GoogleSearch
from moviepy import VideoFileClip

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# --- Configuration ---

# --- Video Processing ---
def get_video_metadata(url: str):
    """Extracts metadata from a video URL without downloading the video."""
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'extract_flat': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            upload_date_str = info.get('upload_date')
            upload_date = None
            if upload_date_str:
                try:
                    upload_date = datetime.strptime(upload_date_str, '%Y%m%d')
                except ValueError:
                    pass
            return {
                "title": info.get('title'),
                "description": info.get('description'),
                "duration": info.get('duration'),
                "thumbnail": info.get('thumbnail'),
                "uploaded_at": upload_date,
                "channel_name": info.get('channel'),
            }
        except Exception as e:
            print(f"Error extracting video metadata: {e}")
            return None


def download_video(url: str, output_path: str = "temp_videos"):
    """Downloads a video from a given URL."""
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    ydl_opts = {
        'format': 'best',
        'outtmpl': os.path.join(output_path, '%(id)s.%(ext)s'),
        'quiet': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return ydl.prepare_filename(info)


# --- Multimodal Data Extraction ---
whisper_model = whisper.load_model("base")


def extract_audio(video_path: str):
    """Extracts audio from a video file."""
    try:
        video = VideoFileClip(video_path)
        audio_path = os.path.splitext(video_path)[0] + ".mp3"
        video.audio.write_audiofile(audio_path, logger=None)
        video.close() # Explicitly close the video file
        return audio_path
    except Exception as e:
        print(f"Error extracting audio: {e}")
        return None


def transcribe_audio(audio_path: str):
    """Transcribes audio using OpenAI Whisper."""
    if not audio_path:
        return ""
    try:
        result = whisper_model.transcribe(audio_path)
        return result['text']
    except Exception as e:
        logging.exception(f"Error during transcription: {e}")
        return ""


def extract_text_from_frames(video_path: str, interval_sec: int = 5):
    """Extracts text from video frames using Tesseract OCR."""
    vidcap = None # Initialize vidcap to None
    try:
        vidcap = cv2.VideoCapture(video_path)
        extracted_text = ""
        for i in range(0, int(vidcap.get(cv2.CAP_PROP_FRAME_COUNT) / vidcap.get(cv2.CAP_PROP_FPS)), interval_sec):
            vidcap.set(cv2.CAP_PROP_POS_MSEC, i * 1000)
            success, image = vidcap.read()
            if success:
                text = pytesseract.image_to_string(image)
                if text.strip():
                    extracted_text += text.strip() + "\n"
        return extracted_text
    except Exception as e:
        logging.exception(f"Error during OCR: {e}")
        return ""
    finally:
        if vidcap: # Ensure vidcap was successfully created before releasing
            vidcap.release() # Release the video capture object



def process_video(url: str):
    """Downloads, processes, and extracts text from a video."""
    try:
        video_path = download_video(url)
        if not video_path:
            return None, "Failed to download video."
        audio_path = extract_audio(video_path)
        transcribed_text = transcribe_audio(audio_path)
        ocr_text = extract_text_from_frames(video_path)
        if os.path.exists(video_path):
            os.remove(video_path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        return transcribed_text + "\n" + ocr_text, None
    except Exception as e:
        return None, f"An error occurred: {e}"


import json
import re


# ... [keep all your existing code until the run_analysis function] ...

def run_analysis(text: str):
    """Runs the Autogen multi-agent system to analyze the text and returns clean JSON."""
    config_list = [
    {
        "model": "gemini-2.5-flash",
        "api_key": os.environ.get("GEMINI_API_KEY", "abc"),
        "api_type": "google"
    }
]
    llm_config = {"config_list": config_list, "cache_seed": 42}

    def search(query: str):
        """Performs a web search for the given query."""
        print(f"\n--- Performing web search for: '{query}' ---")
        try:
            search_results = GoogleSearch(query=query)
            if search_results:
                formatted_results = []
                for i, result in enumerate(search_results[:3]):
                    formatted_results.append(f"Result {i + 1}:")
                    formatted_results.append(f"  Title: {result.get('title', 'N/A')}")
                    formatted_results.append(f"  Link: {result.get('link', 'N/A')}")
                    formatted_results.append(f"  Snippet: {result.get('snippet', 'N/A')}")
                return "\n".join(formatted_results)
            else:
                return "No search results found."
        except Exception as e:
            return f"An error occurred during web search: {e}"

    # Create agents
    user_proxy = UserProxyAgent(
        name="Admin",
        system_message="A human admin. Interact with the team to verify the claims.",
        code_execution_config=False,
        human_input_mode="NEVER",
        llm_config=llm_config,
    )

    claim_extractor = AssistantAgent(
        name="Claim_Extractor",
        llm_config=llm_config,
        system_message="Your role is to analyze the provided text and identify all explicit factual claims. Focus on statements that can be objectively verified. Distinguish facts from opinions. Output a JSON array of strings, where each string is a claim.",
    )

    knowledge_seeker = AssistantAgent(
        name="Knowledge_Seeker",
        llm_config=llm_config,
        system_message="You are an expert researcher. Your role is to take the claims identified by the Claim_Extractor and find evidence from reliable sources using the provided search tool. For each claim, provide a summary of the evidence you find.",
        function_map={"search": search},
    )

    verdict_generator = AssistantAgent(
        name="Verdict_Generator",
        llm_config=llm_config,
        system_message=f"""Your role is to analyze the claims and the evidence provided by the Knowledge_Seeker. For each claim, determine its veracity and assign a reliability score from 0-100. Then, compile a final report. 
        Your final output must be a single JSON object conforming to the following Pydantic schema:

        class AgentClaimOutput(BaseModel):
            claim: str # The factual claim extracted.
            evidence_summary: str # A summary of the evidence found for the claim.
            score: float # A reliability score for the claim (0-100).

        class AgentReportOutput(BaseModel):
            claims: List[AgentClaimOutput] # An array of analyzed claims.
            report: str # A string summarizing the overall findings.
            overall_score: float # A single float representing the overall reliability score.

        Provide ONLY the raw JSON output without any Markdown formatting or additional text.""",
    )

    # Set up the group chat
    groupchat = autogen.GroupChat(
        agents=[user_proxy, claim_extractor, knowledge_seeker, verdict_generator],
        messages=[],
        max_round=6,
        speaker_selection_method="round_robin",
    )

    # Custom termination function
    def is_termination_msg(message: dict) -> bool:
        """Checks if the message indicates the end of the conversation."""
        content = message.get("content", "")
        if not content:
            return False

        # The conversation should terminate when the Verdict_Generator produces its final report.
        # The report is a JSON object with specific keys. We check for the presence of these keys.
        # We also need to handle cases where the JSON is embedded in a markdown block.
        
        # Extract JSON from markdown if present
        if "```json" in content:
            content_match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
            if content_match:
                content = content_match.group(1)

        try:
            data = json.loads(content)
            # Check for the structure of the final report
            if isinstance(data, dict) and all(k in data for k in ['claims', 'report', 'overall_score']):
                return True
        except (json.JSONDecodeError, TypeError):
            # Not a valid JSON or not a dictionary
            pass
            
        return False

    manager = autogen.GroupChatManager(
        groupchat=groupchat,
        llm_config=llm_config,
        is_termination_msg=is_termination_msg,
    )

    # Initiate the chat
    user_proxy.initiate_chat(
        manager,
        message=f"Please analyze the following text, verify the claims, and provide a final report in the specified JSON format:\n\n{text}"
    )

    # Extract and clean the final output
    final_message = groupchat.messages[-1]['content']

    # Remove Markdown code block markers if present
    final_message = final_message.replace('```json', '').replace('```', '').strip()

    # Remove TERMINATE if present
    final_message = final_message.replace('TERMINATE', '').strip()

    try:
        return json.loads(final_message)
    except json.JSONDecodeError as e:
        # Try to extract JSON from malformed response
        try:
            json_match = re.search(r'\{.*\}', final_message, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return {"error": "Could not extract valid JSON from response", "raw_response": final_message}
        except:
            return {"error": "Failed to parse JSON output", "details": str(e), "raw_response": final_message}

