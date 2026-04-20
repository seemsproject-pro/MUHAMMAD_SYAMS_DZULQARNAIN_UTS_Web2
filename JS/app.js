// STATE & DATA
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let currentCategory = 'All';
let currentPage = 1;
const itemsPerPage = 8;
let currentDisplayData = [];

// DATA INITIALIZATION
async function fetchProducts() {
    let localData = JSON.parse(localStorage.getItem('products'));
    if (!localData || localData.length === 0) {
        try {
            const res = await fetch('data/products.json');
            localData = await res.json();
            localStorage.setItem('products', JSON.stringify(localData));
        } catch (e) { console.error("Database Error"); }
    }
    products = localData;
    currentDisplayData = [...products];
    displayPage(1);
    updateUIStats();
    checkAuthUI();
}

// RENDER PRODUCTS
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

// DUAL SIDEBAR LOGIC
function toggleWishlistSidebar() {
    closeAllSidebars();
    const drawer = document.getElementById('wishlistDrawer');
    const overlay = document.getElementById('sidebarOverlay');
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('opacity-100'), 10);
    drawer.classList.remove('-translate-x-full');
    document.body.style.overflow = 'hidden';
    renderWishlistInDrawer();
}

function toggleDetailSidebar(productId) {
    closeAllSidebars();
    const drawer = document.getElementById('detailDrawer');
    const overlay = document.getElementById('sidebarOverlay');
    const p = products.find(x => x.id === productId);
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('opacity-100'), 10);
    drawer.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    renderDetailInDrawer(p);
}

function closeAllSidebars() {
    const left = document.getElementById('wishlistDrawer');
    const right = document.getElementById('detailDrawer');
    const overlay = document.getElementById('sidebarOverlay');
    if(left) left.classList.add('-translate-x-full');
    if(right) right.classList.add('translate-x-full');
    if(overlay) {
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
    document.body.style.overflow = 'auto';
}

function closeSidebar() { closeAllSidebars(); } // Fallback for HTML buttons

function renderWishlistInDrawer() {
    const container = document.getElementById('wishlistContent');
    const wished = products.filter(p => wishlist.includes(p.id));
    container.innerHTML = wished.length ? wished.map(p => `
        <div class="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border dark:border-slate-700 mb-4">
            <img src="${p.image}" class="w-16 h-16 object-cover rounded-2xl shadow-sm">
            <div class="flex-1"><h4 class="font-bold text-sm line-clamp-1">${p.name}</h4><p class="text-anamac-600 font-black text-xs">Rp ${p.price.toLocaleString('id-ID')}</p></div>
            <button onclick="toggleWishlist(${p.id}, true)" class="text-red-500 p-2 hover:bg-red-50 rounded-xl">✕</button>
        </div>`).join('') : '<div class="text-center py-20 opacity-20"><span class="text-6xl">❤️</span><p class="font-bold mt-4">Wishlist Kosong</p></div>';
}

function renderDetailInDrawer(p) {
    const content = document.getElementById('detailContent');
    const formArea = document.getElementById('reviewFormArea');
    const allReviews = JSON.parse(localStorage.getItem('productReviews')) || {};
    const reviews = allReviews[p.id] || [];
    const user = JSON.parse(localStorage.getItem('currentUser'));

    content.innerHTML = `
        <div class="space-y-6">
            <img src="${p.image}" class="w-full rounded-[2.5rem] shadow-xl border dark:border-slate-800">
            <div class="px-2">
                <span class="text-[10px] font-black uppercase text-anamac-600">${p.category}</span>
                <h3 class="text-2xl font-black mt-1">${p.name}</h3>
                <p class="text-2xl font-black text-slate-900 dark:text-white mt-2">Rp ${p.price.toLocaleString('id-ID')}</p>
                <p class="text-sm text-slate-500 mt-4 leading-relaxed">${p.description}</p>
            </div>
            <div class="pt-6 px-2">
                <h4 class="font-black text-xs uppercase mb-4 border-b dark:border-slate-800 pb-2">Ulasan (${reviews.length})</h4>
                <div class="space-y-4">
                    ${reviews.length ? reviews.map(r => `
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border dark:border-slate-700 text-xs italic">
                            <div class="flex justify-between mb-1"><span class="font-bold text-anamac-600">${r.userName}</span><span>${'⭐'.repeat(r.rating)}</span></div>
                            <p>"${r.comment}"</p>
                        </div>`).join('') : '<p class="text-center opacity-40 py-10 text-xs">Belum ada ulasan.</p>'}
                </div>
            </div>
        </div>`;

    formArea.classList.toggle('hidden', false);
    if (user) {
        formArea.innerHTML = `
            <div class="space-y-4">
                <div class="flex gap-2 justify-center text-2xl">${[1,2,3,4,5].map(n => `<button onclick="submitReview(${p.id}, ${n})" class="hover:scale-125 transition-all">⭐</button>`).join('')}</div>
                <div class="flex gap-2">
                    <input type="text" id="reviewInput" placeholder="Komentar..." class="flex-1 p-3 rounded-2xl border-none bg-white dark:bg-slate-700 focus:ring-2 focus:ring-anamac-600 text-sm">
                    <button onclick="submitReview(${p.id}, 5)" class="bg-anamac-600 text-white px-4 rounded-2xl font-bold text-xs uppercase shadow-lg">Kirim</button>
                </div>
            </div>`;
    } else {
        formArea.innerHTML = `<p class="text-center text-[10px] text-slate-500 italic uppercase">Login untuk memberi ulasan.</p>`;
    }
}

// PROTEKSI LOGIN CART
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
    showToast(`🛒 ${p.name} Masuk Keranjang!`);
}

