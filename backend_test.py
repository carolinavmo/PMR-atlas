#!/usr/bin/env python3
"""
PMR Education Platform Backend API Testing
Tests authentication, categories, diseases, bookmarks, notes, and admin functionality
"""

import requests
import sys
import json
from datetime import datetime

class PMRAPITester:
    def __init__(self, base_url="https://clinical-pmr.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Error: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("Health Check", "GET", "/health", 200)

    def test_admin_login(self):
        """Test admin login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/auth/login",
            200,
            data={"email": "admin@pmr.edu", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.admin_user_id = response['user']['id']
            print(f"   Admin user ID: {self.admin_user_id}")
            return True
        return False

    def test_get_categories(self):
        """Test retrieving categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET", 
            "/categories",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} categories")
            return response
        return []

    def test_get_diseases(self):
        """Test retrieving diseases"""
        success, response = self.run_test(
            "Get Diseases",
            "GET",
            "/diseases", 
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} diseases")
            return response
        return []

    def test_get_disease_detail(self, disease_id):
        """Test retrieving specific disease"""
        success, response = self.run_test(
            "Get Disease Detail",
            "GET",
            f"/diseases/{disease_id}",
            200
        )
        return success, response

    def test_bookmarks(self, disease_id):
        """Test bookmark functionality"""
        # Create bookmark
        success, response = self.run_test(
            "Create Bookmark",
            "POST",
            "/bookmarks",
            200,
            data={"disease_id": disease_id}
        )
        
        if not success:
            return False
            
        # Get bookmarks
        success, response = self.run_test(
            "Get Bookmarks",
            "GET",
            "/bookmarks",
            200
        )
        
        if success and len(response) > 0:
            print(f"   Found {len(response)} bookmarks")
            
        # Remove bookmark
        success, response = self.run_test(
            "Remove Bookmark",
            "DELETE",
            f"/bookmarks/{disease_id}",
            200
        )
        
        return success

    def test_notes(self, disease_id):
        """Test notes functionality"""
        # Create/update note
        test_content = f"Test note created at {datetime.now().isoformat()}"
        success, response = self.run_test(
            "Create Note",
            "POST",
            "/notes",
            200,
            data={"disease_id": disease_id, "content": test_content}
        )
        
        if not success:
            return False
            
        note_id = response.get('id')
        
        # Get note for disease
        success, response = self.run_test(
            "Get Note for Disease",
            "GET",
            f"/notes/{disease_id}",
            200
        )
        
        if success and response.get('content') == test_content:
            print(f"   Note content verified")
            
        # Get all notes
        success, response = self.run_test(
            "Get All Notes",
            "GET",
            "/notes",
            200
        )
        
        return success

    def test_recent_views(self, disease_id):
        """Test recent views functionality"""
        # Add view
        success, response = self.run_test(
            "Add Recent View",
            "POST",
            f"/recent-views/{disease_id}",
            200
        )
        
        if not success:
            return False
            
        # Get recent views
        success, response = self.run_test(
            "Get Recent Views", 
            "GET",
            "/recent-views",
            200
        )
        
        if success and len(response) > 0:
            print(f"   Found {len(response)} recent views")
            
        return success

    def test_search_functionality(self):
        """Test disease search with filters"""
        # Search by query
        success, response = self.run_test(
            "Search Diseases by Query",
            "GET",
            "/diseases",
            200,
            params={"search": "rotator"}
        )
        
        if success:
            print(f"   Search found {len(response)} results")
            
        # Search by tag
        success, response = self.run_test(
            "Search Diseases by Tag",
            "GET", 
            "/diseases",
            200,
            params={"tag": "acute"}
        )
        
        return success

    def test_admin_stats(self):
        """Test admin statistics"""
        success, response = self.run_test(
            "Get Admin Stats",
            "GET",
            "/admin/stats",
            200
        )
        
        if success:
            stats = response
            print(f"   Users: {stats.get('total_users', 0)}")
            print(f"   Diseases: {stats.get('total_diseases', 0)}")
            print(f"   Categories: {stats.get('total_categories', 0)}")
            
        return success

    def test_admin_users(self):
        """Test admin user management"""
        success, response = self.run_test(
            "Get All Users",
            "GET",
            "/admin/users",
            200
        )
        
        if success:
            print(f"   Found {len(response)} users")
            
        return success

    def test_tags(self):
        """Test tags endpoint"""
        success, response = self.run_test(
            "Get Tags",
            "GET",
            "/tags",
            200
        )
        
        if success:
            print(f"   Found {len(response)} unique tags")
            
        return success

def main():
    print("🚀 Starting PMR Education Platform API Tests")
    print("=" * 50)
    
    tester = PMRAPITester()
    
    # Test health check
    success, _ = tester.test_health_check()
    if not success:
        print("❌ Health check failed - API might be down")
        return 1

    # Test admin login
    if not tester.test_admin_login():
        print("❌ Admin login failed - cannot continue with authenticated tests")
        return 1

    # Test categories
    categories = tester.test_get_categories()
    if not categories:
        print("❌ No categories found - data might not be seeded")
        return 1

    # Test diseases
    diseases = tester.test_get_diseases()
    if not diseases:
        print("❌ No diseases found - data might not be seeded")
        return 1

    # Use first disease for detailed tests
    test_disease = diseases[0]
    disease_id = test_disease['id']
    print(f"\nUsing disease '{test_disease['name']}' for detailed tests")

    # Test disease detail
    success, disease_detail = tester.test_get_disease_detail(disease_id)
    if not success:
        print("❌ Disease detail fetch failed")
        return 1

    # Test bookmarks
    if not tester.test_bookmarks(disease_id):
        print("❌ Bookmark functionality failed")
        return 1

    # Test notes
    if not tester.test_notes(disease_id):
        print("❌ Notes functionality failed")
        return 1

    # Test recent views
    if not tester.test_recent_views(disease_id):
        print("❌ Recent views functionality failed")
        return 1

    # Test search
    if not tester.test_search_functionality():
        print("❌ Search functionality failed")
        return 1

    # Test admin functionality
    if not tester.test_admin_stats():
        print("❌ Admin stats failed")
        return 1

    if not tester.test_admin_users():
        print("❌ Admin users failed")
        return 1

    # Test tags
    if not tester.test_tags():
        print("❌ Tags functionality failed")
        return 1

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run} passed")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100
    print(f"🎯 Success rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())