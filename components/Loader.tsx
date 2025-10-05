import React from 'react';
import { LoadingStep, GroundingSource } from '../types';

interface LoaderProps {
  loadingStep: LoadingStep;
  sources?: GroundingSource[] | null;
}

const Loader: React.FC<LoaderProps> = ({ loadingStep, sources }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center text-white py-12">
      <div className="flex items-center space-x-4">
        <svg className="animate-spin h-10 w-10 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-semibold tracking-wider">{loadingStep}</p>
      </div>

      {sources && sources.length > 0 && (
        <div className="w-full max-w-4xl mt-8 space-y-6 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-purple-300">Here's what we're vibing on...</h3>
          <p className="text-gray-400">While the beat drops, check out the sources that inspired your track. Note: Some sites may not load in the preview below.</p>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 shadow-lg">
            <iframe
              src={sources[0].uri}
              className="w-full h-96 rounded-lg border-2 border-gray-600"
              title={`Source Preview: ${sources[0].title}`}
              sandbox="allow-scripts allow-same-origin"
            ></iframe>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 shadow-lg">
            <h4 className="text-xl font-bold text-purple-300 mb-3">All Sources</h4>
            <ul className="list-disc list-inside space-y-2 text-left">
              {sources.map((source, index) => (
                <li key={index} className="text-gray-400">
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors underline">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loader;