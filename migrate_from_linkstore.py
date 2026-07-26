#!/usr/bin/env python3
import sys
import requests
import time

def print_help():
    print("ERROR: Missing required information.")
    print("Usage: python migrate_from_linkstore.py <LINKSTORE_TOKEN> <LINKOTECA_TOKEN>")
    print("\nBoth tokens are required to authorize the migration:")
    print(" - LINKSTORE_TOKEN: You can find it in the 'Settings' page of linkstore.app.")
    print(" - LINKOTECA_TOKEN: You can find it in the 'Settings' page of Linkoteca.")
    print("\nExample:")
    print("  python migrate_from_linkstore.py your_linkstore_token your_linkoteca_token")
    sys.exit(1)

def main():
    if len(sys.argv) != 3:
        print_help()
        
    linkstore_token = sys.argv[1]
    linkoteca_token = sys.argv[2]
    
    linkstore_url = "https://linkstore.app/api/link"
    linkoteca_url = "http://api.rotaliano.it/api/link"
    
    linkstore_headers = {
        "X-ACCESS-TOKEN": linkstore_token
    }
    
    linkoteca_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {linkoteca_token}"
    }
    
    previous_url = None
    count = 0
    
    print("Starting migration from Linkstore to Linkoteca...")
    
    while True:
        try:
            # 1. Fetch the URL from linkstore
            response = requests.get(linkstore_url, headers=linkstore_headers)
            response.raise_for_status()
            
            # Clean up the string (removes whitespace or quotes around the string)
            current_url = response.text.strip().strip('"').strip("'")
            
            # If the string is empty or equal to the previous URL, we've reached the end
            if not current_url or current_url == previous_url:
                print(f"\nMigration completed! No new links found. Total links migrated: {count}")
                print("Note: The links on linkstore.app have been archived, which is the normal behavior of Linkstore.")
                break
                
            print(f"[{count+1}] Sending '{current_url}' to Linkoteca... ", end="", flush=True)
            
            # 2. Send the URL to linkoteca using POST JSON
            payload = {"url": current_url}
            res_linkoteca = requests.post(linkoteca_url, json=payload, headers=linkoteca_headers)
            res_linkoteca.raise_for_status()
            
            print("OK")
            
            previous_url = current_url
            count += 1
            
            # Half-second pause to avoid flooding the API with too many requests
            time.sleep(0.5)
            
        except requests.exceptions.RequestException as e:
            print(f"Network ERROR during request: {e}")
            # Exit on error to avoid an infinite loop of failed requests
            sys.exit(1)

if __name__ == "__main__":
    main()
