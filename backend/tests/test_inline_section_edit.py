"""
Backend API tests for Per-Section Inline Editing feature
Tests the inline-save and inline-save-translate endpoints with section_id
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@pmr.edu"
ADMIN_PASSWORD = "admin123"
VIEWER_EMAIL = "test@test.com"
VIEWER_PASSWORD = "password"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def viewer_token(api_client):
    """Get viewer authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": VIEWER_EMAIL,
        "password": VIEWER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Viewer authentication failed")


@pytest.fixture(scope="module")
def admin_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


@pytest.fixture(scope="module")
def test_disease_id(api_client):
    """Get a disease ID for testing"""
    response = api_client.get(f"{BASE_URL}/api/diseases")
    if response.status_code == 200 and len(response.json()) > 0:
        return response.json()[0]["id"]
    pytest.skip("No diseases found for testing")


class TestAuthEndpoints:
    """Authentication tests"""
    
    def test_admin_login_success(self, api_client):
        """Admin can login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"PASS: Admin login successful, role={data['user']['role']}")
    
    def test_viewer_login_success(self, api_client):
        """Viewer can login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": VIEWER_EMAIL,
            "password": VIEWER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] in ["student", "viewer"]
        print(f"PASS: Viewer login successful, role={data['user']['role']}")


