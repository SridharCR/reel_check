# ReelCheck Chrome Extension

This is a Chrome extension for the ReelCheck fact-checking tool, built with React and Tailwind CSS.

## Features

- User Authentication (Signup, Login, JWT handling)
- Reel/Short URL analysis
- Real-time task progress tracking
- View past analyses
- Dark/Light mode toggle
- Responsive and performance-optimized UI

## Setup and Installation

1.  **Clone the repository (if applicable):**

    ```bash
    git clone <repository_url>
    cd reelcheck-extension
    ```

2.  **Install Dependencies:**

    Navigate to the `extension` directory and install the required Node.js packages:

    ```bash
    npm install
    ```

3.  **Build the Extension:**

    ```bash
    npm run build
    ```

    This will create a `build` folder containing the production-ready extension files.

4.  **Load into Chrome:**

    a.  Open Chrome and go to `chrome://extensions`.
    b.  Enable "Developer mode" using the toggle switch in the top right corner.
    c.  Click on "Load unpacked" and select the `build` folder created in the previous step.

    The ReelCheck extension should now appear in your Chrome extensions list and its icon will be visible in your browser toolbar.

## Running in Development Mode

To run the extension in development mode with hot-reloading:

1.  **Start the development server:**

    ```bash
    npm start
    ```

2.  **Load into Chrome (Development):**

    Similar to step 4 above, but instead of selecting the `build` folder, select the `extension` directory itself (the one containing `package.json`). This will allow Chrome to load the extension directly from your development server.

## Project Structure

```
reelcheck-extension/
├── public/
│   ├── index.html
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── src/
│   ├── components/ (Will contain React components)
│   ├── hooks/ (Will contain custom React hooks)
│   ├── services/ (Will contain API service calls)
│   ├── context/ (Will contain React Context API setup)
│   ├── utils/ (Will contain utility functions)
│   ├── index.js (Main entry point for React app)
│   └── index.css (Tailwind CSS imports)
├── .gitignore
├── manifest.json
├── package.json
├── README.md
└── tailwind.config.js
```

## Backend Information

This extension is designed to work with a FastAPI backend that provides the following endpoints:

-   `POST /analyze`: Trigger new analysis
-   `GET /status/{task_id}`: Check current progress
-   `GET /history`: List of past analyses
-   `GET /analysis/{analysis_id}`: Full analysis details

CORS is allowed for `http://localhost:3000`.
