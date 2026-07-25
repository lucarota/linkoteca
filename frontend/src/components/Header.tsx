import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

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
        <h2 className="hover:text-blue-600 py-0.5 mx-2 text-gray-600 cursor-pointer" onClick={() => navigate(`/${collectionName}`)}>
          {collectionName}
        </h2>

        <div className="flex sm:flex-row flex-col sm:py-2 md:grow-0 md:order-0">
          {isOwner && (
            <div className="flex items-center">
              <form onSubmit={handleSave} className="items-center w-full flex my-1 mx-2 md:my-0">
                <div className="flex w-full">
                  <div className="relative flex items-stretch grow focus-within:z-10">
                    <input 
                      className="shadow-inner w-full appearance-none rounded-none rounded-l-sm block text-xs text-gray-700 py-2 border border-gray-300 p-1 px-3 leading-3 focus:outline-none"
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
              <div className="relative flex items-stretch grow focus-within:z-10">
                <input 
                  className="shadow-inner w-full appearance-none rounded-none rounded-l-sm block text-xs text-gray-700 py-2 border border-gray-300 px-3 p-1 leading-3 focus:outline-none"
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
export default Header;
