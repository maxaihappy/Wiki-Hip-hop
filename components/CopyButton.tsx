import React, { useState, useCallback } from 'react';

interface CopyButtonProps {
  text: string;
  label: string;
  copiedLabel: string;
  failedLabel: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, label, copiedLabel, failedLabel }) => {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('failed');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, [text]);

  const displayLabel = status === 'copied' ? copiedLabel : status === 'failed' ? failedLabel : label;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-purple-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-md px-2 py-1"
      aria-label={label}
      title={displayLabel}
    >
      {status === 'copied' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5a1.5 1.5 0 00-1.5-1.5h-1v-3.379a3 3 0 00-.879-2.121L7.38 4.5H4.5z" />
        </svg>
      )}
      <span className={status === 'copied' ? 'text-green-400' : status === 'failed' ? 'text-red-400' : ''}>
        {displayLabel}
      </span>
    </button>
  );
};

export default CopyButton;
