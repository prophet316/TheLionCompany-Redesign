import unittest
import os
import re

class TestLegalPages(unittest.TestCase):
    """Regression tests for footer legal links."""

    def setUp(self):
        """Set up test fixtures."""
        self.repo_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.index_path = os.path.join(self.repo_path, 'index.html')
        self.media_path = os.path.join(self.repo_path, 'media.html')
        self.privacy_path = os.path.join(self.repo_path, 'privacy.html')
        self.terms_path = os.path.join(self.repo_path, 'terms.html')

    def test_privacy_html_exists(self):
        """Test that privacy.html exists in the repository."""
        self.assertTrue(
            os.path.exists(self.privacy_path),
            f"privacy.html should exist at {self.privacy_path}"
        )

    def test_terms_html_exists(self):
        """Test that terms.html exists in the repository."""
        self.assertTrue(
            os.path.exists(self.terms_path),
            f"terms.html should exist at {self.terms_path}"
        )

    def test_index_links_to_privacy(self):
        """Test that index.html contains a link to privacy.html."""
        with open(self.index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Check for relative path link to privacy.html
        self.assertIn(
            'href="privacy.html"',
            content,
            "index.html should contain href=\"privacy.html\""
        )

    def test_index_links_to_terms(self):
        """Test that index.html contains a link to terms.html."""
        with open(self.index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Check for relative path link to terms.html
        self.assertIn(
            'href="terms.html"',
            content,
            "index.html should contain href=\"terms.html\""
        )

    def test_media_links_to_privacy(self):
        """Test that media.html contains a link to privacy.html."""
        with open(self.media_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Check for relative path link to privacy.html
        self.assertIn(
            'href="privacy.html"',
            content,
            "media.html should contain href=\"privacy.html\""
        )

    def test_media_links_to_terms(self):
        """Test that media.html contains a link to terms.html."""
        with open(self.media_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Check for relative path link to terms.html
        self.assertIn(
            'href="terms.html"',
            content,
            "media.html should contain href=\"terms.html\""
        )

    def test_no_broken_root_relative_links(self):
        """Test that pages do not use broken root-relative paths for legal links."""
        for page_path in [self.index_path, self.media_path]:
            with open(page_path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Ensure old broken paths are not present
            self.assertNotIn(
                'href="/privacy"',
                content,
                f"{os.path.basename(page_path)} should not contain broken href=\"/privacy\""
            )
            self.assertNotIn(
                'href="/terms"',
                content,
                f"{os.path.basename(page_path)} should not contain broken href=\"/terms\""
            )


if __name__ == '__main__':
    unittest.main()
