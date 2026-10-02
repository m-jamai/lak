/* ==========================================================================
   NAVIGATION — Profile (logo + name), Experiences, Projects, Resources, Contact
   ========================================================================== */

/* When a link jumps to an anchor, the scroll-follow below pauses briefly
   so the highlight does not flicker on the way there. */
let spyLockUntil = 0;

function setActiveNav(viewName, anchorKey) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const isActive = link.dataset.view === viewName && (link.dataset.scroll || '') === (anchorKey || '');
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
}

function switchView(viewName, scrollTarget) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active-view'));

    const activeTarget = document.getElementById(`view-${viewName}`);
    if (activeTarget) activeTarget.classList.add('active-view');

    // Only one item is highlighted: the exact view + anchor that was chosen.
    setActiveNav(viewName, scrollTarget);

    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (scrollTarget && activeTarget) {
        const anchor = document.getElementById(scrollTarget);
        if (anchor) {
            spyLockUntil = performance.now() + 1100;
            setTimeout(() => anchor.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
        }
    }
}

/* Profile page: Profile / Education / Certifications follow the scroll */
function updateProfileSpy() {
    const view = document.getElementById('view-profile');
    if (!view || !view.classList.contains('active-view')) return;
    if (performance.now() < spyLockUntil) return;

    const line = window.innerHeight * 0.38;
    let key = '';
    ['education', 'certifications'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) key = id;
    });

    // At the very bottom, the last section counts even if its title never reaches the line.
    const doc = document.documentElement;
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= doc.scrollHeight - 4) key = 'certifications';

    setActiveNav('profile', key);
}

let spyTicking = false;
window.addEventListener('scroll', () => {
    if (spyTicking) return;
    spyTicking = true;
    requestAnimationFrame(() => { updateProfileSpy(); spyTicking = false; });
}, { passive: true });

// Start at the minimal landing page.
document.addEventListener('DOMContentLoaded', () => {
    switchView('landing');

    // Navigation items are list elements: make them reachable by keyboard.
    document.querySelectorAll('.nav-link').forEach(link => {
        link.setAttribute('tabindex', '0');
        link.setAttribute('role', 'link');
        link.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); link.click(); }
        });
    });
});

/* Top-bar menu (tablet and phone, below 900 px) */
const mobileHeader = document.getElementById('mobile-header');
const menuToggle = document.getElementById('menu-toggle');

function closeMobileMenu() {
    if (!mobileHeader || !menuToggle) return;
    mobileHeader.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = 'Menu';
}

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        const open = mobileHeader.classList.toggle('menu-open');
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.textContent = open ? 'Close' : 'Menu';
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileMenu(); });
    document.addEventListener('click', e => {
        if (mobileHeader.classList.contains('menu-open') && !mobileHeader.contains(e.target)) closeMobileMenu();
    });
}

/* ==========================================================================
   RESOURCES — built from RESOURCES (see js/resources.js)
   ========================================================================== */

const RESOURCE_CATEGORIES = [
    {
        key: 'articles',
        title: 'Articles & Notes',
        description: 'My own write-ups: technical articles, notes and reflections.',
        defaultLink: 'Read'
    },
    {
        key: 'documents',
        title: 'Documents & Tools',
        description: 'Files I share: templates, cheat sheets, scripts and models.',
        defaultLink: 'Download'
    },
    {
        key: 'recommendations',
        title: 'Recommendations',
        description: 'Books, courses and links I recommend.',
        defaultLink: 'Visit'
    }
];

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return escapeHTML(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderResourceItem(item, category) {
    const isExternal = item.url && /^https?:\/\//.test(item.url);
    const label = item.linkLabel || category.defaultLink;
    const tags = (item.tags || []).map(t => `<li>${escapeHTML(t)}</li>`).join('');
    const download = category.key === 'documents' && item.url && !isExternal ? ' download' : '';
    const target = isExternal ? ' target="_blank" rel="noopener"' : '';

    return `
        <article class="resource-item">
            <div>
                ${item.kind ? `<div class="resource-kind">${escapeHTML(item.kind)}</div>` : ''}
                ${item.date ? `<div class="resource-date">${formatDate(item.date)}</div>` : ''}
            </div>
            <div>
                <div class="resource-title">${escapeHTML(item.title)}</div>
                ${item.description ? `<div class="resource-desc">${escapeHTML(item.description)}</div>` : ''}
                ${item.text ? `<div class="resource-text">${escapeHTML(item.text)}</div>` : ''}
                ${tags ? `<ul class="skill-tags resource-tags">${tags}</ul>` : ''}
            </div>
            <div>
                ${item.url ? `<a class="resource-link" href="${escapeHTML(item.url)}"${target}${download}>${escapeHTML(label)}</a>` : ''}
            </div>
        </article>`;
}

function renderResources() {
    const jump = document.getElementById('resource-jump');
    const blocks = document.getElementById('resource-blocks');
    if (!jump || !blocks) return;

    const data = typeof RESOURCES !== 'undefined' ? RESOURCES : {};

    const prepared = RESOURCE_CATEGORIES.map((category, i) => {
        const items = (data[category.key] || [])
            .filter(item => item && item.title)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return { category, items, index: String(i + 1).padStart(2, '0') };
    });

    jump.innerHTML = prepared.map(({ category, items, index }) => `
        <button class="resource-jump-item" data-target="resources-${category.key}">
            <div class="resource-jump-index">${index}</div>
            <div class="resource-jump-title">${category.title}</div>
            <div class="resource-jump-count">${items.length} ${items.length === 1 ? 'entry' : 'entries'}</div>
        </button>`).join('');

    jump.querySelectorAll('.resource-jump-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    blocks.innerHTML = prepared.map(({ category, items, index }) => `
        <section class="resource-block" id="resources-${category.key}">
            <div class="resource-block-head">
                <span class="resource-block-index">${index}</span>
                <h2 class="resource-block-title">${category.title}</h2>
            </div>
            <p class="resource-block-desc">${category.description}</p>
            <div class="resource-list">
                ${items.length
                    ? items.map(item => renderResourceItem(item, category)).join('')
                    : '<div class="resource-empty">Nothing here yet.</div>'}
            </div>
        </section>`).join('');
}

renderResources();
