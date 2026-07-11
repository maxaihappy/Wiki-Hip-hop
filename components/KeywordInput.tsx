import React from 'react';
import type { Language } from '../types';
import { t } from '../i18n/translations';

interface KeywordInputProps {
  keywords: string;
  setKeywords: (keywords: string) => void;
  trackLength: number;
  setTrackLength: (length: number) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  cooldown: number;
}

const KeywordInput: React.FC<KeywordInputProps> = ({ keywords, setKeywords, trackLength, setTrackLength, language, setLanguage, onSubmit, isLoading, cooldown }) => {
  const minuteLabel = trackLength > 1 ? t(language, 'minutes') : t(language, 'minute');

  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-2">
          <label htmlFor="language" className="text-gray-300 font-medium text-sm">
            {t(language, 'language')}:
          </label>
          <select
            id="language"
            value={language}
            disabled={isLoading || cooldown > 0}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-gray-700 text-white text-sm font-semibold rounded-full px-3 py-1.5 border border-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:outline-none disabled:opacity-50"
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>

       <div className="space-y-3">
        <label htmlFor="track-length" className="block text-center text-gray-300 font-medium text-lg">
          {t(language, 'trackLength')}: <span className="text-purple-400 font-bold">{trackLength} {minuteLabel}</span>
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
            placeholder={t(language, 'keywordsPlaceholder')}
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
            {cooldown > 0 ? `${t(language, 'wait')} ${cooldown}s` : t(language, 'generate')}
          </button>
        </div>
        {cooldown === 0 && (
          <p className="text-center text-gray-400 mt-4 text-sm">
            {t(language, 'keywordsHint')}
          </p>
        )}
      </div>
    </form>
  );
};

export default KeywordInput;