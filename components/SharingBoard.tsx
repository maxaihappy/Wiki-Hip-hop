import React from 'react';
import type { SharedSong } from '../types';

interface SharingBoardProps {
  sharedSongs: SharedSong[];
  onSelectSong: (song: SharedSong) => void;
}

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const SharingBoard: React.FC<SharingBoardProps> = ({ sharedSongs, onSelectSong }) => {
  return (
    <section id="sharing-board" className="my-16 animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Sharing Board
        </h2>
        <p className="text-gray-400 mt-2">A collection of tracks created and shared by the community.</p>
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 md:p-6 shadow-2xl">
        <div className="space-y-4">
          {sharedSongs.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <p>Share a track to see it here!</p>
            </div>
          ) : (
            sharedSongs.map((song, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg transition-all duration-300 hover:bg-gray-700/80">
                 <button 
                  onClick={() => onSelectSong(song)} 
                  className="w-full text-left p-4 cursor-pointer flex justify-between items-center"
                  aria-label={`Load song: ${song.song.title}`}
                 >
                    <div>
                      <h3 className="font-semibold text-lg text-white">{song.song.title}</h3>
                      <p className="text-sm text-gray-400">Keywords: {song.keywords}</p>
                      <p className="text-xs text-gray-500 mt-1">Created: {formatDate(song.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
                      <span className="hidden md:block">Load Track</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default SharingBoard;