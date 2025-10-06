import React, { useState, useCallback, useEffect } from 'react';
import KeywordInput from './components/KeywordInput';
import SongResult from './components/SongResult';
import ChatPanel from './components/ChatPanel';
import SourceViewer from './components/SourceViewer';
import SharingBoard from './components/SharingBoard';
import AuthScreen from './components/AuthScreen';
import FlippingCounter from './components/FlippingCounter';
import { searchForSources, generateSongFromSearchResults, createModificationChat } from './services/geminiService';
import { GenerationStatus } from './types';
import type { GenerationResult, ChatMessage, SongData, GroundingSource, SharedSong } from './types';
import type { Chat } from '@google/genai';

function getFriendlyErrorMessage(error: unknown): string {
  const defaultMessage = "An unexpected hiccup occurred. Please try again. If the problem continues, try adjusting your keywords.";

  if (!(error instanceof Error)) {
    return defaultMessage;
  }

  const message = error.message.toLowerCase();

  if (message.includes("api key") || message.includes("api_key")) {
    return "There's a configuration issue with the app's connection to the creative AI. Our team is likely already addressing it, please try again later.";
  }
  
  if (message.includes("fetch") || message.includes("network")) {
    return "We're having trouble connecting to the internet to research your topic. Please check your connection and try again.";
  }
  
  if (message.includes("429") || message.includes("rate limit") || message.includes("resource exhausted")) {
    return "The studio is getting a lot of requests right now! Please wait a moment before trying again.";
  }

  if (message.includes("400") || message.includes("safety") || message.includes("blocked")) {
     return "Your request couldn't be processed, likely due to our safety filters. Please try using different, more general keywords.";
  }
  
  if (message.includes("500") || message.includes("503") || message.includes("internal server error") || message.includes("service unavailable")) {
    return "The creative AI is experiencing some technical difficulties on its end. Please try again in a little while.";
  }
  
  if (message.includes("json")) {
      return "The AI gave an unexpected response. This can happen with very creative or abstract topics. Trying a different angle with your keywords might work!";
  }

  return defaultMessage;
}

const LoadingPlaceholder: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="relative bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg h-full">
    <h3 className="text-2xl font-bold text-purple-300 mb-3">{title}</h3>
    <div className="flex items-center space-x-3 text-gray-400">
      <div className="w-4 h-4 border-2 border-dashed border-gray-500 rounded-full animate-spin"></div>
      <span>{message}</span>
    </div>
  </div>
);

