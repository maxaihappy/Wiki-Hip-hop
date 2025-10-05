import React, { useState, useEffect, useMemo } from 'react';
import type { GroundingSource } from '../types';

interface SourceViewerProps {
  sources: GroundingSource[];
  isLoading: boolean;
}

const whitelistedDomains = ['wikipedia.org'];

const canBeEmbedded = (uri: string): boolean => {
  try {
    const hostname = new URL(uri).hostname.toLowerCase();
    return whitelistedDomains.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
};

const PreviewFallback: React.FC<{ url: string }> = ({ url }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4 bg-gray-900 rounded-lg border-2 border-gray-600">
    <h4 className="text-lg font-bold text-white mb-2">Unable to Preview</h4>
    <p className="mb-3 text-sm">This source doesn't support embedding.</p>
    <div className="w-full text-center truncate bg-gray-800 p-2 rounded-md my-3 text-xs text-gray-300 font-mono" title={url}>
      {url}
    </div>
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full transition-colors inline-flex items-center text-sm"
    >
      Open in New Tab
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  </div>
);


const SourceViewer: React.FC<SourceViewerProps> = ({ sources, isLoading }) => {
  const [activeSourceUri, setActiveSourceUri] = useState<string | null>(null);

  const sortedSources = useMemo(() => {
    if (!sources) return [];
    return [...sources].sort((a, b) => {
      const aCanBeEmbedded = canBeEmbedded(a.uri);
      const bCanBeEmbedded = canBeEmbedded(b.uri);
      if (aCanBeEmbedded && !bCanBeEmbedded) return -1;
      if (!aCanBeEmbedded && bCanBeEmbedded) return 1;
      return 0;
    });
  }, [sources]);

  useEffect(() => {
    if (sortedSources && sortedSources.length > 0) {
      if (!activeSourceUri || !sortedSources.some(s => s.uri === activeSourceUri)) {
        setActiveSourceUri(sortedSources[0].uri);
      }
    } else {
      setActiveSourceUri(null);
    }
  }, [sortedSources, activeSourceUri]);
  
  const renderLoadingState = () => (
     <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 h-[75vh]">
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 shadow-lg flex flex-col">
           <h3 className="text-xl font-bold text-purple-300 mb-4 flex-shrink-0">Sources</h3>
           <div className="flex items-center space-x-3 text-gray-400">
             <div className="w-4 h-4 border-2 border-dashed border-gray-500 rounded-full animate-spin"></div>
             <span>Identifying sources...</span>
           </div>
        </div>
        <div className="lg:col-span-5 bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-center text-gray-400">
           <p>Waiting for source list to populate...</p>
        </div>
      </div>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  if (!sources || sources.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 shadow-lg text-gray-400 min-h-[200px]">
        <p>No sources found for the given keywords.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 h-[75vh]">
      {/* Column 1: Source List */}
      <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 shadow-lg flex flex-col">
        <h3 className="text-xl font-bold text-purple-300 mb-4 flex-shrink-0">Sources</h3>
        <div className="overflow-y-auto pr-2">
            <ul className="space-y-2">
            {sortedSources.map((source) => (
                <li key={source.uri}>
                <button
                    onClick={() => setActiveSourceUri(source.uri)}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors text-sm ${
                    activeSourceUri === source.uri
                        ? 'bg-purple-600 text-white font-semibold shadow-md'
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                >
                    {source.title}
                </button>
                </li>
            ))}
            </ul>
        </div>
      </div>

      {/* Column 2: iFrame Preview */}
      <div className="lg:col-span-5 bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 shadow-lg flex flex-col">
        {activeSourceUri ? (
          canBeEmbedded(activeSourceUri) ? (
            <iframe
              key={activeSourceUri} // Force re-render on src change
              src={activeSourceUri}
              className="w-full h-full rounded-lg border-2 border-gray-600 bg-gray-900"
              title={`Source Preview`}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <PreviewFallback url={activeSourceUri} />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a source to preview.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceViewer;