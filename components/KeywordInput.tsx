
import React from 'react';

interface KeywordInputProps {
  keywords: string;
  setKeywords: (keywords: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const KeywordInput: React.FC<KeywordInputProps> = ({ keywords, setKeywords, onSubmit, isLoading }) => {
  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g., blockchain, existentialism, graffiti"
          disabled={isLoading}
          className="w-full px-6 py-4 text-lg text-white bg-gray-800 border-2 border-gray-700 rounded-full focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all duration-300 placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={isLoading || !keywords.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
        >
          Generate
        </button>
      </div>
       <p className="text-center text-gray-400 mt-4 text-sm">
        Enter a few keywords separated by commas to start your musical journey.
      </p>
    </form>
  );
};

export default KeywordInput;
