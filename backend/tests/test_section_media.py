"""
Backend API tests for section media functionality
Tests the /api/diseases/{id}/section-media endpoint for per-section media editing
"""
import pytest
import requests
import os

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
    pytest.skip("Admin authentication failed - skipping authenticated tests")

@pytest.fixture(scope="module")
def viewer_token(api_client):
    """Get viewer authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": VIEWER_EMAIL,
        "password": VIEWER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Viewer authentication failed - skipping viewer tests")

@pytest.fixture(scope="module")
def authenticated_admin_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client

@pytest.fixture(scope="module")
def disease_id(authenticated_admin_client):
    """Get first disease ID for testing"""
    response = authenticated_admin_client.get(f"{BASE_URL}/api/diseases")
    assert response.status_code == 200, f"Failed to get diseases: {response.text}"
    diseases = response.json()
    assert len(diseases) > 0, "No diseases found for testing"
    return diseases[0]["id"]


class TestSectionMediaEndpoint:
    """Tests for the /api/diseases/{id}/section-media endpoint"""
    
    def test_section_media_endpoint_exists(self, authenticated_admin_client, disease_id):
        """Test that the section-media endpoint exists and responds"""
        # Try with empty media array first
        response = authenticated_admin_client.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "definition",
                "media": []
            }
        )
        assert response.status_code == 200, f"Section media endpoint failed: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        print(f"PASS: Section media endpoint exists and responds correctly")
    
    def test_add_image_media_via_url(self, authenticated_admin_client, disease_id):
        """Test adding an image via URL to a section"""
        media_item = {
            "url": "https://example.com/test-image.jpg",
            "type": "image",
            "description": "TEST: Sample medical image",
            "size": "50",
            "alignment": "center"
        }
        
        response = authenticated_admin_client.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "definition",
                "media": [media_item]
            }
        )
        
        assert response.status_code == 200, f"Failed to add media: {response.text}"
        data = response.json()
        assert "message" in data
        assert data["media_count"] == 1, "Media count should be 1"
        
        # Verify media was saved by fetching the disease
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/diseases/{disease_id}")
        assert get_response.status_code == 200
        disease = get_response.json()
        
        # Check that definition_media field exists and has the media
        assert "definition_media" in disease, "definition_media field should exist"
        assert len(disease["definition_media"]) == 1, "Should have 1 media item"
        assert disease["definition_media"][0]["url"] == media_item["url"]
        assert disease["definition_media"][0]["type"] == media_item["type"]
        assert disease["definition_media"][0]["alignment"] == media_item["alignment"]
        assert disease["definition_media"][0]["size"] == media_item["size"]
        print(f"PASS: Image media added and saved correctly")
    
    def test_add_video_media(self, authenticated_admin_client, disease_id):
        """Test adding video media to a section"""
        media_item = {
            "url": "https://youtube.com/watch?v=test123",
            "type": "video",
            "description": "TEST: Educational video",
            "size": "75",
            "alignment": "after"
        }
        
        response = authenticated_admin_client.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "epidemiology",
                "media": [media_item]
            }
        )
        
        assert response.status_code == 200, f"Failed to add video media: {response.text}"
        data = response.json()
        assert data["media_count"] == 1
        
        # Verify
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/diseases/{disease_id}")
        disease = get_response.json()
        assert "epidemiology_media" in disease
        assert len(disease["epidemiology_media"]) == 1
        assert disease["epidemiology_media"][0]["type"] == "video"
        print(f"PASS: Video media added correctly")
    
    def test_media_alignment_options(self, authenticated_admin_client, disease_id):
        """Test all alignment options save correctly"""
        alignments = ["before", "after", "left", "right", "center"]
        
        for alignment in alignments:
            response = authenticated_admin_client.put(
                f"{BASE_URL}/api/diseases/{disease_id}/section-media",
                json={
                    "section_id": "pathophysiology",
                    "media": [{
                        "url": f"https://example.com/test-{alignment}.jpg",
                        "type": "image",
                        "description": f"TEST: {alignment} aligned image",
                        "size": "50",
                        "alignment": alignment
                    }]
                }
            )
            assert response.status_code == 200, f"Failed for alignment {alignment}: {response.text}"
        
        # Verify last alignment was saved
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/diseases/{disease_id}")
        disease = get_response.json()
        assert disease["pathophysiology_media"][0]["alignment"] == "center"  # last one
        print(f"PASS: All alignment options save correctly")
    
    def test_media_size_options(self, authenticated_admin_client, disease_id):
        """Test all size options save correctly"""
        sizes = ["25", "50", "75", "100"]
        
        for size in sizes:
            response = authenticated_admin_client.put(
                f"{BASE_URL}/api/diseases/{disease_id}/section-media",
                json={
                    "section_id": "clinical_presentation",
                    "media": [{
                        "url": f"https://example.com/test-size-{size}.jpg",
                        "type": "image",
                        "description": f"TEST: {size}% size image",
                        "size": size,
                        "alignment": "center"
                    }]
                }
            )
            assert response.status_code == 200, f"Failed for size {size}: {response.text}"
        
        print(f"PASS: All size options save correctly")
    
    def test_multiple_media_items_in_section(self, authenticated_admin_client, disease_id):
        """Test adding multiple media items to a single section"""
        media_items = [
            {
                "url": "https://example.com/image1.jpg",
                "type": "image",
                "description": "TEST: First image",
                "size": "50",
                "alignment": "left"
            },
            {
                "url": "https://example.com/image2.jpg",
                "type": "image",
                "description": "TEST: Second image",
                "size": "50",
                "alignment": "right"
            },
            {
                "url": "https://youtube.com/watch?v=abc",
                "type": "video",
                "description": "TEST: Video content",
                "size": "100",
                "alignment": "after"
            }
        ]
        
        response = authenticated_admin_client.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "physical_examination",
                "media": media_items
            }
        )
        
        assert response.status_code == 200
        assert response.json()["media_count"] == 3
        
        # Verify all items saved
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/diseases/{disease_id}")
        disease = get_response.json()
        assert len(disease["physical_examination_media"]) == 3
        print(f"PASS: Multiple media items save correctly")
    
    def test_media_with_description_caption(self, authenticated_admin_client, disease_id):
        """Test that media description/caption saves correctly"""
        caption = "TEST: This is a detailed caption for the medical imaging figure showing anatomical structures."
        
        response = authenticated_admin_client.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "imaging_findings",
                "media": [{
                    "url": "https://example.com/mri-scan.jpg",
                    "type": "image",
                    "description": caption,
                    "size": "75",
                    "alignment": "center"
                }]
            }
        )
        
        assert response.status_code == 200
        
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/diseases/{disease_id}")
        disease = get_response.json()
        assert disease["imaging_findings_media"][0]["description"] == caption
        print(f"PASS: Media caption/description saves correctly")
    
    def test_clear_section_media(self, authenticated_admin_client, disease_id):
        """Test clearing media from a section by sending empty array"""
        # First add media
        authenticated_admin_client.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "differential_diagnosis",
                "media": [{
                    "url": "https://example.com/temp.jpg",
                    "type": "image",
                    "description": "TEST: Temporary",
                    "size": "50",
                    "alignment": "center"
                }]
            }
        )
        
        # Then clear it
        response = authenticated_admin_client.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "differential_diagnosis",
                "media": []
            }
        )
        
        assert response.status_code == 200
        assert response.json()["media_count"] == 0
        
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/diseases/{disease_id}")
        disease = get_response.json()
        assert len(disease.get("differential_diagnosis_media", [])) == 0
        print(f"PASS: Section media can be cleared")


class TestSectionMediaPermissions:
    """Tests for permission checking on section media endpoint"""
    
    def test_viewer_cannot_add_media(self, api_client, viewer_token, disease_id):
        """Test that viewer/student users cannot add media"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {viewer_token}"
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "definition",
                "media": [{
                    "url": "https://example.com/unauthorized.jpg",
                    "type": "image",
                    "description": "Should not save",
                    "size": "50",
                    "alignment": "center"
                }]
            },
            headers=headers
        )
        
        assert response.status_code == 403, f"Viewer should get 403, got {response.status_code}"
        print(f"PASS: Viewer cannot add media (403 returned)")
    
    def test_unauthenticated_cannot_add_media(self, api_client, disease_id):
        """Test that unauthenticated users cannot add media"""
        response = requests.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "definition",
                "media": []
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code in [401, 403], f"Unauthenticated should get 401/403, got {response.status_code}"
        print(f"PASS: Unauthenticated user blocked")


