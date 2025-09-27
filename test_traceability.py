#!/usr/bin/env python3
"""
Test script to verify traceability API works with existing herb data
"""
import requests
import json

# Your API base URL (Django dev server)
API_BASE_URL = "http://localhost:8000"

# Test batch IDs from your database
test_batch_ids = [
    "HERB-664F619F",  # rosemary
    "HERB-3614C4A9",  # basil
    "HERB_001_2024"   # tulsi
]

def test_traceability_api():
    print("🧪 Testing Traceability API with existing herb data...\n")
    
    for batch_id in test_batch_ids:
        print(f"📋 Testing batch: {batch_id}")
        
        try:
            # Test the traceability endpoint
            url = f"{API_BASE_URL}/api/v1/herbs/{batch_id}/traceability"
            response = requests.get(url)
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS!")
                print(f"   Species: {data.get('herb_details', {}).get('species_name', 'N/A')}")
                print(f"   Current Status: {data.get('herb_details', {}).get('current_status', 'N/A')}")
                print(f"   Total Transfers: {data.get('total_transfers', 0)}")
                print(f"   Journey Steps: {len(data.get('journey_timeline', []))}")
                
                # Show first few timeline steps
                timeline = data.get('journey_timeline', [])
                if timeline:
                    print(f"   Timeline Preview:")
                    for i, step in enumerate(timeline[:3]):  # Show first 3 steps
                        reason = step.get('transfer_reason', 'Unknown')
                        user = step.get('to_user', {}).get('name', 'Unknown')
                        print(f"     {i+1}. {reason} → {user}")
                
            elif response.status_code == 404:
                print(f"   ❌ Herb not found or no traceability data")
            else:
                print(f"   ❌ Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection Error: Make sure your Flask server is running on {API_BASE_URL}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()

def test_basic_herb_endpoint():
    print("🔍 Testing basic herb endpoint...\n")
    
    for batch_id in test_batch_ids:
        try:
            url = f"{API_BASE_URL}/api/v1/herbs/{batch_id}"
            response = requests.get(url)
            
            print(f"📋 {batch_id}: Status {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                herb = data.get('herb', {})
                print(f"   Species: {herb.get('species_name', 'N/A')}")
                print(f"   Status: {herb.get('quality_status', 'N/A')}")
                print(f"   Owner: {herb.get('current_owner', 'N/A')}")
                
        except Exception as e:
            print(f"   Error: {str(e)}")
        
        print()

if __name__ == "__main__":
    print("🚀 HerbChain Traceability API Test\n")
    print("=" * 50)
    
    # Test basic herb endpoints first
    test_basic_herb_endpoint()
    
    print("=" * 50)
    
    # Test traceability endpoints
    test_traceability_api()
    
    print("✅ Test completed!")
