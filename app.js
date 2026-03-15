const ui = {
    chart: null,

    setupProfile: () => {
        const name = document.getElementById('user-name-input').value;
        if (!name) return alert("Enter name!");
        localStorage.setItem('userName', name);
        ui.init();
    },

    handleSave: () => {
        const name = document.getElementById('bankName').value.trim();
        const balance = parseFloat(document.getElementById('bankBalance').value);
        const date = document.getElementById('entryDate').value;

        if (!name || isNaN(balance) || !date) return alert("Fill all fields!");

        let banks = JSON.parse(localStorage.getItem('myBanks')) || [];
        let bank = banks.find(b => b.name.toLowerCase() === name.toLowerCase());

        if (bank) {
            // Check if entry for this date already exists
            let historyEntry = bank.history.find(h => h.date === date);

            if (historyEntry) {
                // If it exists, update it (This allows the "Edit" to work)
                historyEntry.balance = balance;
                bank.currentBalance = balance;
            } else {
                // If it's a new date for an existing bank
                bank.history.push({ date, balance });
                bank.currentBalance = balance;
            }
        } else {
            // Brand new bank portfolio
            banks.push({
                id: Date.now(),
                name,
                currentBalance: balance,
                history: [{ date, balance }]
            });
        }

        localStorage.setItem('myBanks', JSON.stringify(banks));
        ui.resetForm();
        ui.render();
    },

    render: () => {
        const banks = JSON.parse(localStorage.getItem('myBanks')) || [];
        const grid = document.getElementById('account-grid');

        if (banks.length === 0) {
            grid.innerHTML = `<p style="color: #94a3b8; grid-column: 1 / -1; text-align: center;">No accounts yet.</p>`;
        } else {
            grid.innerHTML = banks.map(b => {
                // SORT history by date to find the actual latest record, not just the last one typed
                const sortedHistory = [...b.history].sort((a, b) => new Date(b.date) - new Date(a.date));
                const latestRecord = sortedHistory[0];

                return `
                <div class="card" style="margin-bottom:0; position: relative; padding-top: 35px;">
                    <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px;">
                        <button onclick="ui.editBank(${b.id})" style="background:none; border:none; color:#3b82f6; cursor:pointer; font-size: 1rem;">✏️</button>
                        <button onclick="ui.deleteBank(${b.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size: 1rem;">🗑️</button>
                    </div>
                    <strong>${b.name}</strong>
                    <div style="color:var(--primary); font-size: 1.2rem; font-weight: bold; margin-top: 5px;">$${latestRecord.balance.toLocaleString()}</div>
                    <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 5px;">Latest Entry: ${latestRecord.date}</div>
                </div>
            `}).join('');
        }
        ui.updateChart(banks);
    },

    editBank: (id) => {
        const banks = JSON.parse(localStorage.getItem('myBanks')) || [];
        const bank = banks.find(b => b.id === id);
        if (!bank) return;

        // Sort to find the actual latest entry to edit
        const sortedHistory = [...bank.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestRecord = sortedHistory[0];

        document.getElementById('bankName').value = bank.name;
        document.getElementById('bankBalance').value = latestRecord.balance;
        document.getElementById('entryDate').value = latestRecord.date;

        const btn = document.querySelector('.left-col .btn-primary');
        btn.innerText = "Update Latest Entry";
        btn.style.background = "#3b82f6";

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    resetForm: () => {
        document.getElementById('bankName').value = '';
        document.getElementById('bankBalance').value = '';
        document.getElementById('entryDate').valueAsDate = new Date();
        const btn = document.querySelector('.left-col .btn-primary');
        btn.innerText = "Save Entry";
        btn.style.background = "#10b981";
    },

    deleteBank: (id) => {
        if (confirm("Are you sure you want to delete this account and all its history?")) {
            let banks = JSON.parse(localStorage.getItem('myBanks')) || [];
            banks = banks.filter(b => b.id !== id);
            localStorage.setItem('myBanks', JSON.stringify(banks));
            ui.render();
        }
    },

    clearAllData: () => {
        if (confirm("DANGER: This will delete EVERY account and all history. Proceed?")) {
            localStorage.removeItem('myBanks');
            ui.render();
        }
    },

    updateChart: (banks) => {
        const ctx = document.getElementById('mainChart').getContext('2d');
        const allDates = [...new Set(banks.flatMap(b => b.history.map(h => h.date)))].sort();

        const datasets = banks.map((b, i) => ({
            label: b.name,
            data: allDates.map(d => b.history.find(h => h.date === d)?.balance || null),
            borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
            tension: 0.3,
            spanGaps: true
        }));

        if (ui.chart) ui.chart.destroy();
        ui.chart = new Chart(ctx, {
            type: 'line',
            data: { labels: allDates, datasets },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: 'white' } }
                },
                scales: {
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#2d334a' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                }
            }
        });
    },

    init: () => {
        const name = localStorage.getItem('userName');
        if (name) {
            document.getElementById('landing-page').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('display-name').innerText = name;
            document.getElementById('entryDate').valueAsDate = new Date();
            ui.render();
        }
    }
};

window.onload = ui.init;