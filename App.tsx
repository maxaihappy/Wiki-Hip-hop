
import React, { useState, useCallback } from 'react';
import KeywordInput from './components/KeywordInput';
import Loader from './components/Loader';
import SongResult from './components/SongResult';
import { generateSongFromKeywords } from './services/geminiService';
import { LoadingStep } from './types';
import type { GenerationResult } from './types';

const App: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(LoadingStep.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const isLoading = loadingStep !== LoadingStep.IDLE && loadingStep !== LoadingStep.DONE;

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || isLoading) return;

    setResult(null);
    setError(null);
    
    try {
      setLoadingStep(LoadingStep.SEARCHING);
      // A small delay to make the step transition noticeable
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingStep(LoadingStep.STORYTELLING);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingStep(LoadingStep.GENERATING);

      const generatedResult = await generateSongFromKeywords(keywords);
      
      setResult(generatedResult);
      setLoadingStep(LoadingStep.DONE);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate song. ${errorMessage}`);
      setLoadingStep(LoadingStep.IDLE);
    }
  }, [keywords, isLoading]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
       <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
      <div className="container mx-auto max-w-4xl">
        <header className="text-center my-8 md:my-12">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2">
            Wiki Hip-hop
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            From Keywords to Killer Tracks.
          </p>
        </header>

        <main className="flex flex-col items-center">
          <div className="w-full">
            <KeywordInput
              keywords={keywords}
              setKeywords={setKeywords}
              onSubmit={handleGenerate}
              isLoading={isLoading}
            />
          </div>

          <div className="w-full mt-12">
            {isLoading && <Loader loadingStep={loadingStep} />}
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center animate-fade-in-up">
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
            {result && <SongResult result={result} />}
          </div>
        </main>
        <footer className="text-center text-gray-600 mt-16 pb-4">
          <p>Powered by Gemini. Crafted for creators.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
