import { useState, useEffect, useRef } from 'react';

function DropdownMenu({ link, isOwner, onArchive, onDelete, isOpen, onToggle }: any) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isOpen !== undefined ? isOpen : internalOpen
  const menuRef = useRef<HTMLDivElement>(null)

  const handleSetOpen = (newOpen: boolean) => {
    if (onToggle) onToggle(newOpen);
    else setInternalOpen(newOpen);
  }

  const handleSetOpenRef = useRef(handleSetOpen);
  handleSetOpenRef.current = handleSetOpen;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: any) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        handleSetOpenRef.current(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (!isOwner) return null

  return (
    <div className="ml-1 relative inline-block text-left" ref={menuRef}>
      <div>
        <button onClick={() => handleSetOpen(!open)} type="button" className="rounded flex items-center border border-gray-200 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500" aria-expanded="true" aria-haspopup="true">
          <span className="sr-only">Open options</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="origin-top-right border-gray-200 absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-50 ring-1 ring-gray-200 ring-opacity-5 focus:outline-none divide-y divide-gray-200" role="menu" aria-orientation="vertical" tabIndex={-1}>
          <div className="py-1 text-gray-700 text-sm" role="none">
            <a href={`/${link.collection_name || window.location.pathname.split('/')[1]}/${link.id}/edit`} className="cursor-pointer group flex hover:bg-gray-100 items-center px-4 py-2 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </a>
            <a onClick={(e) => { e.preventDefault(); onArchive(link.id, !link.archived); handleSetOpen(false); }} className="cursor-pointer group flex hover:bg-gray-100 items-center px-4 py-2 hover:text-gray-900">
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {link.archived ? 'Unarchive' : 'Archive'}
            </a>
            <a onClick={(e) => { e.preventDefault(); if (window.confirm("Are you sure you want to delete this link?")) { onDelete(link.id); } handleSetOpen(false); }} className="cursor-pointer hover:bg-gray-100 hover:text-red-600 group flex items-center px-4 py-2 text-sm">
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Delete
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
export default DropdownMenu;
