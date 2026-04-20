// ==========================================
// 1. STATE & DATA INITIALIZATION
// ==========================================
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let currentCategory = 'All';
let currentPage = 1;
const itemsPerPage = 8;
let currentDisplayData = [];

// AWAL MUASAL DATA
async function fetchProducts() {
    let localData = JSON.parse(localStorage.getItem('products'));
    if (!localData || localData.length === 0) {
        try {
            const res = await fetch('data/products.json');
            localData = await res.json();
            localStorage.setItem('products', JSON.stringify(localData));
        } catch (e) { 
            console.error("Gagal load database. Pastikan folder data/products.json ada."); 
        }
    }
    products = localData;
    currentDisplayData = [...products];
    displayPage(1);
    updateUIStats();
    renderRecentReviews();
    checkAuthUI();
}

// ==========================================
// 2. RENDER ENGINE (GRID UTAMA)
// ==========================================
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const allReviews = JSON.parse(localStorage.getItem('productReviews')) || {};

    items.forEach(p => {
        const reviews = allReviews[p.id] || [];
        const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "5.0";
        const isWished = wishlist.includes(p.id);

        grid.innerHTML += `
            <div class="bg-white dark:bg-slate-800 rounded-[2.5rem] p-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-2xl transition-all duration-500 group">
                <div class="relative overflow-hidden rounded-[2rem] aspect-square mb-6 bg-slate-100 dark:bg-slate-900 cursor-pointer" onclick="toggleDetailSidebar(${p.id})">
                    <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <button onclick="event.stopPropagation(); toggleWishlist(${p.id})" class="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur h-11 w-11 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-10">
                        <span class="text-lg">${isWished ? '❤️' : '🤍'}</span>
                    </button>
                </div>
                <div class="space-y-3 px-2">
                    <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>${p.category}</span>
                        <span class="text-yellow-500">⭐ ${avg} <small class="text-slate-400">(${reviews.length})</small></span>
                    </div>
                    <h3 class="font-bold text-lg line-clamp-1 hover:text-anamac-600 transition-colors cursor-pointer" onclick="toggleDetailSidebar(${p.id})">${p.name}</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">${p.description}</p>
                    <div class="pt-4 flex justify-between items-center">
                        <span class="text-xl font-black text-anamac-600">Rp ${Number(p.price).toLocaleString('id-ID')}</span>
                        <button onclick="addToCart(${p.id})" class="bg-slate-900 dark:bg-anamac-600 text-white h-12 w-12 rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-all">🛒</button>
                    </div>
                </div>
            </div>`;
    });
}

// ==========================================
// 3. LOGIKA DUAL SIDEBAR (SINKRON CLASS)
// ==========================================

function toggleWishlistSidebar() {
    const drawer = document.getElementById('wishlistDrawer');
    const overlay = document.getElementById('sidebarOverlay');
    
    // Pastikan sidebar detail tutup dulu
    const detailDrawer = document.getElementById('detailDrawer');
    if (detailDrawer) detailDrawer.classList.add('translate-x-full');

    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('opacity-100');
        drawer.classList.remove('-translate-x-full');
        drawer.classList.add('translate-x-0');
    }, 10);
    
    document.body.style.overflow = 'hidden';
    renderWishlistInDrawer();
}

function toggleDetailSidebar(productId) {
    const drawer = document.getElementById('detailDrawer');
    const overlay = document.getElementById('sidebarOverlay');
    const p = products.find(x => x.id === productId);

    // Pastikan wishlist tutup dulu
    const wishDrawer = document.getElementById('wishlistDrawer');
    if (wishDrawer) wishDrawer.classList.add('-translate-x-full');

    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('opacity-100');
        drawer.classList.remove('translate-x-full');
        drawer.classList.add('translate-x-0');
    }, 10);

    document.body.style.overflow = 'hidden';
    renderDetailInDrawer(p);
}

