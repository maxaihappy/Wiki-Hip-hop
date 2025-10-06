import React from 'react';

interface FlippingCounterProps {
  count: number;
}

const FlippingCounter: React.FC<FlippingCounterProps> = ({ count }) => {
  const formattedCount = String(count).padStart(5, '0');

  return (
    <div className="flex items-center gap-1" style={{ perspective: '1000px' }}>
      {formattedCount.split('').map((digit, index) => (
        <div key={index} className="w-6 h-10 md:w-8 md:h-12 flex items-center justify-center bg-black/20 text-purple-300 rounded-md shadow-inner">
          <span key={`${index}-${digit}`} className="text-3xl md:text-4xl font-bold font-mono animate-flip-down">
            {digit}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FlippingCounter;
