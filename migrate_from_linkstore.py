#!/usr/bin/env python3
import sys
import requests
import time

def print_help():
    print("ERROR: Missing required information.")
    print("Usage: python migrate_from_linkstore.py <LINKSTORE_TOKEN> <LINKAMI_TOKEN>")
    print("\nBoth tokens are required to authorize the migration:")
    print(" - LINKSTORE_TOKEN: You can find it in the 'Settings' page of linkstore.app.")
    print(" - LINKAMI_TOKEN: You can find it in the 'Settings' page of Linkami.")
    print("\nExample:")
    print("  python migrate_from_linkstore.py your_linkstore_token your_linkami_token")
    sys.exit(1)

def main():
    if len(sys.argv) != 3:
        print_help()
        
    linkstore_token = sys.argv[1]
    linkami_token = sys.argv[2]
    
    linkstore_url = "https://linkstore.app/api/link"
    linkami_url = "http://api.rotaliano.it/api/link"
    
    linkstore_headers = {
        "X-ACCESS-TOKEN": linkstore_token
    }
    
    linkami_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {linkami_token}"
    }
    
    previous_url = None
    count = 0
    
    print("Starting migration from Linkstore to Linkami...")
    
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
                
            print(f"[{count+1}] Sending '{current_url}' to Linkami... ", end="", flush=True)
            
            # 2. Send the URL to linkami using POST JSON
            payload = {"url": current_url}
            res_linkami = requests.post(linkami_url, json=payload, headers=linkami_headers)
            res_linkami.raise_for_status()
            
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
