
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment.")
        return

    print(f"Testing Gemini API key (starts with {api_key[:10]}...)")
    genai.configure(api_key=api_key)

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hello")
        print("✅ Gemini API test successful!")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Gemini API test failed: {e}")

if __name__ == "__main__":
    test_gemini()
