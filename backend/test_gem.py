import os
import google.generativeai as genai
import traceback

from dotenv import load_dotenv

load_dotenv()

try:
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in .env")
        exit(1)
        
    genai.configure(api_key=api_key)
    # Using the same modern model as farmer_chat.py
    m = genai.GenerativeModel('gemini-2.5-flash')
    res = m.generate_content('hi')
    print("SUCCESS")
    print(res.text)
except Exception as e:
    print("ERROR:")
    traceback.print_exc()
