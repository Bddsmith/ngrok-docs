#!/usr/bin/env python3
"""
Backend API Testing Suite for Poultry Marketplace
Tests all core backend functionality including authentication, listings, and messaging.
"""

import requests
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://661276c2-403e-42b8-b58f-249e6494d924.preview.emergentagent.com')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing backend API at: {API_BASE_URL}")

class PoultryAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_data = {
            "name": "John Farmer",
            "email": f"john.farmer.{uuid.uuid4().hex[:8]}@example.com",
            "password": "SecurePass123!",
            "phone": "+1-555-0123",
            "location": "Rural Valley, TX"
        }
        self.test_user_2_data = {
            "name": "Sarah Buyer",
            "email": f"sarah.buyer.{uuid.uuid4().hex[:8]}@example.com", 
            "password": "BuyerPass456!",
            "phone": "+1-555-0456",
            "location": "Farm City, CA"
        }
        self.user_token = None
        self.user_id = None
        self.user_2_token = None
        self.user_2_id = None
        self.test_listing_id = None
        self.eggs_listing_id = None
        
    def test_api_health(self):
        """Test API health check endpoint"""
        print("\n=== Testing API Health Check ===")
        try:
            response = self.session.get(f"{API_BASE_URL}/")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "status" in data:
                    print("✅ API Health Check: PASSED")
                    return True
                else:
                    print("❌ API Health Check: Invalid response format")
                    return False
            else:
                print(f"❌ API Health Check: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API Health Check: Exception - {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        try:
            # Test first user registration
            response = self.session.post(
                f"{API_BASE_URL}/auth/register",
                json=self.test_user_data
            )
            print(f"User 1 Registration - Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user_id" in data:
                    self.user_token = data["token"]
                    self.user_id = data["user_id"]
                    print("✅ User 1 Registration: PASSED")
                    
                    # Test second user registration
                    response2 = self.session.post(
                        f"{API_BASE_URL}/auth/register",
                        json=self.test_user_2_data
                    )
                    print(f"User 2 Registration - Status Code: {response2.status_code}")
                    
                    if response2.status_code == 200:
                        data2 = response2.json()
                        self.user_2_token = data2["token"]
                        self.user_2_id = data2["user_id"]
                        print("✅ User 2 Registration: PASSED")
                        return True
                    else:
                        print(f"❌ User 2 Registration: Failed with status {response2.status_code}")
                        return False
                else:
                    print("❌ User Registration: Missing token or user_id in response")
                    return False
            else:
                print(f"❌ User Registration: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ User Registration: Exception - {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        try:
            login_data = {
                "email": self.test_user_data["email"],
                "password": self.test_user_data["password"]
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/auth/login",
                json=login_data
            )
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user_id" in data:
                    print("✅ User Login: PASSED")
                    return True
                else:
                    print("❌ User Login: Missing token or user_id in response")
                    return False
            else:
                print(f"❌ User Login: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ User Login: Exception - {str(e)}")
            return False
    
    def test_get_user_profile(self):
        """Test get user profile endpoint"""
        print("\n=== Testing Get User Profile ===")
        try:
            response = self.session.get(f"{API_BASE_URL}/users/{self.user_id}")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if "name" in data and "email" in data and data["email"] == self.test_user_data["email"]:
                    print("✅ Get User Profile: PASSED")
                    return True
                else:
                    print("❌ Get User Profile: Invalid user data returned")
                    return False
            else:
                print(f"❌ Get User Profile: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Get User Profile: Exception - {str(e)}")
            return False
    
    def test_create_listing(self):
        """Test create listing endpoint"""
        print("\n=== Testing Create Listing ===")
        try:
            listing_data = {
                "title": "Premium Rhode Island Red Chickens",
                "description": "Healthy, well-bred Rhode Island Red chickens. Great for egg production and meat. Vaccinated and ready for new home.",
                "category": "poultry",
                "price": 25.50,
                "images": [],
                "location": "Rural Valley, TX",
                "breed": "Rhode Island Red",
                "age": "6 months",
                "health_status": "Excellent - Vaccinated"
            }
            
            # Note: In the actual API, user_id should come from JWT token
            # For testing, we'll pass it as a query parameter
            response = self.session.post(
                f"{API_BASE_URL}/listings?user_id={self.user_id}",
                json=listing_data
            )
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                # API returns _id instead of id
                listing_id = data.get("_id") or data.get("id")
                if listing_id and data["title"] == listing_data["title"]:
                    self.test_listing_id = listing_id
                    print("✅ Create Listing: PASSED")
                    return True
                else:
                    print("❌ Create Listing: Invalid listing data returned")
                    return False
            else:
                print(f"❌ Create Listing: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Create Listing: Exception - {str(e)}")
            return False
    
    def test_get_all_listings(self):
        """Test get all listings endpoint"""
        print("\n=== Testing Get All Listings ===")
        try:
            response = self.session.get(f"{API_BASE_URL}/listings")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Found {len(data)} listings")
                if isinstance(data, list):
                    print("✅ Get All Listings: PASSED")
                    return True
                else:
                    print("❌ Get All Listings: Response is not a list")
                    return False
            else:
                print(f"❌ Get All Listings: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Get All Listings: Exception - {str(e)}")
            return False
    
    def test_get_specific_listing(self):
        """Test get specific listing endpoint"""
        print("\n=== Testing Get Specific Listing ===")
        if not self.test_listing_id:
            print("❌ Get Specific Listing: No test listing ID available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE_URL}/listings/{self.test_listing_id}")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                # API returns _id instead of id
                listing_id = data.get("_id") or data.get("id")
                if listing_id and listing_id == self.test_listing_id:
                    print("✅ Get Specific Listing: PASSED")
                    return True
                else:
                    print("❌ Get Specific Listing: Invalid listing data returned")
                    return False
            else:
                print(f"❌ Get Specific Listing: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Get Specific Listing: Exception - {str(e)}")
            return False
    
    def test_get_user_listings(self):
        """Test get user's listings endpoint"""
        print("\n=== Testing Get User Listings ===")
        try:
            response = self.session.get(f"{API_BASE_URL}/users/{self.user_id}/listings")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Found {len(data)} listings for user")
                if isinstance(data, list):
                    print("✅ Get User Listings: PASSED")
                    return True
                else:
                    print("❌ Get User Listings: Response is not a list")
                    return False
            else:
                print(f"❌ Get User Listings: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Get User Listings: Exception - {str(e)}")
            return False
    
    def test_search_functionality(self):
        """Test search listings endpoint"""
        print("\n=== Testing Search Functionality ===")
        try:
            # Test search with query
            response = self.session.get(f"{API_BASE_URL}/search?q=chicken")
            print(f"Search 'chicken' - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Found {len(data)} results for 'chicken'")
                
                # Test search with category filter
                response2 = self.session.get(f"{API_BASE_URL}/search?category=poultry")
                print(f"Search category 'poultry' - Status Code: {response2.status_code}")
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    print(f"Found {len(data2)} results for category 'poultry'")
                    print("✅ Search Functionality: PASSED")
                    return True
                else:
                    print(f"❌ Search Functionality: Category search failed with status {response2.status_code}")
                    return False
            else:
                print(f"❌ Search Functionality: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Search Functionality: Exception - {str(e)}")
            return False
    
    def test_eggs_category_support(self):
        """Test eggs category support in existing endpoints"""
        print("\n=== Testing Eggs Category Support ===")
        try:
            # Test GET /api/listings with category=eggs parameter
            response = self.session.get(f"{API_BASE_URL}/listings?category=eggs")
            print(f"GET /api/listings?category=eggs - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Found {len(data)} eggs listings")
                
                # Test GET /api/search with category=eggs filter
                response2 = self.session.get(f"{API_BASE_URL}/search?category=eggs")
                print(f"GET /api/search?category=eggs - Status Code: {response2.status_code}")
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    print(f"Found {len(data2)} eggs listings in search")
                    print("✅ Eggs Category Support: PASSED")
                    return True
                else:
                    print(f"❌ Eggs Category Support: Search failed with status {response2.status_code}")
                    return False
            else:
                print(f"❌ Eggs Category Support: Listings failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Eggs Category Support: Exception - {str(e)}")
            return False
    
    def test_create_eggs_listing(self):
        """Test creating eggs listing with eggs-specific fields"""
        print("\n=== Testing Create Eggs Listing ===")
        try:
            eggs_listing_data = {
                "title": "Fresh Organic Chicken Eggs",
                "description": "Farm fresh eggs from pasture-raised hens",
                "category": "eggs", 
                "price": 6.50,
                "location": "Farm Valley, TX",
                "egg_type": "Chicken",
                "laid_date": "2025-01-13",
                "feed_type": "Organic Certified",
                "quantity_available": "2 dozen",
                "farm_practices": "Pasture-raised, USDA Organic"
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/listings?user_id={self.user_id}",
                json=eggs_listing_data
            )
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                listing_id = data.get("_id") or data.get("id")
                if (listing_id and 
                    data["title"] == eggs_listing_data["title"] and
                    data["category"] == "eggs" and
                    data.get("egg_type") == eggs_listing_data["egg_type"] and
                    data.get("laid_date") == eggs_listing_data["laid_date"] and
                    data.get("feed_type") == eggs_listing_data["feed_type"] and
                    data.get("quantity_available") == eggs_listing_data["quantity_available"] and
                    data.get("farm_practices") == eggs_listing_data["farm_practices"]):
                    
                    self.eggs_listing_id = listing_id
                    print("✅ Create Eggs Listing: PASSED")
                    print(f"✅ All eggs-specific fields stored correctly")
                    return True
                else:
                    print("❌ Create Eggs Listing: Missing or incorrect eggs-specific fields")
                    print(f"Expected egg_type: {eggs_listing_data['egg_type']}, Got: {data.get('egg_type')}")
                    print(f"Expected laid_date: {eggs_listing_data['laid_date']}, Got: {data.get('laid_date')}")
                    print(f"Expected feed_type: {eggs_listing_data['feed_type']}, Got: {data.get('feed_type')}")
                    print(f"Expected quantity_available: {eggs_listing_data['quantity_available']}, Got: {data.get('quantity_available')}")
                    print(f"Expected farm_practices: {eggs_listing_data['farm_practices']}, Got: {data.get('farm_practices')}")
                    return False
            else:
                print(f"❌ Create Eggs Listing: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Create Eggs Listing: Exception - {str(e)}")
            return False
    
    def test_eggs_listing_retrieval(self):
        """Test retrieving eggs listing with all eggs-specific fields"""
        print("\n=== Testing Eggs Listing Retrieval ===")
        if not hasattr(self, 'eggs_listing_id') or not self.eggs_listing_id:
            print("❌ Eggs Listing Retrieval: No eggs listing ID available")
            return False
            
        try:
            # Test GET /api/listings/{id} for eggs listing
            response = self.session.get(f"{API_BASE_URL}/listings/{self.eggs_listing_id}")
            print(f"GET /api/listings/{self.eggs_listing_id} - Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                listing_id = data.get("_id") or data.get("id")
                
                # Verify all eggs-specific fields are present
                required_eggs_fields = ["egg_type", "laid_date", "feed_type", "quantity_available", "farm_practices"]
                missing_fields = []
                
                for field in required_eggs_fields:
                    if field not in data or data[field] is None:
                        missing_fields.append(field)
                
                if listing_id == self.eggs_listing_id and not missing_fields:
                    print("✅ Eggs Listing Retrieval: PASSED")
                    print("✅ All eggs-specific fields present in response")
                    
                    # Test that eggs listing appears in category filter
                    response2 = self.session.get(f"{API_BASE_URL}/listings?category=eggs")
                    if response2.status_code == 200:
                        eggs_listings = response2.json()
                        found_listing = any(
                            (listing.get("_id") or listing.get("id")) == self.eggs_listing_id 
                            for listing in eggs_listings
                        )
                        if found_listing:
                            print("✅ Eggs listing appears in category filter")
                            return True
                        else:
                            print("❌ Eggs listing not found in category filter")
                            return False
                    else:
                        print(f"❌ Category filter failed with status {response2.status_code}")
                        return False
                else:
                    if missing_fields:
                        print(f"❌ Eggs Listing Retrieval: Missing fields: {missing_fields}")
                    else:
                        print("❌ Eggs Listing Retrieval: Invalid listing ID")
                    return False
            else:
                print(f"❌ Eggs Listing Retrieval: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Eggs Listing Retrieval: Exception - {str(e)}")
            return False
    
    def test_admin_stats_with_eggs(self):
        """Test admin statistics include eggs count"""
        print("\n=== Testing Admin Statistics with Eggs ===")
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/stats")
            print(f"GET /api/admin/stats - Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if listings_by_category includes eggs
                if "listings_by_category" in data:
                    category_stats = data["listings_by_category"]
                    if "eggs" in category_stats:
                        eggs_count = category_stats["eggs"]
                        print(f"✅ Admin Stats: Found eggs category with {eggs_count} listings")
                        
                        # Verify the count is reasonable (should be at least 1 if we created an eggs listing)
                        if hasattr(self, 'eggs_listing_id') and self.eggs_listing_id:
                            if eggs_count >= 1:
                                print("✅ Admin Statistics with Eggs: PASSED")
                                return True
                            else:
                                print("❌ Admin Statistics: Eggs count should be at least 1")
                                return False
                        else:
                            print("✅ Admin Statistics with Eggs: PASSED")
                            return True
                    else:
                        print("❌ Admin Statistics: 'eggs' category missing from listings_by_category")
                        return False
                else:
                    print("❌ Admin Statistics: 'listings_by_category' missing from response")
                    return False
            else:
                print(f"❌ Admin Statistics: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Admin Statistics: Exception - {str(e)}")
            return False
    
    def test_messaging_system(self):
        """Test messaging system endpoints"""
        print("\n=== Testing Messaging System ===")
        if not self.test_listing_id or not self.user_2_id:
            print("❌ Messaging System: Missing required test data")
            return False
            
        try:
            # Send a message from user 2 to user 1 about the listing
            message_data = {
                "receiver_id": self.user_id,
                "listing_id": self.test_listing_id,
                "content": "Hi! I'm interested in your Rhode Island Red chickens. Are they still available?"
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/messages?sender_id={self.user_2_id}",
                json=message_data
            )
            print(f"Send Message - Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                # API returns _id instead of id
                message_id = data.get("_id") or data.get("id")
                if message_id and data["content"] == message_data["content"]:
                    print("✅ Send Message: PASSED")
                    
                    # Test get conversations for user 1
                    response2 = self.session.get(f"{API_BASE_URL}/users/{self.user_id}/conversations")
                    print(f"Get Conversations - Status Code: {response2.status_code}")
                    
                    if response2.status_code == 200:
                        conversations = response2.json()
                        print(f"Found {len(conversations)} conversations")
                        if isinstance(conversations, list):
                            print("✅ Messaging System: PASSED")
                            return True
                        else:
                            print("❌ Messaging System: Conversations response is not a list")
                            return False
                    else:
                        print(f"❌ Messaging System: Get conversations failed with status {response2.status_code}")
                        return False
                else:
                    print("❌ Messaging System: Invalid message data returned")
                    return False
            else:
                print(f"❌ Messaging System: Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Messaging System: Exception - {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Poultry Marketplace Backend API Tests")
        print("=" * 60)
        
        test_results = {}
        
        # Run tests in order
        test_results['api_health'] = self.test_api_health()
        test_results['user_registration'] = self.test_user_registration()
        test_results['user_login'] = self.test_user_login()
        test_results['get_user_profile'] = self.test_get_user_profile()
        test_results['create_listing'] = self.test_create_listing()
        test_results['get_all_listings'] = self.test_get_all_listings()
        test_results['get_specific_listing'] = self.test_get_specific_listing()
        test_results['get_user_listings'] = self.test_get_user_listings()
        test_results['search_functionality'] = self.test_search_functionality()
        test_results['messaging_system'] = self.test_messaging_system()
        
        # Eggs functionality tests
        test_results['eggs_category_support'] = self.test_eggs_category_support()
        test_results['create_eggs_listing'] = self.test_create_eggs_listing()
        test_results['eggs_listing_retrieval'] = self.test_eggs_listing_retrieval()
        test_results['admin_stats_with_eggs'] = self.test_admin_stats_with_eggs()
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\nTotal Tests: {len(test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(test_results)*100):.1f}%")
        
        return test_results

if __name__ == "__main__":
    tester = PoultryAPITester()
    results = tester.run_all_tests()