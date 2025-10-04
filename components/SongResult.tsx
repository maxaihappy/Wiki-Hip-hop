
import React from 'react';
import type { GenerationResult } from '../types';

interface SongResultProps {
  result: GenerationResult;
}

const SongResult: React.FC<SongResultProps> = ({ result }) => {
  const { song, sources } = result;

  const handleDownload = () => {
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
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up space-y-8">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{song.title}</h2>
      </div>

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
          onClick={handleDownload}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg"
        >
          Download Lyrics
        </button>
      </div>
    </div>
  );
};

export default SongResult;
