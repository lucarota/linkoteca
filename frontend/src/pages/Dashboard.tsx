import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../config';
import DropdownMenu from '../components/DropdownMenu';

function Dashboard({ collectionName, isOwner, search, displayMode, displayImages, archived, setArchived, tagsParam, onTagClick }: any) {
  const [links, setLinks] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hoveredLink, setHoveredLink] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  const fetchLinks = useCallback(async () => {
    try {
      const token = localStorage.getItem('linkoteca_token')
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const url = new URL(`${API_URL}/links/${collectionName}`)
      if (search) url.searchParams.append('q', search)
      if (tagsParam) url.searchParams.append('tags', tagsParam)
      if (archived) url.searchParams.append('archived', 'true')
      else url.searchParams.append('archived', 'false')
      url.searchParams.append('page', page.toString())

      const res = await fetch(url.toString(), { headers })
      if (res.ok) {
        const data = await res.json()
        setLinks(data.items || [])
        setTotalPages(data.pages || 1)
        setPage(data.page || 1)
      }
    } catch {
      // ignore
    }
  }, [collectionName, search, archived, page, tagsParam])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  useEffect(() => {
    setPage(1)
  }, [search, archived, tagsParam])

  const deleteLink = async (id: number) => {
    if (!isOwner) return
    const token = localStorage.getItem('linkoteca_token')
    await fetch(`${API_URL}/link/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchLinks()
  }

  const archiveLink = async (id: number, archived_val: boolean) => {
    if (!isOwner) return
    const token = localStorage.getItem('linkoteca_token')
    await fetch(`${API_URL}/link/${id}/archive?archived=${archived_val}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchLinks()
  }

  return (
    <div className={displayMode === 'grid' ? "max-w-6xl mx-auto" : "max-w-3xl mx-auto"}>
      <div className="px-2 md:px-5">
        <div className="w-full mx-auto flex justify-between py-5">
          <div className="items-center flex flex-1">
            <a className="flex cursor-pointer" onClick={() => setArchived(!archived)}>
              <div className={`py-1 px-2 rounded flex items-center border ${archived ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'} mr-2`}>
                <div className={`cursor-pointer px-2 ${archived ? 'text-blue-600' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
            </a>
          </div>

          <div className="py-1 border border-gray-100 bg-gray-50 rounded items-center flex">
            <div className="flex items-center ">   
              <div className="px-2 flex justify-between  text-gray-700">
                <a className={`${page <= 1 ? 'disabled-link text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:text-blue-600'} relative inline-flex items-center text-xs leading-5 font-medium rounded-md px-2`} onClick={() => page > 1 && setPage(page - 1)}>Previous</a>
                <div className="flex shrink-0 px-2">
                  <p className="text-xs leading-5  text-gray-700">
                    <span className="font-medium">{page}</span>
                    /
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <a className={`${page >= totalPages ? 'disabled-link text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:text-blue-600'} relative inline-flex items-center px-2 text-xs leading-5 font-medium rounded-md`} onClick={() => page < totalPages && setPage(page + 1)}>Next</a>
              </div>
            </div>
          </div>
        </div>

        {displayMode === 'grid' ? (
          <ul className="grid grid-cols-1 gap-2 md:gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {links.map(link => (
              <li key={link.id} className={`col-span-1 border-b md:border-none flex flex-col text-center relative ${openMenuId === link.id ? 'z-50' : ''}`}>
                <div className="text-xs break-all border-gray-200 flex justify-between items-center">
                  <a href={link.url} title={link.url} target="_blank" rel="noopener noreferrer" className="py-1 truncate font-light break-all hover:text-blue-600">
                    {link.url}
                  </a>
                  <DropdownMenu link={link} isOwner={isOwner} onArchive={archiveLink} onDelete={deleteLink} isOpen={openMenuId === link.id} onToggle={(val: boolean) => setOpenMenuId(val ? link.id : null)} />
                </div>
                <div className="object-contain pt-2 overflow-x-hidden grow">
                  {displayImages && (
                    <a href={link.url} rel="noopener noreferrer" target="_blank">
                      <div className="text-left pb-2">
                        <a href={link.url} rel="noopener noreferrer" target="_blank" className="w-full break-all tracking-wide hover:text-blue-600" style={{textOverflow: 'ellipsis'}}>
                          <span>{link.title || link.url}</span>
                        </a>
                        {link.tags && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {link.tags.split(',').map((tag: string, i: number) => tag.trim() ? (
                              <span key={i} onClick={(e) => { e.preventDefault(); onTagClick(tag.trim()); }} className={`cursor-pointer px-2 py-1 rounded text-xs ${tagsParam.split(',').includes(tag.trim()) ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-200'}`}>
                                {tag.trim()}
                              </span>
                            ) : null)}
                          </div>
                        )}
                      </div>
                      {link.image ? (
                        <img src={link.image} alt="thumbnail" className="h-32 w-full object-cover rounded-sm" loading="lazy" onError={(e: any) => e.target.style.display = 'none'} />
                      ) : (
                        <div className="bg-gray-100 h-32 flex items-center justify-center text-xs text-gray-400">
                          No thumbnail
                        </div>
                      )}
                    </a>
                  )}
                  {!displayImages && (
                    <div className="text-left">
                      <a href={link.url} rel="noopener noreferrer" target="_blank" className="w-full break-all tracking-wide hover:text-blue-600" style={{textOverflow: 'ellipsis'}}>
                        <span>{link.title || link.url}</span>
                      </a>
                      {link.tags && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {link.tags.split(',').map((tag: string, i: number) => tag.trim() ? (
                            <span key={i} onClick={(e) => { e.preventDefault(); onTagClick(tag.trim()); }} className={`cursor-pointer px-2 py-1 rounded text-xs ${tagsParam.split(',').includes(tag.trim()) ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-200'}`}>
                              {tag.trim()}
                            </span>
                          ) : null)}
                        </div>
                      )}
                    </div>
                  )}
                  {link.description && (
                    <div className="text-left mt-2 text-xs text-gray-600">
                       <ReactMarkdown>{link.description}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            {links.map(link => (
              <div key={link.id} className={`py-5 border-b-2 border-gray-100 break-all relative ${hoveredLink === link.id || openMenuId === link.id ? 'z-50' : ''}`}>
                <div className="flex flex-col">
                  <div className="flex">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 truncate font-light text-xs py-2 break-all w-full text-gray-600 flex-1">
                      {link.url}
                    </a>
                    <DropdownMenu link={link} isOwner={isOwner} onArchive={archiveLink} onDelete={deleteLink} isOpen={openMenuId === link.id} onToggle={(val: boolean) => setOpenMenuId(val ? link.id : null)} />
                  </div>
                  <div className="flex justify-between items-start mt-2">
                    <div className="overflow-hidden flex-1 pr-4">
                      <a className="hover:text-blue-600 text-gray-700 font-bold block" href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.title || link.url}
                      </a>
                      {link.tags && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {link.tags.split(',').map((tag: string, i: number) => tag.trim() ? (
                            <span key={i} onClick={(e) => { e.preventDefault(); onTagClick(tag.trim()); }} className={`cursor-pointer px-2 py-1 rounded text-xs ${tagsParam.split(',').includes(tag.trim()) ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-200'}`}>
                              {tag.trim()}
                            </span>
                          ) : null)}
                        </div>
                      )}
                      {link.description && (
                        <div className="text-left mt-2 text-sm text-gray-600">
                           <ReactMarkdown>{link.description}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {displayImages && link.image && (
                      <div 
                        className="shrink-0 relative ml-4 w-32 h-32"
                        onMouseEnter={() => setHoveredLink(link.id)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <img 
                            className="w-full h-full object-contain rounded-sm" 
                            src={link.image} 
                            alt="thumbnail" 
                            loading="lazy" 
                            onError={(e: any) => e.target.style.display = 'none'} 
                          />
                        </a>
                        {hoveredLink === link.id && (
                          <div className="absolute right-full top-0 mr-4 z-9999 shadow-2xl bg-white border border-gray-200 p-2 rounded-lg pointer-events-none w-max" style={{ minWidth: '200px' }}>
                            <img 
                              src={link.image} 
                              alt="thumbnail-full" 
                              className="object-contain"
                              style={{ maxWidth: '600px', maxHeight: '600px' }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {links.length === 0 && (
          archived ? (
            <div className="py-10 text-center text-gray-500">No links archived.</div>
          ) : (
            <div className="py-10">
              <div className="max-w-3xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Get started saving links</h3>
                  <p className="mt-2 text-base text-gray-800">Use the input at the top of the page to save a link. Rich previews are created when possible (previews can be disabled from the Settings page)</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Save links quickly with our public API</h3>
                  <p className="mt-2 text-base text-gray-800">Create your own mechanism to save links using our public API (instructions available on Settings page)</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Archive, tag, and delete</h3>
                  <p className="mt-2 text-base text-gray-800">Stay focused and organized by archiving, tagging, and deleting links</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">List or grid view</h3>
                  <p className="mt-2 text-base text-gray-800">Choose between viewing saved links in a list or grid (via Settings page)</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Public collections</h3>
                  <p className="mt-2 text-base text-gray-800">Keep your saved links private (default) or share them with the world by making your collection public (via Settings page)</p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
export default Dashboard;
