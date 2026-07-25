import json
import requests
import metadata_parser
from bs4 import BeautifulSoup
from models import Link

def fetch_metadata_for_url(url: str) -> dict:
    """Fetches the title, description, and preview image metadata for a given URL."""
    result = {'title': None, 'description': None, 'image': None}
    try:
        page = metadata_parser.MetadataParser(url=url, search_head_only=False)
        img = page.get_metadata_link('image')
        if img:
            result['image'] = img
        title_meta = page.get_metadatas('title')
        if title_meta:
            result['title'] = title_meta[0]
        desc_meta = page.get_metadatas('description')
        if desc_meta:
            result['description'] = desc_meta[0]
    except Exception:
        pass

    if not result['image'] or not result['title'] or not result['description']:
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            if not result['title']:
                title_tag = soup.find('title')
                if title_tag and title_tag.string:
                    result['title'] = title_tag.string.strip()
                if not result['title']:
                    for tag in ['og:title', 'twitter:title']:
                        meta = soup.find('meta', property=tag) or soup.find('meta', attrs={'name': tag})
                        if meta and meta.get('content'):
                            result['title'] = meta.get('content').strip()
                            break

            if not result['description']:
                for tag in ['description', 'og:description', 'twitter:description']:
                    meta = soup.find('meta', property=tag) or soup.find('meta', attrs={'name': tag})
                    if meta and meta.get('content'):
                        result['description'] = meta.get('content').strip()
                        break

            if not result['image']:
                for tag in ['og:image', 'twitter:image', 'image']:
                    meta = soup.find('meta', property=tag) or soup.find('meta', attrs={'name': tag})
                    if meta and meta.get('content'):
                        result['image'] = meta.get('content')
                        break
                if not result['image']:
                    link_tag = soup.find('link', rel='image_src')
                    if link_tag and link_tag.get('href'):
                        result['image'] = link_tag.get('href')

            if not result['image'] or not result['title'] or not result['description']:
                for script in soup.find_all('script', type='application/ld+json'):
                    try:
                        data = json.loads(script.string)

                        def find_keys(obj):
                            if isinstance(obj, dict):
                                if not result['title']:
                                    if 'headline' in obj and isinstance(obj['headline'], str):
                                        result['title'] = obj['headline']
                                    elif 'name' in obj and isinstance(obj['name'], str):
                                        result['title'] = obj['name']
                                if not result['description']:
                                    if 'description' in obj and isinstance(obj['description'], str):
                                        result['description'] = obj['description']
                                if not result['image']:
                                    if 'thumbnailUrl' in obj:
                                        if isinstance(obj['thumbnailUrl'], str):
                                            result['image'] = obj['thumbnailUrl']
                                        elif isinstance(obj['thumbnailUrl'], list) and len(obj['thumbnailUrl']) > 0:
                                            result['image'] = obj['thumbnailUrl'][0]
                                for v in obj.values():
                                    find_keys(v)
                            elif isinstance(obj, list):
                                for item in obj:
                                    find_keys(item)

                        find_keys(data)
                        if result['image'] and result['title'] and result['description']:
                            break
                    except Exception:
                        continue
        except Exception:
            pass

    return result

def format_link(link: Link) -> dict:
    """Formats a Link SQLAlchemy model into a dictionary for API responses."""
    return {
        "id": link.id,
        "url": link.url,
        "title": link.title,
        "description": link.description,
        "tags": ", ".join([tag.name for tag in link.tags]) if link.tags else "",
        "image": link.image,
        "archived": link.archived,
        "created_at": link.created_at
    }