function toggleWishlist(id, fromDrawer = false) {
    const idx = wishlist.indexOf(id);
    idx === -1 ? wishlist.push(id) : wishlist.splice(idx, 1);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateUIStats();
    displayPage(currentPage);
    if (fromDrawer) renderWishlistInDrawer();
    showToast(idx === -1 ? "Ditambah ❤️" : "Dihapus 💔");
}

function submitReview(productId, rating) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const comment = document.getElementById('reviewInput')?.value || "Barang mantap!";
    let allReviews = JSON.parse(localStorage.getItem('productReviews')) || {};
    if (!allReviews[productId]) allReviews[productId] = [];
    allReviews[productId].push({ userName: user.name, rating, comment, date: new Date().toLocaleDateString('id-ID') });
    localStorage.setItem('productReviews', JSON.stringify(allReviews));
    showToast("Rating Terkirim! ⭐");
    toggleDetailSidebar(productId); 
    displayPage(currentPage);
}

// UTILS
function updateUIStats() {
    const w = document.getElementById('wishCount'), c = document.getElementById('cartCount');
    if(w) w.innerText = wishlist.length;
    if(c) c.innerText = cart.reduce((s, i) => s + i.quantity, 0);
}

function checkAuthUI() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const area = document.getElementById('authArea');
    if (user && area) area.innerHTML = `<div class="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 pr-4 rounded-2xl border dark:border-slate-700 shadow-sm"><div class="w-8 h-8 bg-anamac-600 rounded-xl flex items-center justify-center text-white font-bold text-xs uppercase">${user.name[0]}</div><span class="text-xs font-bold hidden md:block">${user.name.split(' ')[0]}</span></div>`;
}

function showToast(msg) {
    const old = document.getElementById('customToast'); if(old) old.remove();
    const t = document.createElement('div');
    t.id = 'customToast';
    t.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-4 rounded-full shadow-2xl z-[100] font-black text-[10px] uppercase tracking-widest animate-bounce border border-slate-700';
    t.innerText = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000);
}

function displayPage(page) {
    currentPage = page;
    const start = (page - 1) * itemsPerPage;
    renderProducts(currentDisplayData.slice(start, start + itemsPerPage));
    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination-controls');
    const total = Math.ceil(currentDisplayData.length / itemsPerPage);
    if(!container) return; container.innerHTML = ''; if (total <= 1) return;
    for (let i = 1; i <= total; i++) {
        const btn = document.createElement('button'); btn.innerText = i;
        btn.className = `w-12 h-12 rounded-2xl font-bold transition-all ${currentPage === i ? 'bg-anamac-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400'}`;
        btn.onclick = () => { displayPage(i); window.scrollTo({top: 400, behavior: 'smooth'}); };
        container.appendChild(btn);
    }
}

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.filter-btn').forEach(b => {
        const match = b.innerText === (cat === 'All' ? 'Semua' : cat);
        b.className = `filter-btn ${match ? 'active bg-anamac-600 text-white' : 'text-slate-400'} px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap`;
    });
    currentDisplayData = cat === 'All' ? products : products.filter(p => p.category === cat);
    displayPage(1);
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
    document.getElementById('themeToggle').onclick = () => {
        const dark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    };
    fetchProducts();
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const k = e.target.value.toLowerCase();
        currentDisplayData = products.filter(p => p.name.toLowerCase().includes(k) && (currentCategory === 'All' || p.category === currentCategory));
        displayPage(1);
    });
});