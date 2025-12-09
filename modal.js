// modal.js - handles nav, modal, animations, star-review saving, responsiveness-friendly interactions

// ---- Smooth scroll navigation (safeguarded for anchors that exist) ----
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (!target) return; // allow default if no section
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
    });
});

// ---- Simple reveal-on-scroll for .reveal sections ----
const revealElems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

revealElems.forEach(el => revealObserver.observe(el));

// ---- Activity item highlight behavior ----
const activityItems = document.querySelectorAll('.activity-item');
activityItems.forEach(item => {
    item.addEventListener('click', () => {
        activityItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        // slight timeout to remove highlight after a while for UX (optional)
        setTimeout(() => item.classList.remove('active'), 2000);
    });
});

// ---- Transparent nav effect on scroll ----
const header = document.querySelector('header');
const hero = document.getElementById('hero') || { offsetHeight: 600 };
window.addEventListener('scroll', () => {
    if (window.scrollY > (hero.offsetHeight - 10)) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
});

// ---- Modal Image Viewer with caption ----
const modal = document.getElementById('imageModal');
const modalInner = modal?.querySelector('.modal-inner');
const modalImg = document.getElementById('modalImg');
const modalCaption = document.getElementById('modalCaption');
const modalClose = document.getElementById('modalClose');

function openModal(src, alt, caption) {
    if (!modal) return;
    modalImg.src = src || '';
    modalImg.alt = alt || '';
    modalCaption.textContent = caption || '';
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // prevent background scroll
}

function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modalImg.src = '';
    modalCaption.textContent = '';
    document.body.style.overflow = '';
}

// Attach click handlers to images
document.querySelectorAll('.activity-img').forEach(img => {
    img.addEventListener('click', (e) => {
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt') || '';
        const caption = img.dataset.caption || '';
        openModal(src, alt, caption);
    });
});

// Close controls
modalClose?.addEventListener('click', closeModal);
// clicking outside modal-inner closes modal
modal?.addEventListener('click', (e) => {
    if (!modalInner.contains(e.target)) closeModal();
});
// ESC key closes modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ---- Star-rating + review submit system (localStorage) ----
const reviewForm = document.getElementById('reviewForm');
const reviewsList = document.getElementById('reviewsList');
const clearBtn = document.getElementById('clearReviews');

const STORAGE_KEY = 'tayug_reviews_v1';

function loadReviews() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (err) {
        console.error('Failed to parse reviews', err);
        return [];
    }
}
function saveReviews(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// render reviews
function renderReviews() {
    const reviews = loadReviews();
    reviewsList.innerHTML = '';
    if (!reviews.length) {
        reviewsList.innerHTML = '<p class="review-card">No reviews yet — be the first to share your experience!</p>';
        return;
    }
    reviews.slice().reverse().forEach(r => {
        const card = document.createElement('div');
        card.className = 'review-card';
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        const date = new Date(r.date).toLocaleString();
        card.innerHTML = `<div style="font-weight:700;margin-bottom:6px">${stars} <span style="font-weight:500;color:#f0e7b8;margin-left:8px;font-size:13px">${date}</span></div>
                          <div style="white-space:pre-wrap">${escapeHtml(r.text)}</div>`;
        reviewsList.appendChild(card);
    });
}

// sanitize text to avoid injection in innerHTML (we use textContent for untrusted text where possible)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// handle submit
reviewForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    // get rating
    const rating = parseInt(document.querySelector('input[name="rating"]:checked')?.value || '0', 10);
    const text = document.getElementById('reviewText')?.value?.trim() || '';

    if (!rating) {
        alert('Please select a star rating before submitting.');
        return;
    }

    const reviews = loadReviews();
    reviews.push({ rating, text, date: new Date().toISOString() });
    saveReviews(reviews);
    renderReviews();

    // UX: temporary thank-you feedback and reset form
    reviewForm.reset();
    const old = document.getElementById('submitReview');
    if (old) {
        old.textContent = 'Thanks!';
        setTimeout(() => old.textContent = 'Submit Review', 1400);
    }
});

// clear reviews (dangerous action: confirm)
clearBtn?.addEventListener('click', () => {
    if (!confirm('Clear all saved reviews? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderReviews();
});

// initial render
renderReviews();

// ---- small accessibility: label-star keyboard support ----
document.querySelectorAll('.star-rating label').forEach(label => {
    label.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            label.click();
        }
    });
});
