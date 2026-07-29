import json
import metadata_parser
import requests
import time
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from sqlalchemy import select
from urllib.parse import urljoin

from database import SessionLocal
from models import Link

metadata_executor = ThreadPoolExecutor(max_workers=3)

def extract_favicon(soup, url):
    icon_links = soup.find_all("link")
    links = [l for l in icon_links if l.get('rel') and any('icon' in x.lower() for x in l.get('rel'))]
    best_favicon = None
    min_diff = float('inf')
    for link in links:
        href = link.get('href')
        if not href:
            continue
        sizes = link.get('sizes')
        size = 0
        if sizes and isinstance(sizes, list):
            sizes = sizes[0]
        if sizes and sizes.lower() != 'any':
            try:
                size = int(sizes.lower().split('x')[0])
            except Exception:
                pass
        else:
            size = 32
        diff = abs(size - 16)
        if diff < min_diff:
            min_diff = diff
            best_favicon = href
    if best_favicon:
        from urllib.parse import urljoin
        if best_favicon.startswith("/"):
            best_favicon = urljoin(url, best_favicon)
        elif not best_favicon.startswith("http"):
            best_favicon = urljoin(url, best_favicon)
        return best_favicon
    return None

def extract_metadata_with_bs4(url: str, result: dict, soup=None, headers=None) -> None:
    if soup is None:
        if headers is None:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, features="lxml")

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

    if not result['favicon']:
        favicon = extract_favicon(soup, url)
        if favicon:
            result['favicon'] = favicon

def fetch_metadata_for_url(url: str) -> dict:
    """Fetches the title, description, and preview image metadata for a given URL."""
    result = {'title': None, 'description': None, 'image': None, 'favicon': None}
    soup = None
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        page = metadata_parser.MetadataParser(url=url,
                                              force_doctype=True,
                                              search_head_only=False,
                                              only_parse_http_ok=False,
                                              support_malformed=True,
                                              url_headers=headers)

        img = page.get_metadata_link('image')
        if img:
            result['image'] = img
        title_meta = page.parsed_result.get_metadatas('title')
        if title_meta:
            for v in title_meta.values():
                if v:
                    result['title'] = v[0]
                    break
        desc_meta = page.parsed_result.get_metadatas('description')
        if desc_meta:
            for v in desc_meta.values():
                if v:
                    result['description'] = v[0]
                    break
        if hasattr(page.parsed_result, 'soup'):
            soup = page.parsed_result.soup
            if not result['favicon']:
                favicon = extract_favicon(soup, url)
                if favicon:
                    result['favicon'] = favicon
    except Exception as e:
        print(f"Error parsing metadata: {e}")
        pass

    if not result['image'] or not result['title'] or not result['description']:
        try:
            extract_metadata_with_bs4(url, result, soup, headers)
        except Exception as e:
            print(f"Error parsing metadata BeautifulSoup: {e}")
            pass

    return result

def format_link(link: Link) -> dict:
    """Formats a Link SQLAlchemy model into a dictionary for API responses."""
    return {
        "id": link.id,
        "url": link.url,
        "favicon": link.favicon or "",
        "title": link.title,
        "description": link.description,
        "tags": ", ".join([tag.name for tag in link.tags]) if link.tags else "",
        "image": link.image,
        "archived": link.archived,
        "created_at": link.created_at
    }

def background_fetch_metadata(link_id: int):
    db = SessionLocal()
    try:
        link = db.scalar(select(Link).filter(Link.id == link_id))
        if not link:
            return
            
        if link.image and link.title and link.description:
            return
            
        meta = fetch_metadata_for_url(link.url)
        
        updated = False
        if not link.image and meta.get('image'):
            link.image = meta['image']
            updated = True
        if not link.title and meta.get('title'):
            link.title = meta['title']
            updated = True
        if not link.description and meta.get('description'):
            link.description = meta['description']
            updated = True
        if not link.favicon and meta.get('favicon'):
            link.favicon = meta['favicon']
            updated = True

        if updated:
            db.commit()
    except Exception as e:
        print(f"Background metadata fetch failed for link {link_id}: {e}")
    finally:
        db.close()

def background_import_linkstore(linkstore_token: str, collection_id: int):
    db = SessionLocal()
    try:
        linkstore_url = "https://linkstore.app/api/link"
        linkstore_headers = {"X-ACCESS-TOKEN": linkstore_token.strip()}
        previous_url = None
        count = 0
        
        while True:
            try:
                response = requests.get(linkstore_url, headers=linkstore_headers)
                response.raise_for_status()
                
                current_url = response.text.strip().strip('"').strip("'")
                
                if not current_url or current_url == previous_url:
                    break
                    
                existing_link = db.scalar(select(Link).filter(Link.collection_id == collection_id, Link.url == current_url))
                if existing_link:
                    existing_link.created_at = datetime.utcnow()
                    db.commit()
                else:
                    new_link = Link(
                        collection_id=collection_id,
                        url=current_url
                    )
                    db.add(new_link)
                    db.commit()
                    db.refresh(new_link)
                    metadata_executor.submit(background_fetch_metadata, new_link.id)
                
                previous_url = current_url
                count += 1
                time.sleep(0.5)
            except requests.exceptions.RequestException as e:
                print(f"Network ERROR during linkstore import request: {e}")
                break
    except Exception as e:
        print(f"Background Linkstore import failed for collection {collection_id}: {e}")
    finally:
        db.close()
