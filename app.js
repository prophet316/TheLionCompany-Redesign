// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initMobileMenu();
    initForms();
    initNavbarScroll();
    initLazyMediaImages();
    initMediaLibrary();
    initVideoModal();
    initStoreLightbox();
    initOutboundTracking();
});

// Intersection Observer for scroll reveal animations
function initScrollAnimations() {
    const revealElements = document.querySelectorAll('.fade-up');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealElements.forEach(el => el.classList.add('visible'));
        return;
    }

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));
}
// Mobile Menu Toggle
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    if (menuBtn && mobileMenu) {
        const setMenuState = (isOpen) => {
            menuBtn.classList.toggle('active', isOpen);
            mobileMenu.classList.toggle('active', isOpen);
            menuBtn.setAttribute('aria-expanded', String(isOpen));
            menuBtn.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
            mobileMenu.setAttribute('aria-hidden', String(!isOpen));
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        menuBtn.addEventListener('click', () => {
            setMenuState(!mobileMenu.classList.contains('active'));
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                setMenuState(false);
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
                setMenuState(false);
                menuBtn.focus();
            }
        });
    }
}

// Navbar Scroll Effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
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
    }, { passive: true });
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
            }, 'Your prayer request has been received. Please check your email for a confirmation from our prayer team.');
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
            }, 'Check your inbox to confirm your subscription to The Lion Company.');
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
        if (payload.website) {
            form.reset();
            showFormFeedback(form, successMessage, 'success');
            return;
        }

        // All Lion website workflows stay on the same-origin endpoint so private
        // content and visitor acknowledgments use the verified Lion domain.
        const formsResponse = await fetch('/api/forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const formsResult = await formsResponse.json().catch(() => ({}));
        if (!formsResponse.ok) throw new Error(formsResult.error || 'Unable to process submission');

        form.reset();
        showFormFeedback(form, successMessage, 'success');
        trackEvent('form_submission_success', { form_type: payload.type });
    } catch (error) {
        // Do not place submitted form fields or provider responses in browser logs.
        console.error('Website form submission failed.');
        showFormFeedback(form, 'We could not send that just now. Please email Jonathan@TheLionCompany.org.', 'error');
        trackEvent('form_submission_error', { form_type: payload.type });
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
    feedback.setAttribute('role', type === 'success' ? 'status' : 'alert');
    feedback.setAttribute('aria-live', 'polite');
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
    setTimeout(() => { if (feedback.parentNode) feedback.remove(); }, 8000);
}

// Defer off-screen YouTube thumbnails so the media archive stays fast on mobile.
function initLazyMediaImages() {
    const images = document.querySelectorAll('[data-bg-image]');
    const loadImage = (element) => {
        element.style.backgroundImage = `url("${element.dataset.bgImage}")`;
        element.removeAttribute('data-bg-image');
    };

    if (!('IntersectionObserver' in window)) {
        images.forEach(loadImage);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                loadImage(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '500px 0px' });

    images.forEach(image => observer.observe(image));
}

