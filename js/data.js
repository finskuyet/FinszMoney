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
const DEFAULT_CATEGORIES = [];

// Default accounts / wallets (Kosong, siap diisi pengguna)
const DEFAULT_ACCOUNTS = [];

// Default savings goals
const DEFAULT_GOALS = [];

// Default bills and recurring subscriptions
const DEFAULT_BILLS = [];

// Sample transactions
const getSampleTransactions = () => {
    return [];
};

class DataStoreEngine {
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
        if (window.SupabaseSync) {
            window.SupabaseSync.pushTableToCloud('transactions', transactions);
        }
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
        if (window.SupabaseSync) {
            window.SupabaseSync.pushTableToCloud('categories', categories);
        }
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
        if (window.SupabaseSync) {
            window.SupabaseSync.pushTableToCloud('accounts', accounts);
        }
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
        if (window.SupabaseSync) {
            window.SupabaseSync.pushTableToCloud('goals', goals);
        }
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
        if (window.SupabaseSync) {
            window.SupabaseSync.pushTableToCloud('bills', bills);
        }
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

window.DataStore = new DataStoreEngine();
window.Utils = Utils;
