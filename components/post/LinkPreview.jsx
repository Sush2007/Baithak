import React, { useState, useEffect } from 'react';

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/link-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setPreview(data);
        }
      } catch (error) {
        console.error('Failed to load link preview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-24 bg-[#1A1B22] border border-white/5 rounded-xl animate-pulse mt-2" />
    );
  }

  if (!preview || !preview.title) {
    return null; // Return nothing if we can't fetch a valid preview
  }

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col sm:flex-row mt-3 bg-[#1A1B22] hover:bg-[#22232b] transition-colors border border-white/5 rounded-xl overflow-hidden shadow-sm group"
    >
      {preview.images && preview.images.length > 0 && (
        <div className="w-full sm:w-48 h-32 sm:h-auto shrink-0 bg-[#0C0E14] overflow-hidden relative border-b sm:border-b-0 sm:border-r border-white/5">
          <img 
            src={preview.images[0]} 
            alt={preview.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4 flex flex-col justify-center min-w-0 flex-1">
        <h4 className="text-[#E2E1EB] font-semibold text-sm line-clamp-1 mb-1">
          {preview.title}
        </h4>
        {preview.description && (
          <p className="text-[#C4C5D5]/70 text-xs line-clamp-2 mb-2">
            {preview.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-auto">
          {preview.favicons && preview.favicons.length > 0 && (
            <img 
              src={preview.favicons[0]} 
              alt="favicon" 
              className="w-3 h-3 rounded-sm"
            />
          )}
          <span className="text-white/40 text-[10px] truncate uppercase tracking-wider font-medium">
            {new URL(url).hostname.replace('www.', '')}
          </span>
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