function closeAllSidebars() {
    const left = document.getElementById('wishlistDrawer');
    const right = document.getElementById('detailDrawer');
    const overlay = document.getElementById('sidebarOverlay');

    if (left) {
        left.classList.remove('translate-x-0');
        left.classList.add('-translate-x-full');
    }
    if (right) {
        right.classList.remove('translate-x-0');
        right.classList.add('translate-x-full');
    }

    overlay.classList.remove('opacity-100');
    setTimeout(() => {
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}

// Alias buat tombol di HTML
function closeSidebar() { closeAllSidebars(); }

// ==========================================
// 4. RENDERER KONTEN SIDEBAR
// ==========================================

function renderWishlistInDrawer() {
    const container = document.getElementById('wishlistContent');
    const wished = products.filter(p => wishlist.includes(p.id));
    
    container.innerHTML = wished.length ? wished.map(p => `
        <div class="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 mb-4 shadow-sm">
            <img src="${p.image}" class="w-16 h-16 object-cover rounded-2xl">
            <div class="flex-1">
                <h4 class="font-bold text-sm line-clamp-1">${p.name}</h4>
                <p class="text-anamac-600 font-black text-xs">Rp ${p.price.toLocaleString('id-ID')}</p>
            </div>
            <button onclick="toggleWishlist(${p.id}, true)" class="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl">✕</button>
        </div>`).join('') : '<div class="text-center py-20 opacity-20"><span class="text-6xl">❤️</span><p class="font-bold mt-4 uppercase tracking-widest">Wishlist Kosong</p></div>';
}

function renderDetailInDrawer(p) {
    if (!p) return;
    const content = document.getElementById('detailContent');
    const formArea = document.getElementById('reviewFormArea');
    const allReviews = JSON.parse(localStorage.getItem('productReviews')) || {};
    const reviews = allReviews[p.id] || [];
    const user = JSON.parse(localStorage.getItem('currentUser'));

    content.innerHTML = `
        <div class="space-y-6">
            <img src="${p.image}" class="w-full rounded-[2.5rem] shadow-xl border dark:border-slate-800">
            <div class="px-2">
                <span class="text-[10px] font-black uppercase text-anamac-600 tracking-widest bg-anamac-600/10 px-3 py-1 rounded-full">${p.category}</span>
                <h3 class="text-2xl font-black leading-tight mt-3 dark:text-white">${p.name}</h3>
                <p class="text-2xl font-black text-slate-900 dark:text-white mt-2">Rp ${p.price.toLocaleString('id-ID')}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">${p.description}</p>
            </div>
            <div class="pt-6 px-2">
                <h4 class="font-black text-xs uppercase tracking-widest mb-4 border-b dark:border-slate-800 pb-2 flex justify-between">
                    <span>Ulasan (${reviews.length})</span>
                </h4>
                <div class="space-y-4">
                    ${reviews.length ? reviews.map(r => `
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border dark:border-slate-700 text-xs">
                            <div class="flex justify-between mb-1">
                                <span class="font-bold text-anamac-600 uppercase">${r.userName}</span>
                                <span class="text-yellow-500">${'⭐'.repeat(r.rating)}</span>
                            </div>
                            <p class="italic text-slate-600 dark:text-slate-300 leading-relaxed">"${r.comment}"</p>
                        </div>`).join('') : '<p class="text-center opacity-40 py-10 text-xs italic">Belum ada ulasan untuk hardware ini.</p>'}
                </div>
            </div>
        </div>`;

    formArea.classList.toggle('hidden', false);
    if (user) {
        formArea.innerHTML = `
            <div class="space-y-4">
                <div class="flex gap-2 justify-center text-2xl">
                    ${[1,2,3,4,5].map(n => `<button onclick="submitReview(${p.id}, ${n})" class="hover:scale-125 transition-all active:scale-90">⭐</button>`).join('')}
                </div>
                <div class="flex gap-2">
                    <input type="text" id="reviewInput" placeholder="Tulis komentar..." class="flex-1 p-3 rounded-2xl border-none bg-white dark:bg-slate-700 focus:ring-2 focus:ring-anamac-600 text-sm shadow-sm outline-none">
                    <button onclick="submitReview(${p.id}, 5)" class="bg-anamac-600 text-white px-5 rounded-2xl font-bold text-xs uppercase shadow-lg hover:bg-anamac-700 transition-all">Kirim</button>
                </div>
            </div>`;
    } else {
        formArea.innerHTML = `<p class="text-center text-[10px] text-slate-500 italic uppercase tracking-wider">Silakan <a href="login.html" class="text-anamac-600 font-bold underline">Login</a> untuk memberi ulasan.</p>`;
    }
}

// ==========================================
// 5. CORE BUSINESS LOGIC (CART, WISH, REVIEW)
// ==========================================

function addToCart(id) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        showToast("Login dulu ya, Bos! 🔒");
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }
    const p = products.find(x => x.id === id);
    const existing = cart.find(x => x.id === id);
    existing ? existing.quantity++ : cart.push({...p, quantity: 1});
    localStorage.setItem('cart', JSON.stringify(cart));
    updateUIStats();
    showToast(`🛒 ${p.name} ditambahkan!`);
}

