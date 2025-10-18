import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { GroundingSource } from '../types';

interface SourceViewerProps {
  sources: GroundingSource[];
  isLoading: boolean;
  keywords: string;
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


const SourceViewer: React.FC<SourceViewerProps> = ({ sources, isLoading, keywords }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);

  const primarySource = useMemo(() => {
    if (!sources || sources.length === 0) return null;
    // The service already sorts Wikipedia to the top, so we grab that as the primary source.
    return sources.find(s => s.uri.includes('wikipedia.org')) || sources[0];
  }, [sources]);
  
  // Increment key whenever the primary source changes to ensure a clean reload.
  useEffect(() => {
    if (primarySource) {
        setIframeKey(prevKey => prevKey + 1);
    }
  }, [primarySource]);

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
  
  const embeddable = primarySource && canBeEmbedded(primarySource.uri);

  const fullscreenModal = (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50 py-8 px-20 sm:px-40 md:px-48 animate-fade-in-up">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                <h3 className="text-xl font-bold text-purple-300 truncate pr-4" title={primarySource?.title}>
                    {primarySource?.title || 'Wiki Preview'}
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
                {primarySource ? (
                    embeddable ? (
                        <iframe
                            src={primarySource.uri}
                            className="w-full h-full bg-white"
                            title={`Wiki Preview: ${primarySource.title}`}
                            sandbox="allow-scripts allow-same-origin"
                        />
                    ) : (
                        <PreviewFallback url={primarySource.uri} />
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
              {primarySource ? (
                  embeddable ? (
                      <iframe
                          key={iframeKey}
                          src={primarySource.uri}
                          className="w-full h-full bg-white"
                          title={`Wiki Preview`}
                          sandbox="allow-scripts allow-same-origin"
                      />
                  ) : (
                      <PreviewFallback url={primarySource.uri} />
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
              <ul className="space-y-3">
                {primarySource && (
                  <li key="wiki-source">
                    <a
                      href={primarySource.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      title={primarySource.title}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12.316 3.655c-1.956.368-3.32 1.444-4.576 4.148-.68 1.48-1.036 3.028-1.036 4.348s.356 2.588 1.036 4.028c1.256 2.704 2.62 3.78 4.576 4.148 2.056.388 3.8-.124 5.376-1.54 1.436-1.296 2.276-3.032 2.276-5.636 0-2.43-.84-4.148-2.276-5.556-1.576-1.416-3.32-1.928-5.376-1.928zM3 3h1.8v1.8H3V3zm0 3.6h1.8v1.8H3v-1.8zm0 3.6h1.8v1.8H3v-1.8zm0 3.6h1.8v1.8H3v-1.8zm0 3.6h1.8v1.8H3v-1.8zM19.2 3h1.8v1.8h-1.8V3zm0 3.6h1.8v1.8h-1.8v-1.8zm0 3.6h1.8v1.8h-1.8v-1.8zm0 3.6h1.8v1.8h-1.8v-1.8zm0 3.6h1.8v1.8h-1.8v-1.8z"></path></svg>
                      <span className="truncate flex-grow">Wikipedia</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </li>
                )}
                {keywords && (
                  <li key="youtube-search">
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(keywords)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      title={`Search on YouTube for "${keywords}"`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M10,15l5.19-3L10,9v6m11.56-7.83c-0.25-0.95-1.28-1.67-2.48-1.72C18.06,5.33,12,5.33,12,5.33s-6.06,0-7.08,0.15 C3.72,5.5,2.69,6.22,2.44,7.17C2.17,8.12,2.17,12,2.17,12s0,3.88,0.27,4.83c0.25,0.95,1.28,1.67,2.48,1.72C6.06,18.67,12,18.67,12,18.67 s6.06,0,7.08-0.15c1.2-0.05,2.23-0.77,2.48-1.72C21.83,15.88,21.83,12,21.83,12S21.83,8.12,21.56,7.17z"/></svg>
                      <span className="truncate flex-grow">YouTube</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </li>
                )}
              </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default SourceViewer;