function initMediaLibrary() {
    const search = document.getElementById('media-search');
    const filters = [...document.querySelectorAll('[data-media-filter]')];
    const grids = [...document.querySelectorAll('.media-grid')];
    const cards = [...document.querySelectorAll('.media-grid .media-card')];
    const result = document.getElementById('media-results');
    if (!search || !filters.length || !cards.length) return;

    const categoryLabels = {
        podcast: 'PODCAST',
        teaching: 'TEACHING',
        series: 'SERIES',
        conversation: 'CONVERSATION',
        relationships: 'RELATIONSHIP'
    };
    let activeFilter = 'all';

    grids.forEach((grid) => {
        const category = grid.dataset.mediaCategory;
        grid.querySelectorAll('.media-card').forEach((card) => {
            card.dataset.mediaCategory = category;
            const label = card.querySelector('.media-info span');
            if (label && categoryLabels[category]) label.textContent = categoryLabels[category];
        });
    });

    const updateResults = () => {
        const query = search.value.trim().toLowerCase();
        let visibleCount = 0;

        cards.forEach((card) => {
            const matchesCategory = activeFilter === 'all' || card.dataset.mediaCategory === activeFilter;
            const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
            const isVisible = matchesCategory && matchesQuery;
            card.hidden = !isVisible;
            if (isVisible) visibleCount += 1;
        });

        grids.forEach((grid) => {
            const hasVisibleCards = [...grid.querySelectorAll('.media-card')].some(card => !card.hidden);
            grid.hidden = !hasVisibleCards;
            const heading = grid.previousElementSibling;
            if (heading?.matches('h3')) heading.hidden = !hasVisibleCards;
        });

        result.textContent = visibleCount === 1
            ? '1 resource found.'
            : `${visibleCount} resources found.`;
    };

    filters.forEach((filter) => {
        filter.addEventListener('click', () => {
            activeFilter = filter.dataset.mediaFilter;
            filters.forEach((button) => {
                const isActive = button === filter;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
            updateResults();
            trackEvent('media_filter', { media_category: activeFilter });
        });
    });

    search.addEventListener('input', updateResults);
    updateResults();
}

// Video Modal Logic
function initVideoModal() {
    const modal = document.getElementById('video-modal');
    if (!modal) return;
    const iframe = document.getElementById('video-iframe');
    const youtubeLink = document.getElementById('video-youtube-link');
    const copyLink = document.getElementById('video-copy-link');
    const closeTriggers = document.querySelectorAll('.js-modal-close');
    const openTriggers = document.querySelectorAll('.video-trigger');
    const closeButton = modal.querySelector('.video-modal-close');
    let returnFocus = null;

    const shareUrlFor = (videoId) => {
        const url = new URL(window.location.href);
        url.hash = `watch-${videoId}`;
        return url.toString();
    };

    const openVideo = (videoId, updateHistory = true) => {
        if (!videoId) return;
        returnFocus = document.activeElement;
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
        youtubeLink.href = `https://www.youtube.com/watch?v=${videoId}`;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (updateHistory) history.replaceState(null, '', `#watch-${videoId}`);
        closeButton?.focus();
        trackEvent('video_play', { video_id: videoId });
    };

    const closeVideo = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        setTimeout(() => { iframe.src = ''; }, 300);
        document.body.style.overflow = '';
        if (window.location.hash.startsWith('#watch-')) {
            history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }
        returnFocus?.focus();
    };

    openTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            const videoId = trigger.getAttribute('data-video-id');
            openVideo(videoId);
        });
    });

    closeTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            closeVideo();
        });
    });

    copyLink?.addEventListener('click', async () => {
        const videoId = youtubeLink.href.match(/[?&]v=([^&]+)/)?.[1];
        if (!videoId) return;
        try {
            await navigator.clipboard.writeText(shareUrlFor(videoId));
            copyLink.textContent = 'Link copied';
            setTimeout(() => { copyLink.textContent = 'Copy share link'; }, 2000);
        } catch (_error) {
            copyLink.textContent = 'Copy unavailable';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeVideo();
            return;
        }

        if (e.key === 'Tab' && modal.classList.contains('active')) {
            const focusable = [...modal.querySelectorAll('a[href], button:not([disabled])')];
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    const hashMatch = window.location.hash.match(/^#watch-([A-Za-z0-9_-]+)$/);
    if (hashMatch && document.querySelector(`[data-video-id="${hashMatch[1]}"]`)) {
        openVideo(hashMatch[1], false);
    }
}

// Store Lightbox — only shows once per visit
function initStoreLightbox() {
    const modal = document.getElementById('store-modal');
    if (!modal) return;
    const closeTriggers = modal.querySelectorAll('.js-lightbox-close');
    const closeButton = modal.querySelector('.lightbox-close');
    const storageKey = 'lion-store-lightbox-shown';
    let hasShown = false;

    try {
        hasShown = sessionStorage.getItem(storageKey) === 'true';
    } catch (_error) {
        hasShown = false;
    }

    const closeLightbox = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    setTimeout(() => {
        if (!hasShown) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            hasShown = true;
            try { sessionStorage.setItem(storageKey, 'true'); } catch (_error) { /* storage may be unavailable */ }
            closeButton?.focus();
        }
    }, 12000);

    closeTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            closeLightbox();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeLightbox();
        }
    });
}

function trackEvent(name, parameters = {}) {
    if (typeof window.gtag === 'function') {
        window.gtag('event', name, parameters);
    }
}

function initOutboundTracking() {
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link) return;
        const destination = new URL(link.href, window.location.href);
        const platform = link.dataset.platform;

        if (platform) {
            trackEvent('podcast_platform_click', {
                platform,
                link_url: destination.href
            });
            return;
        }

        if (destination.origin !== window.location.origin && !destination.href.startsWith('mailto:')) {
            trackEvent('outbound_click', {
                link_domain: destination.hostname,
                link_url: destination.href,
                link_text: link.textContent.trim().slice(0, 100)
            });
        }
    });
}
