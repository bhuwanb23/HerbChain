#!/usr/bin/env python3
"""
Test script to verify translation API functionality
"""
import requests
import json

# Test data
API_BASE_URL = "http://localhost:5000/api/v1/translate"

def test_translation_api():
    print("🧪 Testing Translation API...\n")
    
    # Test 1: Single text translation
    print("1️⃣ Testing single text translation:")
    try:
        response = requests.post(f"{API_BASE_URL}/text", 
            json={
                "text": "Hello World",
                "target_lang": "hi"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Original: {data.get('original_text')}")
            print(f"   Translated: {data.get('translated_text')}")
            print("   ✅ Single text translation working!")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")
    
    print()
    
    # Test 2: Payment data translation
    print("2️⃣ Testing payment data translation:")
    try:
        test_transactions = [
            {
                "id": "TXN001",
                "buyer": "Ayurvedic Wellness Corp",
                "amount": "₹15,000",
                "description": "Premium quality herbs",
                "status": "pending"
            },
            {
                "id": "TXN002", 
                "buyer": "Herbal Solutions Ltd",
                "amount": "₹25,000",
                "description": "Organic certified herbs",
                "status": "completed"
            }
        ]
        
        response = requests.post(f"{API_BASE_URL}/payments",
            json={
                "transactions": test_transactions,
                "target_lang": "hi"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Payment data translation working!")
            
            # Show first transaction translation
            if data.get('translated_transactions'):
                original = test_transactions[0]
                translated = data['translated_transactions'][0]
                print(f"   Original buyer: {original['buyer']}")
                print(f"   Translated buyer: {translated['buyer']}")
                print(f"   Original description: {original['description']}")
                print(f"   Translated description: {translated['description']}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")
    
    print()
    
    # Test 3: Check supported languages
    print("3️⃣ Testing supported languages:")
    try:
        response = requests.get(f"{API_BASE_URL}/languages")
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Supported languages: {data.get('supported_languages')}")
            print("   ✅ Languages endpoint working!")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")

if __name__ == "__main__":
    print("🔍 Make sure your Flask server is running on http://localhost:5000")
    print("🔍 Make sure you have installed: pip install deep-translator\n")
    test_translation_api()
