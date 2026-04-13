import requests
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

headers = {"apikey": key, "Authorization": f"Bearer {key}"}

print(f"URL: {url}")
print(f"KEY: {key[:20]}...")

r = requests.get(f"{url}/rest/v1/jobs", headers=headers, params={"limit": "5"})
print(f"\nStatus: {r.status_code}")
print(f"Response: {r.text[:500]}")