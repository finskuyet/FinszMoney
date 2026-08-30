import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Pastikan nilai tidak kosong agar tidak error saat inisialisasi awal tanpa .env
const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project-id.supabase.co') 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

window.SupabaseSync = {
    supabase,
    
    // Auth: Register
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
            if (usersReq.data) {
                const settings = {
                    userName: usersReq.data.name,
                    userEmail: usersReq.data.email,
                    monthlySavingTarget: usersReq.data.monthly_saving_target || 0,
                    monthlyBudgetTotal: usersReq.data.monthly_budget_total || 0,
                    darkMode: usersReq.data.dark_mode || false
                };
                localStorage.setItem('settings', JSON.stringify(settings));
            }
            if (txReq.data) localStorage.setItem('transactions', JSON.stringify(txReq.data));
            if (catReq.data) localStorage.setItem('categories', JSON.stringify(catReq.data));
            if (accReq.data) localStorage.setItem('accounts', JSON.stringify(accReq.data));
            if (goalReq.data) localStorage.setItem('goals', JSON.stringify(goalReq.data));
            if (billReq.data) localStorage.setItem('bills', JSON.stringify(billReq.data));

            console.log('Sinkronisasi Supabase ke LocalStorage berhasil.');
        } catch (error) {
            console.error('Gagal pull data dari Supabase:', error);
        }
    },

    // Sync: Dorong data spesifik ke Cloud (Dipanggil tiap kali DataStore menyimpan)
    async pushTableToCloud(tableName, dataArray) {
        if (!this.supabase) return;
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return; // Harus login untuk sync

        try {
            // Karena ini sinkronisasi sederhana, kita update dengan pendekatan upsert
            const formattedData = dataArray.map(item => ({
                ...item,
                user_id: user.id
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
