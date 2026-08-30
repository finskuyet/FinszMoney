const Guide = {
    getConfig(tabName) {
        const configs = {
            dashboard: [
                { popover: { title: 'Selamat Datang!', description: 'Ini adalah dashboard utama Anda. Di sini Anda dapat melihat ringkasan keuangan.' } },
                { element: '#stat-total-balance', popover: { title: 'Saldo Arus Kas', description: 'Total saldo bersih Anda saat ini.', side: 'bottom' } },
                { element: '#stat-total-income', popover: { title: 'Pemasukan', description: 'Total pemasukan tercatat Anda.', side: 'bottom' } },
                { element: '#stat-total-expense', popover: { title: 'Pengeluaran', description: 'Total pengeluaran tercatat Anda.', side: 'bottom' } },
                { element: '#cashflow-chart', popover: { title: 'Arus Kas', description: 'Grafik pergerakan uang Anda dalam 7 hari terakhir.', side: 'top' } },
                { element: 'button[onclick="App.openAddTransactionModal(\'expense\')"]', popover: { title: 'Tambah Transaksi', description: 'Klik di sini kapan saja untuk mencatat pemasukan atau pengeluaran baru.', side: 'bottom' } }
            ],
            transactions: [
                { popover: { title: 'Riwayat Transaksi', description: 'Di sini Anda dapat melihat seluruh riwayat pencatatan.' } },
                { element: '#search-transactions', popover: { title: 'Cari Transaksi', description: 'Gunakan fitur pencarian untuk menemukan transaksi lama.', side: 'bottom' } },
                { element: '#filter-type', popover: { title: 'Filter', description: 'Anda bisa memfilter berdasarkan tipe dan kategori.', side: 'bottom' } }
            ],
            reports: [
                { popover: { title: 'Laporan Keuangan', description: 'Analisis keuangan Anda ada di sini.' } },
                { element: '#report-trend-chart', popover: { title: 'Tren Keuangan', description: 'Lihat bagaimana pengeluaran dan pemasukan Anda dari waktu ke waktu.', side: 'top' } },
                { element: '#category-breakdown-list', popover: { title: 'Realisasi Anggaran', description: 'Pantau pengeluaran setiap kategori agar tidak melebihi anggaran.', side: 'top' } }
            ],
            goals: [
                { popover: { title: 'Target Tabungan', description: 'Kelola tujuan menabung Anda.' } },
                { element: 'button[onclick="App.openAddGoalModal()"]', popover: { title: 'Buat Target Baru', description: 'Tambahkan target seperti dana darurat atau liburan di sini.', side: 'bottom' } }
            ],
            accounts: [
                { popover: { title: 'Rekening & Dompet', description: 'Pantau saldo di setiap rekening atau e-wallet.' } },
                { element: 'button[onclick="App.openAddAccountModal()"]', popover: { title: 'Tambah Rekening', description: 'Catat rekening bank atau e-wallet baru di sini.', side: 'bottom' } }
            ],
            bills: [
                { popover: { title: 'Tagihan Rutin', description: 'Jangan sampai terlewat membayar tagihan bulanan.' } },
                { element: 'button[onclick="App.openAddBillModal()"]', popover: { title: 'Tambah Tagihan', description: 'Masukkan tagihan rutin Anda agar mudah dipantau.', side: 'bottom' } }
            ],
            categories: [
                { popover: { title: 'Kategori & Anggaran', description: 'Atur kategori transaksi dan anggarannya.' } },
                { element: 'button[onclick="App.openAddCategoryModal(\'expense\')"]', popover: { title: 'Tambah Kategori', description: 'Tambahkan kategori pengeluaran baru dan tetapkan batas anggaran bulanan.', side: 'bottom' } }
            ]
        };
        
        return configs[tabName] || [];
    },
    
    start(tabName) {
        if (!window.driver) {
            console.error("Driver.js not loaded.");
            return;
        }
        
        const steps = this.getConfig(tabName);
        if (steps && steps.length > 0) {
            // Wait slightly for DOM to be fully visible
            setTimeout(() => {
                const availableSteps = steps.filter(step => {
                    if (!step.element) return true;
                    const el = document.querySelector(step.element);
                    return el && (el.offsetWidth > 0 || el.offsetHeight > 0);
                });
                
                if (availableSteps.length > 0) {
                    try {
                        const driver = window.driver.js.driver;
                        const driverObj = driver({
                            showProgress: true,
                            nextBtnText: 'Lanjut &rarr;',
                            prevBtnText: '&larr; Kembali',
                            doneBtnText: 'Selesai',
                            allowClose: true,
                            steps: availableSteps
                        });
                        driverObj.drive();
                    } catch (e) {
                        console.error("Driver.js failed to start:", e);
                    }
                }
            }, 400);
        }
    },
    
    checkAutoStart(tabName) {
        const seenKey = `guide_seen_${tabName}`;
        const hasSeen = localStorage.getItem(seenKey);
        
        if (!hasSeen) {
            this.start(tabName);
            localStorage.setItem(seenKey, 'true');
        }
    }
};

window.Guide = Guide;
