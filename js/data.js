/**
 * FinszMoney - Data Storage & Calculation Engine
 * Comprehensive Personal Finance Platform
 */

const STORAGE_KEYS = {
    TRANSACTIONS: 'finszmoney_transactions_v1',
    CATEGORIES: 'finszmoney_categories_v1',
    ACCOUNTS: 'finszmoney_accounts_v1',
    GOALS: 'finszmoney_goals_v1',
    BILLS: 'finszmoney_bills_v1',
    SETTINGS: 'finszmoney_settings_v1'
};

// Default pre-seeded categories
const DEFAULT_CATEGORIES = [
    // Pengeluaran (Expense)
    { id: 'cat_makanan', name: 'Makanan & Minuman', type: 'expense', icon: 'restaurant', color: '#EF4444', budget: 2500000 },
    { id: 'cat_transport', name: 'Transportasi & Bensin', type: 'expense', icon: 'directions_car', color: '#F97316', budget: 1000000 },
    { id: 'cat_belanja', name: 'Belanja & Kebutuhan', type: 'expense', icon: 'shopping_bag', color: '#EC4899', budget: 1500000 },
    { id: 'cat_tagihan', name: 'Tagihan & Utilitas', type: 'expense', icon: 'receipt_long', color: '#8B5CF6', budget: 1200000 },
    { id: 'cat_hiburan', name: 'Hiburan & Liburan', type: 'expense', icon: 'movie', color: '#06B6D4', budget: 800000 },
    { id: 'cat_kesehatan', name: 'Kesehatan & Obat', type: 'expense', icon: 'medical_services', color: '#10B981', budget: 500000 },
    { id: 'cat_pendidikan', name: 'Edukasi & Kursus', type: 'expense', icon: 'school', color: '#3B82F6', budget: 500000 },
    { id: 'cat_lainnya_exp', name: 'Lain-lain', type: 'expense', icon: 'more_horiz', color: '#64748B', budget: 300000 },

    // Pemasukan (Income)
    { id: 'cat_gaji', name: 'Gaji Utama', type: 'income', icon: 'payments', color: '#16A34A' },
    { id: 'cat_freelance', name: 'Freelance & Side Project', type: 'income', icon: 'laptop_mac', color: '#2563EB' },
    { id: 'cat_investasi', name: 'Investasi & Dividen', type: 'income', icon: 'trending_up', color: '#9333EA' },
    { id: 'cat_bonus', name: 'Bonus & THR', type: 'income', icon: 'redeem', color: '#D97706' },
    { id: 'cat_lainnya_inc', name: 'Pemasukan Lainnya', type: 'income', icon: 'account_balance_wallet', color: '#0D9488' }
];

// Default accounts / wallets
const DEFAULT_ACCOUNTS = [
    { id: 'acc_cash', name: 'Uang Tunai (Cash)', initialBalance: 1500000, icon: 'wallet', type: 'cash', color: '#10B981' },
    { id: 'acc_bca', name: 'BCA Utama', initialBalance: 18500000, accountNumber: '8820194812', icon: 'account_balance', type: 'bank', color: '#2563EB' },
    { id: 'acc_mandiri', name: 'Mandiri Payroll', initialBalance: 7200000, accountNumber: '14000182749', icon: 'account_balance', type: 'bank', color: '#0284C7' },
    { id: 'acc_gopay', name: 'GoPay / OVO', initialBalance: 850000, accountNumber: '081234567890', icon: 'smartphone', type: 'ewallet', color: '#06B6D4' },
    { id: 'acc_bibit', name: 'Bibit (Reksadana)', initialBalance: 15000000, icon: 'trending_up', type: 'investment', color: '#8B5CF6' }
];

// Default savings goals
const DEFAULT_GOALS = [
    {
        id: 'goal_darurat',
        name: 'Dana Darurat (Emergency Fund)',
        targetAmount: 30000000,
        currentAmount: 18500000,
        deadline: '2026-12-31',
        icon: 'security',
        color: '#2563EB',
        notes: 'Target 6 bulan pengeluaran rutin'
    },
    {
        id: 'goal_liburan',
        name: 'Liburan Akhir Tahun ke Jepang',
        targetAmount: 25000000,
        currentAmount: 12000000,
        deadline: '2026-11-20',
        icon: 'flight_takeoff',
        color: '#EC4899',
        notes: 'Tiket pesawat & akomodasi Tokyo/Kyoto'
    },
    {
        id: 'goal_laptop',
        name: 'Upgrade Laptop Kerja M4 Pro',
        targetAmount: 32000000,
        currentAmount: 22500000,
        deadline: '2026-10-15',
        icon: 'laptop_mac',
        color: '#8B5CF6',
        notes: 'Untuk produktivitas programming & design'
    }
];

