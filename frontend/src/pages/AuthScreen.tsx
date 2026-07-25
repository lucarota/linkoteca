import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

function AuthScreen() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ links: 0, collections: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    const savedName = localStorage.getItem('linkami_name')
    if (savedName) {
      navigate(`/${savedName}`)
    }

    fetch(`${API_URL}/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => console.error("Failed to load stats"))
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
    } catch {
      setError('Network error')
    }
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 py-10">
      <header>
        <h1 className="font-bold tracking-tight text-4xl text-center">
          <a href="/">Linkami</a>
        </h1>
        <p className="tracking-tighter text-center">{stats.links} links saved in {stats.collections} collections</p>
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
                    className="w-full appearance-none block text-gray-700 border text-lg border-gray-200 rounded p-3 py-4 leading-3 focus:outline-none"
                    placeholder="Enter collection name" 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required 
                  />
                </div>
                <div className="w-full flex flex-col justify-center items-center pt-5">
                  <input 
                    className="w-full appearance-none block text-gray-700 border text-lg border-gray-200 rounded p-3 py-4 leading-3 focus:outline-none"
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
export default AuthScreen;
