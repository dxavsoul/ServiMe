#!/usr/bin/env python3
"""
Database verification script to check if test data exists for the coordinates:
40.75998908700563, -73.91608525788222

This script will help verify that your database has the necessary test data.
"""

import requests
import json

def check_database_content():
    """
    Check various endpoints to verify database content.
    """
    base_url = "http://localhost:8000"
    
    print("🔍 Checking Database Content")
    print("=" * 50)
    
    # Test coordinates
    test_lat = 40.75998908700563
    test_lon = -73.91608525788222
    
    # 1. Check if there are any service types
    print("\n1. Checking Service Types...")
    try:
        response = requests.get(f"{base_url}/mobile/service-types")
        if response.status_code == 200:
            data = response.json()
            service_types = data.get('data', [])
            print(f"   ✅ Found {len(service_types)} service types")
            if service_types:
                for st in service_types[:3]:
                    print(f"      - {st.get('name')} (ID: {st.get('id')})")
            else:
                print("   ❌ No service types found - database might be empty")
                return
        else:
            print(f"   ❌ Failed to get service types: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error checking service types: {e}")
        return
    
    # 2. Check for companies
    print("\n2. Checking Companies...")
    try:
        params = {"latitude": test_lat, "longitude": test_lon, "radius_km": 50, "limit": 10}
        response = requests.get(f"{base_url}/mobile/companies/nearby", params=params)
        if response.status_code == 200:
            data = response.json()
            companies = data.get('data', [])
            print(f"   ✅ Found {len(companies)} companies within 50km")
            if companies:
                for company in companies[:3]:
                    nearest_branch = company.get('nearest_branch', {})
                    print(f"      - {company.get('name')}")
                    print(f"        Nearest Branch: {nearest_branch.get('name', 'Unknown')}")
                    print(f"        Distance: {nearest_branch.get('distance_km', 'N/A')} km")
                    print(f"        Coordinates: ({nearest_branch.get('latitude')}, {nearest_branch.get('longitude')})")
            else:
                print("   ❌ No companies found nearby")
        else:
            print(f"   ❌ Failed to get companies: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error checking companies: {e}")
    
    # 3. Check services discovery
    print("\n3. Checking Services Discovery...")
    try:
        params = {"latitude": test_lat, "longitude": test_lon, "radius_km": 50, "limit": 10}
        response = requests.get(f"{base_url}/mobile/services/discover", params=params)
        if response.status_code == 200:
            data = response.json()
            services = data.get('data', [])
            print(f"   ✅ Found {len(services)} services within 50km")
            if services:
                for service in services[:3]:
                    print(f"      - {service.get('name')} ({service.get('service_type_name', 'Unknown Type')})")
                    print(f"        Department: {service.get('department_name', 'Unknown')}")
                    print(f"        Price: ${service.get('price', 'N/A')}")
        else:
            print(f"   ❌ Failed to discover services: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error checking services: {e}")
    
    # 4. Now test the problematic endpoint
    print("\n4. Testing Service Types Nearby (The problematic endpoint)...")
    try:
        params = {"latitude": test_lat, "longitude": test_lon, "radius_km": 50, "limit": 10}
        response = requests.get(f"{base_url}/mobile/service-types/nearby", params=params)
        print(f"   Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            service_types = data.get('data', [])
            print(f"   ✅ Found {len(service_types)} service types with nearby branches")
            
            if service_types:
                for st in service_types[:2]:
                    print(f"      - {st.get('name')}")
                    print(f"        Nearby branches: {st.get('nearby_branches_count', 0)}")
                    print(f"        Nearest distance: {st.get('nearest_distance_km', 'N/A')} km")
                    
                    branches = st.get('branches', [])
                    if branches:
                        for branch in branches[:2]:
                            print(f"          * {branch.get('branch_name')} - {branch.get('distance_km')} km")
            else:
                print("   ❌ No service types with nearby branches found")
                print("   This suggests the issue is in the branch filtering logic")
        
        elif response.status_code == 422:
            print("   ❌ Validation error")
            try:
                error_data = response.json()
                print(f"   Error details: {json.dumps(error_data, indent=4)}")
            except:
                print(f"   Raw response: {response.text}")
        else:
            print(f"   ❌ Other error: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Error testing service types nearby: {e}")

def suggest_test_data():
    """
    Suggest what test data should be created.
    """
    print("\n💡 Suggested Test Data Structure")
    print("=" * 50)
    print("To make the endpoint work, you need:")
    print()
    print("1. Company:")
    print("   - Name: 'Test Company'")
    print("   - is_active: True")
    print()
    print("2. Branch:")
    print("   - Name: 'Test Branch'")
    print("   - company_id: [Company ID from step 1]")
    print(f"   - latitude: {40.75998908700563}")
    print(f"   - longitude: {-73.91608525788222}")
    print("   - is_active: True")
    print("   - address: 'Test Address, New York, NY'")
    print()
    print("3. Department:")
    print("   - Name: 'Test Department'")
    print("   - branch_id: [Branch ID from step 2]")
    print("   - is_active: True")
    print()
    print("4. Service Type:")
    print("   - Name: 'Test Service Type'")
    print("   - is_active: True")
    print()
    print("5. Service:")
    print("   - Name: 'Test Service'")
    print("   - department_id: [Department ID from step 3]")
    print("   - service_type_id: [Service Type ID from step 4]")
    print("   - is_active: True")
    print("   - price: 50.00")
    print()
    print("Database relationships: Service -> Department -> Branch -> Company")

if __name__ == "__main__":
    check_database_content()
    suggest_test_data()
    
    print("\n" + "=" * 50)
    print("🚀 Next Steps:")
    print("1. Run this script to check current database state")
    print("2. If no data found, create test data as suggested above")
    print("3. Run the debug script: python debug_service_types_nearby.py")
    print("4. Check the mobile.py file for any syntax errors")
    print("5. Verify the API server is running: uvicorn app.main:app --reload")
