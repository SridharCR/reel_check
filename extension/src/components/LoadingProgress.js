import React from 'react';

const LoadingProgress = ({ status }) => {
  let message = '';
  let colorClass = '';

  switch (status) {
    case 'queued':
      message = 'Analysis Queued...';
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