// Default bills and recurring subscriptions
const DEFAULT_BILLS = [
    {
        id: 'bill_wifi',
        name: 'Indihome 50 Mbps Fiber',
        amount: 385000,
        dueDay: 20,
        frequency: 'Bulanan',
        categoryId: 'cat_tagihan',
        accountId: 'acc_bca',
        icon: 'wifi',
        isPaid: true,
        lastPaidDate: '2026-08-19'
    },
    {
        id: 'bill_listrik',
        name: 'Token Listrik PLN',
        amount: 500000,
        dueDay: 5,
        frequency: 'Bulanan',
        categoryId: 'cat_tagihan',
        accountId: 'acc_mandiri',
        icon: 'bolt',
        isPaid: true,
        lastPaidDate: '2026-08-05'
    },
    {
        id: 'bill_netflix',
        name: 'Netflix Premium 4K',
        amount: 186000,
        dueDay: 28,
        frequency: 'Bulanan',
        categoryId: 'cat_hiburan',
        accountId: 'acc_gopay',
        icon: 'movie',
        isPaid: false,
        lastPaidDate: '2026-07-28'
    },
    {
        id: 'bill_spotify',
        name: 'Spotify Family Plan',
        amount: 86900,
        dueDay: 15,
        frequency: 'Bulanan',
        categoryId: 'cat_hiburan',
        accountId: 'acc_gopay',
        icon: 'headphones',
        isPaid: true,
        lastPaidDate: '2026-08-15'
    },
    {
        id: 'bill_bpjs',
        name: 'BPJS Kesehatan Kelas 1',
        amount: 150000,
        dueDay: 10,
        frequency: 'Bulanan',
        categoryId: 'cat_kesehatan',
        accountId: 'acc_bca',
        icon: 'medical_information',
        isPaid: true,
        lastPaidDate: '2026-08-10'
    }
];

// Sample transactions
const getSampleTransactions = () => {
    const today = new Date();
    const formatDate = (offsetDays) => {
        const d = new Date(today);
        d.setDate(d.getDate() - offsetDays);
        return d.toISOString().split('T')[0];
    };

    return [
        {
            id: 'trx_' + (Date.now() - 1000),
            title: 'Gaji Bulanan',
            amount: 12500000,
            type: 'income',
            categoryId: 'cat_gaji',
            accountId: 'acc_bca',
            date: formatDate(1),
            notes: 'Transfer payroll bulanan'
        },
        {
            id: 'trx_' + (Date.now() - 2000),
            title: 'Belanja Bulanan Supermarket',
            amount: 850000,
            type: 'expense',
            categoryId: 'cat_belanja',
            accountId: 'acc_mandiri',
            date: formatDate(1),
            notes: 'Bahan masakan & perlengkapan rumah'
        },
        {
            id: 'trx_' + (Date.now() - 3000),
            title: 'Makan Siang & Kopi',
            amount: 65000,
            type: 'expense',
            categoryId: 'cat_makanan',
            accountId: 'acc_gopay',
            date: formatDate(2),
            notes: 'Makan siang bareng tim'
        },
        {
            id: 'trx_' + (Date.now() - 4000),
            title: 'Isi Bensin Pertamax',
            amount: 150000,
            type: 'expense',
            categoryId: 'cat_transport',
            accountId: 'acc_cash',
            date: formatDate(3),
            notes: 'Full tank mobil'
        },
        {
            id: 'trx_' + (Date.now() - 5000),
            title: 'Project Website Design',
            amount: 4200000,
            type: 'income',
            categoryId: 'cat_freelance',
            accountId: 'acc_bca',
            date: formatDate(4),
            notes: 'Pembayaran termin 1 UI/UX'
        },
        {
            id: 'trx_' + (Date.now() - 6000),
            title: 'Tagihan Internet & Listrik',
            amount: 680000,
            type: 'expense',
            categoryId: 'cat_tagihan',
            accountId: 'acc_mandiri',
            date: formatDate(5),
            notes: 'Indihome 50Mbps & Token PLN'
        },
        {
            id: 'trx_' + (Date.now() - 7000),
            title: 'Nonton Bioskop & Snack',
            amount: 180000,
            type: 'expense',
            categoryId: 'cat_hiburan',
            accountId: 'acc_gopay',
            date: formatDate(6),
            notes: 'Weekend movie with family'
        },
        {
            id: 'trx_' + (Date.now() - 8000),
            title: 'Dividen Reksadana',
            amount: 350000,
            type: 'income',
            categoryId: 'cat_investasi',
            accountId: 'acc_bca',
            date: formatDate(8),
            notes: 'Dividen pasar uang bulanan'
        },
        {
            id: 'trx_' + (Date.now() - 9000),
            title: 'Beli Vitamin & Obat Rutin',
            amount: 120000,
            type: 'expense',
            categoryId: 'cat_kesehatan',
            accountId: 'acc_cash',
            date: formatDate(10),
            notes: 'Apotek Century'
        }
    ];
};

