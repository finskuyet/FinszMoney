import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Pastikan nilai tidak kosong agar tidak error saat inisialisasi awal tanpa .env
const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project-id.supabase.co') 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

// Log status koneksi Supabase saat load
if (supabase) {
    console.log('✅ Supabase aktif:', supabaseUrl);
} else {
    console.warn('⚠️ Supabase tidak aktif — sinkronisasi antar device tidak tersedia.');
}

const toSnakeCase = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(toSnakeCase);
    const newObj = {};
    for (const key in obj) {
        // Kolom khusus yang perlu mapping manual
        if (key === 'notes') {
            newObj['note'] = obj[key];
        } else if (key === 'calculatedBalance') {
            // Skip kolom computed, tidak perlu disimpan ke DB
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
        if (key === 'note') {
            newObj['notes'] = obj[key];
        } else {
            const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
            newObj[camelKey] = obj[key];
        }
    }
    return newObj;
};

// Ambil userId dari sesi localStorage
const getLocalUserId = () => {
    try {
        const s = localStorage.getItem('lexfinszmoney_current_user');
        return s ? JSON.parse(s)?.id : null;
    } catch(e) { return null; }
};

// Ambil nama & email user dari sesi localStorage
const getLocalUserInfo = () => {
    try {
        const s = localStorage.getItem('lexfinszmoney_current_user');
        return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
};

window.SupabaseSync = {
    supabase,

    // Pastikan entri user ada di tabel public.users sebelum menyimpan data
    async ensureUserExists(userId) {
        if (!this.supabase || !userId) return false;
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('id')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('❌ Gagal cek user di DB:', error.message);
                return false;
            }

            if (!data) {
                // User belum ada di tabel users, insert sekarang
                const info = getLocalUserInfo();
                const { error: insertErr } = await this.supabase.from('users').insert([{
                    id: userId,
                    name: info?.name || 'User',
                    email: info?.email || ''
                }]);
                if (insertErr) {
                    console.error('❌ Gagal insert user ke DB:', insertErr.message);
                    return false;
                }
                console.log('✅ User berhasil dibuat di DB.');
            }
            return true;
        } catch(e) {
            console.error('❌ ensureUserExists error:', e);
            return false;
        }
    },

    async register(email, password, name) {
        if (!this.supabase) return { success: false, message: 'Supabase belum dikonfigurasi' };
        
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });

            if (error) throw error;
            
            // Simpan profil di tabel users (trigger otomatis juga akan membuatnya)
            if (data.user) {
                await this.supabase.from('users').upsert([{
                    id: data.user.id,
                    name: name,
                    email: email
                }]);
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ Supabase Register Error:', error.message);
            return { success: false, message: error.message };
        }
    },

    // Auth: Login via Supabase
    async login(email, password) {
        if (!this.supabase) return { success: false, message: 'Supabase belum dikonfigurasi' };
        
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            // Pastikan user ada di tabel public.users
            await this.ensureUserExists(data.user.id);
            
            // Tarik semua data milik user ke LocalStorage
            await this.pullDataToLocal(data.user.id);
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ Supabase Login Error:', error.message);
            return { success: false, message: error.message };
        }
    },

    // Sync: Tarik data dari Cloud ke LocalStorage saat login / buka app
    async pullDataToLocal(userId) {
        if (!this.supabase || !userId) return;
        
        try {
            console.log('🔄 Menarik data dari Supabase untuk user:', userId);

            const [usersReq, txReq, catReq, accReq, goalReq, billReq] = await Promise.all([
                this.supabase.from('users').select('*').eq('id', userId).single(),
                this.supabase.from('transactions').select('*').eq('user_id', userId),
                this.supabase.from('categories').select('*').eq('user_id', userId),
                this.supabase.from('accounts').select('*').eq('user_id', userId),
                this.supabase.from('goals').select('*').eq('user_id', userId),
                this.supabase.from('bills').select('*').eq('user_id', userId)
            ]);

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
            if (txReq.data)   localStorage.setItem('lexfinszmoney_transactions_v1' + suffix, JSON.stringify(toCamelCase(txReq.data)));
            if (catReq.data)  localStorage.setItem('lexfinszmoney_categories_v1'   + suffix, JSON.stringify(toCamelCase(catReq.data)));
            if (accReq.data)  localStorage.setItem('lexfinszmoney_accounts_v1'     + suffix, JSON.stringify(toCamelCase(accReq.data)));
            if (goalReq.data) localStorage.setItem('lexfinszmoney_goals_v1'        + suffix, JSON.stringify(toCamelCase(goalReq.data)));
            if (billReq.data) localStorage.setItem('lexfinszmoney_bills_v1'        + suffix, JSON.stringify(toCamelCase(billReq.data)));

            console.log('✅ Data dari Supabase berhasil dimuat:', {
                transactions: txReq.data?.length,
                categories: catReq.data?.length,
                accounts: accReq.data?.length,
                goals: goalReq.data?.length,
                bills: billReq.data?.length
            });

            if (usersReq.error) console.warn('⚠️ users error:', usersReq.error.message);
            if (txReq.error)    console.warn('⚠️ transactions error:', txReq.error.message);
            if (catReq.error)   console.warn('⚠️ categories error:', catReq.error.message);
            if (accReq.error)   console.warn('⚠️ accounts error:', accReq.error.message);
            if (goalReq.error)  console.warn('⚠️ goals error:', goalReq.error.message);
            if (billReq.error)  console.warn('⚠️ bills error:', billReq.error.message);

        } catch (error) {
            console.error('❌ Gagal pull data dari Supabase:', error.message || error);
        }
    },

    // Sync: Dorong data ke Cloud setiap kali DataStore menyimpan
    async pushTableToCloud(tableName, dataArray) {
        if (!this.supabase) return;

        const userId = getLocalUserId();
        if (!userId) {
            console.warn('⚠️ pushTableToCloud: tidak ada userId, skip sync.');
            return;
        }

        // Pastikan user ada di DB sebelum insert data
        const userExists = await this.ensureUserExists(userId);
        if (!userExists) {
            console.error('❌ Gagal memastikan user ada di DB. Push dibatalkan.');
            return;
        }

        try {
            // Hapus data lama user di tabel ini, lalu insert ulang (full sync)
            const { error: delErr } = await this.supabase
                .from(tableName)
                .delete()
                .eq('user_id', userId);

            if (delErr) console.warn(`⚠️ Gagal hapus data lama ${tableName}:`, delErr.message);

            if (dataArray && dataArray.length > 0) {
                const snakeData = toSnakeCase(dataArray);
                const formatted = snakeData.map(item => ({ ...item, user_id: userId }));

                const { error: insErr } = await this.supabase.from(tableName).insert(formatted);
                if (insErr) throw insErr;
            }

            console.log(`✅ Sync ${tableName} berhasil (${dataArray?.length || 0} records).`);
        } catch (error) {
            console.error(`❌ Gagal sync ${tableName}:`, error.message || error);
        }
    }
};
