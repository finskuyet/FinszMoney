/**
 * FinszMoney - Chart.js Visualizations
 */

let cashFlowChartInstance = null;
let categoryDonutChartInstance = null;
let reportTrendChartInstance = null;

const ChartManager = {
    getThemeColors() {
        const isDark = document.documentElement.classList.contains('dark');
        return {
            textColor: isDark ? '#94a3b8' : '#64748b',
            gridColor: isDark ? '#334155' : '#f1f5f9',
            primary: '#2563eb',
            success: '#16a34a',
            expense: '#dc2626',
            warning: '#f59e0b',
            cardBg: isDark ? '#1e293b' : '#ffffff'
        };
    },

    // Render 7-day or Monthly Cashflow Bar Chart on Dashboard
    renderCashFlowChart(canvasId, transactions) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const colors = this.getThemeColors();

        // Calculate last 7 days aggregation
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
            labels.push(dayLabel);

            let dayIncome = 0;
            let dayExpense = 0;

            transactions.forEach(t => {
                if (t.date === dateStr) {
                    if (t.type === 'income') dayIncome += Number(t.amount);
                    if (t.type === 'expense') dayExpense += Number(t.amount);
                }
            });

            incomeData.push(dayIncome);
            expenseData.push(dayExpense);
        }

        if (cashFlowChartInstance) {
            cashFlowChartInstance.destroy();
        }

        cashFlowChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: incomeData,
                        backgroundColor: '#22c55e',
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.7
                    },
                    {
                        label: 'Pengeluaran',
                        data: expenseData,
                        backgroundColor: '#ef4444',
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: colors.textColor,
                            usePointStyle: true,
                            font: { family: 'Inter', size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.cardBg,
                        titleColor: colors.textColor,
                        bodyColor: colors.textColor,
                        borderColor: '#cbd5e1',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function (context) {
                                return ` ${context.dataset.label}: ${Utils.formatRupiah(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor, font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        grid: { color: colors.gridColor },
                        ticks: {
                            color: colors.textColor,
                            font: { family: 'Inter', size: 11 },
                            callback: function (value) {
                                if (value >= 1000000) return (value / 1000000).toFixed(1) + ' jt';
                                if (value >= 1000) return (value / 1000).toFixed(0) + ' rb';
                                return value;
                            }
                        }
                    }
                }
            }
        });
    },

    // Render Category Expense Donut Chart on Dashboard / Laporan
    renderCategoryDonutChart(canvasId, transactions, categories) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const colors = this.getThemeColors();

        const expenseMap = {};
        transactions.forEach(t => {
            if (t.type === 'expense') {
                expenseMap[t.categoryId] = (expenseMap[t.categoryId] || 0) + Number(t.amount);
            }
        });

        const labels = [];
        const dataValues = [];
        const bgColors = [];

        Object.keys(expenseMap).forEach(catId => {
            const cat = categories.find(c => c.id === catId);
            if (cat) {
                labels.push(cat.name);
                dataValues.push(expenseMap[catId]);
                bgColors.push(cat.color || '#3b82f6');
            } else {
                labels.push('Lainnya');
                dataValues.push(expenseMap[catId]);
                bgColors.push('#94a3b8');
            }
        });

        if (categoryDonutChartInstance) {
            categoryDonutChartInstance.destroy();
        }

        // If no expenses yet
        if (dataValues.length === 0) {
            labels.push('Belum ada data pengeluaran');
            dataValues.push(1);
            bgColors.push('#cbd5e1');
        }

        categoryDonutChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: bgColors,
                    borderWidth: 2,
                    borderColor: colors.cardBg,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.textColor,
                            font: { family: 'Inter', size: 11 },
                            boxWidth: 12,
                            padding: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.cardBg,
                        titleColor: colors.textColor,
                        bodyColor: colors.textColor,
                        borderColor: '#cbd5e1',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function (context) {
                                if (dataValues.length === 1 && labels[0].includes('Belum ada data')) {
                                    return 'Belum ada transaksi';
                                }
                                return ` ${context.label}: ${Utils.formatRupiah(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Render Monthly Trend Chart on Laporan Page
    renderReportTrendChart(canvasId, transactions) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const colors = this.getThemeColors();

        // Get last 6 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const labels = [];
        const incomeData = [0, 0, 0, 0, 0, 0];
        const expenseData = [0, 0, 0, 0, 0, 0];

        const today = new Date();
        const monthKeys = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthKeys.push(key);
            labels.push(`${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`);
        }

        transactions.forEach(t => {
            if (!t.date) return;
            const tKey = t.date.slice(0, 7);
            const index = monthKeys.indexOf(tKey);
            if (index !== -1) {
                if (t.type === 'income') incomeData[index] += Number(t.amount);
                if (t.type === 'expense') expenseData[index] += Number(t.amount);
            }
        });

        if (reportTrendChartInstance) {
            reportTrendChartInstance.destroy();
        }

        reportTrendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: incomeData,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Pengeluaran',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: colors.textColor,
                            usePointStyle: true,
                            font: { family: 'Inter', size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.cardBg,
                        titleColor: colors.textColor,
                        bodyColor: colors.textColor,
                        borderColor: '#cbd5e1',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function (context) {
                                return ` ${context.dataset.label}: ${Utils.formatRupiah(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor, font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        grid: { color: colors.gridColor },
                        ticks: {
                            color: colors.textColor,
                            font: { family: 'Inter', size: 11 },
                            callback: function (value) {
                                if (value >= 1000000) return (value / 1000000).toFixed(1) + ' jt';
                                if (value >= 1000) return (value / 1000).toFixed(0) + ' rb';
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }
};

window.ChartManager = ChartManager;
