import {useState, useEffect} from 'react';
import {useParams, useSearchParams, useNavigate} from 'react-router-dom';

import {API_URL} from '../config';
import Header from '../components/Header';
import Dashboard from './Dashboard';

function DashboardWrapper() {
    const {collectionName} = useParams()
    const [colInfo, setColInfo] = useState<any>(null)
    const [error] = useState('')
    const [search, setSearch] = useState('')
    const [archived, setArchived] = useState(false)
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const tagsParam = searchParams.get('tags') || ''
    const [addedLink, setAddedLink] = useState<any>(null)

    useEffect(() => {
        const fetchInfo = async () => {
            const token = localStorage.getItem('linkoteca_token')
            const headers: any = {}
            if (token) headers['Authorization'] = `Bearer ${token}`

            const res = await fetch(`${API_URL}/collection/${collectionName}`, {headers})
            if (res.ok) {
                setColInfo(await res.json())
            } else {
                localStorage.removeItem('linkoteca_name')
                localStorage.removeItem('linkoteca_token')
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
            <Header collectionName={collectionName} isOwner={colInfo.is_owner} search={search} setSearch={setSearch}
                    archived={archived} setArchived={setArchived} collectionDescription={colInfo.description} onUrlAdded={setAddedLink} />
            <Dashboard
                collectionName={collectionName!}
                isOwner={colInfo.is_owner}
                search={search}
                displayMode={colInfo.display_mode}
                displayImages={colInfo.display_images}
                archived={archived}
                setArchived={setArchived}
                tagsParam={tagsParam}
                addedLink={addedLink}
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

export default DashboardWrapper;
