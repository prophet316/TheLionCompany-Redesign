// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initMobileMenu();
    initForms();
    initNavbarScroll();
    initVideoModal();
});

// Intersection Observer for scroll reveal animations
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select all elements with fade-up class
    const revealElements = document.querySelectorAll('.fade-up');
    revealElements.forEach(el => observer.observe(el));
}

// Mobile Menu Toggle
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');

            // Toggle body scroll
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when a link is clicked
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

// Navbar Scroll Effect (add background on scroll)
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.9)';
            navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
            navbar.style.padding = '10px 0'; // Slight shrink effect
        } else {
            navbar.style.background = 'rgba(25, 25, 25, 0.6)';
            navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
            navbar.style.padding = '0';
        }
    });
}

// Form Handling (Basic prevent default for demo)
function initForms() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get the submit button to show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;

            if (submitBtn) {
                submitBtn.innerText = 'Sending...';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';

                // Simulate network request
                setTimeout(() => {
                    submitBtn.innerText = 'Sent successfully!';
                    submitBtn.style.backgroundColor = '#10b981'; // Success green
                    form.reset();

                    // Reset button after 3 seconds
                    setTimeout(() => {
                        submitBtn.innerText = originalText;
                        submitBtn.disabled = false;
                        submitBtn.style.opacity = '1';
                        submitBtn.style.backgroundColor = '';
                    }, 3000);
                }, 1500);
            }
        });
    });
}

// Video Modal Logic
function initVideoModal() {
    const modal = document.getElementById('video-modal');
    if (!modal) return;

    const iframe = document.getElementById('video-iframe');
    const closeTriggers = document.querySelectorAll('.js-modal-close');
    const openTriggers = document.querySelectorAll('.video-trigger');

    openTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const videoId = trigger.getAttribute('data-video-id');
            if (videoId) {
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            }
        });
    });

    closeTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('active');
            // Remove the video source to stop playback immediately
            setTimeout(() => { iframe.src = ''; }, 300);
            document.body.style.overflow = ''; // Restore scrolling
        });
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            setTimeout(() => { iframe.src = ''; }, 300);
            document.body.style.overflow = '';
        }
    });
}