class TestSectionMediaEdgeCases:
    """Edge case tests for section media endpoint"""
    
    def test_invalid_disease_id(self, authenticated_admin_client):
        """Test with non-existent disease ID"""
        response = authenticated_admin_client.put(
            f"{BASE_URL}/api/diseases/non-existent-id/section-media",
            json={
                "section_id": "definition",
                "media": []
            }
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid disease ID, got {response.status_code}"
        print(f"PASS: Invalid disease ID returns 404")
    
    def test_version_increments_on_media_save(self, authenticated_admin_client, disease_id):
        """Test that disease version increments when media is saved"""
        # Get current version
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/diseases/{disease_id}")
        current_version = get_response.json().get("version", 1)
        
        # Save media
        response = authenticated_admin_client.put(
            f"{BASE_URL}/api/diseases/{disease_id}/section-media",
            json={
                "section_id": "treatment_conservative",
                "media": [{
                    "url": "https://example.com/version-test.jpg",
                    "type": "image",
                    "description": "TEST: Version check",
                    "size": "50",
                    "alignment": "center"
                }]
            }
        )
        
        assert response.status_code == 200
        
        # Check version incremented
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/diseases/{disease_id}")
        new_version = get_response.json().get("version", 1)
        assert new_version > current_version, f"Version should increment: was {current_version}, now {new_version}"
        print(f"PASS: Version increments on media save")


class TestCleanup:
    """Clean up test data"""
    
    def test_cleanup_test_media(self, authenticated_admin_client, disease_id):
        """Clean up all test media by clearing sections"""
        sections_to_clean = [
            "definition", "epidemiology", "pathophysiology", 
            "clinical_presentation", "physical_examination",
            "imaging_findings", "differential_diagnosis", "treatment_conservative"
        ]
        
        for section in sections_to_clean:
            authenticated_admin_client.put(
                f"{BASE_URL}/api/diseases/{disease_id}/section-media",
                json={
                    "section_id": section,
                    "media": []
                }
            )
        
        print(f"PASS: Test media cleaned up from {len(sections_to_clean)} sections")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