function toggleWishlist(id, fromDrawer = false) {
    const idx = wishlist.indexOf(id);
    if (idx === -1) {
        wishlist.push(id);
        showToast("Ditambah ke Wishlist ❤️");
    } else {
        wishlist.splice(idx, 1);
        showToast("Dihapus dari Wishlist 💔");
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateUIStats();
    displayPage(currentPage);
    if (fromDrawer) renderWishlistInDrawer();
}

function submitReview(productId, rating) {
    const comment = document.getElementById('reviewInput')?.value || "Barang mantap!";
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    let allReviews = JSON.parse(localStorage.getItem('productReviews')) || {};
    if (!allReviews[productId]) allReviews[productId] = [];
    
    allReviews[productId].push({ 
        userName: user.name, 
        rating, 
        comment, 
        date: new Date().toLocaleDateString('id-ID') 
    });
    
    localStorage.setItem('productReviews', JSON.stringify(allReviews));
    showToast("Terima kasih ulasannya! ⭐");
    toggleDetailSidebar(productId); 
    displayPage(currentPage);
}

// ==========================================
// 6. UTILITIES (PAGINATION, FILTER, UI)
// ==========================================

function updateUIStats() {
    const w = document.getElementById('wishCount');
    const c = document.getElementById('cartCount');
    if(w) w.innerText = wishlist.length;
    if(c) c.innerText = cart.reduce((s, i) => s + i.quantity, 0);
}

function showToast(msg) {
    const old = document.getElementById('customToast'); if(old) old.remove();
    const t = document.createElement('div');
    t.id = 'customToast';
    t.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-4 rounded-full shadow-2xl z-[100] font-black text-[10px] uppercase tracking-[0.2em] animate-bounce border border-white/20';
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 500);
    }, 2500);
}

function displayPage(page) {
    currentPage = page;
    const start = (page - 1) * itemsPerPage;
    renderProducts(currentDisplayData.slice(start, start + itemsPerPage));
    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination-controls');
    if (!container) return;
    const total = Math.ceil(currentDisplayData.length / itemsPerPage);
    container.innerHTML = '';
    if (total <= 1) return;
    for (let i = 1; i <= total; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = `w-12 h-12 rounded-2xl font-bold transition-all ${currentPage === i ? 'bg-anamac-600 text-white shadow-lg shadow-anamac-600/30 scale-110' : 'bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}`;
        btn.onclick = () => { displayPage(i); window.scrollTo({top: 400, behavior: 'smooth'}); };
        container.appendChild(btn);
    }
}

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.filter-btn').forEach(b => {
        const match = b.innerText === (cat === 'All' ? 'Semua' : cat);
        b.className = `filter-btn ${match ? 'active bg-anamac-600 text-white shadow-lg' : 'text-slate-400'} px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap`;
    });
    currentDisplayData = cat === 'All' ? products : products.filter(p => p.category === cat);
    displayPage(1);
}

function checkAuthUI() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const area = document.getElementById('authArea');
    if (user && area) {
        area.innerHTML = `
            <div class="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 pr-4 rounded-2xl border dark:border-slate-700 shadow-sm">
                <div class="w-8 h-8 bg-anamac-600 rounded-xl flex items-center justify-center text-white font-bold text-xs uppercase">${user.name[0]}</div>
                <span class="text-xs font-bold hidden md:block dark:text-white">${user.name.split(' ')[0]}</span>
            </div>`;
    }
}

function renderRecentReviews() {
    const container = document.getElementById('recentReviews');
    if (!container) return;
    const all = JSON.parse(localStorage.getItem('productReviews')) || {};
    let flattened = [];
    Object.keys(all).forEach(id => { all[id].forEach(r => flattened.push({...r})); });
    flattened.sort((a,b) => new Date(b.date) - new Date(a.date));
    const slice = flattened.slice(0, 3);
    if (slice.length) {
        container.innerHTML = slice.map(r => `
            <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-700 text-[10px] mb-3">
                <div class="flex justify-between mb-1"><strong class="text-anamac-600 uppercase">${r.userName}</strong><span>${'⭐'.repeat(r.rating)}</span></div>
                <p class="text-slate-500 italic line-clamp-2">"${r.comment}"</p>
            </div>`).join('');
    }
}

// ==========================================
// 7. GLOBAL INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Sync Theme
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const dark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', dark ? 'dark' : 'light');
        };
    }

    fetchProducts();

    // Search Real-time
    const search = document.getElementById('searchInput');
    if (search) {
        search.addEventListener('input', (e) => {
            const k = e.target.value.toLowerCase();
            currentDisplayData = products.filter(p => 
                p.name.toLowerCase().includes(k) && 
                (currentCategory === 'All' || p.category === currentCategory)
            );
            displayPage(1);
        });
    }
});
