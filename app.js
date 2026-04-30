/* ============================================
   MHP3RD MIX SET GUIDE — APP.JS
   Firebase v12 Modular (Firestore only)
   Fitur: Search, Rating, Komentar, Filter, Contributors+Social, Team, Animasi
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: "AIzaSyDG9ySIMBkUsVHXRC7M5WoMoRxMB3BuaZ0",
    authDomain: "mh3rd-fdd53.firebaseapp.com",
    projectId: "mh3rd-fdd53",
    storageBucket: "mh3rd-fdd53.firebasestorage.app",
    messagingSenderId: "212751426267",
    appId: "1:212751426267:web:c263934dfb500c50dae2fe"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== WEAPONS =====
const WEAPONS = [
    { id: 'greatsword', name: 'Great Sword', icon: '🗡️' },
    { id: 'longsword', name: 'Long Sword', icon: '⚔️' },
    { id: 'swordshield', name: 'Sword & Shield', icon: '🛡️' },
    { id: 'dualblades', name: 'Dual Blades', icon: '🔪' },
    { id: 'hammer', name: 'Hammer', icon: '🔨' },
    { id: 'huntinghorn', name: 'Hunting Horn', icon: '🎵' },
    { id: 'lance', name: 'Lance', icon: '🔱' },
    { id: 'gunlance', name: 'Gunlance', icon: '💥' },
    { id: 'switchaxe', name: 'Switch Axe', icon: '🪓' },
    { id: 'lightbowgun', name: 'Light Bowgun', icon: '🔫' },
    { id: 'heavybowgun', name: 'Heavy Bowgun', icon: '💣' },
    { id: 'bow', name: 'Bow', icon: '🏹' }
];

// ===== AVATARS =====
const CONTRIBUTOR_AVATARS = ['🦁', '🐉', '⚔️', '🛡️', '🏆'];
const TEAM_AVATARS = ['👑', '⭐', '💎', '🔥', '🗡️'];

// ===== STATE =====
let allMixSets = {};
let globalFilter = 'all';
let searchDebounce = null;

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    renderWeaponNav();
    fetchAllData();
    fetchContributors();
    fetchTeam();
    initImageModal();
    initSearch();
});

// ===== NAVBAR =====
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// ===== RENDER WEAPON NAVIGATION =====
function renderWeaponNav() {
    const weaponNavGrid = document.getElementById('weaponNavGrid');
    weaponNavGrid.innerHTML = '';

    WEAPONS.forEach(weapon => {
        const data = allMixSets[weapon.id];
        let lowCount = 0, highCount = 0, total = 0;

        if (data) {
            lowCount = data.low.length;
            highCount = data.high.length;
            total = lowCount + highCount;
        }

        const card = document.createElement('a');
        card.className = 'weapon-nav-card';
        card.href = `#section-${weapon.id}`;
        card.innerHTML = `
            <span class="icon">${weapon.icon}</span>
            <div class="name">${weapon.name}</div>
            <div class="count">${total > 0 ? `${total} set (LR: ${lowCount} · HR: ${highCount})` : 'Coming soon...'}</div>
        `;
        weaponNavGrid.appendChild(card);
    });
}

// ===== FETCH ALL DATA =====
async function fetchAllData() {
    try {
        for (const weapon of WEAPONS) {
            const mixsetsRef = collection(db, 'weapons', weapon.id, 'mixsets');
            const lowSnap = await getDocs(query(mixsetsRef, where('rank', '==', 'low')));
            const highSnap = await getDocs(query(mixsetsRef, where('rank', '==', 'high')));

            allMixSets[weapon.id] = { low: [], high: [] };

            lowSnap.forEach(docSnap => {
                allMixSets[weapon.id].low.push({ id: docSnap.id, ...docSnap.data() });
            });
            highSnap.forEach(docSnap => {
                allMixSets[weapon.id].high.push({ id: docSnap.id, ...docSnap.data() });
            });
        }
        renderWeaponNav();
        renderWeaponSections();
    } catch (error) {
        console.error('Error fetching data:', error);
        renderWeaponNav();
        renderWeaponSections();
    }
}

// ===== FETCH CONTRIBUTORS =====
async function fetchContributors() {
    try {
        const docRef = doc(db, 'settings', 'topContributors');
        const docSnap = await getDoc(docRef);
        let contributors = [];

        if (docSnap.exists()) {
            contributors = docSnap.data().contributors || [];
        }

        renderContributors(contributors);
    } catch (error) {
        console.error('Error fetching contributors:', error);
        renderContributors([]);
    }
}

// ===== FETCH TEAM =====
async function fetchTeam() {
    try {
        const docRef = doc(db, 'settings', 'teamMembers');
        const docSnap = await getDoc(docRef);
        let members = [];

        if (docSnap.exists()) {
            members = docSnap.data().members || [];
        }

        renderTeam(members);
    } catch (error) {
        console.error('Error fetching team:', error);
        renderTeam([]);
    }
}

// ===== RENDER CONTRIBUTORS =====
function renderContributors(contributors) {
    const grid = document.getElementById('contributorsGrid');
    if (!grid) return;

    const slots = [];
    for (let i = 0; i < 5; i++) {
        slots.push(contributors[i] || { name: '', amount: '', tiktok: '', facebook: '', youtube: '' });
    }

    const rankLabels = ['🏆 #1', '🥈 #2', '🥉 #3', '⭐ #4', '⭐ #5'];

    grid.innerHTML = slots.map((c, i) => {
        const isEmpty = !c.name || c.name.trim() === '';

        if (isEmpty) {
            return `
                <div class="contributor-card empty">
                    <div class="contributor-rank">${rankLabels[i]}</div>
                    <div class="contributor-avatar">❓</div>
                    <div class="contributor-name">Waiting...</div>
                    <div class="contributor-amount">—</div>
                </div>
            `;
        }

        // Social links
        let socialsHtml = '';
        if (c.tiktok) {
            socialsHtml += `<a href="${escapeHTML(c.tiktok)}" target="_blank" rel="noopener" class="social-tiktok" title="TikTok">🎵</a>`;
        }
        if (c.facebook) {
            socialsHtml += `<a href="${escapeHTML(c.facebook)}" target="_blank" rel="noopener" class="social-facebook" title="Facebook">📘</a>`;
        }
        if (c.youtube) {
            socialsHtml += `<a href="${escapeHTML(c.youtube)}" target="_blank" rel="noopener" class="social-youtube" title="YouTube">▶️</a>`;
        }

        return `
            <div class="contributor-card">
                <div class="contributor-rank">${rankLabels[i]}</div>
                <div class="contributor-avatar">${CONTRIBUTOR_AVATARS[i]}</div>
                <div class="contributor-name">${escapeHTML(c.name)}</div>
                <div class="contributor-amount">${escapeHTML(c.amount)}</div>
                ${socialsHtml ? `<div class="contributor-socials">${socialsHtml}</div>` : ''}
            </div>
        `;
    }).join('');
}

// ===== RENDER TEAM =====
function renderTeam(members) {
    const grid = document.getElementById('teamGrid');
    if (!grid) return;

    const slots = [];
    for (let i = 0; i < 5; i++) {
        slots.push(members[i] || { name: '', nickMH: '', tiktok: '', youtube: '' });
    }

    grid.innerHTML = slots.map((m, i) => {
        const isEmpty = !m.name || m.name.trim() === '';

        if (isEmpty) {
            return `
                <div class="team-card empty">
                    <div class="team-avatar">❓</div>
                    <div class="team-name">Waiting...</div>
                    <div class="team-role">Slot #${i + 1}</div>
                </div>
            `;
        }

        const tiktokLink = m.tiktok ? 
            `<a href="${escapeHTML(m.tiktok)}" target="_blank" rel="noopener">@${escapeHTML(m.tiktok.replace(/https?:\/\/(www\.)?tiktok\.com\/@?/i, ''))}</a>` : '—';
        
        const youtubeLink = m.youtube ? 
            `<a href="${escapeHTML(m.youtube)}" target="_blank" rel="noopener">Channel YouTube</a>` : '—';

        return `
            <div class="team-card">
                <div class="team-avatar">${TEAM_AVATARS[i]}</div>
                <div class="team-name">${escapeHTML(m.name)}</div>
                <div class="team-role">Hunter</div>
                <div class="team-info">
                    <div class="team-info-item">
                        <span class="info-icon">🎮</span>
                        <span>${escapeHTML(m.nickMH || '—')}</span>
                    </div>
                    <div class="team-info-item">
                        <span class="info-icon">🎵</span>
                        <span>${tiktokLink}</span>
                    </div>
                    <div class="team-info-item">
                        <span class="info-icon">▶️</span>
                        <span>${youtubeLink}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== SET GLOBAL FILTER =====
window.setGlobalFilter = function(filter) {
    globalFilter = filter;

    document.querySelectorAll('.global-filter-tabs .filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === filter) {
            tab.classList.add('active');
        }
    });

    renderWeaponSections();
};

// ===== RENDER WEAPON SECTIONS =====
function renderWeaponSections() {
    const container = document.getElementById('weaponSections');
    container.innerHTML = '';

    const hasAnyData = WEAPONS.some(w => {
        const data = allMixSets[w.id];
        return data && (data.low.length > 0 || data.high.length > 0);
    });

    if (!hasAnyData) {
        container.innerHTML = `
            <div class="empty-state" style="padding:5rem;">
                <span class="icon">📋</span>
                <p>Belum ada data mix set. Buka <a href="dev.html" style="color:var(--gold);">Dev Mode</a> untuk menambahkan.</p>
            </div>
        `;
        return;
    }

    WEAPONS.forEach(weapon => {
        const data = allMixSets[weapon.id];
        if (!data) return;

        const showLow = globalFilter === 'all' || globalFilter === 'low';
        const showHigh = globalFilter === 'all' || globalFilter === 'high';

        const hasLow = showLow && data.low.length > 0;
        const hasHigh = showHigh && data.high.length > 0;

        if (!hasLow && !hasHigh) return;

        const section = document.createElement('div');
        section.className = 'weapon-section';
        section.id = `section-${weapon.id}`;

        let html = `
            <div class="weapon-header">
                <span class="icon-large">${weapon.icon}</span>
                <h2>${weapon.name} Mix Set</h2>
            </div>
        `;

        if (hasLow) {
            html += `
                <div class="rank-section">
                    <h3><span class="rank-badge rank-low">LOW RANK</span> Low Rank Armor Sets</h3>
                    <div class="mixset-grid">
                        ${data.low.map(set => renderMixSetCard(set, weapon.id, 'low')).join('')}
                    </div>
                </div>
            `;
        }

        if (hasHigh) {
            html += `
                <div class="rank-section">
                    <h3><span class="rank-badge rank-high">HIGH RANK</span> High Rank Armor Sets</h3>
                    <div class="mixset-grid">
                        ${data.high.map(set => renderMixSetCard(set, weapon.id, 'high')).join('')}
                    </div>
                </div>
            `;
        }

        section.innerHTML = html;
        container.appendChild(section);
    });

    attachCardListeners();
}

// ===== RENDER SINGLE MIX SET CARD =====
function renderMixSetCard(set, weaponId, rank) {
    const thumbnail = set.images && set.images.length > 0
        ? set.images[0]
        : 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#2d2219"/><text x="40" y="48" text-anchor="middle" fill="#7a6e5e" font-size="28">⚔</text></svg>');

    const skillsHtml = set.skills && set.skills.length > 0
        ? set.skills.map(s => `<span class="skill-tag">${escapeHTML(s)}</span>`).join('')
        : '';

    const pieces = set.pieces || [];
    const kelebihan = set.kelebihan || [];
    const kekurangan = set.kekurangan || [];
    const notes = set.notes || [];
    const images = set.images || [];
    const rating = set.rating || 0;
    const ratingCount = set.ratingCount || 0;
    const comments = set.comments || [];

    const avgRating = ratingCount > 0 ? (rating / ratingCount).toFixed(1) : '0.0';

    return `
        <div class="mixset-card" data-set-id="${set.id}" data-weapon-id="${weaponId}" data-set-name="${escapeHTML(set.name)}">
            <div class="mixset-card-header">
                <img class="mixset-card-thumb" src="${thumbnail}" alt="${escapeHTML(set.name)}" loading="lazy" onerror="this.style.display='none'">
                <div class="mixset-card-info">
                    <h4>${escapeHTML(set.name)}</h4>
                    <div class="skills-preview">${skillsHtml || '<span style="color:var(--text-muted);font-size:0.8rem;">No skills</span>'}</div>
                </div>
            </div>
            <div class="mixset-card-body">
                ${pieces.length > 0 ? `
                <div class="detail-section">
                    <h5>🛡️ Armor Pieces</h5>
                    <ul>
                        ${pieces.map(p => `<li>${escapeHTML(typeof p === 'string' ? p : p.name || p)}</li>`).join('')}
                    </ul>
                </div>` : ''}

                ${set.skills && set.skills.length > 0 ? `
                <div class="detail-section">
                    <h5>⚡ Skills</h5>
                    <div class="skills-preview">${skillsHtml}</div>
                </div>` : ''}

                ${kelebihan.length > 0 ? `
                <div class="detail-section pros">
                    <h5>✅ Kelebihan</h5>
                    <ul>${kelebihan.map(k => `<li>${escapeHTML(k)}</li>`).join('')}</ul>
                </div>` : ''}

                ${kekurangan.length > 0 ? `
                <div class="detail-section cons">
                    <h5>❌ Kekurangan</h5>
                    <ul>${kekurangan.map(k => `<li>${escapeHTML(k)}</li>`).join('')}</ul>
                </div>` : ''}

                ${notes.length > 0 ? `
                <div class="detail-section">
                    <h5>📝 Catatan</h5>
                    <ul>${notes.map(n => `<li>${escapeHTML(n)}</li>`).join('')}</ul>
                </div>` : ''}

                ${images.length > 0 ? `
                <div class="detail-images">
                    ${images.map(img => `<img src="${img}" alt="Preview" loading="lazy" onclick="event.stopPropagation(); openImageModal('${img}')">`).join('')}
                </div>` : ''}

                <!-- RATING -->
                <div class="rating-section">
                    <div class="rating-stars" data-set-id="${set.id}" data-weapon-id="${weaponId}" data-rank="${rank}" onclick="event.stopPropagation();">
                        ${[1,2,3,4,5].map(i => `
                            <span class="rating-star ${i <= Math.round(rating / (ratingCount || 1)) ? 'filled' : ''}" 
                                  data-value="${i}" 
                                  onclick="rateSet('${set.id}', '${weaponId}', '${rank}', ${i})">
                                ★
                            </span>
                        `).join('')}
                    </div>
                    <span class="rating-info">${avgRating} (${ratingCount} suara)</span>
                </div>

                <!-- KOMENTAR -->
                <div class="comments-section">
                    <h5>💬 Komentar</h5>
                    <div class="comment-list" id="comments-${set.id}">
                        ${comments.slice(-10).map(c => `
                            <div class="comment-item">
                                <div class="comment-author">${escapeHTML(c.author || 'Anonim')}</div>
                                <div class="comment-text">${escapeHTML(c.text)}</div>
                                <div class="comment-date">${c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('id-ID') : ''}</div>
                            </div>
                        `).join('')}
                        ${comments.length === 0 ? '<p style="color:var(--text-muted);font-size:0.8rem;">Belum ada komentar.</p>' : ''}
                    </div>
                    <div class="comment-form" onclick="event.stopPropagation();">
                        <input type="text" id="commentInput-${set.id}" placeholder="Tulis komentar..." maxlength="300">
                        <button onclick="addComment('${set.id}', '${weaponId}', '${rank}')">Kirim</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== ATTACH CARD LISTENERS =====
function attachCardListeners() {
    document.querySelectorAll('.mixset-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.tagName === 'IMG' || 
                e.target.classList.contains('rating-star') ||
                e.target.closest('.comment-form') ||
                e.target.closest('button')) return;
            this.classList.toggle('expanded');
        });
    });
}

// ===== RATING =====
window.rateSet = async function(setId, weaponId, rank, value) {
    try {
        const docRef = doc(db, 'weapons', weaponId, 'mixsets', setId);
        await updateDoc(docRef, {
            rating: increment(value),
            ratingCount: increment(1)
        });

        const rankKey = rank === 'low' ? 'low' : 'high';
        const set = allMixSets[weaponId][rankKey].find(s => s.id === setId);
        if (set) {
            set.rating = (set.rating || 0) + value;
            set.ratingCount = (set.ratingCount || 0) + 1;
        }

        showToast('✅ Terima kasih atas ratingnya!');
        renderWeaponSections();
    } catch (error) {
        console.error('Rating error:', error);
        showToast('❌ Gagal memberi rating.');
    }
};

// ===== KOMENTAR =====
window.addComment = async function(setId, weaponId, rank) {
    const input = document.getElementById(`commentInput-${setId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    try {
        const docRef = doc(db, 'weapons', weaponId, 'mixsets', setId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const comments = data.comments || [];
        comments.push({
            author: 'Anonim',
            text: text,
            createdAt: new Date()
        });

        await updateDoc(docRef, { comments: comments });

        const rankKey = rank === 'low' ? 'low' : 'high';
        const set = allMixSets[weaponId][rankKey].find(s => s.id === setId);
        if (set) {
            set.comments = comments;
        }

        input.value = '';
        showToast('✅ Komentar ditambahkan!');
        renderWeaponSections();
    } catch (error) {
        console.error('Comment error:', error);
        showToast('❌ Gagal menambah komentar.');
    }
};

// ===== IMAGE MODAL =====
function initImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('imageModalImg');

    modal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('active');
        }
    });
}

window.openImageModal = function(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('imageModalImg');
    modalImg.src = src;
    modal.classList.add('active');
};

// ===== SEARCH =====
function initSearch() {
    const heroInput = document.getElementById('heroSearchInput');
    const heroLoading = document.getElementById('heroSearchLoading');
    const heroResults = document.getElementById('heroSearchResults');

    heroInput.addEventListener('input', function() {
        handleSearch(this.value, heroLoading, heroResults);
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.hero-search')) {
            heroResults.classList.remove('active');
        }
    });
}

function handleSearch(query, loadingEl, resultsEl) {
    if (searchDebounce) clearTimeout(searchDebounce);

    if (query.length < 2) {
        resultsEl.classList.remove('active');
        resultsEl.innerHTML = '';
        loadingEl.classList.remove('active');
        document.querySelectorAll('.mixset-card.highlight').forEach(c => c.classList.remove('highlight'));
        return;
    }

    loadingEl.classList.add('active');
    resultsEl.classList.remove('active');

    searchDebounce = setTimeout(() => {
        const results = [];
        const q = query.toLowerCase();

        WEAPONS.forEach(weapon => {
            const data = allMixSets[weapon.id];
            if (!data) return;

            [...data.low, ...data.high].forEach(set => {
                if (set.name.toLowerCase().includes(q)) {
                    results.push({
                        ...set,
                        weaponId: weapon.id,
                        weaponName: weapon.name,
                        weaponIcon: weapon.icon
                    });
                }
            });
        });

        loadingEl.classList.remove('active');

        if (results.length > 0) {
            resultsEl.innerHTML = results.map(r => `
                <div class="search-result-item" onclick="navigateToSet('${r.weaponId}', '${r.id}', '${r.rank}')">
                    <span class="result-icon">${r.weaponIcon}</span>
                    <div class="result-info">
                        <div class="result-name">${escapeHTML(r.name)}</div>
                        <div class="result-weapon">${r.weaponName}</div>
                        <span class="result-rank ${r.rank === 'high' ? 'rank-high' : 'rank-low'}">${r.rank === 'high' ? 'HIGH RANK' : 'LOW RANK'}</span>
                    </div>
                </div>
            `).join('');
            resultsEl.classList.add('active');
        } else {
            resultsEl.innerHTML = '<div class="search-no-result">🔍 Tidak ditemukan</div>';
            resultsEl.classList.add('active');
        }
    }, 400);
}

// ===== NAVIGATE TO SET =====
window.navigateToSet = function(weaponId, setId, rank) {
    globalFilter = 'all';
    document.querySelectorAll('.global-filter-tabs .filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === 'all') {
            tab.classList.add('active');
        }
    });

    renderWeaponSections();

    setTimeout(() => {
        const section = document.getElementById(`section-${weaponId}`);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });

            setTimeout(() => {
                const card = document.querySelector(`.mixset-card[data-set-id="${setId}"]`);
                if (card) {
                    card.classList.add('highlight');
                    card.classList.add('expanded');
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    setTimeout(() => {
                        card.classList.remove('highlight');
                    }, 2000);
                }
            }, 600);
        }
    }, 300);

    document.querySelectorAll('.search-results').forEach(el => el.classList.remove('active'));
    document.getElementById('heroSearchInput').value = '';
};

// ===== TOAST =====
function showToast(message, duration = 3500) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===== HELPER =====
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== EXPORT DATA =====
window.exportData = async function() {
    const data = {};
    for (const weapon of WEAPONS) {
        const mixsetsRef = collection(db, 'weapons', weapon.id, 'mixsets');
        const lowSnap = await getDocs(query(mixsetsRef, where('rank', '==', 'low')));
        const highSnap = await getDocs(query(mixsetsRef, where('rank', '==', 'high')));

        data[weapon.id] = { low: [], high: [] };
        lowSnap.forEach(d => data[weapon.id].low.push({ id: d.id, ...d.data() }));
        highSnap.forEach(d => data[weapon.id].high.push({ id: d.id, ...d.data() }));
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mhp3rd-mixset-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Data berhasil diexport!');
};

console.log('🔥 MHP3rd Mix Set Guide - app.js loaded');
console.log('🔍 Search | 🎚️ Filter | ⭐ Rating | 💬 Komentar | 🏆 Contributors+Social | 👥 Team | ✨ Animasi');
