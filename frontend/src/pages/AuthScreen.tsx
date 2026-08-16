import {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {API_URL} from '../config';

function AuthScreen() {
    const [searchParams] = useSearchParams()
    const [name, setName] = useState(searchParams.get('login') || '')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [stats, setStats] = useState({links: 0, collections: 0})
    const navigate = useNavigate()

    useEffect(() => {
        const savedName = localStorage.getItem('linkoteca_name')
        if (savedName) {
            navigate(`/${savedName}`)
        }
        document.title = 'Linkoteca';

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
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, password})
            })
            const data = await res.json()
            if (res.ok) {
                localStorage.setItem('linkoteca_token', data.token)
                localStorage.setItem('linkoteca_name', name)
                navigate(`/${name}`)
            } else {
                setError(data.detail || 'Authentication failed')
            }
        } catch {
            setError('Network error')
        }
    }

    const cleanCollectionName = (name: string) => {
        name = name.trim()
        name = name.toLowerCase()
        name = name.replace(/[^a-z0-9_-]+/g, '_')
        setName(name)
    }

    return (
        <div className="container mx-auto max-w-3xl p-4 py-10">
            <header>
                <h1 className="flex justify-center font-bold tracking-tight text-4xl text-center">
                    <a href="/">
                        <svg width="207.64" height="28.72" viewBox="0 0 207.64 28.72"
                             xmlns="http://www.w3.org/2000/svg">
                            <g id="svgGroup" strokeLinecap="round" fillRule="evenodd" fontSize="9pt" stroke="#000000"
                               strokeWidth="0.25mm" fill="#000000"
                               style={{stroke: "#000000", strokeWidth: "0.25mm", fill: "#000000"}}>
                                <path
                                    d="M 76.88 28.2 L 71.24 20 L 68.56 20 L 68.56 28.2 L 61.88 28.2 L 61.88 0 L 68.56 0 L 68.56 14.92 L 71.24 14.92 L 76.64 7.52 L 84.16 7.52 L 77.08 17.08 L 85.16 28.2 L 76.88 28.2 Z M 40.56 28.2 L 33.88 28.2 L 33.88 7.52 L 40.56 7.52 L 40.56 10.36 C 42.52 8.32 44.88 7 47.92 7 C 50.88 7 53.68 7.88 55.64 9.72 C 57.12 11.16 57.68 12.28 57.68 15.16 L 57.68 28.2 L 50.96 28.2 L 50.96 15.44 C 50.96 14.4 50.64 13.84 49.88 13.32 C 49.08 12.68 47.76 12.36 46.2 12.36 C 43.96 12.36 42.04 13.6 40.56 15.28 L 40.56 28.2 Z M 155.52 27.68 C 152.48 28.24 148.84 28.44 145.6 28.44 C 139.68 28.44 136.4 27.4 134.36 25.84 C 132.76 24.6 132.32 23.4 132.32 20.8 L 132.32 14.96 C 132.32 12.4 132.76 11.2 134.36 9.96 C 136.48 8.36 139.68 7 144.44 7 C 149.16 7 152.32 8.36 154.48 9.96 C 156.04 11.2 156.52 12.36 156.52 15 L 156.52 16.96 C 156.52 19.24 155.64 19.76 153.48 19.76 L 139.04 19.76 L 139.04 20.48 C 139.04 21.48 139.32 22.08 140.16 22.64 C 141.28 23.28 142.6 23.68 145.64 23.68 C 148.28 23.68 151.88 23.48 155.52 22.84 L 155.52 27.68 Z M 166.48 20.24 C 166.48 21.24 166.76 21.84 167.6 22.4 C 168.72 23.08 170.2 23.4 172.16 23.4 C 174.56 23.4 177.56 23.08 179.76 22.6 L 179.76 27.96 C 177.96 28.32 175.84 28.72 173.2 28.72 C 167.28 28.72 163.92 27.72 162.08 26.32 C 160.2 24.88 159.76 23.4 159.76 20.8 L 159.76 14.96 C 159.76 12.4 160.2 11.2 161.8 9.96 C 163.96 8.32 167.28 7 172.16 7 C 175.32 7 177.72 7.36 179.76 7.8 L 179.76 13.12 C 177.36 12.68 174.72 12.36 172.16 12.36 C 170.2 12.36 168.72 12.68 167.6 13.36 C 166.76 13.92 166.48 14.52 166.48 15.52 L 166.48 20.24 Z M 129.96 27.96 C 128.56 28.48 126.8 28.72 124.28 28.72 C 120.72 28.72 117.84 28.04 116.4 26.88 C 114.48 25.36 114.12 23.72 114.12 20.72 L 114.12 2.76 L 120.8 2.76 L 120.8 7.52 L 129.96 7.52 L 129.96 12.6 L 120.8 12.6 L 120.8 20.4 C 120.8 21.56 121.04 22.2 121.68 22.72 C 122.36 23.24 123.36 23.68 125.24 23.68 C 126.88 23.68 128.36 23.52 129.96 23.16 L 129.96 27.96 Z M 200.92 28.2 L 200.92 25.72 C 198.68 27.64 195.8 28.72 192.8 28.72 C 189.76 28.72 186.96 27.76 185 25.88 C 183.56 24.48 182.96 23.36 182.96 20.48 L 182.96 15.28 C 182.96 12.4 183.56 11.28 185 9.88 C 186.96 8 189.76 7 192.8 7 C 195.8 7 198.68 8.12 200.92 10.08 L 200.92 7.52 L 207.64 7.52 L 207.64 28.2 L 200.92 28.2 Z M 0 28.2 L 0 3.2 L 6.68 3.2 L 6.68 23.16 L 20.32 23.16 L 20.32 28.2 L 0 28.2 Z M 110.56 20.76 C 110.56 23.4 110.08 24.56 108.52 25.8 C 106.32 27.44 103.04 28.72 98.2 28.72 C 93.32 28.72 90 27.44 87.84 25.8 C 86.24 24.56 85.8 23.36 85.8 20.8 L 85.8 14.96 C 85.8 12.4 86.24 11.2 87.84 9.96 C 90 8.32 93.32 7 98.2 7 C 103.04 7 106.32 8.32 108.52 9.96 C 110.08 11.2 110.56 12.36 110.56 15 L 110.56 20.76 Z M 29.68 28.2 L 23 28.2 L 23 7.52 L 29.68 7.52 L 29.68 28.2 Z M 103.84 15.56 L 103.84 20.2 C 103.84 21.28 103.52 21.84 102.68 22.36 C 101.56 23.08 100.12 23.4 98.2 23.4 C 96.24 23.4 94.76 23.08 93.64 22.4 C 92.8 21.84 92.52 21.24 92.52 20.24 L 92.52 15.52 C 92.52 14.52 92.8 13.92 93.64 13.36 C 94.76 12.68 96.24 12.36 98.2 12.36 C 100.12 12.36 101.56 12.68 102.68 13.4 C 103.52 13.92 103.84 14.48 103.84 15.56 Z M 189.68 20.2 L 189.68 15.56 C 189.68 14.52 190 14 190.8 13.44 C 191.76 12.76 192.96 12.36 194.44 12.36 C 196.72 12.36 199.56 13.76 200.92 15.44 L 200.92 20.28 C 199.56 22 196.72 23.4 194.44 23.4 C 192.96 23.4 191.76 23 190.8 22.32 C 190 21.76 189.68 21.24 189.68 20.2 Z M 149.8 14.88 L 149.8 15.6 L 139.04 15.6 L 139.04 14.84 C 139.04 13.84 139.28 13.24 140.16 12.72 C 141.28 12.04 142.68 11.84 144.44 11.84 C 146.16 11.84 147.56 12.08 148.68 12.72 C 149.56 13.28 149.8 13.84 149.8 14.88 Z M 29.68 5.04 L 23 5.04 L 23 0 L 29.68 0 L 29.68 5.04 Z"
                                    vectorEffect="non-scaling-stroke"></path>
                            </g>
                        </svg>
                    </a>
                </h1>
                <p className="tracking-tighter text-center">{stats.links} links saved
                    in {stats.collections} collections</p>
                <p className="my-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
                    Never lose a great link again. Save your favorite content from any browser, on any device.
                </p>
                <div className="flex justify-center mt-4">
                    <button onClick={() => navigate('/directory')} className="cursor-pointer text-black hover:text-blue-800 font-medium">
                        Explore Public Directory →
                    </button>
                </div>
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
                                        onChange={e => cleanCollectionName(e.target.value)}
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
                                        Login
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

                    <div className="relative py-5">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <h2 className="px-2 bg-white text-lg font-medium text-gray-600">
                                Features
                            </h2>
                        </div>
                    </div>
                    <div className="mx-auto px-4 md:px-0 sm:px-6 lg:px-8">
                        <div className="flex flex-col space-y-4">
                            <div>
                                <div className="mt-5">
                                    <h3 className="text-lg leading-6 font-medium  text-gray-700">
                                        Private, Free & Open Source
                                    </h3>
                                    <p className="mt-2 text-base leading-6  text-gray-500">
                                        Your privacy comes first. No personal information is ever collected or stored.
                                        <label
                                            className="my-2 flex items-center text-sm font-medium leading-5 text-gray-700">
                                            <span>View the source on GitHub</span>
                                            <a href="https://github.com/lucarota/linkoteca" target="_blank"
                                               rel="noopener noreferrer"
                                               className="text-black-500 hover:text-blue-600 transition-colors"
                                               title="Open link">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                                     viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                                </svg>
                                            </a>
                                        </label>
                                    </p>
                                </div>
                            </div>
                            <div>
                                <div className="mt-5">
                                    <h3 className="text-lg leading-6 font-medium  text-gray-700">
                                        Organize with Tags
                                        <p></p>
                                    </h3>
                                    <p className="mt-2 text-base leading-6  text-gray-500">
                                        Archive, delete, and tag your saved links to keep your collection organized and
                                        easy to browse.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <div className="mt-5">
                                    <h3 className="text-lg leading-6 font-medium  text-gray-700">
                                        List or grid view

                                    </h3>
                                    <p className="mt-2 text-base leading-6  text-gray-500">
                                        Choose the layout that works best for you. View your saved links as a list or a
                                        grid.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <div className="mt-5">
                                    <h3 className="text-lg leading-6 font-medium  text-gray-700">
                                        Public collections
                                    </h3>
                                    <p className="mt-2 text-base leading-6  text-gray-500">
                                        Keep your saved links private by default, or share them with the world by making
                                        a collection public.
                                    </p>
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
