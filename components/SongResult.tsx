import React, { useState, useEffect, useCallback } from 'react';
import type { GenerationResult } from '../types';

interface SongResultProps {
  result: GenerationResult;
}

const SongResult: React.FC<SongResultProps> = ({ result }) => {
  const { song } = result;
  const [isPlaying, setIsPlaying] = useState(false);
  const synth = window.speechSynthesis;

  // Cleanup speech on component unmount or when the song lyrics change.
  // This ensures that if a user generates a new version while the old one is
  // playing, the old speech will stop.
  useEffect(() => {
    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, [song.lyrics, synth]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      // If currently playing, stop the speech
      synth.cancel();
      setIsPlaying(false);
    } else {
      // If not playing, start the speech
      if (synth.speaking) { // Safeguard to cancel any lingering speech
        synth.cancel();
      }
      
      // Remove section headers like [Chorus] for a smoother listening experience
      const cleanedLyrics = song.lyrics.replace(/\[.*?\]/g, '\n').trim();
      const utterance = new SpeechSynthesisUtterance(cleanedLyrics);
      
      // Adjust speech properties to make it sound more like a performance
      utterance.pitch = 0.8; // A lower pitch
      utterance.rate = 1.1;  // A slightly faster pace

      // When the speech ends, update the playing state
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      // Handle potential errors with the speech synthesis
      utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsPlaying(false);
        alert('Sorry, text-to-speech is not supported or failed on your browser.');
      }

      synth.speak(utterance);
      setIsPlaying(true);
    }
  }, [isPlaying, song.lyrics, synth]);

  return (
    <div className="w-full bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-6">{song.title}</h2>
        
        {/* Audio Player */}
        <div className="bg-gray-800/70 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handlePlayPause}
                className="text-purple-400 hover:text-purple-300 transition-colors focus:outline-none"
                aria-label={isPlaying ? "Pause lyric preview" : "Play lyric preview"}
              >
                {isPlaying ? (
                  // Pause Icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1H7zm5 0a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1h-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // Play Icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <div className="flex-grow text-left">
                 <p className="text-lg font-semibold text-gray-200">Listen to the Lyrics</p>
                 <p className="text-xs text-gray-400">Using browser text-to-speech</p>
              </div>
            </div>
             <p className="text-xs text-center text-gray-500 mt-3">Note: Audio quality and voice may vary by browser.</p>
        </div>
      </div>
      
      <div className="text-center pt-6 flex justify-center gap-4">
        <button
            disabled
            className="bg-gray-600 cursor-not-allowed text-white font-bold py-3 px-8 rounded-full shadow-lg w-full max-w-xs"
            title="Audio file generation is not yet available."
        >
            Download Audio
        </button>
      </div>
    </div>
  );
};

export default SongResult;
