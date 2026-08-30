import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Pastikan nilai tidak kosong agar tidak error saat inisialisasi awal tanpa .env
const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project-id.supabase.co') 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

const toSnakeCase = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(toSnakeCase);
    const newObj = {};
    for (const key in obj) {
        // Pengecualian untuk keys tertentu
        if (key === 'notes' && obj.notes) {
            newObj['note'] = obj[key];
        } else {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            newObj[snakeKey] = obj[key];
        }
    }
    return newObj;
};

const toCamelCase = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCase);
    const newObj = {};
    for (const key in obj) {
        if (key === 'note' && obj.note) {
            newObj['notes'] = obj[key];
        } else {
            const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
            newObj[camelKey] = obj[key];
        }
    }
    return newObj;
};

window.SupabaseSync = {
    supabase,
    async register(email, password, name) {
        if (!this.supabase) return { success: false, message: 'Supabase belum dikonfigurasi di .env' };
        
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name }
                }
            });

            if (error) throw error;
            
            // Simpan profil di tabel users
            if (data.user) {
                await this.supabase.from('users').insert([{
                    id: data.user.id,
                    name: name,
                    email: email
                }]);
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Supabase Register Error:', error);
            return { success: false, message: error.message };
        }
    },

    // Auth: Login
    async login(email, password) {
        if (!this.supabase) return { success: false, message: 'Supabase belum dikonfigurasi di .env' };
        
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            
            // Setelah berhasil login, fetch data dari Supabase ke LocalStorage
            await this.pullDataToLocal(data.user.id);
            
            return { success: true, data };
        } catch (error) {
            console.error('Supabase Login Error:', error);
            return { success: false, message: error.message };
        }
    },

    // Sync: Tarik data dari Cloud ke LocalStorage saat login
    async pullDataToLocal(userId) {
        if (!this.supabase) return;
        
        try {
            // Mengambil semua data milik user
            const [usersReq, txReq, catReq, accReq, goalReq, billReq] = await Promise.all([
                this.supabase.from('users').select('*').eq('id', userId).single(),
                this.supabase.from('transactions').select('*').eq('user_id', userId),
                this.supabase.from('categories').select('*').eq('user_id', userId),
                this.supabase.from('accounts').select('*').eq('user_id', userId),
                this.supabase.from('goals').select('*').eq('user_id', userId),
                this.supabase.from('bills').select('*').eq('user_id', userId)
            ]);

            // Save to LocalStorage format yang dikenali oleh aplikasi (DataStore)
            const suffix = `_${userId}`;
            if (usersReq.data) {
                const settings = {
                    userName: usersReq.data.name,
                    userEmail: usersReq.data.email,
                    monthlySavingTarget: usersReq.data.monthly_saving_target || 0,
                    monthlyBudgetTotal: usersReq.data.monthly_budget_total || 0,
                    darkMode: usersReq.data.dark_mode || false
                };
                localStorage.setItem('lexfinszmoney_settings_v1' + suffix, JSON.stringify(settings));
            }
            if (txReq.data) localStorage.setItem('lexfinszmoney_transactions_v1' + suffix, JSON.stringify(toCamelCase(txReq.data)));
            if (catReq.data) localStorage.setItem('lexfinszmoney_categories_v1' + suffix, JSON.stringify(toCamelCase(catReq.data)));
            if (accReq.data) localStorage.setItem('lexfinszmoney_accounts_v1' + suffix, JSON.stringify(toCamelCase(accReq.data)));
            if (goalReq.data) localStorage.setItem('lexfinszmoney_goals_v1' + suffix, JSON.stringify(toCamelCase(goalReq.data)));
            if (billReq.data) localStorage.setItem('lexfinszmoney_bills_v1' + suffix, JSON.stringify(toCamelCase(billReq.data)));

            console.log('Sinkronisasi Supabase ke LocalStorage berhasil.');
        } catch (error) {
            console.error('Gagal pull data dari Supabase:', error);
        }
    },

    // Sync: Dorong data spesifik ke Cloud (Dipanggil tiap kali DataStore menyimpan)
    async pushTableToCloud(tableName, dataArray) {
        if (!this.supabase) return;

        // Ambil user dari sesi localStorage (lebih andal daripada supabase.auth.getUser di non-Vite)
        let userId = null;
        try {
            const sessionStr = localStorage.getItem('lexfinszmoney_current_user');
            if (sessionStr) {
                userId = JSON.parse(sessionStr)?.id;
            }
        } catch(e) {}

        // Fallback ke Supabase session
        if (!userId) {
            try {
                const { data } = await this.supabase.auth.getUser();
                userId = data?.user?.id;
            } catch(e) {}
        }

        if (!userId) return; // Harus login untuk sync

        try {
            // Karena ini sinkronisasi sederhana, kita update dengan pendekatan upsert
            const snakeDataArray = toSnakeCase(dataArray);
            const formattedData = snakeDataArray.map(item => ({
                ...item,
                user_id: userId
            }));
            
            const { error } = await this.supabase
                .from(tableName)
                .upsert(formattedData);

            if (error) throw error;
            console.log(`Sync ${tableName} ke Supabase berhasil.`);
        } catch (error) {
            console.error(`Gagal sync ${tableName}:`, error);
        }
    }
};
