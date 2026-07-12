import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function App() {
  return (
    <BrowserRouter>
      <style>{`
        .custom-tag-checkbox {
          appearance: none;
          background-color: #fff;
          border: 1px solid #000;
        }
        .custom-tag-checkbox:checked {
          background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
          background-color: #fff;
          border-color: #000;
        }
      `}</style>
      <Routes>
        <Route path="/" element={<AuthScreen />} />
        <Route path="/:collectionName" element={<DashboardWrapper />} />
        <Route path="/:collectionName/:linkId/edit" element={<EditScreen />} />
        <Route path="/:collectionName/settings" element={<SettingsScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

function AuthScreen() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const savedName = localStorage.getItem('linkami_name')
    if (savedName) {
      navigate(`/${savedName}`)
    }
  }, [navigate])

  const handleAction = async (e: any, action: 'login' | 'register') => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('linkami_token', data.token)
        localStorage.setItem('linkami_name', name)
        navigate(`/${name}`)
      } else {
        setError(data.detail || 'Authentication failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 py-10">
      <header>
        <h1 className="font-bold tracking-tight text-4xl text-center">
          <a href="/">Linkami</a>
        </h1>
        {/*<p className="tracking-tighter text-center">xxx links saved in yyy collections</p>*/}
        <p className="my-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
          Bookmark your favourite content from any browser on any device. Fast, private, and free.
        </p>  
      </header>

      <main>
        <div id="login-form">
          <div className="relative py-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <h2 className="px-2 bg-white text-lg font-medium text-gray-600">
                Login or create new collection
              </h2>
            </div>
          </div>
      
          <div className="w-full flex flex-col mx-auto justify-center items-center text-center">
            <div className="w-full px-2 flex flex-col justify-center items-center">
              <div className="w-full flex flex-col justify-center items-center">
                <div className="w-full flex flex-col justify-center items-center pt-5">
                  <input 
                    className="placeholder-gray-600 w-full appearance-none block text-gray-700 border text-lg border-gray-200 rounded p-3 py-4 leading-3 focus:outline-none" 
                    placeholder="Enter collection name" 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required 
                  />
                </div>
                <div className="w-full flex flex-col justify-center items-center pt-5">
                  <input 
                    className="placeholder-gray-600 w-full appearance-none block text-gray-700 border text-lg border-gray-200 rounded p-3 py-4 leading-3 focus:outline-none" 
                    placeholder="Enter password" 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required 
                  />
                </div>

                {error && <div className="text-red-500 mt-2">{error}</div>}

                <div className="w-full md:flex justify-between items-center py-7">
                  <button 
                    onClick={e => handleAction(e, 'login')}
                    className="capitalize bg-black flex-1 w-full hover:bg-blue-600 text-white font-bold py-3 px-12 border text-lg hover:border-transparent rounded">
                    login
                  </button>
                  <div className="md:flex items-center">
                    <div className="py-2 px-4">or</div>
                    <button 
                      onClick={e => handleAction(e, 'register')}
                      className="w-full border rounded text-gray-700 text-sm hover:border-transparent hover:bg-blue-600 hover:text-white py-2 px-3">
                      Create new collection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Header({ collectionName, isOwner, search, setSearch}: any) {
  const [newUrl, setNewUrl] = useState('')
  const navigate = useNavigate()

  const handleSave = async (e: any) => {
    e.preventDefault()
    if (!newUrl) return
    const token = localStorage.getItem('linkami_token')
    await fetch(`${API_URL}/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ url: newUrl })
    })
    setNewUrl('')
    window.location.reload()
  }

  const handleLogout = () => {
    localStorage.removeItem('linkami_token')
    localStorage.removeItem('linkami_name')
    navigate('/')
  }

  return (
    <header className="mx-auto text-xs rounded-t-none rounded-r-none border-b z-0">
      <div className="flex border-b bg-gray-50 border-gray-200 items-center justify-center text-gray-900">
        <h1 className="hover:text-blue-600 py-0.5 mx-2 text-gray-600 cursor-pointer" onClick={() => navigate(`/${collectionName}`)}>
          {collectionName}
        </h1>

        <div className="flex sm:flex-row flex-col sm:py-2 md:flex-grow-0 md:order-none">
          {isOwner && (
            <div className="flex items-center">
              <form onSubmit={handleSave} className="items-center w-full flex my-1 mx-2 md:my-0">
                <div className="flex w-full">
                  <div className="relative flex items-stretch flex-grow focus-within:z-10">
                    <input 
                      className="shadow-inner w-full appearance-none rounded-none rounded-l-sm block text-xs text-gray-700 placeholder-gray-600 py-2 border border-gray-300 p-1 px-3 leading-3 focus:outline-none" 
                      placeholder="Save URL" 
                      type="url" 
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      required
                    />
                  </div>
                  <button className="-ml-px relative inline-flex items-center space-x-2 px-2 border border-gray-300 text-xs font-medium rounded-r-sm text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none hover:text-blue-600" type="submit">Save</button>
                </div>
              </form>
            </div>
          )}

          <div className="flex items-center">
            <form className="items-center w-full flex my-1 mx-2 md:my-0" onSubmit={e => e.preventDefault()}>
              <div className="relative flex items-stretch flex-grow focus-within:z-10">
                <input 
                  className="shadow-inner w-full appearance-none rounded-none rounded-l-sm block text-xs text-gray-700 placeholder-gray-600 py-2 border border-gray-300 px-3 p-1 leading-3 focus:outline-none" 
                  placeholder="Search" 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>

        {isOwner && (
          <div className="cursor-pointer" onClick={() => navigate(`/${collectionName}/settings`)}>
            <div className="p-2 hover:bg-gray-100 hover:text-blue-600">
              <span className="sr-only">Settings</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        )}

        <div className="cursor-pointer" onClick={handleLogout}>
          <div className="p-2 hover:bg-gray-100 text hover:text-red-600">
            <span className="sr-only">Logout</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
}

function DropdownMenu({ link, isOwner, onArchive, onDelete }: any) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isOwner) return null

  return (
    <div className="ml-1 relative inline-block text-left" ref={menuRef}>
      <div>
        <button onClick={() => setOpen(!open)} type="button" className="rounded flex items-center border border-gray-200 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500" aria-expanded="true" aria-haspopup="true">
          <span className="sr-only">Open options</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="origin-top-right border absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-50 ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-200" role="menu" aria-orientation="vertical" tabIndex={-1}>
          <div className="py-1 text-gray-700 text-sm" role="none">
            <a href={`/${link.collection_name || window.location.pathname.split('/')[1]}/${link.id}/edit`} className="cursor-pointer group flex hover:bg-gray-100 items-center px-4 py-2 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </a>
            <a onClick={(e) => { e.preventDefault(); onArchive(link.id, !link.archived); setOpen(false); }} className="cursor-pointer group flex hover:bg-gray-100 items-center px-4 py-2 hover:text-gray-900">
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {link.archived ? 'Unarchive' : 'Archive'}
            </a>
            <a onClick={(e) => { e.preventDefault(); if (window.confirm("Are you sure you want to delete this link?")) { onDelete(link.id); } setOpen(false); }} className="cursor-pointer hover:bg-gray-100 hover:text-red-600 group flex items-center px-4 py-2 text-sm">
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

function DashboardWrapper() {
  const { collectionName } = useParams()
  const [colInfo, setColInfo] = useState<any>(null)
  const [error] = useState('')
  const [search, setSearch] = useState('')
  const [archived, setArchived] = useState(false)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tagsParam = searchParams.get('tags') || ''

  useEffect(() => {
    const fetchInfo = async () => {
      const token = localStorage.getItem('linkami_token')
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const res = await fetch(`${API_URL}/collection/${collectionName}`, { headers })
      if (res.ok) {
        setColInfo(await res.json())
      } else {
        if (res.status === 403 || res.status === 404) {
          navigate('/')
        } else {
          navigate('/')
        }
      }
    }
    fetchInfo()
  }, [collectionName, navigate])

  if (error) return <div className="p-10 text-center">{error}</div>
  if (!colInfo) return <div className="p-10 text-center">Loading...</div>

  return (
    <>
      <Header collectionName={collectionName} isOwner={colInfo.is_owner} search={search} setSearch={setSearch} archived={archived} setArchived={setArchived} />
      <Dashboard 
        collectionName={collectionName!} 
        isOwner={colInfo.is_owner} 
        search={search} 
        displayMode={colInfo.display_mode} 
        displayImages={colInfo.display_images} 
        archived={archived} 
        setArchived={setArchived} 
        tagsParam={tagsParam}
        onTagClick={(tag: string) => {
          const currentTags = tagsParam ? tagsParam.split(',') : []
          if (!currentTags.includes(tag)) {
            searchParams.set('tags', [...currentTags, tag].join(','))
            setSearchParams(searchParams)
          } else {
            const newTags = currentTags.filter(t => t !== tag)
            if (newTags.length > 0) {
              searchParams.set('tags', newTags.join(','))
              setSearchParams(searchParams)
            } else {
              searchParams.delete('tags')
              setSearchParams(searchParams)
            }
          }
        }}
      />
    </>
  )
}

function Dashboard({ collectionName, isOwner, search, displayMode, displayImages, archived, setArchived, tagsParam, onTagClick }: any) {
  const [links, setLinks] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hoveredLink, setHoveredLink] = useState<number | null>(null)

  const fetchLinks = async () => {
    try {
      const token = localStorage.getItem('linkami_token')
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
    } catch (err) {}
  }

  useEffect(() => {
    fetchLinks()
  }, [collectionName, search, archived, page, tagsParam])

  useEffect(() => {
    setPage(1)
  }, [search, archived, tagsParam])

  const deleteLink = async (id: number) => {
    if (!isOwner) return
    const token = localStorage.getItem('linkami_token')
    await fetch(`${API_URL}/link/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchLinks()
  }

  const archiveLink = async (id: number, archived_val: boolean) => {
    if (!isOwner) return
    const token = localStorage.getItem('linkami_token')
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
                <div className="flex flex-shrink-0 px-2">
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
              <li key={link.id} className="col-span-1 border-b md:border-none flex flex-col text-center">
                <div className="text-xs break-all border-gray-200 flex justify-between items-center">
                  <a href={link.url} title={link.url} target="_blank" rel="noopener noreferrer" className="py-1 truncate font-light break-all hover:text-blue-600">
                    {link.url}
                  </a>
                  <DropdownMenu link={link} isOwner={isOwner} onArchive={archiveLink} onDelete={deleteLink} />
                </div>
                <div className="object-contain pt-2 overflow-x-hidden flex-grow">
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
              <div key={link.id} className={`py-5 border-b-2 border-gray-100 break-all relative ${hoveredLink === link.id ? 'z-50' : 'z-0'}`}>
                <div className="flex flex-col">
                  <div className="flex">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 truncate font-light text-xs py-2 break-all w-full text-gray-600 flex-1">
                      {link.url}
                    </a>
                    <DropdownMenu link={link} isOwner={isOwner} onArchive={archiveLink} onDelete={deleteLink} />
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
                        className="flex-shrink-0 relative ml-4 w-32 h-32"
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
                          <div className="absolute right-full top-0 mr-4 z-[9999] shadow-2xl bg-white border border-gray-200 p-2 rounded-lg pointer-events-none w-max" style={{ minWidth: '200px' }}>
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
        {links.length === 0 && <div className="py-10 text-center text-gray-500">No links found.</div>}
      </div>
    </div>
  )
}

function SettingsScreen() {
  const { collectionName } = useParams()
  const navigate = useNavigate()
  const [settings, setSettings] = useState({ is_public: false, display_images: true, display_mode: 'list', links_per_page: 20 })
  const [tokens, setTokens] = useState<any[]>([])
  const [newToken, setNewToken] = useState('')
  const token = localStorage.getItem('linkami_token')

  useEffect(() => {
    if (!token || localStorage.getItem('linkami_name') !== collectionName) {
      navigate('/')
      return
    }

    const fetchSettings = async () => {
      const [setRes, tokRes] = await Promise.all([
        fetch(`${API_URL}/settings`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/settings/access_tokens`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (setRes.ok) setSettings(await setRes.json())
      if (tokRes.ok) setTokens(await tokRes.json())
    }
    fetchSettings()
  }, [collectionName, token, navigate])

  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newSettings)
    })
  }

  const createToken = async () => {
    // Delete old tokens to match original "Reset" behavior of exactly one token
    for (let t of tokens) {
      await fetch(`${API_URL}/settings/access_token/${t.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }
    
    const res = await fetch(`${API_URL}/settings/access_token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (res.ok) {
      const data = await res.json()
      setNewToken(data.token)
    }
    
    const tokRes = await fetch(`${API_URL}/settings/access_tokens`, { headers: { 'Authorization': `Bearer ${token}` } })
    if (tokRes.ok) setTokens(await tokRes.json())
  }

  return (
    <>
      <Header collectionName={collectionName} isOwner={true} search="" setSearch={() => {}} />
      <div className="max-w-2xl mx-auto px-2 md:px-0">
        <div>
          <form onSubmit={e => e.preventDefault()}>
            <div>
              <div className="">
                <div className="mt-6">
                  <fieldset className="mt-6">
                    <legend className="text-base font-medium text-gray-900">Collection visibility</legend>
                    <div className="mt-4">
                      <div className="flex items-center">
                        <input className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out" type="radio" checked={!settings.is_public} onChange={() => updateSetting('is_public', false)} />
                        <label className="ml-3 block text-sm leading-5 font-medium text-gray-700">Private</label>
                      </div>
                      <div className="mt-4 flex items-center">
                        <input className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out" type="radio" checked={settings.is_public} onChange={() => updateSetting('is_public', true)} />
                        <label className="ml-3 block text-sm leading-5 font-medium text-gray-700">Public</label>
                      </div>
                    </div>
                  </fieldset>
                </div>

                <div className="mt-8">
                  <fieldset className="mt-6">
                    <legend className="text-base font-medium text-gray-900">Rich previews</legend>
                    <div className="mt-4">
                      <div className="flex items-center">
                        <input className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out" type="radio" checked={settings.display_images === true} onChange={() => updateSetting('display_images', true)} />
                        <label className="ml-3 block text-sm leading-5 font-medium text-gray-700">Enabled</label>
                      </div>
                      <div className="mt-4 flex items-center">
                        <input className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out" type="radio" checked={settings.display_images === false} onChange={() => updateSetting('display_images', false)} />
                        <label className="ml-3 block text-sm leading-5 font-medium text-gray-700">Disabled</label>
                      </div>
                    </div>
                  </fieldset>
                </div>

                <div className="mt-8">
                  <fieldset className="mt-6">
                    <legend className="text-base font-medium text-gray-900">Display mode</legend>
                    <div className="mt-4">
                      <div className="flex items-center">
                        <input className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out" type="radio" checked={settings.display_mode === 'list'} onChange={() => updateSetting('display_mode', 'list')} />
                        <label className="ml-3 block text-sm leading-5 font-medium text-gray-700">List</label>
                      </div>
                      <div className="mt-4 flex items-center">
                        <input className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out" type="radio" checked={settings.display_mode === 'grid'} onChange={() => updateSetting('display_mode', 'grid')} />
                        <label className="ml-3 block text-sm leading-5 font-medium text-gray-700">Grid</label>
                      </div>
                    </div>
                  </fieldset>
                </div>

                <div className="mt-8">
                  <fieldset className="mt-6">
                    <legend className="text-base font-medium text-gray-900">Links per page</legend>
                    <div className="mt-4">
                      <input 
                        type="number" 
                        min="1" 
                        max="200" 
                        className="shadow-inner appearance-none block text-gray-700 border text-sm border-gray-300 rounded p-2 focus:outline-none" 
                        value={settings.links_per_page || 20} 
                        onChange={e => updateSetting('links_per_page', parseInt(e.target.value) || 20)}
                      />
                    </div>
                  </fieldset>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-8">              </div>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-10">
          <div className="rounded-md bg-gray-50 px-2 py-5 flex items-start justify-between">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 sm:mt-0">
                <div className="leading-5 font-bold text-gray-900">API</div>
                <div className="mt-1 leading-5 text-gray-700">
                  <div className="mt-5 border-t border-gray-200 pt-5">
                    <dl>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm leading-5 font-bold">Access token</dt>
                        <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="mt-4 sm:mt-0">
                            {newToken ? (
                              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-yellow-800 text-sm font-bold mb-2">Save this token now. You will not be able to see it again!</p>
                                <p className="cursor-pointer select-all text-yellow-900 font-mono break-all">{newToken}</p>
                              </div>
                            ) : tokens.length > 0 ? (
                              <p className="pb-5 cursor-pointer select-all text-red-500 font-bold pr-4 break-all">
                                {tokens[0].token}
                              </p>
                            ) : (
                              <p className="pb-5 cursor-pointer select-all text-gray-500 font-bold pr-4 break-all">
                                No token generated.
                              </p>
                            )}
                            <span className="inline-flex rounded-md shadow-sm">
                              <button onClick={createToken} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
                                {tokens.length > 0 ? 'Generate New API Token' : 'Create API Token'}
                              </button>
                            </span>
                          </div>
                        </dd>
                      </div>

                      <div className="mt-8 sm:grid sm:mt-5 sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                        <dt className="text-sm leading-5 font-bold">Retrieve link API</dt>
                        <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                          <p>GET {API_URL}/link<br />GET {API_URL}/link?tags=tag1,tag2</p>
                          <div className="my-3">
                            <code>curl -H "Authorization: Bearer {tokens.length > 0 ? tokens[0].token : 'YOUR_TOKEN'}" {API_URL}/link</code>
                          </div>
                        </dd>
                      </div>

                      <div className="mt-8 sm:grid sm:mt-5 sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                        <dt className="text-sm leading-5 font-bold">Create link API</dt>
                        <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                          <p>POST {API_URL}/link</p>
                          <div className="my-3">
                            <code>curl -d '&#123;"url": "https://my-new-url.com"&#125;' -H "Content-Type: application/json" -H "Authorization: Bearer {tokens.length > 0 ? tokens[0].token : 'YOUR_TOKEN'}" -X POST {API_URL}/link</code>
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

function EditScreen() {
  const { collectionName, linkId } = useParams()
  const navigate = useNavigate()
  const [link, setLink] = useState<any>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [newTagsString, setNewTagsString] = useState<string>('')
  
  useEffect(() => {
    const fetchLinkAndTags = async () => {
      const token = localStorage.getItem('linkami_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      
      const [linkRes, tagsRes] = await Promise.all([
        fetch(`${API_URL}/link/${linkId}`, { headers }),
        fetch(`${API_URL}/collection/${collectionName}/tags`, { headers })
      ])
      
      if (linkRes.ok) {
        const linkData = await linkRes.json()
        setLink(linkData)
        if (linkData.tags) {
           setSelectedTags(new Set(linkData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)))
        }
      } else {
        navigate(`/${collectionName}`)
      }
      
      if (tagsRes.ok) {
        setAllTags(await tagsRes.json())
      }
    }
    fetchLinkAndTags()
  }, [linkId, collectionName, navigate])

  const handleTagToggle = (tag: string) => {
    const newSelected = new Set(selectedTags)
    if (newSelected.has(tag)) {
      newSelected.delete(tag)
    } else {
      newSelected.add(tag)
    }
    setSelectedTags(newSelected)
  }

  const handleSave = async (e: any) => {
    e.preventDefault()
    const token = localStorage.getItem('linkami_token')
    await fetch(`${API_URL}/link/${linkId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        url: link.url,
        title: link.title,
        description: link.description,
        image: link.image,
        tags: Array.from(selectedTags).join(',') + (newTagsString ? ',' + newTagsString : '')
      })
    })
    navigate(`/${collectionName}`)
  }

  if (!link) return <div className="p-10 text-center">Loading...</div>

  return (
    <>
      <Header collectionName={collectionName} isOwner={true} search="" setSearch={() => {}} />
      <div className="max-w-2xl mx-auto my-10 px-2">
        <form onSubmit={handleSave}>
          <div>
            <div className="mt-8">
              <div className="mt-6">
                <fieldset className="mt-6">
                  <legend className="text-base break-all font-medium text-gray-900">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                  </legend>
                  <div className="my-4">
                    <label className="my-2 block text-sm font-medium leading-5 text-gray-700">Title</label>
                    <textarea 
                      className="w-full p-3 appearance-none block my-2 text-gray-700 border text-md border-gray-200 rounded px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" 
                      rows={2}
                      value={link.title || ''}
                      onChange={e => setLink({...link, title: e.target.value})}
                      placeholder="Enter text"
                    ></textarea>
                  </div>
                  <div className="my-4">
                    <label className="my-2 block text-sm font-medium leading-5 text-gray-700">Description</label>
                    <textarea 
                      className="w-full p-3 appearance-none block my-2 text-gray-700 border text-md border-gray-200 rounded px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" 
                      rows={5}
                      value={link.description || ''}
                      onChange={e => setLink({...link, description: e.target.value})}
                      placeholder="Enter text (markdown supported)"
                    ></textarea>
                  </div>
                  <div className="my-4">
                    <label className="my-2 block text-sm font-medium leading-5 text-gray-700">Preview image URL</label>
                    <input 
                      type="url"
                      className="w-full p-3 appearance-none block text-gray-700 border text-md border-gray-200 rounded px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" 
                      value={link.image || ''}
                      onChange={e => setLink({...link, image: e.target.value})}
                      placeholder="Enter URL"
                    />
                  </div>
                  <div className="my-4">
                    <label className="my-2 block text-sm font-medium leading-5 text-gray-700">Create new tags</label>
                    <input 
                      type="text"
                      className="w-full p-3 appearance-none block text-gray-700 border text-md border-gray-200 rounded px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" 
                      value={newTagsString}
                      onChange={e => setNewTagsString(e.target.value)}
                      placeholder="comma separate tags to assign multiple at once"
                    />
                  </div>
                  
                  {allTags.length > 0 && (
                    <div className="my-4">
                      <label className="my-2 block text-sm font-medium leading-5 text-gray-700">Use existing tags</label>
                      <div className="flex flex-col gap-3 mt-2">
                        {allTags.map(tag => (
                          <label key={tag} className="flex items-center space-x-2">
                            <input 
                              type="checkbox"
                              checked={selectedTags.has(tag)}
                              onChange={() => handleTagToggle(tag)}
                              className="custom-tag-checkbox h-4 w-4 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">{tag}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </fieldset>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-5">
            <div className="flex justify-end">
              <button type="submit" className="capitalize bg-black hover:bg-blue-600 text-white font-medium py-2 px-5 border text-sm border-transparent hover:border-transparent rounded">
                save
              </button>
            </div>
          </div>
        </form>

        <div className="mt-10">
          <div className="bg-gray-50 sm:rounded-lg">
            <div className="px-4 py-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Preview</h3>
              <div className="mt-5">
                <div className="flex-col">
                  <div className="text-xs overflow-hidden break-all border-gray-200 flex justify-between items-center">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="py-1 font-light break-all">{link.url}</a>
                  </div>
                  <div className="flex flex-row py-1">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="max-h-48 w-full break-all font-bold text-xl tracking-tight" style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {link.title || link.url}
                    </a>
                  </div>
                  {link.image && (
                    <div className="flex py-1">
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <img className="max-h-80" src={link.image} alt={link.title || "Preview"} loading="lazy" onError={(e: any) => e.target.style.display = 'none'} />
                      </a>
                    </div>
                  )}
                  {link.description && (
                    <div className="flex-col markdown leading-relaxed">
                      <ReactMarkdown>{link.description}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
