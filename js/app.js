/**
 * LFMoney - Application Main Controller
 * Handles Views: Dashboard, Transactions, Reports, Categories, Goals, Accounts, Bills, Settings
 */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    currentTab: 'dashboard',
    editingTransactionId: null,
    editingCategoryId: null,
    editingAccountId: null,
    editingGoalId: null,
    editingBillId: null,
    activeGoalActionId: null,

    init() {
        const user = Auth.requireAuth();
        if (!user) return;
        this.updateUserProfile(user);

        this.setupTheme();
        this.bindEvents();
        this.handleHashChange();
        this.populateDropdowns();

        // Listen for hash changes in URL
        window.addEventListener('hashchange', () => this.handleHashChange());
        
        // Listen for online/offline status
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());
        this.updateConnectionStatus();
    },

    updateUserProfile(user) {
        const nameEl = document.getElementById('user-profile-name');
        const initialEl = document.getElementById('user-profile-initial');
        if (nameEl) nameEl.textContent = user.name;
        if (initialEl) {
            initialEl.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }
    },

    updateConnectionStatus() {
        const el = document.getElementById('connection-status');
        if (!el) return;
        
        const device = (() => {
            const ua = navigator.userAgent;
            if (/Windows/i.test(ua)) return 'Windows';
            if (/Mac/i.test(ua)) return 'Mac';
            if (/Android/i.test(ua)) return 'Android';
            if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
            if (/Linux/i.test(ua)) return 'Linux';
            return 'Perangkat';
        })();
        
        if (navigator.onLine) {
            el.textContent = `Online - ${device}`;
            el.className = 'text-[10px] text-emerald-600 dark:text-emerald-400 font-medium';
        } else {
            el.textContent = `Offline - ${device}`;
            el.className = 'text-[10px] text-rose-500 font-medium';
        }
    },

    handleHashChange() {
        const hash = window.location.hash.replace('#', '');
        const validTabs = ['dashboard', 'transactions', 'reports', 'categories', 'goals', 'accounts', 'bills', 'settings', 'ai', 'guide'];
        if (validTabs.includes(hash)) {
            this.switchTab(hash, false);
        } else {
            this.switchTab('dashboard', false);
        }
    },

    // Theme setup (Dark / Light mode)
    setupTheme() {
        const settings = DataStore.getSettings();
        if (settings.darkMode !== undefined) {
            if (settings.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
        this.updateThemeToggleIcon();

        // Listen for OS theme changes if no explicit user preference
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                const currentSettings = DataStore.getSettings();
                if (currentSettings.darkMode === undefined) {
                    if (event.matches) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    this.updateThemeToggleIcon();
                }
            });
        }
    },

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        DataStore.updateSettings({ darkMode: isDark });
        this.updateThemeToggleIcon();
        this.refreshCharts();
    },

    updateThemeToggleIcon() {
        const isDark = document.documentElement.classList.contains('dark');
        const themeIcons = document.querySelectorAll('.theme-icon');
        themeIcons.forEach(icon => {
            icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        });
    },

    // Navigation / Routing
    switchTab(tabId, updateHash = true) {
        this.currentTab = tabId;
        if (updateHash) {
            if (tabId === 'ai') {
                history.replaceState(null, null, window.location.pathname);
            } else {
                window.location.hash = tabId;
            }
        }

        // 1. Update Desktop Sidebar nav item active states
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.tab === tabId) {
                link.className = 'nav-link flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm transition-all';
            } else {
                link.className = 'nav-link flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-all';
            }
        });

        // 2. Update Mobile Drawer nav item active states
        document.querySelectorAll('.drawer-nav-link').forEach(link => {
            if (link.dataset.tab === tabId) {
                link.className = 'drawer-nav-link flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm transition-all';
            } else {
                link.className = 'drawer-nav-link flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-all';
            }
        });

        // 3. Update Mobile Bottom nav active state
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            if (link.dataset.tab === tabId) {
                link.className = 'mobile-nav-link flex flex-col items-center gap-0.5 text-blue-600 dark:text-blue-400 font-bold transition-all';
            } else {
                link.className = 'mobile-nav-link flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all';
            }
        });

        // 4. Hide all views, show active view
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.add('hidden');
        });

        const activeView = document.getElementById(`view-${tabId}`);
        if (activeView) {
            activeView.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 5. Update top bar page title
        const titles = {
            dashboard: 'Financial Overview',
            transactions: 'Riwayat Transaksi',
            reports: 'Laporan & Analisis',
            goals: 'Target Tabungan (Goals)',
            accounts: 'Rekening & Dompet',
            bills: 'Tagihan & Langganan',
            categories: 'Kategori & Anggaran',
            settings: 'Pengaturan & Data'
        };
        const pageTitle = document.getElementById('top-page-title');
        if (pageTitle) pageTitle.textContent = titles[tabId] || 'Financial Overview';

        // 6. Close mobile drawer if open
        this.closeMobileDrawer();

        // 7. Render data for current view
        this.renderCurrentView();

        // 8. Auto-start guide if applicable
        if (typeof Guide !== 'undefined') {
            Guide.checkAutoStart(tabId);
        }
    },

    renderCurrentView() {
        switch (this.currentTab) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'transactions':
                this.renderTransactionsTable();
                break;
            case 'reports':
                this.renderReports();
                break;
            case 'categories':
                this.renderCategories();
                break;
            case 'goals':
                this.renderGoals();
                break;
            case 'accounts':
                this.renderAccounts();
                break;
            case 'bills':
                this.renderBills();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    },

    // ================= 1. VIEW: DASHBOARD =================
    renderDashboard() {
        const transactions = DataStore.getTransactions();
        const summary = DataStore.getSummary(transactions);

        // Summary Metric Cards
        const elTotalBalance = document.getElementById('stat-total-balance');
        const elTotalIncome = document.getElementById('stat-total-income');
        const elTotalExpense = document.getElementById('stat-total-expense');
        const elNetWorth = document.getElementById('stat-net-worth');
        const elSavingRate = document.getElementById('stat-saving-rate');
        const elSavingProgress = document.getElementById('stat-saving-progress');

        if (elTotalBalance) elTotalBalance.textContent = Utils.formatRupiah(summary.balance);
        if (elTotalIncome) elTotalIncome.textContent = Utils.formatRupiah(summary.totalIncome);
        if (elTotalExpense) elTotalExpense.textContent = Utils.formatRupiah(summary.totalExpense);
        if (elNetWorth) elNetWorth.textContent = Utils.formatRupiah(summary.totalNetWorth);
        if (elSavingRate) elSavingRate.textContent = `${summary.savingRate}%`;
        if (elSavingProgress) elSavingProgress.style.width = `${Math.min(100, summary.savingRate)}%`;

        // Render Dashboard Pending Bills Alert
        const elBillsBadge = document.getElementById('dashboard-bills-alert');
        if (elBillsBadge) {
            if (summary.pendingBillsCount > 0) {
                elBillsBadge.classList.remove('hidden');
                elBillsBadge.innerHTML = `
                    <div class="flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200">
                        <div class="flex items-center gap-2.5">
                            <span class="material-symbols-outlined text-amber-600 text-xl">notification_important</span>
                            <span class="text-xs font-semibold">Ada ${summary.pendingBillsCount} tagihan belum dibayar bulan ini (${Utils.formatRupiah(summary.pendingBillsAmount)})</span>
                        </div>
                        <button onclick="App.switchTab('bills')" class="text-xs font-bold text-amber-700 dark:text-amber-300 underline hover:no-underline">Lihat Tagihan &rarr;</button>
                    </div>
                `;
            } else {
                elBillsBadge.classList.add('hidden');
            }
        }

        // Render Recent Transactions (Top 5)
        const recentList = document.getElementById('recent-transactions-list');
        if (recentList) {
            const recentTx = transactions.slice(0, 5);
            if (recentTx.length === 0) {
                recentList.innerHTML = `
                    <div class="py-8 text-center text-slate-400">
                        <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">receipt_long</span>
                        <p class="text-sm">Belum ada transaksi. Klik "Tambah Transaksi" untuk mulai.</p>
                    </div>
                `;
            } else {
                recentList.innerHTML = recentTx.map(tx => {
                    const cat = DataStore.getCategoryById(tx.categoryId) || { name: 'Lainnya', icon: 'payments', color: '#64748b' };
                    const isIncome = tx.type === 'income';
                    const amountClass = isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100';
                    const sign = isIncome ? '+' : '-';

                    return `
                        <div class="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <div class="flex items-center gap-3.5">
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style="background-color: ${cat.color}">
                                    <span class="material-symbols-outlined text-xl">${cat.icon || 'category'}</span>
                                </div>
                                <div>
                                    <h4 class="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight">${tx.title}</h4>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <span class="text-xs text-slate-400">${cat.name}</span>
                                        <span class="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                                        <span class="text-xs text-slate-400">${Utils.formatDate(tx.date)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="font-bold text-sm ${amountClass}">${sign}${Utils.formatRupiah(tx.amount)}</span>
                                <div class="flex items-center justify-end gap-1 mt-0.5">
                                    <button onclick="App.openEditTransactionModal('${tx.id}')" class="text-slate-400 hover:text-primary p-1 rounded transition-colors" title="Edit">
                                        <span class="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button onclick="App.deleteTransaction('${tx.id}')" class="text-slate-400 hover:text-red-600 p-1 rounded transition-colors" title="Hapus">
                                        <span class="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Render mini Goals progress preview on Dashboard
        const elDashGoals = document.getElementById('dashboard-goals-preview');
        if (elDashGoals) {
            const goals = DataStore.getGoals().slice(0, 3);
            if (goals.length === 0) {
                elDashGoals.innerHTML = `<p class="text-xs text-slate-400">Belum ada target tabungan dibuat.</p>`;
            } else {
                elDashGoals.innerHTML = goals.map(g => {
                    const percent = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                    return `
                        <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                            <div class="flex items-center justify-between text-xs">
                                <span class="font-medium text-slate-800 dark:text-slate-200 truncate">${g.name}</span>
                                <span class="font-bold text-blue-600 dark:text-blue-400">${percent}%</span>
                            </div>
                            <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div class="h-1.5 rounded-full bg-blue-600" style="width: ${percent}%"></div>
                            </div>
                            <div class="flex justify-between text-[11px] text-slate-400">
                                <span>${Utils.formatRupiah(g.currentAmount)}</span>
                                <span>Target: ${Utils.formatRupiah(g.targetAmount)}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Render Charts
        this.refreshCharts();
    },

    refreshCharts() {
        const transactions = DataStore.getTransactions();
        const categories = DataStore.getCategories();
        ChartManager.renderCashFlowChart('cashflow-chart', transactions);
        ChartManager.renderCategoryDonutChart('category-donut-chart', transactions, categories);
        ChartManager.renderReportTrendChart('report-trend-chart', transactions);
    },

    // ================= 2. VIEW: TRANSAKSI (RIWAYAT) =================
    renderTransactionsTable() {
        const transactions = DataStore.getTransactions();
        const searchInput = document.getElementById('search-transactions');
        const filterType = document.getElementById('filter-type');
        const filterCategory = document.getElementById('filter-category');

        const keyword = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const selectedType = filterType ? filterType.value : 'all';
        const selectedCat = filterCategory ? filterCategory.value : 'all';

        let filtered = transactions.filter(t => {
            const matchKeyword = t.title.toLowerCase().includes(keyword) || (t.notes && t.notes.toLowerCase().includes(keyword));
            const matchType = selectedType === 'all' || t.type === selectedType;
            const matchCategory = selectedCat === 'all' || t.categoryId === selectedCat;
            return matchKeyword && matchType && matchCategory;
        });

        const filteredSummary = DataStore.getSummary(filtered);
        const elFilteredIncome = document.getElementById('filtered-income');
        const elFilteredExpense = document.getElementById('filtered-expense');
        const elFilteredCount = document.getElementById('filtered-count');

        if (elFilteredIncome) elFilteredIncome.textContent = Utils.formatRupiah(filteredSummary.totalIncome);
        if (elFilteredExpense) elFilteredExpense.textContent = Utils.formatRupiah(filteredSummary.totalExpense);
        if (elFilteredCount) elFilteredCount.textContent = `${filtered.length} Transaksi`;

        const tbody = document.getElementById('transactions-table-body');
        if (tbody) {
            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="py-12 text-center text-slate-400">
                            <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">search_off</span>
                            <p class="text-sm">Tidak ada transaksi yang cocok dengan filter pencarian.</p>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = filtered.map(tx => {
                    const cat = DataStore.getCategoryById(tx.categoryId) || { name: 'Lainnya', icon: 'category', color: '#64748b' };
                    const acc = DataStore.getAccountById(tx.accountId) || { name: 'Tunai' };
                    const isIncome = tx.type === 'income';
                    const amountClass = isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
                    const sign = isIncome ? '+' : '-';

                    return `
                        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                ${Utils.formatDate(tx.date)}
                            </td>
                            <td class="py-3.5 px-4">
                                <div class="font-medium text-slate-900 dark:text-slate-100 text-sm">${tx.title}</div>
                                ${tx.notes ? `<div class="text-xs text-slate-400 italic">${tx.notes}</div>` : ''}
                            </td>
                            <td class="py-3.5 px-4 whitespace-nowrap">
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs" style="background-color: ${cat.color}">
                                        <span class="material-symbols-outlined text-sm">${cat.icon || 'category'}</span>
                                    </div>
                                    <span class="text-xs font-medium text-slate-700 dark:text-slate-300">${cat.name}</span>
                                </div>
                            </td>
                            <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                ${acc.name}
                            </td>
                            <td class="py-3.5 px-4 text-right whitespace-nowrap">
                                <span class="font-bold text-sm ${amountClass}">${sign}${Utils.formatRupiah(tx.amount)}</span>
                            </td>
                            <td class="py-3.5 px-4 text-center whitespace-nowrap">
                                <div class="flex items-center justify-center gap-1.5">
                                    <button onclick="App.openEditTransactionModal('${tx.id}')" class="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                                        <span class="material-symbols-outlined text-base">edit</span>
                                    </button>
                                    <button onclick="App.deleteTransaction('${tx.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Hapus">
                                        <span class="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    },

    // ================= 3. VIEW: LAPORAN KEUANGAN =================
    renderReports() {
        const transactions = DataStore.getTransactions();
        const categories = DataStore.getCategories();
        const summary = DataStore.getSummary(transactions);

        const elReportIncome = document.getElementById('report-total-income');
        const elReportExpense = document.getElementById('report-total-expense');
        const elReportNet = document.getElementById('report-net-income');

        if (elReportIncome) elReportIncome.textContent = Utils.formatRupiah(summary.totalIncome);
        if (elReportExpense) elReportExpense.textContent = Utils.formatRupiah(summary.totalExpense);
        if (elReportNet) {
            elReportNet.textContent = Utils.formatRupiah(summary.balance);
            elReportNet.className = summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold';
        }

        const categoryReportContainer = document.getElementById('category-breakdown-list');
        if (categoryReportContainer) {
            const expenseMap = {};
            let totalExp = 0;

            transactions.forEach(t => {
                if (t.type === 'expense') {
                    expenseMap[t.categoryId] = (expenseMap[t.categoryId] || 0) + Number(t.amount);
                    totalExp += Number(t.amount);
                }
            });

            const expenseCategories = categories.filter(c => c.type === 'expense');

            if (expenseCategories.length === 0 || totalExp === 0) {
                categoryReportContainer.innerHTML = `
                    <div class="py-8 text-center text-slate-400">
                        <p class="text-sm">Belum ada data pengeluaran untuk dianalisis.</p>
                    </div>
                `;
            } else {
                categoryReportContainer.innerHTML = expenseCategories.map(cat => {
                    const spent = expenseMap[cat.id] || 0;
                    const percentOfTotal = totalExp > 0 ? Math.round((spent / totalExp) * 100) : 0;
                    const budget = cat.budget || 0;
                    const budgetPercent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : percentOfTotal;
                    const isOverBudget = budget > 0 && spent > budget;

                    return `
                        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2.5">
                                    <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style="background-color: ${cat.color}">
                                        <span class="material-symbols-outlined text-sm">${cat.icon || 'category'}</span>
                                    </div>
                                    <div>
                                        <span class="font-medium text-slate-800 dark:text-slate-200 text-sm">${cat.name}</span>
                                        <span class="text-xs text-slate-400 ml-1.5">(${percentOfTotal}% total)</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="font-bold text-sm text-slate-900 dark:text-slate-100">${Utils.formatRupiah(spent)}</span>
                                    ${budget > 0 ? `<span class="text-xs text-slate-400 block">Budget: ${Utils.formatRupiah(budget)}</span>` : ''}
                                </div>
                            </div>
                            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div class="h-2 rounded-full transition-all duration-500" style="width: ${budgetPercent}%; background-color: ${isOverBudget ? '#ef4444' : cat.color}"></div>
                            </div>
                            ${isOverBudget ? `
                                <div class="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                                    <span class="material-symbols-outlined text-xs">warning</span>
                                    <span>Melebihi anggaran sebesar ${Utils.formatRupiah(spent - budget)}</span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');
            }
        }

        this.refreshCharts();
    },

    // ================= 4. VIEW: MANAJEMEN KATEGORI =================
    renderCategories() {
        const categories = DataStore.getCategories();
        const expenseCategories = categories.filter(c => c.type === 'expense');
        const incomeCategories = categories.filter(c => c.type === 'income');

        const elExpList = document.getElementById('expense-categories-list');
        const elIncList = document.getElementById('income-categories-list');

        const renderCatItem = (cat) => `
            <div class="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style="background-color: ${cat.color}">
                        <span class="material-symbols-outlined text-xl">${cat.icon || 'category'}</span>
                    </div>
                    <div>
                        <h4 class="font-semibold text-slate-900 dark:text-slate-100 text-sm">${cat.name}</h4>
                        ${cat.budget ? `<p class="text-xs text-slate-400">Budget: ${Utils.formatRupiah(cat.budget)}</p>` : `<p class="text-xs text-slate-400">${cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</p>`}
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <button onclick="App.openEditCategoryModal('${cat.id}')" class="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors" title="Edit">
                        <span class="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onclick="App.deleteCategory('${cat.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Hapus">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>
            </div>
        `;

        if (elExpList) elExpList.innerHTML = expenseCategories.map(renderCatItem).join('');
        if (elIncList) elIncList.innerHTML = incomeCategories.map(renderCatItem).join('');
    },

    // ================= 5. VIEW: TARGET TABUNGAN (GOALS) =================
    renderGoals() {
        const goals = DataStore.getGoals();
        const goalsList = document.getElementById('goals-grid-list');
        const summary = DataStore.getSummary();

        const elTotalSaved = document.getElementById('goals-total-saved');
        const elTotalTarget = document.getElementById('goals-total-target');

        if (elTotalSaved) elTotalSaved.textContent = Utils.formatRupiah(summary.totalSavedInGoals);
        if (elTotalTarget) elTotalTarget.textContent = Utils.formatRupiah(summary.totalTargetGoals);

        if (goalsList) {
            if (goals.length === 0) {
                goalsList.innerHTML = `
                    <div class="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                        <span class="material-symbols-outlined text-5xl mb-3 text-slate-300">savings</span>
                        <h4 class="font-bold text-base text-slate-700 dark:text-slate-300">Belum Ada Target Tabungan</h4>
                        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Mulai wujudkan impian Anda seperti Dana Darurat, Liburan, atau Beli Gadget dengan membuat target baru.</p>
                        <button onclick="App.openAddGoalModal()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-blue-500/25">
                            <span class="material-symbols-outlined text-base">add</span>
                            <span>Buat Target Pertama</span>
                        </button>
                    </div>
                `;
            } else {
                goalsList.innerHTML = goals.map(goal => {
                    const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

                    return `
                        <div class="hover-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                            <div>
                                <div class="flex items-center justify-between">
                                    <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md" style="background-color: ${goal.color}">
                                        <span class="material-symbols-outlined text-2xl">${goal.icon || 'savings'}</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <button onclick="App.openEditGoalModal('${goal.id}')" class="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors" title="Edit">
                                            <span class="material-symbols-outlined text-base">edit</span>
                                        </button>
                                        <button onclick="App.deleteGoal('${goal.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Hapus">
                                            <span class="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 mt-3 leading-tight">${goal.name}</h3>
                                ${goal.notes ? `<p class="text-xs text-slate-400 mt-1 line-clamp-2">${goal.notes}</p>` : ''}
                            </div>

                            <div class="space-y-2">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="font-medium text-slate-500 dark:text-slate-400">Terkumpul: <strong class="text-slate-800 dark:text-slate-200">${Utils.formatRupiah(goal.currentAmount)}</strong></span>
                                    <span class="font-bold text-blue-600 dark:text-blue-400">${percent}%</span>
                                </div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                    <div class="h-2.5 rounded-full transition-all duration-500" style="width: ${percent}%; background-color: ${goal.color}"></div>
                                </div>
                                <div class="flex items-center justify-between text-[11px] text-slate-400">
                                    <span>Target: ${Utils.formatRupiah(goal.targetAmount)}</span>
                                    <span>Sisa: ${Utils.formatRupiah(remaining)}</span>
                                </div>
                                ${goal.deadline ? `
                                    <div class="flex items-center gap-1 text-[11px] text-slate-400 pt-1">
                                        <span class="material-symbols-outlined text-xs">event</span>
                                        <span>Target Selesai: ${Utils.formatDate(goal.deadline)}</span>
                                    </div>
                                ` : ''}
                            </div>

                            <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                                <button onclick="App.openDepositGoalModal('${goal.id}')" class="flex-1 py-2 px-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                                    <span class="material-symbols-outlined text-sm">add</span>
                                    <span>Setor Dana</span>
                                </button>
                                <button onclick="App.openWithdrawGoalModal('${goal.id}')" class="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center transition-colors" title="Tarik Dana">
                                    <span class="material-symbols-outlined text-sm">remove</span>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    },

    // ================= 6. VIEW: REKENING & DOMPET (ACCOUNTS) =================
    renderAccounts() {
        const accounts = DataStore.getAccounts();
        const accountsList = document.getElementById('accounts-grid-list');
        const summary = DataStore.getSummary();

        const elTotalNetWorth = document.getElementById('accounts-total-networth');
        if (elTotalNetWorth) elTotalNetWorth.textContent = Utils.formatRupiah(summary.totalNetWorth);

        if (accountsList) {
            accountsList.innerHTML = accounts.map(acc => {
                const bal = acc.calculatedBalance || 0;
                return `
                    <div class="hover-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                        <div>
                            <div class="flex items-center justify-between">
                                <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md" style="background-color: ${acc.color}">
                                    <span class="material-symbols-outlined text-2xl">${acc.icon || 'account_balance_wallet'}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <button onclick="App.openEditAccountModal('${acc.id}')" class="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors" title="Edit">
                                        <span class="material-symbols-outlined text-base">edit</span>
                                    </button>
                                    <button onclick="App.deleteAccount('${acc.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Hapus">
                                        <span class="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            </div>
                            <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 mt-3 leading-tight">${acc.name}</h3>
                            <p class="text-xs text-slate-400 mt-0.5 font-mono">${acc.accountNumber || (acc.type ? acc.type.toUpperCase() : 'DOMPET')}</p>
                        </div>

                        <div>
                            <span class="text-xs text-slate-400 block font-medium">Saldo Terkini</span>
                            <span class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">${Utils.formatRupiah(bal)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    // ================= 7. VIEW: TAGIHAN & LANGGANAN (BILLS) =================
    renderBills() {
        const bills = DataStore.getBills();
        const billsList = document.getElementById('bills-table-body');

        const pendingBills = bills.filter(b => !b.isPaid);
        const paidBills = bills.filter(b => b.isPaid);

        const pendingCount = pendingBills.length;
        const pendingAmount = pendingBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        const paidAmount = paidBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        const totalAmount = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

        const elPendingCount = document.getElementById('bills-pending-count');
        const elPendingTotal = document.getElementById('bills-pending-total');
        const elPaidTotal = document.getElementById('bills-paid-total');
        const elAllTotal = document.getElementById('bills-all-total');

        if (elPendingCount) elPendingCount.textContent = `${pendingCount} Belum Bayar`;
        if (elPendingTotal) elPendingTotal.textContent = Utils.formatRupiah(pendingAmount);
        if (elPaidTotal) elPaidTotal.textContent = Utils.formatRupiah(paidAmount);
        if (elAllTotal) elAllTotal.textContent = Utils.formatRupiah(totalAmount);

        if (billsList) {
            if (bills.length === 0) {
                billsList.innerHTML = `
                    <tr>
                        <td colspan="6" class="py-12 text-center text-slate-400">
                            <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">receipt_long</span>
                            <p class="text-sm">Belum ada tagihan atau langganan rutin ditambahkan.</p>
                        </td>
                    </tr>
                `;
            } else {
                billsList.innerHTML = bills.map(bill => {
                    const cat = DataStore.getCategoryById(bill.categoryId) || { name: 'Tagihan' };
                    const acc = DataStore.getAccountById(bill.accountId) || { name: 'Utama' };

                    return `
                        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td class="py-3.5 px-4 whitespace-nowrap">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                        <span class="material-symbols-outlined text-base">${bill.icon || 'receipt_long'}</span>
                                    </div>
                                    <div>
                                        <div class="font-semibold text-slate-900 dark:text-slate-100 text-sm">${bill.name}</div>
                                        <div class="text-xs text-slate-400">${bill.frequency || 'Bulanan'} • ${cat.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                Setiap Tgl ${bill.dueDay}
                            </td>
                            <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                ${acc.name}
                            </td>
                            <td class="py-3.5 px-4 text-right font-bold text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                ${Utils.formatRupiah(bill.amount)}
                            </td>
                            <td class="py-3.5 px-4 text-center whitespace-nowrap">
                                ${bill.isPaid ? `
                                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        <span class="material-symbols-outlined text-xs">check_circle</span> Lunas Bulan Ini
                                    </span>
                                ` : `
                                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        <span class="material-symbols-outlined text-xs">pending</span> Belum Bayar
                                    </span>
                                `}
                            </td>
                            <td class="py-3.5 px-4 text-center whitespace-nowrap">
                                <div class="flex items-center justify-center gap-1.5">
                                    ${!bill.isPaid ? `
                                        <button onclick="App.payBillAction('${bill.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-sm shadow-emerald-500/20">
                                            <span class="material-symbols-outlined text-sm">payments</span>
                                            <span>Bayar</span>
                                        </button>
                                    ` : ''}
                                    <button onclick="App.openEditBillModal('${bill.id}')" class="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Edit">
                                        <span class="material-symbols-outlined text-base">edit</span>
                                    </button>
                                    <button onclick="App.deleteBill('${bill.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Hapus">
                                        <span class="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    },

    payBillAction(id) {
        if (confirm('Tandai tagihan ini telah dibayar dan catat ke pengeluaran otomatis?')) {
            DataStore.payBill(id);
            this.showToast('Tagihan berhasil dibayar dan dicatat ke transaksi!', 'success');
            this.renderBills();
            this.populateDropdowns();
        }
    },

    // ================= 8. VIEW: PENGATURAN & PROFIL (SETTINGS) =================
    renderSettings() {
        const settings = DataStore.getSettings();
        const user = Auth.getCurrentUser();

        const elName = document.getElementById('settings-user-name');
        const elEmail = document.getElementById('settings-user-email');
        const elSavingTarget = document.getElementById('settings-saving-target');
        const elBudgetTotal = document.getElementById('settings-budget-total');

        if (elName && user) elName.value = user.name;
        if (elEmail && user) elEmail.value = user.email;
        if (elSavingTarget) elSavingTarget.value = settings.monthlySavingTarget || 5000000;
        if (elBudgetTotal) elBudgetTotal.value = settings.monthlyBudgetTotal || 10000000;
    },

    saveSettings(e) {
        e.preventDefault();
        const userName = document.getElementById('settings-user-name').value.trim();
        const userEmail = document.getElementById('settings-user-email').value.trim();
        const userPassword = document.getElementById('settings-user-password') ? document.getElementById('settings-user-password').value : '';
        
        const monthlySavingTarget = Number(document.getElementById('settings-saving-target').value) || 0;
        const monthlyBudgetTotal = Number(document.getElementById('settings-budget-total').value) || 0;

        const authResult = Auth.updateUser(userName, userEmail, userPassword);

        if (!authResult.success) {
            this.showToast(authResult.message, 'error');
            return;
        }

        DataStore.updateSettings({
            monthlySavingTarget,
            monthlyBudgetTotal
        });

        // Update profile di sidebar
        this.updateUserProfile(authResult.user);
        
        // Reset kolom password agar aman
        if (document.getElementById('settings-user-password')) {
            document.getElementById('settings-user-password').value = '';
        }

        this.showToast('Pengaturan profil & anggaran berhasil disimpan!', 'success');
    },

    // ================= DROPDOWNS & SELECTORS =================
    populateDropdowns() {
        const categories = DataStore.getCategories();
        const accounts = DataStore.getAccounts();

        // Transaction Category Dropdown
        const txType = document.querySelector('input[name="tx-type"]:checked')?.value || 'expense';
        this.updateModalCategoryDropdown(txType);

        // Transaction Account Dropdown
        const elAccountSelect = document.getElementById('tx-account');
        if (elAccountSelect) {
            elAccountSelect.innerHTML = accounts.length > 0 
                ? accounts.map(acc => `<option value="${acc.id}">${acc.name} (${Utils.formatRupiah(acc.calculatedBalance || 0)})</option>`).join('')
                : `<option value="" disabled selected>-- Tambah Rekening Dulu --</option>`;
        }

        // Filter Category Dropdown in Table
        const elFilterCategory = document.getElementById('filter-category');
        if (elFilterCategory) {
            elFilterCategory.innerHTML = `
                <option value="all">Semua Kategori</option>
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            `;
        }

        // Bill Category Dropdown
        const elBillCategory = document.getElementById('bill-category');
        if (elBillCategory) {
            elBillCategory.innerHTML = categories.length > 0 
                ? categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
                : `<option value="" disabled selected>-- Tambah Kategori Dulu --</option>`;
        }

        // Bill Account Dropdown
        const elBillAccount = document.getElementById('bill-account');
        if (elBillAccount) {
            elBillAccount.innerHTML = accounts.length > 0 
                ? accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')
                : `<option value="" disabled selected>-- Tambah Rekening Dulu --</option>`;
        }

        // Deposit Goal Account Dropdown
        const elDepositAcc = document.getElementById('goal-deposit-account');
        if (elDepositAcc) {
            elDepositAcc.innerHTML = accounts.length > 0 
                ? accounts.map(acc => `<option value="${acc.id}">${acc.name} (${Utils.formatRupiah(acc.calculatedBalance || 0)})</option>`).join('')
                : `<option value="" disabled selected>-- Tambah Rekening Dulu --</option>`;
        }
    },

    updateModalCategoryDropdown(type) {
        const categories = DataStore.getCategories(type);
        const elCategorySelect = document.getElementById('tx-category');
        if (elCategorySelect) {
            elCategorySelect.innerHTML = categories.length > 0 
                ? categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
                : `<option value="" disabled selected>-- Tambah Kategori Dulu --</option>`;
        }
    },

    // ================= TRANSACTION MODAL =================
    openAddTransactionModal(defaultType = 'expense') {
        try {
            this.editingTransactionId = null;
            
            try {
                this.populateDropdowns();
            } catch(e) {
                console.error('Error populating dropdowns:', e);
            }

            const title = document.getElementById('modal-transaction-title');
            if (title) title.textContent = 'Tambah Transaksi Baru';
            const form = document.getElementById('form-transaction');
            if (form) form.reset();

            const radio = document.querySelector(`input[name="tx-type"][value="${defaultType}"]`);
            if (radio) radio.checked = true;

            try {
                this.updateModalCategoryDropdown(defaultType);
            } catch(e) {
                console.error('Error updating category dropdown:', e);
            }

            const date = document.getElementById('tx-date');
            if (date) date.value = new Date().toISOString().split('T')[0];
            const modal = document.getElementById('modal-transaction');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Error in openAddTransactionModal:', err);
        }
    },

    openEditTransactionModal(id) {
        try {
            const tx = DataStore.getTransactionById(id);
            if (!tx) return;

            this.editingTransactionId = id;
            this.populateDropdowns();
            const title = document.getElementById('modal-transaction-title');
            if (title) title.textContent = 'Edit Transaksi';

            const radio = document.querySelector(`input[name="tx-type"][value="${tx.type}"]`);
            if (radio) radio.checked = true;

            this.updateModalCategoryDropdown(tx.type);

            const elTitle = document.getElementById('tx-title');
            if (elTitle) elTitle.value = tx.title || '';
            const elAmount = document.getElementById('tx-amount');
            if (elAmount) elAmount.value = tx.amount || '';
            const elCat = document.getElementById('tx-category');
            if (elCat) elCat.value = tx.categoryId;
            const elAcc = document.getElementById('tx-account');
            if (elAcc) elAcc.value = tx.accountId;
            const elDate = document.getElementById('tx-date');
            if (elDate) elDate.value = tx.date;
            const elNotes = document.getElementById('tx-notes');
            if (elNotes) elNotes.value = tx.notes || '';

            const modal = document.getElementById('modal-transaction');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Error in openEditTransactionModal:', err);
        }
    },

    closeTransactionModal() {
        const modal = document.getElementById('modal-transaction');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        this.editingTransactionId = null;
    },

    saveTransaction(e) {
        e.preventDefault();
        const type = document.querySelector('input[name="tx-type"]:checked')?.value || 'expense';
        const title = (document.getElementById('tx-title')?.value || '').trim();
        const amount = Number(document.getElementById('tx-amount')?.value);
        const categoryId = document.getElementById('tx-category')?.value;
        const accountId = document.getElementById('tx-account')?.value;
        const date = document.getElementById('tx-date')?.value;
        const notes = (document.getElementById('tx-notes')?.value || '').trim();

        if (!title || !amount || amount <= 0 || !date) {
            this.showToast('Mohon lengkapi judul, nominal, dan tanggal transaksi!', 'warning');
            return;
        }

        const txData = { title, amount, type, categoryId, accountId, date, notes };

        if (this.editingTransactionId) {
            DataStore.updateTransaction(this.editingTransactionId, txData);
            this.showToast('Transaksi berhasil diperbarui!', 'success');
        } else {
            DataStore.addTransaction(txData);
            this.showToast('Transaksi baru berhasil ditambahkan!', 'success');
        }

        this.closeTransactionModal();
        this.renderCurrentView();
        this.populateDropdowns();
    },

    deleteTransaction(id) {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            DataStore.deleteTransaction(id);
            this.showToast('Transaksi berhasil dihapus!', 'success');
            this.renderCurrentView();
        }
    },

    // ================= CATEGORY MODAL =================
    openAddCategoryModal(defaultType = 'expense') {
        try {
            this.editingCategoryId = null;
            const title = document.getElementById('modal-category-title');
            if (title) title.textContent = 'Tambah Kategori Baru';
            const form = document.getElementById('form-category');
            if (form) form.reset();

            const radio = document.querySelector(`input[name="cat-type"][value="${defaultType}"]`);
            if (radio) radio.checked = true;

            const color = document.getElementById('cat-color');
            if (color) color.value = '#2563EB';
            const icon = document.getElementById('cat-icon');
            if (icon) icon.value = 'category';
            const modal = document.getElementById('modal-category');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Error in openAddCategoryModal:', err);
        }
    },

    openEditCategoryModal(id) {
        try {
            const cat = DataStore.getCategoryById(id);
            if (!cat) return;

            this.editingCategoryId = id;
            const title = document.getElementById('modal-category-title');
            if (title) title.textContent = 'Edit Kategori';

            const radio = document.querySelector(`input[name="cat-type"][value="${cat.type}"]`);
            if (radio) radio.checked = true;

            const name = document.getElementById('cat-name');
            if (name) name.value = cat.name || '';
            const icon = document.getElementById('cat-icon');
            if (icon) icon.value = cat.icon || 'category';
            const color = document.getElementById('cat-color');
            if (color) color.value = cat.color || '#2563EB';
            const budget = document.getElementById('cat-budget');
            if (budget) budget.value = cat.budget || '';

            const modal = document.getElementById('modal-category');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Error in openEditCategoryModal:', err);
        }
    },

    closeCategoryModal() {
        const modal = document.getElementById('modal-category');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        this.editingCategoryId = null;
    },

    saveCategory(e) {
        e.preventDefault();
        const type = document.querySelector('input[name="cat-type"]:checked')?.value || 'expense';
        const name = (document.getElementById('cat-name')?.value || '').trim();
        const icon = (document.getElementById('cat-icon')?.value || 'category').trim();
        const color = document.getElementById('cat-color')?.value || '#2563EB';
        const budget = Number(document.getElementById('cat-budget')?.value) || 0;

        if (!name) {
            this.showToast('Nama kategori tidak boleh kosong!', 'warning');
            return;
        }

        const catData = { name, type, icon, color, budget };

        if (this.editingCategoryId) {
            DataStore.updateCategory(this.editingCategoryId, catData);
            this.showToast('Kategori berhasil diperbarui!', 'success');
        } else {
            DataStore.addCategory(catData);
            this.showToast('Kategori baru berhasil ditambahkan!', 'success');
        }

        this.closeCategoryModal();
        this.renderCategories();
        this.populateDropdowns();
    },

    deleteCategory(id) {
        if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
            DataStore.deleteCategory(id);
            this.showToast('Kategori berhasil dihapus!', 'success');
            this.renderCategories();
            this.populateDropdowns();
        }
    },

    // ================= ACCOUNT MODAL =================
    openAddAccountModal() {
        try {
            this.editingAccountId = null;
            const title = document.getElementById('modal-account-title');
            if (title) title.textContent = 'Tambah Rekening / Dompet';
            const form = document.getElementById('form-account');
            if (form) form.reset();
            const color = document.getElementById('acc-color');
            if (color) color.value = '#2563EB';
            const modal = document.getElementById('modal-account');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Error in openAddAccountModal:', err);
        }
    },

    openEditAccountModal(id) {
        try {
            const acc = DataStore.getAccountById(id);
            if (!acc) return;

            this.editingAccountId = id;
            const title = document.getElementById('modal-account-title');
            if (title) title.textContent = 'Edit Rekening';

            const name = document.getElementById('acc-name');
            if (name) name.value = acc.name || '';
            const initial = document.getElementById('acc-initial');
            if (initial) initial.value = acc.initialBalance || 0;
            const number = document.getElementById('acc-number');
            if (number) number.value = acc.accountNumber || '';
            const type = document.getElementById('acc-type');
            if (type) type.value = acc.type || 'bank';
            const icon = document.getElementById('acc-icon');
            if (icon) icon.value = acc.icon || 'account_balance';
            const color = document.getElementById('acc-color');
            if (color) color.value = acc.color || '#2563EB';

            const modal = document.getElementById('modal-account');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Error in openEditAccountModal:', err);
        }
    },

    closeAccountModal() {
        const modal = document.getElementById('modal-account');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        this.editingAccountId = null;
    },

    saveAccount(e) {
        e.preventDefault();
        const name = (document.getElementById('acc-name')?.value || '').trim();
        const initialBalance = Number(document.getElementById('acc-initial')?.value) || 0;
        const accountNumber = (document.getElementById('acc-number')?.value || '').trim();
        const type = document.getElementById('acc-type')?.value || 'bank';
        const icon = document.getElementById('acc-icon')?.value || 'account_balance';
        const color = document.getElementById('acc-color')?.value || '#2563EB';

        if (!name) {
            this.showToast('Nama rekening wajib diisi!', 'warning');
            return;
        }

        const accData = { name, initialBalance, accountNumber, type, icon, color };

        if (this.editingAccountId) {
            DataStore.updateAccount(this.editingAccountId, accData);
            this.showToast('Rekening berhasil diperbarui!', 'success');
        } else {
            DataStore.addAccount(accData);
            this.showToast('Rekening baru berhasil ditambahkan!', 'success');
        }

        this.closeAccountModal();
        this.renderAccounts();
        this.populateDropdowns();
    },

    deleteAccount(id) {
        if (confirm('Hapus rekening ini?')) {
            DataStore.deleteAccount(id);
            this.showToast('Rekening berhasil dihapus!', 'success');
            this.renderAccounts();
            this.populateDropdowns();
        }
    },

    // ================= GOAL MODAL =================
    openAddGoalModal() {
        try {
            this.editingGoalId = null;
            const title = document.getElementById('modal-goal-title');
            if (title) title.textContent = 'Buat Target Tabungan';
            const form = document.getElementById('form-goal');
            if (form) form.reset();
            const color = document.getElementById('goal-color');
            if (color) color.value = '#2563EB';
            const modal = document.getElementById('modal-goal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Error in openAddGoalModal:', err);
        }
    },

    openEditGoalModal(id) {
        try {
            const goal = DataStore.getGoalById(id);
            if (!goal) return;

            this.editingGoalId = id;
            const title = document.getElementById('modal-goal-title');
            if (title) title.textContent = 'Edit Target Tabungan';

            const name = document.getElementById('goal-name');
            if (name) name.value = goal.name || '';
            const target = document.getElementById('goal-target');
            if (target) target.value = goal.targetAmount || '';
            const current = document.getElementById('goal-current');
            if (current) current.value = goal.currentAmount || 0;
            const deadline = document.getElementById('goal-deadline');
            if (deadline) deadline.value = goal.deadline || '';
            const icon = document.getElementById('goal-icon');
            if (icon) icon.value = goal.icon || 'savings';
            const color = document.getElementById('goal-color');
            if (color) color.value = goal.color || '#2563EB';
            const notes = document.getElementById('goal-notes');
            if (notes) notes.value = goal.notes || '';

            const modal = document.getElementById('modal-goal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Error in openEditGoalModal:', err);
        }
    },

    closeGoalModal() {
        const modal = document.getElementById('modal-goal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        this.editingGoalId = null;
    },

    saveGoal(e) {
        e.preventDefault();
        const name = (document.getElementById('goal-name')?.value || '').trim();
        const targetAmount = Number(document.getElementById('goal-target')?.value);
        const currentAmount = Number(document.getElementById('goal-current')?.value) || 0;
        const deadline = document.getElementById('goal-deadline')?.value || '';
        const icon = document.getElementById('goal-icon')?.value || 'savings';
        const color = document.getElementById('goal-color')?.value || '#2563EB';
        const notes = (document.getElementById('goal-notes')?.value || '').trim();

        if (!name || !targetAmount || targetAmount <= 0) {
            this.showToast('Nama target & target nominal wajib diisi (lebih dari 0)!', 'warning');
            return;
        }

        const goalData = { name, targetAmount, currentAmount, deadline, icon, color, notes };

        if (this.editingGoalId) {
            DataStore.updateGoal(this.editingGoalId, goalData);
            this.showToast('Target tabungan berhasil diperbarui!', 'success');
        } else {
            DataStore.addGoal(goalData);
            this.showToast('Target tabungan baru berhasil dibuat!', 'success');
        }

        this.closeGoalModal();
        this.renderGoals();
    },

    deleteGoal(id) {
        if (confirm('Hapus target tabungan ini?')) {
            DataStore.deleteGoal(id);
            this.showToast('Target tabungan berhasil dihapus!', 'success');
            this.renderGoals();
        }
    },

    // Deposit / Withdraw Goal
    openDepositGoalModal(goalId) {
        try {
            const goal = DataStore.getGoalById(goalId);
            if (!goal) return;
            this.activeGoalActionId = goalId;
            const nameEl = document.getElementById('deposit-goal-name');
            if (nameEl) nameEl.textContent = goal.name;
            const amountEl = document.getElementById('deposit-goal-amount');
            if (amountEl) amountEl.value = '';
            this.populateDropdowns();
            const modal = document.getElementById('modal-deposit-goal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Error in openDepositGoalModal:', err);
        }
    },

    closeDepositGoalModal() {
        const modal = document.getElementById('modal-deposit-goal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        this.activeGoalActionId = null;
    },

    saveDepositGoal(e) {
        e.preventDefault();
        const amount = Number(document.getElementById('deposit-goal-amount')?.value);
        const accountId = document.getElementById('goal-deposit-account')?.value;

        if (!amount || amount <= 0) {
            this.showToast('Nominal setoran tidak valid!', 'warning');
            return;
        }

        DataStore.adjustGoalAmount(this.activeGoalActionId, amount, accountId);
        this.showToast('Setoran tabungan berhasil dicatat!', 'success');
        this.closeDepositGoalModal();
        this.renderGoals();
        this.populateDropdowns();
    },

    openWithdrawGoalModal(goalId) {
        const goal = DataStore.getGoalById(goalId);
        if (!goal) return;
        const amountStr = prompt(`Tarik dana dari "${goal.name}". Masukkan nominal penarikan (Rp):`, '500000');
        if (amountStr) {
            const amount = Number(amountStr);
            if (amount > 0) {
                DataStore.adjustGoalAmount(goalId, -amount);
                this.showToast('Penarikan dana tabungan berhasil!', 'success');
                this.renderGoals();
            }
        }
    },

    // ================= BILL MODAL =================
    openAddBillModal() {
        try {
            this.editingBillId = null;
            const title = document.getElementById('modal-bill-title');
            if (title) title.textContent = 'Tambah Tagihan Rutin';
            const form = document.getElementById('form-bill');
            if (form) form.reset();
            
            try {
                this.populateDropdowns();
            } catch(e) {
                console.error('Error populating dropdowns:', e);
            }
            
            const modal = document.getElementById('modal-bill');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        } catch(err) {
            console.error('Error in openAddBillModal:', err);
        }
    },

    openEditBillModal(id) {
        const bill = DataStore.getBillById(id);
        if (!bill) return;

        this.editingBillId = id;
        document.getElementById('modal-bill-title').textContent = 'Edit Tagihan';
        document.getElementById('form-bill').reset();
        this.populateDropdowns();

        document.getElementById('bill-name').value = bill.name || '';
        document.getElementById('bill-amount').value = bill.amount || '';
        document.getElementById('bill-dueday').value = bill.dueDay || 15;
        document.getElementById('bill-frequency').value = bill.frequency || 'Bulanan';
        if (bill.categoryId) document.getElementById('bill-category').value = bill.categoryId;
        if (bill.accountId) document.getElementById('bill-account').value = bill.accountId;
        document.getElementById('bill-icon').value = bill.icon || 'receipt_long';

        document.getElementById('modal-bill').classList.remove('hidden');
    },

    closeBillModal() {
        const modal = document.getElementById('modal-bill');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        this.editingBillId = null;
    },

    saveBill(e) {
        e.preventDefault();
        const name = (document.getElementById('bill-name').value || '').trim();
        const amount = Number(document.getElementById('bill-amount').value);
        const dueDay = Number(document.getElementById('bill-dueday').value);
        const frequency = document.getElementById('bill-frequency').value || 'Bulanan';
        const categoryId = document.getElementById('bill-category').value || 'cat_tagihan';
        const accountId = document.getElementById('bill-account').value || 'acc_bca';
        const icon = document.getElementById('bill-icon').value || 'receipt_long';

        if (!name) {
            this.showToast('Masukkan nama tagihan / langganan!', 'warning');
            return;
        }

        if (!amount || amount <= 0) {
            this.showToast('Masukkan nominal tagihan (lebih dari 0)!', 'warning');
            return;
        }

        if (!dueDay || dueDay < 1 || dueDay > 31) {
            this.showToast('Tanggal jatuh tempo harus antara 1 sampai 31!', 'warning');
            return;
        }

        const billData = { name, amount, dueDay, frequency, categoryId, accountId, icon };

        if (this.editingBillId) {
            DataStore.updateBill(this.editingBillId, billData);
            this.showToast('Tagihan berhasil diperbarui!', 'success');
        } else {
            DataStore.addBill(billData);
            this.showToast('Tagihan rutin baru berhasil ditambahkan!', 'success');
        }

        this.closeBillModal();
        this.renderBills();
    },

    deleteBill(id) {
        if (confirm('Hapus pengingat tagihan ini?')) {
            DataStore.deleteBill(id);
            this.showToast('Tagihan berhasil dihapus!', 'success');
            this.renderBills();
        }
    },

    // ================= MOBILE DRAWER MENU =================
    toggleMobileDrawer() {
        const drawer = document.getElementById('mobile-drawer');
        const overlay = document.getElementById('mobile-drawer-overlay');
        if (drawer && overlay) {
            drawer.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        }
    },

    closeMobileDrawer() {
        const drawer = document.getElementById('mobile-drawer');
        const overlay = document.getElementById('mobile-drawer-overlay');
        if (drawer && overlay) {
            drawer.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    },

    // ================= BACKUP & EXPORT / IMPORT =================
    exportToCSV() {
        const transactions = DataStore.getTransactions();
        const categories = DataStore.getCategories();
        const accounts = DataStore.getAccounts();

        if (transactions.length === 0) {
            this.showToast('Tidak ada transaksi untuk diekspor!', 'warning');
            return;
        }

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'ID,Tanggal,Judul,Tipe,Kategori,Akun,Nominal,Catatan\n';

        transactions.forEach(t => {
            const cat = categories.find(c => c.id === t.categoryId)?.name || '-';
            const acc = accounts.find(a => a.id === t.accountId)?.name || '-';
            const row = [
                t.id,
                t.date,
                `"${(t.title || '').replace(/"/g, '""')}"`,
                t.type,
                `"${cat}"`,
                `"${acc}"`,
                t.amount,
                `"${(t.notes || '').replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + '\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `LFMoney_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Data transaksi berhasil diekspor ke CSV!', 'success');
    },

    exportToJSON() {
        const backupData = {
            transactions: DataStore.getTransactions(),
            categories: DataStore.getCategories(),
            accounts: DataStore.getAccounts(),
            goals: DataStore.getGoals(),
            bills: DataStore.getBills(),
            settings: DataStore.getSettings(),
            exportedAt: new Date().toISOString()
        };

        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const link = document.createElement('a');
        link.setAttribute('href', dataStr);
        link.setAttribute('download', `LFMoney_Complete_Backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Backup lengkap berhasil diunduh!', 'success');
    },

    triggerImportJSON() {
        const fileInput = document.getElementById('import-json-file');
        if (fileInput) fileInput.click();
    },

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (DataStore.restoreFromBackupJSON(parsed)) {
                    this.showToast('Data cadangan berhasil dipulihkan!', 'success');
                    this.renderCurrentView();
                    this.populateDropdowns();
                } else {
                    this.showToast('Format file JSON tidak valid!', 'error');
                }
            } catch (err) {
                this.showToast('Gagal membaca file backup!', 'error');
            }
        };
        reader.readAsText(file);
    },

    resetToDemo() {
        if (confirm('Apakah Anda ingin memulihkan data demo awal? Semua data saat ini akan digantikan data sampel.')) {
            DataStore.resetToDemoData();
            this.showToast('Data demo berhasil dipulihkan!', 'success');
            this.renderCurrentView();
            this.populateDropdowns();
        }
    },

    // ================= TOAST NOTIFICATIONS =================
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const colors = {
            success: 'bg-emerald-600 text-white',
            warning: 'bg-amber-600 text-white',
            error: 'bg-rose-600 text-white',
            info: 'bg-blue-600 text-white'
        };

        const icons = {
            success: 'check_circle',
            warning: 'warning',
            error: 'error',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${colors[type] || colors.info} transform transition-all duration-300 translate-y-2 opacity-0`;
        toast.innerHTML = `
            <span class="material-symbols-outlined text-lg">${icons[type] || 'info'}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        }, 20);

        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ================= EVENT BINDINGS =================
    bindEvents() {
        // Tab switching
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(btn.dataset.tab);
            });
        });

        // Transaction Type Radio Change in Modal
        document.querySelectorAll('input[name="tx-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateModalCategoryDropdown(e.target.value);
            });
        });

        // Filter / Search inputs in table
        const searchInput = document.getElementById('search-transactions');
        const filterType = document.getElementById('filter-type');
        const filterCategory = document.getElementById('filter-category');

        if (searchInput) searchInput.addEventListener('input', () => this.renderTransactionsTable());
        if (filterType) filterType.addEventListener('change', () => this.renderTransactionsTable());
        if (filterCategory) filterCategory.addEventListener('change', () => this.renderTransactionsTable());

        // Forms Submits
        const formTx = document.getElementById('form-transaction');
        if (formTx) formTx.addEventListener('submit', (e) => this.saveTransaction(e));

        const formCat = document.getElementById('form-category');
        if (formCat) formCat.addEventListener('submit', (e) => this.saveCategory(e));

        const formAcc = document.getElementById('form-account');
        if (formAcc) formAcc.addEventListener('submit', (e) => this.saveAccount(e));

        const formGoal = document.getElementById('form-goal');
        if (formGoal) formGoal.addEventListener('submit', (e) => this.saveGoal(e));

        const formDepositGoal = document.getElementById('form-deposit-goal');
        if (formDepositGoal) formDepositGoal.addEventListener('submit', (e) => this.saveDepositGoal(e));

        const formBill = document.getElementById('form-bill');
        if (formBill) formBill.addEventListener('submit', (e) => this.saveBill(e));

        // Close modal when clicking outside
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    const modalId = backdrop.id;
                    if (modalId === 'modal-transaction') this.closeTransactionModal();
                    if (modalId === 'modal-bill') this.closeBillModal();
                    if (modalId === 'modal-account') this.closeAccountModal();
                    if (modalId === 'modal-goal') this.closeGoalModal();
                    if (modalId === 'modal-deposit-goal') this.closeDepositGoalModal();
                    if (modalId === 'modal-category') this.closeCategoryModal();
                }
            });
        });

        const formSettings = document.getElementById('form-settings');
        if (formSettings) formSettings.addEventListener('submit', (e) => this.saveSettings(e));

        // Button Add Bill Listener
        const btnAddBill = document.getElementById('btn-add-bill');
        if (btnAddBill) {
            btnAddBill.addEventListener('click', (e) => {
                e.preventDefault();
                this.openAddBillModal();
            });
        }

        // File Import listener
        const fileImport = document.getElementById('import-json-file');
        if (fileImport) fileImport.addEventListener('change', (e) => this.handleFileImport(e));
    }
};

window.App = App;
