// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initMobileMenu();
    initForms();
    initNavbarScroll();
    initVideoModal();
    initStoreLightbox();
});

// Intersection Observer for scroll reveal animations
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

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
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

// Navbar Scroll Effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
            navbar.style.padding = '10px 0';
        } else {
            navbar.style.background = 'rgba(25, 25, 25, 0.6)';
            navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
            navbar.style.padding = '0';
        }
    });
}
// Form handling — submits to the site's server-side email/list endpoint.
function initForms() {
    const prayerForm = document.getElementById('prayer-form');
    if (prayerForm) {
        prayerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fname = document.getElementById('prayer-fname').value.trim();
            const lname = document.getElementById('prayer-lname').value.trim();
            const email = document.getElementById('prayer-email').value.trim();
            const phone = document.getElementById('prayer-phone').value.trim();
            const msg = document.getElementById('prayer-msg').value.trim();
            if (!fname || !email || !msg) {
                showFormFeedback(prayerForm, 'Please fill in all required fields.', 'error');
                return;
            }
            await submitWebsiteForm(prayerForm, {
                type: 'prayer',
                firstName: fname,
                lastName: lname,
                email,
                phone,
                message: msg,
                website: prayerForm.elements.website?.value || ''
            }, 'Your prayer request has been sent. Thank you for trusting us to pray with you.');
        });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fname = document.getElementById('contact-fname').value.trim();
            const lname = document.getElementById('contact-lname').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const phone = document.getElementById('contact-phone').value.trim();
            const msg = document.getElementById('contact-msg').value.trim();
            if (!fname || !email || !msg) {
                showFormFeedback(contactForm, 'Please fill in all required fields.', 'error');
                return;
            }
            await submitWebsiteForm(contactForm, {
                type: 'contact',
                firstName: fname,
                lastName: lname,
                email,
                phone,
                message: msg,
                website: contactForm.elements.website?.value || ''
            }, 'Your message has been sent. We will be in touch soon.');
        });
    }
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value.trim();
            if (!email) {
                showFormFeedback(newsletterForm, 'Please enter your email address.', 'error');
                return;
            }
            await submitWebsiteForm(newsletterForm, {
                type: 'newsletter',
                email,
                website: newsletterForm.elements.website?.value || ''
            }, "You're on the list. Thank you for joining The Lion Company.");
        });
    }
}

async function submitWebsiteForm(form, payload, successMessage) {
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button ? button.textContent : '';

    if (button) {
        button.disabled = true;
        button.textContent = 'SENDING…';
    }

    try {
        const response = await fetch('/api/forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Submission failed');

        form.reset();
        showFormFeedback(form, successMessage, 'success');
    } catch (error) {
        console.error('Website form submission failed:', error);
        showFormFeedback(form, 'We could not send that just now. Please email Jonathan@TheLionCompany.org.', 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalLabel;
        }
    }
}

function showFormFeedback(form, message, type) {
    const existing = form.querySelector('.form-feedback');
    if (existing) existing.remove();
    const feedback = document.createElement('div');
    feedback.className = 'form-feedback';
    feedback.style.cssText = 'padding:12px 16px;border-radius:8px;margin-top:12px;font-size:14px;text-align:center;';
    if (type === 'success') {
        feedback.style.background = 'rgba(16,185,129,0.15)';
        feedback.style.border = '1px solid rgba(16,185,129,0.3)';
        feedback.style.color = '#10b981';
    } else {
        feedback.style.background = 'rgba(239,68,68,0.15)';
        feedback.style.border = '1px solid rgba(239,68,68,0.3)';
        feedback.style.color = '#ef4444';
    }
    feedback.textContent = message;
    form.appendChild(feedback);
    setTimeout(() => { if (feedback.parentNode) feedback.remove(); }, 5000);
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
                iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    closeTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('active');
            setTimeout(() => { iframe.src = ''; }, 300);
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            setTimeout(() => { iframe.src = ''; }, 300);
            document.body.style.overflow = '';
        }
    });
}

// Store Lightbox — only shows once per visit
function initStoreLightbox() {
    const modal = document.getElementById('store-modal');
    if (!modal) return;
    const closeTriggers = modal.querySelectorAll('.js-lightbox-close');
    let hasShown = false;

    setTimeout(() => {
        if (!hasShown) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            hasShown = true;
        }
    }, 12000);

    closeTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
