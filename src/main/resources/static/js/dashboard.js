/**
 * SmartSpend - Dashboard Controller
 */

let monthlyChartInstance = null;
let categoryChartInstance = null;
let txModal = null;
let viewModal = null;
let deleteModal = null;
let pendingDeleteId = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initModals();
    initDateSelectors();
    initTransactionFormEvents();
    loadDashboardData();
});

function initModals() {
    txModal = new bootstrap.Modal(document.getElementById('transactionModal'));
    viewModal = new bootstrap.Modal(document.getElementById('viewTransactionModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    // Set currency prefix from settings
    const prefixEl = document.getElementById('currencyPrefix');
    if (prefixEl) {
        prefixEl.textContent = SmartSpend.settings.currency || '₹';
    }
}

function initDateSelectors() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();

    const monthSelect = document.getElementById('selectMonth');
    const yearSelect = document.getElementById('selectYear');

    if (monthSelect) monthSelect.value = currentMonth;
    if (yearSelect) yearSelect.value = currentYear;

    // Fetch available years from backend to populate dropdown dynamically
    SmartSpend.get('/api/transactions/years')
        .then(res => {
            if (res && res.data && res.data.length > 0) {
                yearSelect.innerHTML = '';
                res.data.forEach(yr => {
                    const opt = document.createElement('option');
                    opt.value = yr;
                    opt.textContent = yr;
                    if (yr === currentYear) opt.selected = true;
                    yearSelect.appendChild(opt);
                });
            }
        })
        .catch(() => {});

    monthSelect.addEventListener('change', () => loadDashboardData());
    yearSelect.addEventListener('change', () => loadDashboardData());

    // Quick add buttons
    document.getElementById('btnQuickAddIncome').addEventListener('click', () => openTransactionModal('INCOME'));
    document.getElementById('btnQuickAddExpense').addEventListener('click', () => openTransactionModal('EXPENSE'));

    // Confirm delete button
    document.getElementById('btnConfirmDelete').addEventListener('click', () => {
        if (pendingDeleteId) {
            SmartSpend.delete(`/api/transactions/${pendingDeleteId}`)
                .then(() => {
                    deleteModal.hide();
                    SmartSpend.showToast('Transaction deleted successfully', 'success');
                    loadDashboardData();
                })
                .catch(err => {
                    SmartSpend.showToast(err.message, 'danger');
                });
        }
    });
}

function getSelectedPeriod() {
    const month = parseInt(document.getElementById('selectMonth').value, 10);
    const year = parseInt(document.getElementById('selectYear').value, 10);
    return { month, year };
}

function loadDashboardData() {
    const { month, year } = getSelectedPeriod();

    // Update label on category chart
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    const periodLabelEl = document.getElementById('categoryChartPeriodLabel');
    if (periodLabelEl) {
        periodLabelEl.textContent = `${monthNames[month - 1]} ${year}`;
    }

    loadSummary(month, year);
    loadCharts(month, year);
    loadInsights(month, year);
    loadRecentTransactions();
}

// 1. Summary Cards
function loadSummary(month, year) {
    SmartSpend.get('/api/dashboard/summary', { month, year })
        .then(res => {
            const data = res.data;
            document.getElementById('cardIncome').textContent = SmartSpend.formatCurrency(data.totalIncome);
            document.getElementById('cardExpense').textContent = SmartSpend.formatCurrency(data.totalExpenses);
            document.getElementById('cardBalance').textContent = SmartSpend.formatCurrency(data.currentBalance);
            
            const balSub = document.getElementById('cardBalanceSubtext');
            if (data.currentBalance >= 0) {
                balSub.innerHTML = '<i class="fa-solid fa-arrow-up text-success"></i> <span class="text-success fw-bold">Positive Cash Flow</span>';
            } else {
                balSub.innerHTML = '<i class="fa-solid fa-arrow-down text-danger"></i> <span class="text-danger fw-bold">Deficit Spending</span>';
            }

            document.getElementById('cardSavingsRate').textContent = `${data.savingsRate.toFixed(1)}%`;
            document.getElementById('cardTxCount').textContent = data.transactionCount;
            
            document.getElementById('cardTopCategory').textContent = data.highestSpendingCategory || 'None';
            document.getElementById('cardTopCategorySubtext').innerHTML = 
                `<i class="fa-solid fa-fire text-warning"></i> <span>${SmartSpend.formatCurrency(data.highestSpendingCategoryAmount)} spent</span>`;
        })
        .catch(err => {
            console.error('Failed to load summary:', err);
            SmartSpend.showToast('Could not load financial summary', 'danger');
        });
}

// 2. Charts (Chart.js)
function loadCharts(month, year) {
    SmartSpend.get('/api/dashboard/charts', { month, year })
        .then(res => {
            renderMonthlyChart(res.data);
            renderCategoryChart(res.data);
        })
        .catch(err => {
            console.error('Failed to load charts:', err);
        });
}

function renderMonthlyChart(data) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');

    if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
    }

    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.monthlyLabels,
            datasets: [
                {
                    label: 'Income',
                    data: data.monthlyIncome,
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                    borderSkipped: false
                },
                {
                    label: 'Expense',
                    data: data.monthlyExpense,
                    backgroundColor: '#ef4444',
                    borderRadius: 6,
                    borderSkipped: false
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
                        usePointStyle: true,
                        font: { family: 'Plus Jakarta Sans', size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return `${ctx.dataset.label}: ${SmartSpend.formatCurrency(ctx.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(val) {
                            return SmartSpend.formatCurrency(val);
                        }
                    }
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    if (!data.categoryLabels || data.categoryLabels.length === 0) {
        // Render Empty State Canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px Plus Jakarta Sans';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('No expenses recorded for this month', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const palette = [
        '#f97316', '#0ea5e9', '#ec4899', '#8b5cf6', '#a855f7',
        '#ef4444', '#eab308', '#14b8a6', '#06b6d4', '#f43f5e', '#64748b'
    ];

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.categoryLabels,
            datasets: [{
                data: data.categoryAmounts,
                backgroundColor: palette.slice(0, data.categoryLabels.length),
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        font: { family: 'Plus Jakarta Sans', size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const val = ctx.parsed;
                            const idx = ctx.dataIndex;
                            const pct = data.categoryPercentages[idx] || 0;
                            return ` ${ctx.label}: ${SmartSpend.formatCurrency(val)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 3. Financial Insights
function loadInsights(month, year) {
    const container = document.getElementById('insightsContainer');

    SmartSpend.get('/api/dashboard/insights', { month, year })
        .then(res => {
            const list = res.data;
            if (!list || list.length === 0) {
                container.innerHTML = `
                    <div class="empty-state py-3">
                        <div class="empty-state-icon" style="width: 50px; height: 50px; font-size: 1.25rem;"><i class="fa-solid fa-check"></i></div>
                        <h6>All Looks Good</h6>
                        <p class="small text-muted mb-0">No active spending warnings or alerts.</p>
                    </div>`;
                return;
            }

            container.innerHTML = list.map(item => `
                <div class="insight-card ${item.type}">
                    <div class="insight-icon">
                        <i class="fa-solid ${item.icon}"></i>
                    </div>
                    <div class="insight-content">
                        <h5>${item.title}</h5>
                        <p>${item.message}</p>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => {
            container.innerHTML = `<div class="text-danger small p-3">Failed to load insights.</div>`;
        });
}

// 4. Recent Transactions
function loadRecentTransactions() {
    const tbody = document.getElementById('recentTransactionsTableBody');

    SmartSpend.get('/api/transactions/recent')
        .then(res => {
            const list = res.data;
            if (!list || list.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-muted">
                            <i class="fa-solid fa-folder-open fs-3 d-block mb-2"></i>
                            No recent transactions found. Click "+ Add Expense" or "+ Add Income" above.
                        </td>
                    </tr>`;
                return;
            }

            tbody.innerHTML = list.slice(0, 8).map(tx => {
                const isIncome = tx.type === 'INCOME';
                const typeBadge = isIncome ? 'badge-income' : 'badge-expense';
                const amountClass = isIncome ? 'amount-income' : 'amount-expense';
                const sign = isIncome ? '+' : '-';
                const catIcon = SmartSpend.getCategoryIcon(tx.category, tx.type);
                const payIcon = SmartSpend.getPaymentIcon(tx.paymentMethod);

                return `
                    <tr>
                        <td><small class="text-muted">${SmartSpend.formatDisplayDate(tx.transactionDate)}</small></td>
                        <td>
                            <span class="fw-semibold text-truncate d-inline-block" style="max-width: 180px;" title="${tx.title}">
                                ${tx.title}
                            </span>
                        </td>
                        <td>
                            <span class="badge badge-custom badge-category">
                                <i class="fa-solid ${catIcon}"></i> ${tx.category}
                            </span>
                        </td>
                        <td>
                            <span class="badge badge-custom ${typeBadge}">${tx.type}</span>
                        </td>
                        <td>
                            <span class="badge badge-custom badge-method">
                                <i class="fa-solid ${payIcon}"></i> ${tx.paymentMethod}
                            </span>
                        </td>
                        <td class="text-end ${amountClass}">
                            ${sign}${SmartSpend.formatCurrency(tx.amount)}
                        </td>
                        <td class="text-center">
                            <div class="d-flex justify-content-center gap-1">
                                <button type="button" class="btn btn-sm btn-icon" style="width: 30px; height: 30px;" onclick="viewTransaction(${tx.id})" title="View Details">
                                    <i class="fa-solid fa-eye fs-6"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-icon" style="width: 30px; height: 30px;" onclick="editTransaction(${tx.id})" title="Edit">
                                    <i class="fa-solid fa-pen-to-square fs-6"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-icon text-danger" style="width: 30px; height: 30px;" onclick="confirmDeleteTransaction(${tx.id})" title="Delete">
                                    <i class="fa-solid fa-trash fs-6"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        })
        .catch(err => {
            tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center py-3">Failed to load recent transactions.</td></tr>`;
        });
}

// 5. Transaction Form & Modal Logic
function initTransactionFormEvents() {
    const form = document.getElementById('transactionForm');
    const typeRadios = document.querySelectorAll('input[name="txType"]');

    typeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            populateCategories(radio.value);
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const txId = document.getElementById('txId').value;
        const type = document.querySelector('input[name="txType"]:checked').value;
        const title = document.getElementById('txTitle').value.trim();
        const amount = parseFloat(document.getElementById('txAmount').value);
        const transactionDate = document.getElementById('txDate').value;
        const category = document.getElementById('txCategory').value;
        const paymentMethod = document.getElementById('txPaymentMethod').value;
        const description = document.getElementById('txDescription').value.trim();

        if (isNaN(amount) || amount <= 0) {
            SmartSpend.showToast('Amount must be greater than zero', 'warning');
            return;
        }

        const payload = {
            title,
            amount,
            type,
            category,
            transactionDate,
            paymentMethod,
            description
        };

        const isUpdate = txId && txId.length > 0;
        const promise = isUpdate ?
            SmartSpend.put(`/api/transactions/${txId}`, payload) :
            SmartSpend.post('/api/transactions', payload);

        promise
            .then(() => {
                txModal.hide();
                SmartSpend.showToast(isUpdate ? 'Transaction updated successfully' : 'Transaction created successfully', 'success');
                loadDashboardData();
            })
            .catch(err => {
                SmartSpend.showToast(err.message, 'danger');
            });
    });
}

function populateCategories(type, selectedCategory = '') {
    const categorySelect = document.getElementById('txCategory');
    categorySelect.innerHTML = '';

    const list = SmartSpend.categories[type] || SmartSpend.categories.EXPENSE;
    list.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        if (cat.name === selectedCategory) {
            opt.selected = true;
        }
        categorySelect.appendChild(opt);
    });
}

function openTransactionModal(type = 'EXPENSE') {
    const form = document.getElementById('transactionForm');
    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('txId').value = '';
    document.getElementById('transactionModalTitle').innerHTML = `
        <i class="fa-solid fa-circle-plus text-primary me-2"></i>
        <span>Add ${type === 'INCOME' ? 'Income' : 'Expense'}</span>`;

    // Select type radio
    if (type === 'INCOME') {
        document.getElementById('typeIncome').checked = true;
    } else {
        document.getElementById('typeExpense').checked = true;
    }

    populateCategories(type);

    // Set date to today
    document.getElementById('txDate').value = new Date().toISOString().split('T')[0];

    txModal.show();
}

// Global actions called from HTML buttons
window.viewTransaction = function(id) {
    SmartSpend.get(`/api/transactions/${id}`)
        .then(res => {
            const tx = res.data;
            const isIncome = tx.type === 'INCOME';
            const catIcon = SmartSpend.getCategoryIcon(tx.category, tx.type);
            const payIcon = SmartSpend.getPaymentIcon(tx.paymentMethod);

            const html = `
                <div class="text-center pb-3 border-bottom mb-3">
                    <span class="badge badge-custom ${isIncome ? 'badge-income' : 'badge-expense'} fs-6 mb-2">
                        ${tx.type}
                    </span>
                    <h3 class="fw-bold ${isIncome ? 'text-success' : 'text-danger'} mb-1">
                        ${isIncome ? '+' : '-'}${SmartSpend.formatCurrency(tx.amount)}
                    </h3>
                    <h5 class="fw-bold text-dark mb-0">${tx.title}</h5>
                </div>
                <div class="row g-3">
                    <div class="col-6">
                        <small class="text-muted d-block">Category</small>
                        <span class="badge badge-custom badge-category mt-1">
                            <i class="fa-solid ${catIcon}"></i> ${tx.category}
                        </span>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">Payment Method</small>
                        <span class="badge badge-custom badge-method mt-1">
                            <i class="fa-solid ${payIcon}"></i> ${tx.paymentMethod}
                        </span>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">Transaction Date</small>
                        <strong class="text-dark">${SmartSpend.formatDate(tx.transactionDate)}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">Recorded At</small>
                        <span class="small text-muted">${tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div class="col-12">
                        <small class="text-muted d-block">Notes / Description</small>
                        <p class="mb-0 bg-light p-2 rounded small text-secondary mt-1">
                            ${tx.description || 'No description provided.'}
                        </p>
                    </div>
                </div>
            `;

            document.getElementById('viewTxDetailsBody').innerHTML = html;
            viewModal.show();
        })
        .catch(err => {
            SmartSpend.showToast(err.message, 'danger');
        });
};

window.editTransaction = function(id) {
    SmartSpend.get(`/api/transactions/${id}`)
        .then(res => {
            const tx = res.data;
            const form = document.getElementById('transactionForm');
            form.reset();
            form.classList.remove('was-validated');

            document.getElementById('txId').value = tx.id;
            document.getElementById('transactionModalTitle').innerHTML = `
                <i class="fa-solid fa-pen-to-square text-primary me-2"></i>
                <span>Edit Transaction #${tx.id}</span>`;

            if (tx.type === 'INCOME') {
                document.getElementById('typeIncome').checked = true;
            } else {
                document.getElementById('typeExpense').checked = true;
            }

            populateCategories(tx.type, tx.category);

            document.getElementById('txTitle').value = tx.title;
            document.getElementById('txAmount').value = tx.amount;
            document.getElementById('txDate').value = tx.transactionDate;
            document.getElementById('txPaymentMethod').value = tx.paymentMethod;
            document.getElementById('txDescription').value = tx.description || '';

            txModal.show();
        })
        .catch(err => {
            SmartSpend.showToast(err.message, 'danger');
        });
};

window.confirmDeleteTransaction = function(id) {
    pendingDeleteId = id;
    deleteModal.show();
};
