import React from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = 'blue',
  height = 'md'
}) => {
  const heightClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heightClasses[height]} overflow-hidden`}>
        <div
          className={`bg-${color}-600 ${heightClasses[height]} rounded-full transition-all duration-300 ease-out flex items-center justify-center`}
          style={{ width: `${clampedProgress}%` }}
        >
          {height !== 'sm' && showPercentage && clampedProgress > 10 && (
            <span className="text-xs font-medium text-white">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar; 