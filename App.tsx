import React, { useState, useCallback } from 'react';
import KeywordInput from './components/KeywordInput';
import Loader from './components/Loader';
import SongResult from './components/SongResult';
import ChatPanel from './components/ChatPanel';
import { generateSongFromKeywords, createModificationChat } from './services/geminiService';
import { LoadingStep } from './types';
import type { GenerationResult, ChatMessage, SongData } from './types';
import type { Chat } from '@google/genai';


// A new local component to display the main content of the song.
const SongDetails: React.FC<{ result: GenerationResult, onDownload: () => void }> = ({ result, onDownload }) => {
  const { song, sources } = result;
  return (
     <div className="space-y-8 animate-fade-in-up">
      <div className="relative bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg">
         <h3 className="text-2xl font-bold text-purple-300 mb-3">The Beat</h3>
         <p className="text-gray-300 leading-relaxed">{song.beatDescription}</p>
      </div>
      
      <div className="relative bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg">
        <h3 className="text-2xl font-bold text-purple-300 mb-3">The Lyrics</h3>
        <p className="text-gray-200 leading-loose whitespace-pre-wrap font-mono">{song.lyrics}</p>
      </div>

      {sources.length > 0 && (
        <div className="relative bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg">
          <h3 className="text-xl font-bold text-purple-300 mb-3">Sources</h3>
          <ul className="list-disc list-inside space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="text-gray-400">
                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors underline">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
       <div className="text-center pt-4">
        <button
          onClick={onDownload}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg"
        >
          Download Lyrics
        </button>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(LoadingStep.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  const isLoading = loadingStep !== LoadingStep.IDLE && loadingStep !== LoadingStep.DONE;

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || isLoading) return;

    setResult(null);
    setError(null);
    setChat(null);
    setChatHistory([]);
    
    try {
      setLoadingStep(LoadingStep.SEARCHING);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingStep(LoadingStep.STORYTELLING);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingStep(LoadingStep.GENERATING);

      const generatedResult = await generateSongFromKeywords(keywords);
      
      setResult(generatedResult);
      const modificationChat = createModificationChat(generatedResult.song, keywords);
      setChat(modificationChat);
      // We don't want to show the initial context messages in the UI
      setChatHistory([]); 

      setLoadingStep(LoadingStep.DONE);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate song. ${errorMessage}`);
      setLoadingStep(LoadingStep.IDLE);
    }
  }, [keywords, isLoading]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!chat || isChatting || !message.trim()) return;

    setIsChatting(true);
    const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      const response = await chat.sendMessage({ message });
      const newSongData = JSON.parse(response.text) as SongData;

      setResult(prev => prev ? { ...prev, song: newSongData } : null);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      // For now, log error. A toast notification could be better UX.
      alert(`Failed to refine song: ${errorMessage}`);
    } finally {
      setIsChatting(false);
    }
  }, [chat, isChatting]);

  const handleDownloadLyrics = useCallback(() => {
    if (!result) return;
    const { song, sources } = result;
    const content = `Title: ${song.title}\n\nBeat Description:\n${song.beatDescription}\n\nLyrics:\n${song.lyrics}\n\n\n---Sources---\n${sources.map(s => `${s.title}: ${s.uri}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);


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
      <div className="container mx-auto max-w-7xl">
        <header className="text-center my-8 md:my-12">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2">
            Wiki Hip-hop
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            From Keywords to Killer Tracks.
          </p>
        </header>

        <main>
          {result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 mt-8">
              {/* Left Column: Beat, Lyrics, Sources */}
              <div className="md:col-span-1">
                 <SongDetails result={result} onDownload={handleDownloadLyrics} />
              </div>

              {/* Right Column: Preview and Chat */}
              <div className="md:col-span-1 flex flex-col gap-8">
                <SongResult result={result} />
                <ChatPanel history={chatHistory} isChatting={isChatting} onSendMessage={handleSendMessage} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-4xl mx-auto">
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
              </div>
            </div>
          )}
        </main>
        <footer className="text-center text-gray-600 mt-16 pb-4">
          <p>Powered by Gemini. Crafted for creators.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;