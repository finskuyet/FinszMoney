// auth.js - Menangani sistem autentikasi menggunakan localStorage

const AUTH_KEYS = {
    USERS: 'lexfinszmoney_users',
    CURRENT_USER: 'lexfinszmoney_current_user'
};

const Auth = {
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(AUTH_KEYS.USERS)) || [];
        } catch (e) {
            return [];
        }
    },

    saveUsers(users) {
        localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
    },

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(AUTH_KEYS.CURRENT_USER));
        } catch (e) {
            return null;
        }
    },

    async login(email, password) {
        if (window.SupabaseSync && window.SupabaseSync.supabase) {
            const res = await window.SupabaseSync.login(email, password);
            if (res.success) {
                const sessionUser = { id: res.data.user.id, name: res.data.user.user_metadata?.full_name || 'User', email: res.data.user.email };
                localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
                return { success: true, user: sessionUser };
            }
            return res;
        }

        // Fallback LocalStorage
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            const sessionUser = { id: user.id, name: user.name, email: user.email };
            localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
            return { success: true, user: sessionUser };
        }
        return { success: false, message: 'Email atau password salah!' };
    },

    async register(name, email, password) {
        if (window.SupabaseSync && window.SupabaseSync.supabase) {
            const res = await window.SupabaseSync.register(email, password, name);
            if (res.success) {
                const newUser = { id: res.data.user.id, name: name.trim(), email: email.trim(), password: password };
                const users = this.getUsers();
                users.push(newUser);
                this.saveUsers(users);
                return { success: true, user: newUser };
            }
            return res;
        }

        // Fallback LocalStorage
        const users = this.getUsers();
        
        // Cek apakah email sudah terdaftar
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Email sudah terdaftar!' };
        }

        const newUser = {
            id: 'usr_' + Date.now(),
            name: name.trim(),
            email: email.trim(),
            password: password
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, user: newUser };
    },

    updateUser(name, email, password) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: 'Tidak ada sesi aktif.' };

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex === -1) return { success: false, message: 'Pengguna tidak ditemukan.' };

        // Cek jika email diganti dan sudah dipakai orang lain
        if (email !== users[userIndex].email && users.some(u => u.email === email)) {
            return { success: false, message: 'Email sudah terdaftar untuk pengguna lain!' };
        }

        users[userIndex].name = name.trim();
        users[userIndex].email = email.trim();
        if (password) {
            users[userIndex].password = password;
        }

        this.saveUsers(users);

        const updatedSession = { id: users[userIndex].id, name: users[userIndex].name, email: users[userIndex].email };
        localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(updatedSession));
        
        return { success: true, user: updatedSession };
    },

    logout() {
        // Hanya hapus sesi user saat ini, jangan hapus data transaksi mereka
        localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
        
        window.location.href = 'index.html';
    },

    // Middleware: Hanya bisa diakses jika sudah login
    requireAuth() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return null;
        }
        return user;
    },

    // Middleware: Hanya bisa diakses jika belum login (halaman login/register)
    requireGuest() {
        if (this.getCurrentUser()) {
            window.location.href = 'dashboard.html';
        }
    },
};

// Daftarkan ke global window
window.Auth = Auth;
