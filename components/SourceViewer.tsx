import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);

  const sortedSources = useMemo(() => {
    if (!sources) return [];
    // The sorting logic now in geminiService handles relevance, this just ensures an embeddable one is picked first if relevance is equal.
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
  
  // Increment key whenever the active source changes to ensure a clean reload in the normal view.
  useEffect(() => {
    if (activeSourceUri) {
        setIframeKey(prevKey => prevKey + 1);
    }
  }, [activeSourceUri]);

  const renderLoadingState = () => (
     <div className="flex flex-col gap-8 h-full">
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col flex-grow min-h-0">
           <h3 className="text-xl font-bold text-purple-300 mb-4 flex-shrink-0">Wiki</h3>
           <div className="flex-grow flex items-center justify-center text-gray-400">
             <div className="flex items-center space-x-3">
                <div className="w-4 h-4 border-2 border-dashed border-gray-500 rounded-full animate-spin"></div>
                <span>Loading preview...</span>
            </div>
           </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col h-48 flex-shrink-0">
           <h3 className="text-xl font-bold text-purple-300 mb-4 flex-shrink-0">All Sources</h3>
           <div className="flex items-center space-x-3 text-gray-400">
             <div className="w-4 h-4 border-2 border-dashed border-gray-500 rounded-full animate-spin"></div>
             <span>Identifying sources...</span>
           </div>
        </div>
      </div>
  );

  if (isLoading && sources.length === 0) {
    return renderLoadingState();
  }

  if (!sources || sources.length === 0) {
    return (
       <div className="relative bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg h-full">
        <h3 className="text-2xl font-bold text-purple-300 mb-3">Sources</h3>
        <div className="flex items-center justify-center h-5/6 text-gray-400">
          <p>No sources found for the given keywords.</p>
        </div>
      </div>
    );
  }
  
  const activeSource = sortedSources.find(s => s.uri === activeSourceUri);
  const embeddable = activeSource && canBeEmbedded(activeSource.uri);

  const fullscreenModal = (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50 py-8 px-20 sm:px-40 md:px-48 animate-fade-in-up">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                <h3 className="text-xl font-bold text-purple-300 truncate pr-4" title={activeSource?.title}>
                    {activeSource?.title || 'Wiki Preview'}
                </h3>
                <button
                    onClick={() => setIsFullScreen(false)}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Close fullscreen preview"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="flex-grow min-h-0">
                {activeSource ? (
                    embeddable ? (
                        <iframe
                            src={activeSource.uri}
                            className="w-full h-full bg-white"
                            title={`Wiki Preview: ${activeSource.title}`}
                            sandbox="allow-scripts allow-same-origin"
                        />
                    ) : (
                        <PreviewFallback url={activeSource.uri} />
                    )
                ) : null}
            </div>
        </div>
    </div>
  );

  return (
    <>
      {/* Fullscreen Modal - Rendered into a portal to escape stacking context issues */}
      {isFullScreen && createPortal(fullscreenModal, document.body)}

      {/* Normal View */}
      <div className="flex flex-col gap-8 h-full">
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 shadow-lg flex flex-col flex-grow min-h-0">
          <div className="flex justify-between items-center mb-4 flex-shrink-0 px-2">
              <h3 className="text-xl font-bold text-purple-300">Wiki</h3>
              <button
                onClick={() => setIsFullScreen(true)}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
                aria-label="Enlarge Wiki preview"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4-4l-5 5M4 16v4m0 0h4m-4-4l5-5m11 5v-4m0 0h-4m4 4l-5-5" />
                  </svg>
              </button>
          </div>
          <div className="flex-grow min-h-0 rounded-lg overflow-hidden">
              {activeSource ? (
                  embeddable ? (
                      <iframe
                          key={iframeKey}
                          src={activeSource.uri}
                          className="w-full h-full bg-white"
                          title={`Wiki Preview`}
                          sandbox="allow-scripts allow-same-origin"
                      />
                  ) : (
                      <PreviewFallback url={activeSource.uri} />
                  )
              ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                      <p>Select a source to preview.</p>
                  </div>
              )}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col h-48 flex-shrink-0">
          <h3 className="text-xl font-bold text-purple-300 mb-4 flex-shrink-0">All Sources</h3>
          <div className="overflow-y-auto pr-2 flex-grow">
              <ul className="space-y-2">
              {sortedSources.map((source) => (
                  <li key={source.uri} className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveSourceUri(source.uri)}
                        className={`flex-grow text-left p-2.5 rounded-lg transition-colors text-sm truncate ${
                        activeSourceUri === source.uri
                            ? 'bg-purple-600 text-white font-semibold shadow-md'
                            : 'text-gray-300 hover:bg-gray-700/50'
                        }`}
                        title={source.title}
                    >
                        {source.title}
                    </button>
                    <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors flex-shrink-0"
                        aria-label={`Open ${source.title} in a new tab`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                  </li>
              ))}
              </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default SourceViewer;