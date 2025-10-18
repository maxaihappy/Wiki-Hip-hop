import React from 'react';

interface KeywordInputProps {
  keywords: string;
  setKeywords: (keywords: string) => void;
  trackLength: number;
  setTrackLength: (length: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  cooldown: number;
}

const KeywordInput: React.FC<KeywordInputProps> = ({ keywords, setKeywords, trackLength, setTrackLength, onSubmit, isLoading, cooldown }) => {
  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto space-y-8">
       <div className="space-y-3">
        <label htmlFor="track-length" className="block text-center text-gray-300 font-medium text-lg">
          Track Length: <span className="text-purple-400 font-bold">{trackLength} minute{trackLength > 1 ? 's' : ''}</span>
        </label>
        <input
          id="track-length"
          type="range"
          min="1"
          max="5"
          step="0.5"
          value={trackLength}
          disabled={isLoading || cooldown > 0}
          onChange={(e) => setTrackLength(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      <div>
        <div className="relative">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., blockchain, existentialism, graffiti"
            disabled={isLoading || cooldown > 0}
            className="w-full px-6 py-4 text-lg text-white bg-gray-800 border-2 border-gray-700 rounded-full focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all duration-300 placeholder-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !keywords.trim()}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-white font-bold py-2.5 px-8 rounded-full transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-purple-500/50 ${
              cooldown > 0
                ? 'bg-gray-600'
                : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
            } disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100`}
          >
            {cooldown > 0 ? `Wait ${cooldown}s` : 'Generate'}
          </button>
        </div>
        {cooldown > 0 ? (
          <p className="text-center text-yellow-400 mt-4 text-sm">
            To prevent abuse, you can generate a new track in {cooldown} second{cooldown > 1 ? 's' : ''}.
          </p>
        ) : (
          <p className="text-center text-gray-400 mt-4 text-sm">
            Enter a few keywords separated by commas to start your musical journey.
          </p>
        )}
      </div>
    </form>
  );
};

export default KeywordInput;
