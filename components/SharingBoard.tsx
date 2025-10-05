import React from 'react';
import type { SharedSong } from '../types';

interface SharingBoardProps {
  sharedSongs: SharedSong[];
}

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const SharingBoard: React.FC<SharingBoardProps> = ({ sharedSongs }) => {
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
              <details key={index} className="bg-gray-700/50 rounded-lg overflow-hidden transition-all duration-300">
                <summary className="p-4 cursor-pointer hover:bg-gray-700/80 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg text-white">{song.song.title}</h3>
                    <p className="text-sm text-gray-400">Keywords: {song.keywords}</p>
                    <p className="text-xs text-gray-500 mt-1">Created: {formatDate(song.createdAt)}</p>
                  </div>
                  <span className="text-purple-400 text-sm font-semibold hidden md:block">View Details</span>
                </summary>
                <div className="p-4 border-t border-gray-600 bg-gray-800 space-y-4">
                  <div>
                    <h4 className="font-bold text-purple-300 mb-2">The Beat</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{song.song.beatDescription}</p>
                  </div>
                   <div>
                    <h4 className="font-bold text-purple-300 mb-2">The Lyrics</h4>
                    <div className="text-gray-200 text-sm leading-loose font-mono whitespace-pre-wrap max-h-60 overflow-y-auto pr-2">
                      {song.song.lyrics.split(/\n\s*\n/).map((stanza, i) => (
                        <p key={i} className="mb-4">{stanza}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default SharingBoard;