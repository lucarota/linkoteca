import { useState, useRef, useEffect } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export default function Pagination({ page, totalPages, setPage }: PaginationProps) {
  const [showInputFor, setShowInputFor] = useState<'left' | 'right' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInputFor && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInputFor]);

  const handleGo = () => {
    let p = parseInt(inputValue, 10);
    if (!isNaN(p) && p > 0) {
      if (p > totalPages) p = totalPages;
      setPage(p);
    }
    setShowInputFor(null);
    setInputValue('');
  };

  const pages: (number | string)[] = [];
  
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    const left = Math.max(2, page - 2);
    const right = Math.min(totalPages - 1, page + 2);
    
    if (left > 2) pages.push('left-ellipsis');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('right-ellipsis');
    
    if (totalPages > 1) pages.push(totalPages);
  }

  const renderPopup = (type: 'left' | 'right') => {
    if (showInputFor !== type) return null;
    return (
      <div 
        className="absolute z-50 bg-white border border-gray-200 rounded shadow-lg flex items-center p-1.5 gap-2 cursor-default" 
        style={{ bottom: '100%', marginBottom: '4px', left: '50%', transform: 'translateX(-50%)' }}
      >
        <input 
          ref={inputRef}
          type="number" 
          min="1" 
          max={totalPages}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGo()}
          onBlur={() => {
              setTimeout(() => { setShowInputFor(null); setInputValue(''); }, 200)
          }}
          className="w-24 text-center text-sm px-2 py-1 border border-gray-300 rounded outline-none focus:border-blue-500"
        />
        <button 
          onMouseDown={e => { e.preventDefault(); handleGo(); }} 
          className="text-sm font-medium bg-black text-white px-3 py-1 rounded hover:bg-blue-600 transition ease-in-out duration-150"
        >
          Go
        </button>
      </div>
    );
  };

  return (
    <div className="flex items-center text-xs leading-5 font-medium text-gray-700">
      <a 
        className={`${page <= 1 ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:text-blue-600'} relative inline-flex items-center rounded-md px-2 select-none`} 
        onClick={() => page > 1 && setPage(page - 1)}
      >
        Previous
      </a>
      
      <div className="flex items-center">
        {pages.map((p, _) => {
          if (p === 'left-ellipsis') {
            return (
              <div key="left-ellipsis" className="relative flex items-center justify-center">
                <span 
                  className="px-1 text-gray-500 hover:text-black cursor-pointer select-none"
                  onClick={() => { setShowInputFor('left'); setInputValue('2'); }}
                  title="Jump to page"
                >
                  ...
                </span>
                {renderPopup('left')}
              </div>
            );
          }
          if (p === 'right-ellipsis') {
            const right = Math.min(totalPages - 1, page + 2);
            return (
              <div key="right-ellipsis" className="relative flex items-center justify-center">
                <span 
                  className="px-1 text-gray-500 hover:text-black cursor-pointer select-none"
                  onClick={() => { setShowInputFor('right'); setInputValue(String(right + 1)); }}
                  title="Jump to page"
                >
                  ...
                </span>
                {renderPopup('right')}
              </div>
            );
          }
          const pageNum = p as number;
          return (
            <a
              key={pageNum}
              onClick={() => setPage(pageNum)}
              className={`px-1.5 min-w-5 text-center rounded select-none cursor-pointer ${
                page === pageNum 
                  ? 'text-black font-bold' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {pageNum}
            </a>
          );
        })}
      </div>

      <a 
        className={`${page >= totalPages ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:text-blue-600'} relative inline-flex items-center rounded-md px-2 select-none`} 
        onClick={() => page < totalPages && setPage(page + 1)}
      >
        Next
      </a>
    </div>
  );
}
