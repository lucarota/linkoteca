import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import Header from '../components/Header';

function SettingsScreen() {
  const { collectionName } = useParams()
  const navigate = useNavigate()
  const [settings, setSettings] = useState({ is_public: false, display_images: true, display_mode: 'list', links_per_page: 20 })
  const [tokens, setTokens] = useState<any[]>([])
  const [newToken, setNewToken] = useState('')
  const token = localStorage.getItem('linkoteca_token')

  useEffect(() => {
    if (!token || localStorage.getItem('linkoteca_name') !== collectionName) {
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
                        <input className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out" type="radio" checked={settings.display_images} onChange={() => updateSetting('display_images', true)} />
                        <label className="ml-3 block text-sm leading-5 font-medium text-gray-700">Enabled</label>
                      </div>
                      <div className="mt-4 flex items-center">
                        <input className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out" type="radio" checked={!settings.display_images} onChange={() => updateSetting('display_images', false)} />
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
                              <button onClick={createToken} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
                                {tokens.length > 0 ? 'Generate New API Token' : 'Create API Token'}
                              </button>
                            </span>
                          </div>
                        </dd>
                      </div>

                      <div className="mt-8 sm:grid sm:mt-5 sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                        <dt className="text-sm leading-5 font-bold">Retrieve link API</dt>
                        <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                          <p className="mb-2 text-gray-600">Fetches a list of links in your collection. You can optionally filter the results by providing comma-separated tags, or retrieve archived links by setting the archived parameter to true.</p>
                          <p>GET {API_URL}/links<br />GET {API_URL}/links?tags=tag1,tag2<br />GET {API_URL}/links?archived=true</p>
                          <div className="my-3">
                            <code>curl -H "Authorization: Bearer {tokens.length > 0 ? tokens[0].token : 'YOUR_TOKEN'}" "{API_URL}/links"</code>
                          </div>
                        </dd>
                      </div>

                      <div className="mt-8 sm:grid sm:mt-5 sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                        <dt className="text-sm leading-5 font-bold">Create link API</dt>
                        <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                          <p className="mb-2 text-gray-600">Creates a new link in your collection. You must provide the URL of the link in the JSON payload.</p>
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
export default SettingsScreen;
