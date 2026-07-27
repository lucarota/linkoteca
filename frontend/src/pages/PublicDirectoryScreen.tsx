import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

function PublicDirectoryScreen() {
  const [collections, setCollections] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchDirectory = useCallback(async () => {
    setLoading(true)
    try {
      const url = new URL(`${API_URL}/directory`)
      url.searchParams.append('page', page.toString())
      if (search) url.searchParams.append('q', search)

      const res = await fetch(url.toString())
      if (res.ok) {
        const data = await res.json()
        setCollections(data.items || [])
        setTotalPages(data.pages || 1)
        setPage(data.page || 1)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchDirectory()
  }, [fetchDirectory])

  useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <div className="container mx-auto max-w-4xl p-4 py-10">
      <header>
        <h1 className="flex justify-center font-bold tracking-tight text-4xl text-center">
          <a href="/">
            <svg width="207.64" height="28.72" viewBox="0 0 207.64 28.72" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
              <g strokeLinecap="round" fillRule="evenodd" fontSize="9pt" stroke="#000000" strokeWidth="0.25mm" fill="#000000" style={{stroke: "#000000", strokeWidth: "0.25mm", fill: "#000000"}}>
                <path d="M 76.88 28.2 L 71.24 20 L 68.56 20 L 68.56 28.2 L 61.88 28.2 L 61.88 0 L 68.56 0 L 68.56 14.92 L 71.24 14.92 L 76.64 7.52 L 84.16 7.52 L 77.08 17.08 L 85.16 28.2 L 76.88 28.2 Z M 40.56 28.2 L 33.88 28.2 L 33.88 7.52 L 40.56 7.52 L 40.56 10.36 C 42.52 8.32 44.88 7 47.92 7 C 50.88 7 53.68 7.88 55.64 9.72 C 57.12 11.16 57.68 12.28 57.68 15.16 L 57.68 28.2 L 50.96 28.2 L 50.96 15.44 C 50.96 14.4 50.64 13.84 49.88 13.32 C 49.08 12.68 47.76 12.36 46.2 12.36 C 43.96 12.36 42.04 13.6 40.56 15.28 L 40.56 28.2 Z M 155.52 27.68 C 152.48 28.24 148.84 28.44 145.6 28.44 C 139.68 28.44 136.4 27.4 134.36 25.84 C 132.76 24.6 132.32 23.4 132.32 20.8 L 132.32 14.96 C 132.32 12.4 132.76 11.2 134.36 9.96 C 136.48 8.36 139.68 7 144.44 7 C 149.16 7 152.32 8.36 154.48 9.96 C 156.04 11.2 156.52 12.36 156.52 15 L 156.52 16.96 C 156.52 19.24 155.64 19.76 153.48 19.76 L 139.04 19.76 L 139.04 20.48 C 139.04 21.48 139.32 22.08 140.16 22.64 C 141.28 23.28 142.6 23.68 145.64 23.68 C 148.28 23.68 151.88 23.48 155.52 22.84 L 155.52 27.68 Z M 166.48 20.24 C 166.48 21.24 166.76 21.84 167.6 22.4 C 168.72 23.08 170.2 23.4 172.16 23.4 C 174.56 23.4 177.56 23.08 179.76 22.6 L 179.76 27.96 C 177.96 28.32 175.84 28.72 173.2 28.72 C 167.28 28.72 163.92 27.72 162.08 26.32 C 160.2 24.88 159.76 23.4 159.76 20.8 L 159.76 14.96 C 159.76 12.4 160.2 11.2 161.8 9.96 C 163.96 8.32 167.28 7 172.16 7 C 175.32 7 177.72 7.36 179.76 7.8 L 179.76 13.12 C 177.36 12.68 174.72 12.36 172.16 12.36 C 170.2 12.36 168.72 12.68 167.6 13.36 C 166.76 13.92 166.48 14.52 166.48 15.52 L 166.48 20.24 Z M 129.96 27.96 C 128.56 28.48 126.8 28.72 124.28 28.72 C 120.72 28.72 117.84 28.04 116.4 26.88 C 114.48 25.36 114.12 23.72 114.12 20.72 L 114.12 2.76 L 120.8 2.76 L 120.8 7.52 L 129.96 7.52 L 129.96 12.6 L 120.8 12.6 L 120.8 20.4 C 120.8 21.56 121.04 22.2 121.68 22.72 C 122.36 23.24 123.36 23.68 125.24 23.68 C 126.88 23.68 128.36 23.52 129.96 23.16 L 129.96 27.96 Z M 200.92 28.2 L 200.92 25.72 C 198.68 27.64 195.8 28.72 192.8 28.72 C 189.76 28.72 186.96 27.76 185 25.88 C 183.56 24.48 182.96 23.36 182.96 20.48 L 182.96 15.28 C 182.96 12.4 183.56 11.28 185 9.88 C 186.96 8 189.76 7 192.8 7 C 195.8 7 198.68 8.12 200.92 10.08 L 200.92 7.52 L 207.64 7.52 L 207.64 28.2 L 200.92 28.2 Z M 0 28.2 L 0 3.2 L 6.68 3.2 L 6.68 23.16 L 20.32 23.16 L 20.32 28.2 L 0 28.2 Z M 110.56 20.76 C 110.56 23.4 110.08 24.56 108.52 25.8 C 106.32 27.44 103.04 28.72 98.2 28.72 C 93.32 28.72 90 27.44 87.84 25.8 C 86.24 24.56 85.8 23.36 85.8 20.8 L 85.8 14.96 C 85.8 12.4 86.24 11.2 87.84 9.96 C 90 8.32 93.32 7 98.2 7 C 103.04 7 106.32 8.32 108.52 9.96 C 110.08 11.2 110.56 12.36 110.56 15 L 110.56 20.76 Z M 29.68 28.2 L 23 28.2 L 23 7.52 L 29.68 7.52 L 29.68 28.2 Z M 103.84 15.56 L 103.84 20.2 C 103.84 21.28 103.52 21.84 102.68 22.36 C 101.56 23.08 100.12 23.4 98.2 23.4 C 96.24 23.4 94.76 23.08 93.64 22.4 C 92.8 21.84 92.52 21.24 92.52 20.24 L 92.52 15.52 C 92.52 14.52 92.8 13.92 93.64 13.36 C 94.76 12.68 96.24 12.36 98.2 12.36 C 100.12 12.36 101.56 12.68 102.68 13.4 C 103.52 13.92 103.84 14.48 103.84 15.56 Z M 189.68 20.2 L 189.68 15.56 C 189.68 14.52 190 14 190.8 13.44 C 191.76 12.76 192.96 12.36 194.44 12.36 C 196.72 12.36 199.56 13.76 200.92 15.44 L 200.92 20.28 C 199.56 22 196.72 23.4 194.44 23.4 C 192.96 23.4 191.76 23 190.8 22.32 C 190 21.76 189.68 21.24 189.68 20.2 Z M 149.8 14.88 L 149.8 15.6 L 139.04 15.6 L 139.04 14.84 C 139.04 13.84 139.28 13.24 140.16 12.72 C 141.28 12.04 142.68 11.84 144.44 11.84 C 146.16 11.84 147.56 12.08 148.68 12.72 C 149.56 13.28 149.8 13.84 149.8 14.88 Z M 29.68 5.04 L 23 5.04 L 23 0 L 29.68 0 L 29.68 5.04 Z" vectorEffect="non-scaling-stroke"></path>
              </g>
            </svg>
          </a>
        </h1>
        <p className="my-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
            Public Directory
        </p>
      </header>
      
      <main>
        <div className="w-full mx-auto flex flex-col sm:flex-row justify-between py-5 gap-4 items-center">
          <div className="flex-1 self-start sm:self-center">
             <button onClick={() => navigate('/')} className="text-gray-500 hover:text-blue-600 text-sm font-medium">← Back to home</button>
          </div>
          <div className="flex-1 flex justify-center w-full">
            <input 
              type="text" 
              placeholder="Search collections..." 
              className="w-full max-w-sm shadow-inner appearance-none block text-gray-700 border text-sm border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 flex justify-end">
            <div className="py-1 border border-gray-100 bg-gray-50 rounded items-center flex">
              <div className="flex items-center ">   
              <div className="px-2 flex justify-between text-gray-700">
                <a className={`${page <= 1 ? 'disabled-link text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:text-blue-600'} relative inline-flex items-center text-xs leading-5 font-medium rounded-md px-2`} onClick={() => page > 1 && setPage(page - 1)}>Previous</a>
                <div className="flex shrink-0 px-2">
                  <p className="text-xs leading-5 text-gray-700">
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
        </div>

        {loading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : collections.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No public collections found.</div>
        ) : (
            <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg shadow-sm">
                {collections.map(c => (
                    <li key={c.name} className="cursor-pointer hover:bg-gray-50 transition duration-150 ease-in-out" onClick={() => navigate(`/${c.name}`)}>
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3 w-3/4">
                                <div className="">
                                    <h3 className="text-gray-900 text-lg font-medium truncate">{c.name}</h3>
                                    {c.description && (
                                        <p className="mt-1 text-gray-500 text-sm">{c.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-blue-600 text-sm font-medium whitespace-nowrap ml-4">
                                View collection →
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        )}
      </main>
    </div>
  )
}
export default PublicDirectoryScreen;
