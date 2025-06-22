
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
      <span className="text-sm text-gray-600">考え中...</span>
    </div>
  );
};

export default LoadingSpinner;
