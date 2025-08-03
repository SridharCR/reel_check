# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates

# Download the latest installer
ADD https://astral.sh/uv/install.sh /uv-installer.sh

# Run the installer then remove it
RUN sh /uv-installer.sh && rm /uv-installer.sh

# Ensure the installed binary is on the `PATH`
ENV PATH="/root/.local/bin/:$PATH"


# Install system dependencies required for libraries like OpenCV and Tesseract
RUN apt-get update && apt-get install -y     tesseract-ocr     ffmpeg     curl     && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml uv.lock* ./

# Install dependencies using uv
RUN uv sync


# Copy the rest of the backend application code into the container at /app
COPY ./app ./app

# Add the project root to the python path
ENV PYTHONPATH=/app

# Command to run the uvicorn server
CMD uv run fastapi run app/main.py