const ErrorPlaceholder: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="relative bg-red-900/30 backdrop-blur-sm p-6 rounded-2xl border border-red-700/50 shadow-lg h-full text-red-200">
      <h3 className="text-xl font-bold text-red-300 mb-3">{title}</h3>
      <p className="text-sm">{message}</p>
    </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check session storage on initial load to maintain session
    return sessionStorage.getItem('wiki-hiphop-auth') === 'true';
  });
  const [keywords, setKeywords] = useState('');
  const [trackLength, setTrackLength] = useState<number>(2);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);

  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  const [songCount, setSongCount] = useState<number>(() => Number(localStorage.getItem('songCount')) || 0);
  const [sharedSongs, setSharedSongs] = useState<SharedSong[]>(() => {
    const saved = localStorage.getItem('sharedSongs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const isLoading = generationStatus === GenerationStatus.SEARCHING || generationStatus === GenerationStatus.GENERATING;

  useEffect(() => {
    localStorage.setItem('songCount', String(songCount));
  }, [songCount]);

  useEffect(() => {
    localStorage.setItem('sharedSongs', JSON.stringify(sharedSongs));
  }, [sharedSongs]);

  const handleAuthSuccess = () => {
    sessionStorage.setItem('wiki-hiphop-auth', 'true');
    setIsAuthenticated(true);
  };

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || isLoading) return;

    setResult(null);
    setSources([]);
    setError(null);
    setChat(null);
    setChatHistory([]);
    
    try {
      setGenerationStatus(GenerationStatus.SEARCHING);
      
      const handlePreviewSource = (previewSource: GroundingSource) => {
        setSources([previewSource]);
      };

      const { searchResultsText, sources: foundSources } = await searchForSources(keywords, handlePreviewSource);
      setSources(foundSources);

      setGenerationStatus(GenerationStatus.GENERATING);
      const songData = await generateSongFromSearchResults(searchResultsText, trackLength);
      
      const finalResult = { song: songData, sources: foundSources };
      setResult(finalResult);
      setSongCount(prevCount => prevCount + 1);

      const modificationChat = createModificationChat(finalResult.song, keywords);
      setChat(modificationChat);

      setGenerationStatus(GenerationStatus.DONE);
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
      setGenerationStatus(GenerationStatus.DONE);
    }
  }, [keywords, trackLength, isLoading]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!chat || isChatting || !message.trim()) return;

    setIsChatting(true);
    const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      const response = await chat.sendMessage({ message });
      const newSongData = JSON.parse(response.text) as SongData;

      setResult(prev => prev ? { ...prev, song: newSongData } : null);
      
      if (newSongData.comment) {
        const modelMessage: ChatMessage = { role: 'model', parts: [{ text: newSongData.comment }] };
        setChatHistory(prev => [...prev, modelMessage]);
      }

    } catch (err) {
      console.error(err);
      const friendlyError = getFriendlyErrorMessage(err);
      const errorResponseMessage: ChatMessage = { role: 'model', parts: [{ text: `Sorry, I hit a snag and couldn't update the track. ${friendlyError}`}]};
      setChatHistory(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsChatting(false);
    }
  }, [chat, isChatting]);

  const handleDownloadLyrics = useCallback(() => {
    if (!result || !result.song) return;
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

  const handleShareSong = useCallback(() => {
    if (!result) return;
    const newSharedSong: SharedSong = {
      ...result,
      keywords,
      createdAt: new Date().toISOString(),
    };
    setSharedSongs(prev => [newSharedSong, ...prev]);
    // Optional: scroll to sharing board
    document.getElementById('sharing-board')?.scrollIntoView({ behavior: 'smooth' });
  }, [result, keywords]);

  if (!isAuthenticated) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  const beatMessage = generationStatus === GenerationStatus.SEARCHING ? 'Waiting for sources...' : 'Creating the beat...';
  const lyricsMessage = generationStatus === GenerationStatus.SEARCHING ? 'Waiting for sources...' : 'Writing the lyrics...';

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
        @keyframes flip-down {
          from {
            transform: rotateX(90deg);
          }
          to {
            transform: rotateX(0);
          }
        }
        .animate-flip-down {
          display: inline-block;
          transform-origin: top center;
          animation: flip-down 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
      <div className="container mx-auto max-w-7xl relative">
        <header className="text-center my-8 md:my-12 relative">
          <div className="absolute top-0 right-0">
            <div className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-lg border border-gray-700 flex items-center gap-3">
              <FlippingCounter count={songCount} />
              <p className="text-gray-300 text-xs md:text-sm font-semibold pr-2 leading-tight text-center">Songs<br/>Created</p>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2">
            Wiki Hip-hop
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            From Keywords to Killer Tracks.
          </p>
        </header>

        <main>
          <div className="flex flex-col items-center max-w-4xl mx-auto">
            <KeywordInput
              keywords={keywords}
              setKeywords={setKeywords}
              trackLength={trackLength}
              setTrackLength={setTrackLength}
              onSubmit={handleGenerate}
              isLoading={isLoading}
            />
          </div>

          {generationStatus === GenerationStatus.DONE && result && (
             <div className="my-12 animate-fade-in-up max-w-2xl mx-auto">
                <SongResult result={result} onDownloadLyrics={handleDownloadLyrics} onShare={handleShareSong} />
            </div>
          )}
          
          {error && (
            <div className="w-full max-w-4xl mx-auto mt-12 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center animate-fade-in-up">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {generationStatus !== GenerationStatus.IDLE && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8 animate-fade-in-up">
                {/* Column 1: Sources and Preview */}
                <div className="lg:col-span-2">
                  <SourceViewer 
                    sources={sources}
                    isLoading={generationStatus === GenerationStatus.SEARCHING} 
                  />
                </div>

                {/* Column 2: The Beat */}
                <div className="flex flex-col lg:col-span-1">
                   { (generationStatus === GenerationStatus.SEARCHING || generationStatus === GenerationStatus.GENERATING) ? (
                      <LoadingPlaceholder title="The Beat" message={beatMessage} />
                   ) : result ? (
                       <div className="relative bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg h-full">
                          <h3 className="text-xl font-bold text-purple-300 mb-3">The Beat</h3>
                          <p className="text-gray-300 leading-relaxed text-sm">{result.song.beatDescription}</p>
                      </div>
                   ) : error ? (
                      <ErrorPlaceholder title="Generation Failed" message="Could not create the beat." />
                   ) : null}
                </div>

                 {/* Column 3: The Lyrics */}
                <div className="flex flex-col lg:col-span-2">
                   { (generationStatus === GenerationStatus.SEARCHING || generationStatus === GenerationStatus.GENERATING) ? (
                        <LoadingPlaceholder title="The Lyrics" message={lyricsMessage} />
                   ) : result ? (
                        <div className="relative bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg h-full flex flex-col">
                            <h3 className="text-xl font-bold text-purple-300 mb-3">The Lyrics</h3>
                            <div className="text-gray-200 leading-loose font-mono text-sm overflow-y-auto pr-2 flex-grow">
                            {result.song.lyrics.split(/\n\s*\n/).map((stanza, index) => (
                                <p key={index} className="mb-4 whitespace-pre-wrap">
                                {stanza}
                                </p>
                            ))}
                            </div>
                        </div>
                   ) : error ? (
                        <ErrorPlaceholder title="Generation Failed" message="Could not write the lyrics." />
                   ) : null }
                </div>
              </div>
              {result && <ChatPanel history={chatHistory} isChatting={isChatting} onSendMessage={handleSendMessage} />}
            </>
          )}

          <SharingBoard sharedSongs={sharedSongs} />
        </main>
        <footer className="text-center text-gray-600 mt-16 pb-4">
          <p>Powered by Gemini. Crafted for creators.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;