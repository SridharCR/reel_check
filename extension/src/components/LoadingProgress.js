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
    <div className="flex items-center justify-center space-x-2 py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
      <p className={`font-medium ${colorClass}`}>{message}</p>
    </div>
  );
};

export default LoadingProgress;