class DataStore {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
            localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.GOALS)) {
            localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(DEFAULT_GOALS));
        }
        const currentBills = JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS) || '[]');
        if (!localStorage.getItem(STORAGE_KEYS.BILLS) || currentBills.length === 0) {
            localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(DEFAULT_BILLS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(getSampleTransactions()));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
                currency: 'IDR',
                darkMode: false,
                monthlySavingTarget: 5000000,
                monthlyBudgetTotal: 10000000,
                userName: 'Alex Finz',
                userEmail: 'alex@finszmoney.com',
                userRole: 'Premium Plan'
            }));
        }
    }

    // ================= TRANSACTIONS =================
    getTransactions() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
        } catch (e) {
            console.error('Failed to parse transactions', e);
            return [];
        }
    }

    saveTransactions(transactions) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }

    addTransaction(tx) {
        const transactions = this.getTransactions();
        const newTx = {
            id: 'trx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            ...tx,
            amount: Number(tx.amount),
            createdAt: new Date().toISOString()
        };
        transactions.unshift(newTx);
        this.saveTransactions(transactions);
        return newTx;
    }

    updateTransaction(id, updatedData) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                ...updatedData,
                amount: Number(updatedData.amount),
                updatedAt: new Date().toISOString()
            };
            this.saveTransactions(transactions);
            return transactions[index];
        }
        return null;
    }

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        this.saveTransactions(filtered);
        return true;
    }

    getTransactionById(id) {
        return this.getTransactions().find(t => t.id === id) || null;
    }

    // ================= CATEGORIES =================
    getCategories(type = null) {
        const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || [];
        if (type) {
            return categories.filter(c => c.type === type);
        }
        return categories;
    }

    getCategoryById(id) {
        return this.getCategories().find(c => c.id === id) || null;
    }

    saveCategories(categories) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }

    addCategory(cat) {
        const categories = this.getCategories();
        const newCat = {
            id: 'cat_' + Date.now(),
            ...cat,
            budget: Number(cat.budget) || 0
        };
        categories.push(newCat);
        this.saveCategories(categories);
        return newCat;
    }

    updateCategory(id, updatedData) {
        const categories = this.getCategories();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index] = {
                ...categories[index],
                ...updatedData,
                budget: Number(updatedData.budget) || 0
            };
            this.saveCategories(categories);
            return categories[index];
        }
        return null;
    }

    deleteCategory(id) {
        const categories = this.getCategories();
        const filtered = categories.filter(c => c.id !== id);
        this.saveCategories(filtered);
        return true;
    }

    // ================= ACCOUNTS & WALLETS =================
    getAccounts() {
        let accounts = [];
        try {
            accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) || [];
        } catch(e) {
            console.error('Error parsing accounts:', e);
        }
        const transactions = this.getTransactions();

        // Calculate dynamic real-time balance for each account
        return accounts.map(acc => {
            let balance = Number(acc.initialBalance) || 0;
            transactions.forEach(tx => {
                if (tx.accountId === acc.id) {
                    if (tx.type === 'income') balance += Number(tx.amount);
                    if (tx.type === 'expense') balance -= Number(tx.amount);
                }
            });
            return {
                ...acc,
                calculatedBalance: balance
            };
        });
    }

    getAccountById(id) {
        return this.getAccounts().find(a => a.id === id) || null;
    }

    saveAccounts(accounts) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }

    addAccount(acc) {
        const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) || [];
        const newAcc = {
            id: 'acc_' + Date.now(),
            name: acc.name,
            initialBalance: Number(acc.initialBalance) || 0,
            accountNumber: acc.accountNumber || '',
            icon: acc.icon || 'account_balance_wallet',
            type: acc.type || 'bank',
            color: acc.color || '#2563EB'
        };
        accounts.push(newAcc);
        this.saveAccounts(accounts);
        return newAcc;
    }

    updateAccount(id, updatedData) {
        const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) || [];
        const index = accounts.findIndex(a => a.id === id);
        if (index !== -1) {
            accounts[index] = {
                ...accounts[index],
                ...updatedData,
                initialBalance: Number(updatedData.initialBalance) || 0
            };
            this.saveAccounts(accounts);
            return accounts[index];
        }
        return null;
    }

    deleteAccount(id) {
        const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) || [];
        const filtered = accounts.filter(a => a.id !== id);
        this.saveAccounts(filtered);
        return true;
    }

    transferBetweenAccounts(fromId, toId, amount, date, notes) {
        const fromAcc = this.getAccountById(fromId);
        const toAcc = this.getAccountById(toId);
        if (!fromAcc || !toAcc || amount <= 0) return false;

        // Create 2 paired transactions: Expense from source + Income into destination
        const expenseTx = {
            title: `Transfer ke ${toAcc.name}`,
            amount: amount,
            type: 'expense',
            categoryId: 'cat_tagihan',
            accountId: fromId,
            date: date || new Date().toISOString().split('T')[0],
            notes: notes || `Transfer saldo ke ${toAcc.name}`
        };

        const incomeTx = {
            title: `Transfer dari ${fromAcc.name}`,
            amount: amount,
            type: 'income',
            categoryId: 'cat_lainnya_inc',
            accountId: toId,
            date: date || new Date().toISOString().split('T')[0],
            notes: notes || `Transfer saldo dari ${fromAcc.name}`
        };

        this.addTransaction(expenseTx);
        this.addTransaction(incomeTx);
        return true;
    }

    // ================= SAVINGS GOALS =================
    getGoals() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS)) || [];
    }

    getGoalById(id) {
        return this.getGoals().find(g => g.id === id) || null;
    }

    saveGoals(goals) {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    }

    addGoal(goal) {
        const goals = this.getGoals();
        const newGoal = {
            id: 'goal_' + Date.now(),
            name: goal.name,
            targetAmount: Number(goal.targetAmount) || 0,
            currentAmount: Number(goal.currentAmount) || 0,
            deadline: goal.deadline || '',
            icon: goal.icon || 'savings',
            color: goal.color || '#2563EB',
            notes: goal.notes || ''
        };
        goals.push(newGoal);
        this.saveGoals(goals);
        return newGoal;
    }

    updateGoal(id, updatedData) {
        const goals = this.getGoals();
        const index = goals.findIndex(g => g.id === id);
        if (index !== -1) {
            goals[index] = {
                ...goals[index],
                ...updatedData,
                targetAmount: Number(updatedData.targetAmount) || 0,
                currentAmount: Number(updatedData.currentAmount) || 0
            };
            this.saveGoals(goals);
            return goals[index];
        }
        return null;
    }

    adjustGoalAmount(id, deltaAmount, accountId = null) {
        const goals = this.getGoals();
        const goal = goals.find(g => g.id === id);
        if (!goal) return null;

        goal.currentAmount = Math.max(0, (Number(goal.currentAmount) || 0) + Number(deltaAmount));
        this.saveGoals(goals);

        // If deposited via an account, record as transaction
        if (accountId && deltaAmount > 0) {
            this.addTransaction({
                title: `Setoran Tabungan: ${goal.name}`,
                amount: deltaAmount,
                type: 'expense',
                categoryId: 'cat_lainnya_exp',
                accountId: accountId,
                date: new Date().toISOString().split('T')[0],
                notes: `Setor dana impian ${goal.name}`
            });
        }
        return goal;
    }

    deleteGoal(id) {
        const goals = this.getGoals();
        const filtered = goals.filter(g => g.id !== id);
        this.saveGoals(filtered);
        return true;
    }

    // ================= BILLS & SUBSCRIPTIONS =================
    getBills() {
        try {
            const bills = JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS));
            if (!bills || bills.length === 0) {
                this.saveBills(DEFAULT_BILLS);
                return DEFAULT_BILLS;
            }
            return bills;
        } catch (e) {
            return DEFAULT_BILLS;
        }
    }

    getBillById(id) {
        return this.getBills().find(b => b.id === id) || null;
    }

    saveBills(bills) {
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    }

    addBill(bill) {
        const bills = this.getBills();
        const newBill = {
            id: 'bill_' + Date.now(),
            name: bill.name,
            amount: Number(bill.amount) || 0,
            dueDay: Number(bill.dueDay) || 1,
            frequency: bill.frequency || 'Bulanan',
            categoryId: bill.categoryId || 'cat_tagihan',
            accountId: bill.accountId || 'acc_bca',
            icon: bill.icon || 'receipt_long',
            isPaid: Boolean(bill.isPaid),
            lastPaidDate: bill.isPaid ? new Date().toISOString().split('T')[0] : null
        };
        bills.push(newBill);
        this.saveBills(bills);
        return newBill;
    }

    updateBill(id, updatedData) {
        const bills = this.getBills();
        const index = bills.findIndex(b => b.id === id);
        if (index !== -1) {
            bills[index] = {
                ...bills[index],
                ...updatedData,
                amount: Number(updatedData.amount) || 0,
                dueDay: Number(updatedData.dueDay) || 1
            };
            this.saveBills(bills);
            return bills[index];
        }
        return null;
    }

    payBill(id) {
        const bills = this.getBills();
        const bill = bills.find(b => b.id === id);
        if (!bill) return null;

        bill.isPaid = true;
        bill.lastPaidDate = new Date().toISOString().split('T')[0];
        this.saveBills(bills);

        // Record automatic expense transaction
        this.addTransaction({
            title: `Pembayaran Tagihan: ${bill.name}`,
            amount: bill.amount,
            type: 'expense',
            categoryId: bill.categoryId,
            accountId: bill.accountId,
            date: new Date().toISOString().split('T')[0],
            notes: `Tagihan jatuh tempo tanggal ${bill.dueDay}`
        });

        return bill;
    }

    deleteBill(id) {
        const bills = this.getBills();
        const filtered = bills.filter(b => b.id !== id);
        this.saveBills(filtered);
        return true;
    }

    // ================= SETTINGS =================
    getSettings() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
    }

    updateSettings(updated) {
        const settings = { ...this.getSettings(), ...updated };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return settings;
    }

    // ================= BACKUP / RESTORE / RESET =================
    resetToDemoData() {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(DEFAULT_GOALS));
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(DEFAULT_BILLS));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(getSampleTransactions()));
    }

    restoreFromBackupJSON(jsonData) {
        if (!jsonData || typeof jsonData !== 'object') return false;
        if (jsonData.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(jsonData.transactions));
        if (jsonData.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(jsonData.categories));
        if (jsonData.accounts) localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(jsonData.accounts));
        if (jsonData.goals) localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(jsonData.goals));
        if (jsonData.bills) localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(jsonData.bills));
        if (jsonData.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(jsonData.settings));
        return true;
    }

    // ================= AGGREGATIONS & SUMMARY =================
    getSummary(filteredTransactions = null) {
        const transactions = filteredTransactions || this.getTransactions();
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += Number(t.amount);
            } else if (t.type === 'expense') {
                totalExpense += Number(t.amount);
            }
        });

        const balance = totalIncome - totalExpense;
        const savingRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

        // Total wealth across all accounts
        const accounts = this.getAccounts();
        const totalNetWorth = accounts.reduce((sum, a) => sum + (a.calculatedBalance || 0), 0);

        // Goals total
        const goals = this.getGoals();
        const totalSavedInGoals = goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
        const totalTargetGoals = goals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);

        // Bills pending
        const bills = this.getBills();
        const pendingBillsCount = bills.filter(b => !b.isPaid).length;
        const pendingBillsAmount = bills.filter(b => !b.isPaid).reduce((sum, b) => sum + Number(b.amount), 0);

        return {
            totalIncome,
            totalExpense,
            balance,
            savingRate: Math.max(0, savingRate),
            transactionCount: transactions.length,
            totalNetWorth,
            totalSavedInGoals,
            totalTargetGoals,
            pendingBillsCount,
            pendingBillsAmount
        };
    }
}

// Utility Formatters
const Utils = {
    formatRupiah(amount, withPrefix = true) {
        const num = Math.round(Number(amount) || 0);
        const formatted = new Intl.NumberFormat('id-ID').format(Math.abs(num));
        const sign = num < 0 ? '-' : '';
        return withPrefix ? `${sign}Rp ${formatted}` : `${sign}${formatted}`;
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },

    formatDateTime(dateString) {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

window.DataStore = new DataStore();
window.Utils = Utils;
