import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {API_URL} from '../config';
import Header from '../components/Header';

function EditScreen() {
    const {collectionName, linkId} = useParams()
    const navigate = useNavigate()
    const [link, setLink] = useState<any>(null)
    const [allTags, setAllTags] = useState<string[]>([])
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
    const [newTagsString, setNewTagsString] = useState<string>('')

    useEffect(() => {
        const fetchLinkAndTags = async () => {
            const token = localStorage.getItem('linkoteca_token')
            const headers = {'Authorization': `Bearer ${token}`}

            const [linkRes, tagsRes] = await Promise.all([
                fetch(`${API_URL}/link/${linkId}`, {headers}),
                fetch(`${API_URL}/collection/${collectionName}/tags`, {headers})
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
        const token = localStorage.getItem('linkoteca_token')
        await fetch(`${API_URL}/link/${linkId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
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
            <Header collectionName={collectionName} isOwner={true} search="" setSearch={() => {
            }}/>
            <div className="max-w-2xl mx-auto my-10 px-2">
                <form onSubmit={handleSave}>
                    <div>
                        <div className="mt-8">
                            <div className="mt-6">
                                <fieldset className="mt-6">
                                    <div className="my-4">
                                        <label className="my-2 flex justify-between items-center text-sm font-medium leading-5 text-gray-700">
                                            <span>URL</span>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-black-500 hover:text-blue-600 transition-colors" title="Open link">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </label>
                                        <input
                                            type="url"
                                            className="w-full p-3 appearance-none block text-gray-700 border text-md border-gray-200 rounded px-4 leading-tight focus:outline-none focus:bg-white"
                                            value={link.url || ''}
                                            onChange={e => setLink({...link, url: e.target.value})}
                                            placeholder="Enter URL"
                                            required
                                        />
                                    </div>
                                    <div className="my-4">
                                        <label
                                            className="my-2 block text-sm font-medium leading-5 text-gray-700">Title</label>
                                        <textarea
                                            className="w-full p-3 appearance-none block my-2 text-gray-700 border text-md border-gray-200 rounded px-4 leading-tight focus:outline-none focus:bg-white"
                                            rows={2}
                                            value={link.title || ''}
                                            onChange={e => setLink({...link, title: e.target.value})}
                                            placeholder="Enter text"
                                        ></textarea>
                                    </div>
                                    <div className="my-4">
                                        <label
                                            className="my-2 block text-sm font-medium leading-5 text-gray-700">Description</label>
                                        <textarea
                                            className="w-full p-3 appearance-none block my-2 text-gray-700 border text-md border-gray-200 rounded px-4 leading-tight focus:outline-none focus:bg-white"
                                            rows={5}
                                            value={link.description || ''}
                                            onChange={e => setLink({...link, description: e.target.value})}
                                            placeholder="Enter text (markdown supported)"
                                        ></textarea>
                                    </div>
                                    <div className="my-4">
                                        <label className="my-2 block text-sm font-medium leading-5 text-gray-700">Preview
                                            image URL</label>
                                        <input
                                            type="url"
                                            className="w-full p-3 appearance-none block text-gray-700 border text-md border-gray-200 rounded px-4 leading-tight focus:outline-none focus:bg-white"
                                            value={link.image || ''}
                                            onChange={e => setLink({...link, image: e.target.value})}
                                            placeholder="Enter URL"
                                        />
                                    </div>
                                    <div className="my-4">
                                        <label className="my-2 block text-sm font-medium leading-5 text-gray-700">Create
                                            new tags</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 appearance-none block text-gray-700 border text-md border-gray-200 rounded px-4 leading-tight focus:outline-none focus:bg-white"
                                            value={newTagsString}
                                            onChange={e => setNewTagsString(e.target.value)}
                                            placeholder="comma separate tags to assign multiple at once"
                                        />
                                    </div>

                                    {allTags.length > 0 && (
                                        <div className="my-4">
                                            <label className="my-2 block text-sm font-medium leading-5 text-gray-700">Use
                                                existing tags</label>
                                            <div className="flex flex-col gap-3 mt-2">
                                                {allTags.map(tag => (
                                                    <label key={tag} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTags.has(tag)}
                                                            onChange={() => handleTagToggle(tag)}
                                                            className="custom-tag-checkbox h-4 w-4 rounded cursor-pointer"
                                                        />
                                                        <span className="text-sm text-gray-700 ml-2">{tag}</span>
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
                            <button type="submit"
                                    className="capitalize bg-black hover:bg-blue-600 text-white font-medium py-2 px-5 border text-sm border-transparent hover:border-transparent rounded">
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
                                    <div
                                        className="text-xs overflow-hidden break-all border-gray-200 flex justify-between items-center">
                                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                                           className="py-1 font-light break-all">{link.url}</a>
                                    </div>
                                    <div className="flex flex-row py-1">
                                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                                           className="max-h-48 w-full break-all font-bold text-xl tracking-tight"
                                           style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                            {link.title || link.url}
                                        </a>
                                    </div>
                                    {link.image && (
                                        <div className="flex py-1">
                                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                <img className="max-h-80" src={link.image} alt={link.title || "Preview"}
                                                     loading="lazy"
                                                     onError={(e: any) => e.target.style.display = 'none'}/>
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

export default EditScreen;
