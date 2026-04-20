// Inisialisasi data users dari LocalStorage
let users = JSON.parse(localStorage.getItem('users')) || [];

// Fungsi Register
function register(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validasi Password [cite: 32]
    if (password.length < 6) {
        alert("Password minimal harus 6 karakter!");
        return;
    }

    // Validasi Email Unik [cite: 31]
    const emailExists = users.some(user => user.email === email);
    if (emailExists) {
        alert("Email sudah terdaftar! Gunakan email lain.");
        return;
    }

    // Simpan user baru ke LocalStorage [cite: 28]
    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert("Registrasi berhasil! Silakan login.");
    window.location.href = 'login.html';
}

// Fungsi Login
function login(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Cek kecocokan data
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Simpan sesi user yang sedang aktif
        localStorage.setItem('currentUser', JSON.stringify({ id: user.id, name: user.name, email: user.email }));
        alert(`Selamat datang, ${user.name}!`);
        window.location.href = 'index.html';
    } else {
        alert("Email atau password salah!");
    }
}

// Fungsi Logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Cek status login (Dipanggil di halaman yang butuh proteksi / update UI)
function checkAuthStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const loginBtn = document.getElementById('loginBtn');
    
    if (currentUser && loginBtn) {
        // Ubah tombol Login menjadi Logout / Nama User
        loginBtn.outerHTML = `
            <div class="flex items-center space-x-4">
                <span class="text-white text-sm">Halo, ${currentUser.name}</span>
                <button onclick="logout()" class="bg-red-500 text-white px-4 py-1 rounded font-semibold hover:bg-red-600 transition">Logout</button>
            </div>
        `;
    }
}

// Jalankan pengecekan status saat halaman dimuat
document.addEventListener('DOMContentLoaded', checkAuthStatus);