import React, { useState, useEffect } from 'react';

const LoadingProgress = ({ status }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const queuedMessages = [
    "Initializing AI agents...",
    "Extracting video data...",
    "Analyzing audio tracks...",
    "Cross-referencing facts...",
    "Generating report..."
  ];

  let message = '';
  let colorClass = '';

  useEffect(() => {
    let interval;
    if (status === 'queued') {
      interval = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => {
          if (prevIndex < queuedMessages.length - 1) {
            return prevIndex + 1;
          } else {
            clearInterval(interval);
            return prevIndex;
          }
        });
      }, 7000); // Change message every 7 seconds
    } else {
      setCurrentMessageIndex(0); // Reset when status changes
    }
    return () => clearInterval(interval);
  }, [status]);

  switch (status) {
    case 'queued':
      message = queuedMessages[currentMessageIndex];
      colorClass = 'text-yellow-600';
      break;
    case 'processing':
      message = 'Processing Analysis...';
      colorClass = 'text-blue-600';
      break;
    case 'completed':
      message = 'Analysis Completed!';
      colorClass = 'text-green-600';
      break;
    default:
      message = 'Unknown Status';
      colorClass = 'text-gray-600';
  }

  return (
    <div className="flex items-center justify-center space-x-3 py-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-inner">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p className={`text-lg font-semibold ${colorClass}`}>{message}</p>
    </div>
  );
};

export default LoadingProgress;