class TestDiseaseEndpoints:
    """Disease retrieval tests"""
    
    def test_get_diseases_list(self, api_client):
        """Can retrieve list of diseases"""
        response = api_client.get(f"{BASE_URL}/api/diseases")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "No diseases in database"
        print(f"PASS: Retrieved {len(data)} diseases")
    
    def test_get_single_disease(self, api_client, test_disease_id):
        """Can retrieve a single disease by ID"""
        response = api_client.get(f"{BASE_URL}/api/diseases/{test_disease_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_disease_id
        assert "definition" in data
        print(f"PASS: Retrieved disease: {data['name']}")


class TestInlineSaveSectionEndpoint:
    """Tests for /api/diseases/{id}/inline-save with section_id"""
    
    def test_inline_save_section_requires_auth(self, api_client, test_disease_id):
        """Inline save requires authentication"""
        # Remove auth header temporarily
        auth_header = api_client.headers.pop("Authorization", None)
        try:
            response = api_client.put(
                f"{BASE_URL}/api/diseases/{test_disease_id}/inline-save",
                json={
                    "language": "en",
                    "section_id": "definition",
                    "content": "Test content"
                }
            )
            assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
            print("PASS: Inline save requires authentication")
        finally:
            if auth_header:
                api_client.headers["Authorization"] = auth_header
    
    def test_inline_save_section_requires_admin(self, api_client, viewer_token, test_disease_id):
        """Inline save requires admin role"""
        response = requests.put(
            f"{BASE_URL}/api/diseases/{test_disease_id}/inline-save",
            json={
                "language": "en",
                "section_id": "definition",
                "content": "Test content from viewer"
            },
            headers={
                "Authorization": f"Bearer {viewer_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Inline save blocked for non-admin users")
    
    def test_inline_save_section_definition_english(self, admin_client, admin_token, test_disease_id):
        """Admin can save definition section in English"""
        unique_content = f"TEST_Definition updated at {uuid.uuid4()}"
        response = requests.put(
            f"{BASE_URL}/api/diseases/{test_disease_id}/inline-save",
            json={
                "language": "en",
                "section_id": "definition",
                "content": unique_content
            },
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "disease" in data
        assert data["disease"]["definition"] == unique_content
        print("PASS: Definition section saved in English")
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/diseases/{test_disease_id}")
        assert get_response.status_code == 200
        assert get_response.json()["definition"] == unique_content
        print("PASS: Definition content verified via GET")
    
    def test_inline_save_section_epidemiology_portuguese(self, admin_token, test_disease_id):
        """Admin can save epidemiology section in Portuguese"""
        unique_content = f"TEST_Epidemiologia atualizada {uuid.uuid4()}"
        response = requests.put(
            f"{BASE_URL}/api/diseases/{test_disease_id}/inline-save",
            json={
                "language": "pt",
                "section_id": "epidemiology",
                "content": unique_content
            },
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["disease"]["epidemiology_pt"] == unique_content
        print("PASS: Epidemiology section saved in Portuguese")
    
    def test_inline_save_section_updates_edit_meta(self, admin_token, test_disease_id):
        """Inline save updates section-level edit metadata"""
        unique_content = f"TEST_Content with metadata {uuid.uuid4()}"
        response = requests.put(
            f"{BASE_URL}/api/diseases/{test_disease_id}/inline-save",
            json={
                "language": "en",
                "section_id": "pathophysiology",
                "content": unique_content
            },
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 200
        
        # Verify edit metadata was stored
        get_response = requests.get(f"{BASE_URL}/api/diseases/{test_disease_id}")
        assert get_response.status_code == 200
        disease = get_response.json()
        
        # Check section edit metadata
        meta = disease.get("pathophysiology_edit_meta")
        assert meta is not None, "Section edit metadata not found"
        assert "last_edited_at" in meta
        assert "last_edited_by" in meta
        assert "last_edited_by_name" in meta
        print(f"PASS: Section edit metadata stored: edited by {meta.get('last_edited_by_name')}")


class TestInlineSaveTranslateEndpoint:
    """Tests for /api/diseases/{id}/inline-save-translate with section_id"""
    
    def test_inline_translate_requires_admin(self, viewer_token, test_disease_id):
        """Inline save-translate requires admin role"""
        response = requests.put(
            f"{BASE_URL}/api/diseases/{test_disease_id}/inline-save-translate",
            json={
                "source_language": "en",
                "section_id": "definition",
                "content": "Test content",
                "target_languages": ["pt", "es"]
            },
            headers={
                "Authorization": f"Bearer {viewer_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Inline save-translate blocked for non-admin users")
    
    def test_inline_translate_section_success(self, admin_token, test_disease_id):
        """Admin can save and translate a single section"""
        unique_content = f"TEST_Clinical presentation for translation {uuid.uuid4()}"
        response = requests.put(
            f"{BASE_URL}/api/diseases/{test_disease_id}/inline-save-translate",
            json={
                "source_language": "en",
                "section_id": "clinical_presentation",
                "content": unique_content,
                "target_languages": ["en", "pt", "es"]
            },
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            timeout=60  # LLM translation may take time
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "disease" in data
        assert data["disease"]["clinical_presentation"] == unique_content
        print(f"PASS: Section saved and translated. Translations count: {data.get('translations_count', 0)}")
    
    def test_inline_translate_updates_translation_meta(self, admin_token, test_disease_id):
        """Inline save-translate updates section metadata with translation info"""
        unique_content = f"TEST_Biomechanics for translation {uuid.uuid4()}"
        response = requests.put(
            f"{BASE_URL}/api/diseases/{test_disease_id}/inline-save-translate",
            json={
                "source_language": "en",
                "section_id": "biomechanics",
                "content": unique_content,
                "target_languages": ["en", "pt", "es"]
            },
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            timeout=60
        )
        assert response.status_code == 200
        
        # Verify edit metadata includes translation info
        get_response = requests.get(f"{BASE_URL}/api/diseases/{test_disease_id}")
        assert get_response.status_code == 200
        disease = get_response.json()
        
        meta = disease.get("biomechanics_edit_meta")
        assert meta is not None, "Section edit metadata not found"
        assert "translated_at" in meta, "translated_at not in metadata"
        assert "translated_to" in meta, "translated_to not in metadata"
        print(f"PASS: Translation metadata stored: translated to {meta.get('translated_to')}")


class TestVersionHistory:
    """Tests for version history of edits"""
    
    def test_inline_edit_creates_version(self, admin_token, test_disease_id):
        """Inline edit creates a new version entry"""
        # First get current version
        get_response = requests.get(f"{BASE_URL}/api/diseases/{test_disease_id}")
        initial_version = get_response.json().get("version", 1)
        
        # Make an edit
        response = requests.put(
            f"{BASE_URL}/api/diseases/{test_disease_id}/inline-save",
            json={
                "language": "en",
                "section_id": "prognosis",
                "content": f"TEST_Prognosis updated for version test {uuid.uuid4()}"
            },
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 200
        
        # Verify version incremented
        get_response = requests.get(f"{BASE_URL}/api/diseases/{test_disease_id}")
        new_version = get_response.json().get("version", 1)
        assert new_version > initial_version, f"Version not incremented: {initial_version} -> {new_version}"
        print(f"PASS: Version incremented from {initial_version} to {new_version}")


class TestCategoriesAndTags:
    """Supporting API tests"""
    
    def test_get_categories(self, api_client):
        """Can retrieve categories"""
        response = api_client.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Retrieved {len(data)} categories")
    
    def test_get_tags(self, api_client):
        """Can retrieve tags"""
        response = api_client.get(f"{BASE_URL}/api/tags")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Retrieved {len(data)} tags")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
