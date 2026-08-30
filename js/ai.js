// ai.js - Logika Mock AI Assistant

const AIEngine = {
    // Kata kunci dan respons statis (mocking backend)
    generateResponse(message) {
        const lowerMsg = message.toLowerCase();
        const summary = DataStore.getSummary(DataStore.getTransactions());
        
        if (lowerMsg.includes('saldo') || lowerMsg.includes('uang') || lowerMsg.includes('sisa')) {
            return `Total saldo bersih Anda saat ini adalah **${Utils.formatRupiah(summary.balance)}**. Ini dihitung dari total pemasukan dikurangi pengeluaran.`;
        }
        
        if (lowerMsg.includes('pengeluaran') || lowerMsg.includes('habis')) {
            return `Total pengeluaran tercatat Anda sejauh ini mencapai **${Utils.formatRupiah(summary.totalExpense)}**. Pastikan untuk tidak melebihi anggaran bulanan Anda ya!`;
        }

        if (lowerMsg.includes('pemasukan') || lowerMsg.includes('pendapatan')) {
            return `Total pemasukan Anda tercatat sebesar **${Utils.formatRupiah(summary.totalIncome)}**. Bagus! Coba sisihkan sebagian untuk ditabung.`;
        }

        if (lowerMsg.includes('tagihan') || lowerMsg.includes('bayar')) {
            if (summary.pendingBillsCount > 0) {
                return `Ada **${summary.pendingBillsCount} tagihan** yang belum Anda bayar bulan ini, dengan total **${Utils.formatRupiah(summary.pendingBillsAmount)}**. Jangan lupa dibayar sebelum jatuh tempo ya.`;
            }
            return `Keren! Anda tidak memiliki tagihan yang tertunggak saat ini. Semua aman terkendali.`;
        }
        
        if (lowerMsg.includes('hemat') || lowerMsg.includes('tips') || lowerMsg.includes('saran')) {
            return `Berikut tips hemat dari Finsz AI:\n1. Terapkan prinsip 50/30/20 (50% kebutuhan, 30% keinginan, 20% tabungan).\n2. Kurangi membeli kopi mahal setiap hari.\n3. Lunasi tagihan tepat waktu agar bebas denda.`;
        }

        if (lowerMsg.includes('halo') || lowerMsg.includes('hai')) {
            const user = Auth.getCurrentUser();
            const name = user ? user.name : 'Sahabat Finsz';
            return `Halo ${name}! Saya Finsz AI, asisten keuangan pribadi Anda. Ada yang bisa saya bantu terkait saldo, pengeluaran, atau tips keuangan hari ini?`;
        }

        return `Maaf, saya masih dalam tahap pengembangan (Offline Mode). Cobalah tanyakan seputar "saldo", "pengeluaran", "tagihan", atau "tips hemat".`;
    }
};

const AIChat = {
    init() {
        this.chatBox = document.getElementById('ai-chat-box');
        this.form = document.getElementById('ai-chat-form');
        this.input = document.getElementById('ai-chat-input');
        
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Tampilkan pesan selamat datang
        setTimeout(() => {
            if (this.chatBox && this.chatBox.children.length === 0) {
                this.appendMessage('AI', AIEngine.generateResponse('halo'));
            }
        }, 500);
    },

    handleSubmit(e) {
        e.preventDefault();
        const message = this.input.value.trim();
        if (!message) return;

        // Tampilkan pesan user
        this.appendMessage('User', message);
        this.input.value = '';

        // Tampilkan indikator typing
        this.showTypingIndicator();

        // Simulasi delay AI (1 detik)
        setTimeout(() => {
            this.removeTypingIndicator();
            const response = AIEngine.generateResponse(message);
            this.appendMessage('AI', response);
        }, 1000);
    },

    appendMessage(sender, text) {
        if (!this.chatBox) return;

        const isUser = sender === 'User';
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} w-full mb-4`;

        // Ubah markdown sederhana (**) menjadi bold
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

        if (isUser) {
            msgDiv.innerHTML = `
                <div class="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md text-sm">
                    ${formattedText}
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="flex items-start gap-3 max-w-[85%]">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 text-white flex items-center justify-center shadow-md">
                        <span class="material-symbols-outlined text-sm">smart_toy</span>
                    </div>
                    <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-sm">
                        ${formattedText}
                    </div>
                </div>
            `;
        }

        this.chatBox.appendChild(msgDiv);
        this.scrollToBottom();
    },

    showTypingIndicator() {
        if (!this.chatBox) return;
        const msgDiv = document.createElement('div');
        msgDiv.id = 'ai-typing-indicator';
        msgDiv.className = `flex justify-start w-full mb-4`;
        
        msgDiv.innerHTML = `
            <div class="flex items-start gap-3 max-w-[85%]">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 text-white flex items-center justify-center shadow-md">
                    <span class="material-symbols-outlined text-sm">smart_toy</span>
                </div>
                <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5 h-10">
                    <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                    <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        `;
        
        this.chatBox.appendChild(msgDiv);
        this.scrollToBottom();
    },

    removeTypingIndicator() {
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) indicator.remove();
    },

    scrollToBottom() {
        if (this.chatBox) {
            this.chatBox.scrollTop = this.chatBox.scrollHeight;
        }
    }
};

// Initialize after DOM load
document.addEventListener('DOMContentLoaded', () => {
    AIChat.init();
});
