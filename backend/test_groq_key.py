
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in environment.")
        return

    print(f"Testing Groq API key (starts with {api_key[:10]}...)")
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
    )

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Hello"}],
        )
        print("✅ Groq API test successful!")
        print(f"Response: {completion.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Groq API test failed: {e}")

if __name__ == "__main__":
    test_groq()
