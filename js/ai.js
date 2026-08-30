// ai.js - Logika AI Assistant dengan Gemini API

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const AIEngine = {
    async generateResponse(message) {
        if (!apiKey) {
            return `Maaf, sistem AI sedang offline karena API Key belum dikonfigurasi. Silakan tambahkan VITE_GEMINI_API_KEY di file .env Anda.`;
        }

        // Ambil data keuangan untuk memberikan konteks pada AI
        const summary = window.DataStore.getSummary(window.DataStore.getTransactions());
        const user = window.Auth.getCurrentUser();
        const userName = user ? user.name : 'Pengguna';
        
        // System Prompt untuk menginstruksikan AI
        const systemPrompt = `
Anda adalah "LexFinsz AI", asisten keuangan pribadi yang profesional, ramah, dan pintar yang terintegrasi di dalam aplikasi LexLexFinszMoney.
Nama pengguna adalah ${userName}.
Berikut adalah ringkasan keuangan pengguna saat ini:
- Total Saldo Bersih: Rp ${summary.balance.toLocaleString('id-ID')}
- Total Pemasukan: Rp ${summary.totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${summary.totalExpense.toLocaleString('id-ID')}
- Kekayaan Bersih: Rp ${summary.totalNetWorth.toLocaleString('id-ID')}
- Jumlah Tagihan Belum Dibayar: ${summary.pendingBillsCount} (Total: Rp ${summary.pendingBillsAmount.toLocaleString('id-ID')})

ATURAN SANGAT PENTING:
1. Anda HANYA BOLEH menjawab pertanyaan seputar keuangan, pencatatan uang, penghematan, tagihan, dan hal-hal yang berhubungan dengan aplikasi LexLexFinszMoney.
2. JIKA pengguna bertanya di luar topik keuangan (misalnya: coding, sejarah, cuaca, politik, lelucon umum, dll), Anda HARUS MENOLAK dengan sopan dan mengingatkan mereka bahwa Anda hanya asisten keuangan LexLexFinszMoney.
3. Jawab pertanyaan pengguna berdasarkan data di atas jika relevan.
4. Berikan saran atau teguran ramah jika pengeluaran terlalu besar atau saldo menipis.
5. Gunakan bahasa Indonesia yang santai tapi profesional.
6. Format jawaban Anda menggunakan Markdown yang mudah dibaca.
        `;

        const requestBody = {
            contents: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Baik, saya siap membantu Anda mengelola keuangan dengan pintar!" }] },
                { role: "user", parts: [{ text: message }] }
            ],
            systemInstruction: {
                role: "system",
                parts: [{ text: "Anda adalah LexFinsz AI, penasihat keuangan pintar yang terintegrasi di aplikasi LexLexFinszMoney." }]
            }
        };

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                console.error("API Error:", await response.text());
                return `Maaf, saya sedang mengalami kendala teknis saat menghubungi server otak saya. Coba lagi nanti ya!`;
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            }
            return `Maaf, saya tidak mengerti maksud Anda.`;
        } catch (error) {
            console.error("Gemini API Error:", error);
            return `Maaf, koneksi ke server AI terputus. Pastikan internet Anda stabil.`;
        }
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

    async handleSubmit(e) {
        e.preventDefault();
        const message = this.input.value.trim();
        if (!message) return;

        // Tampilkan pesan user
        this.appendMessage('User', message);
        this.input.value = '';

        // Tampilkan indikator typing
        this.showTypingIndicator();

        // Panggil API Gemini
        const response = await AIEngine.generateResponse(message);
        
        this.removeTypingIndicator();
        this.appendMessage('AI', response);
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

// Initialize after DOM load, expose AIChat to window just in case
window.AIChat = AIChat;
document.addEventListener('DOMContentLoaded', () => {
    AIChat.init();
});
