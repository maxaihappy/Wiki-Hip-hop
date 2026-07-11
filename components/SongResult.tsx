import React, { useState, useEffect, useCallback } from 'react';
import type { GenerationResult } from '../types';

interface SongResultProps {
  result: GenerationResult;
  onDownloadLyrics: () => void;
  onDownloadTrack: () => void;
  onShare: () => void;
  downloadTrackLabel: string;
}

const FeedbackSection: React.FC = () => {
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [rating, setRating] = useState<'up' | 'down' | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFeedbackSubmitted(true);
    };

    if (feedbackSubmitted) {
        return (
            <div className="text-center text-green-400 font-semibold p-4 bg-gray-700/50 rounded-lg">
                Thanks for your feedback!
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border-t border-gray-700/50">
            <div className="flex items-center justify-center gap-4">
                <p className="text-sm text-gray-400">Rate this track:</p>
                <button 
                    type="button" 
                    onClick={() => setRating('up')}
                    className={`p-2 rounded-full transition-colors ${rating === 'up' ? 'bg-green-500/50 text-green-300' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
                    aria-label="Thumbs up"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.758a1 1 0 00.97-1.22l-1.95-6.147a1 1 0 00-.97-.78h-3.51V6.5a1.5 1.5 0 00-3 0v3.833z" /></svg>
                </button>
                <button 
                    type="button" 
                    onClick={() => setRating('down')}
                    className={`p-2 rounded-full transition-colors ${rating === 'down' ? 'bg-red-500/50 text-red-300' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
                    aria-label="Thumbs down"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1h-6.758a1 1 0 00-.97 1.22l1.95 6.147a1 1 0 00.97.78h3.51v3.5a1.5 1.5 0 003 0v-3.833z" /></svg>
                </button>
            </div>
            <textarea
                placeholder="Optional: Add a comment..."
                className="w-full p-2 text-sm text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                rows={2}
            />
            <button type="submit" className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                Submit Feedback
            </button>
        </form>
    );
};

const SongResult: React.FC<SongResultProps> = ({ result, onDownloadLyrics, onDownloadTrack, onShare, downloadTrackLabel }) => {
  const { song } = result;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const synthRef = React.useRef<SpeechSynthesis | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');

  const populateVoiceList = useCallback(() => {
    const synth = synthRef.current;
    if (synth) {
      const availableVoices = synth.getVoices();
      const englishVoices = availableVoices.filter(voice => voice.lang.startsWith('en'));
      setVoices(englishVoices);
      if (!selectedVoiceURI && englishVoices.length > 0) {
        setSelectedVoiceURI(englishVoices[0].voiceURI);
      }
    }
  }, [selectedVoiceURI]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSpeechSupported(true);
      synthRef.current = window.speechSynthesis;
      synthRef.current.onvoiceschanged = populateVoiceList;
      populateVoiceList();
    }
    return () => {
      if (synthRef.current?.speaking) synthRef.current.cancel();
    };
  }, [populateVoiceList]);

  useEffect(() => {
    return () => {
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
        setIsPlaying(false);
      }
    };
  }, [song.lyrics]);

  const handlePlayPause = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) return;

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
    } else {
      if (synth.speaking) synth.cancel();
      
      const cleanedLyrics = song.lyrics.replace(/\[.*?\]/g, '\n').trim();
      if (!cleanedLyrics) return;
      
      const utterance = new SpeechSynthesisUtterance(cleanedLyrics);
      const selectedVoice = voices.find(voice => voice.voiceURI === selectedVoiceURI);
      
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.pitch = 0.8;
      utterance.rate = 1.1;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      synth.speak(utterance);
      setIsPlaying(true);
    }
  }, [isPlaying, song.lyrics, voices, selectedVoiceURI]);

  return (
    <div className="w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-6">
            <div className="text-center mb-6">
                <p className="text-sm text-purple-400 font-semibold mb-1">✨ New Track Generated! ✨</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{song.title}</h2>
            </div>
            
            <div className="bg-gray-800/70 border border-gray-700 rounded-lg p-4 max-w-sm mx-auto space-y-4">
                <div className="flex items-center space-x-4">
                <button 
                    onClick={handlePlayPause}
                    disabled={!isSpeechSupported}
                    className="text-purple-400 hover:text-purple-300 transition-colors focus:outline-none disabled:text-gray-500 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label={isPlaying ? "Pause lyric preview" : "Play lyric preview"}
                >
                    {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1H7zm5 0a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1h-1z" clipRule="evenodd" /></svg>
                    ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    )}
                </button>
                <div className="flex-grow text-left">
                    <p className="text-lg font-semibold text-gray-200">Listen to the Lyrics</p>
                    <p className="text-xs text-gray-400">
                        {isSpeechSupported ? "Using browser text-to-speech" : "Text-to-speech not supported"}
                    </p>
                </div>
                </div>

                {isSpeechSupported && voices.length > 0 && (
                    <div>
                        <label htmlFor="voice-select" className="sr-only">Choose a voice:</label>
                        <select
                            id="voice-select"
                            value={selectedVoiceURI}
                            onChange={(e) => setSelectedVoiceURI(e.target.value)}
                            className="w-full p-2 text-sm text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {voices.map((voice) => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {voice.name} ({voice.lang})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            
            <div className="text-center pt-6 flex justify-center gap-3 flex-wrap">
                <button
                    onClick={onShare}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-lg text-sm"
                >
                    Share
                </button>
                <button
                    onClick={onDownloadTrack}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg text-sm"
                >
                    {downloadTrackLabel}
                </button>
                <button
                    onClick={onDownloadLyrics}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg text-sm"
                >
                    Download Lyrics
                </button>
                 <button
                    disabled
                    className="bg-gray-600 cursor-not-allowed text-white font-bold py-2 px-6 rounded-full shadow-lg text-sm"
                    title="Audio file generation is not yet available."
                >
                    Download Audio
                </button>
            </div>
        </div>
        <FeedbackSection />
    </div>
  );
};

export default SongResult;