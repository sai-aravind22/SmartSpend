/**
 * SmartSpend - Budgets Management Controller
 */

let budgetModal = null;
let deleteBudgetModal = null;
let pendingDeleteBudgetId = null;
let currentBudgets = [];

document.addEventListener('DOMContentLoaded', () => {
    initModals();
    initDateSelectors();
    initBudgetFormEvents();
    loadBudgets();
});

function initModals() {
    budgetModal = new bootstrap.Modal(document.getElementById('budgetModal'));
    deleteBudgetModal = new bootstrap.Modal(document.getElementById('deleteBudgetModal'));

    const prefixEl = document.getElementById('budgetCurrencyPrefix');
    if (prefixEl) {
        prefixEl.textContent = SmartSpend.settings.currency || '₹';
    }

    document.getElementById('btnOpenAddBudget').addEventListener('click', () => {
        openAddBudgetModal();
    });

    document.getElementById('btnConfirmDeleteBudget').addEventListener('click', () => {
        if (pendingDeleteBudgetId) {
            SmartSpend.delete(`/api/budgets/${pendingDeleteBudgetId}`)
                .then(() => {
                    deleteBudgetModal.hide();
                    SmartSpend.showToast('Budget deleted successfully', 'success');
                    loadBudgets();
                })
                .catch(err => {
                    SmartSpend.showToast(err.message, 'danger');
                });
        }
    });
}

function initDateSelectors() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const monthSelect = document.getElementById('budgetMonthSelect');
    const yearSelect = document.getElementById('budgetYearSelect');

    if (monthSelect) monthSelect.value = currentMonth;
    if (yearSelect) yearSelect.value = currentYear;

    // Load available years
    SmartSpend.get('/api/transactions/years')
        .then(res => {
            if (res && res.data && res.data.length > 0) {
                yearSelect.innerHTML = '';
                const modalYrSelect = document.getElementById('modalBudgetYear');
                if (modalYrSelect) modalYrSelect.innerHTML = '';

                res.data.forEach(yr => {
                    const opt = document.createElement('option');
                    opt.value = yr;
                    opt.textContent = yr;
                    if (yr === currentYear) opt.selected = true;
                    yearSelect.appendChild(opt);

                    if (modalYrSelect) {
                        const opt2 = document.createElement('option');
                        opt2.value = yr;
                        opt2.textContent = yr;
                        if (yr === currentYear) opt2.selected = true;
                        modalYrSelect.appendChild(opt2);
                    }
                });
            }
        })
        .catch(() => {});

    monthSelect.addEventListener('change', () => loadBudgets());
    yearSelect.addEventListener('change', () => loadBudgets());
}

function getSelectedPeriod() {
    const month = parseInt(document.getElementById('budgetMonthSelect').value, 10);
    const year = parseInt(document.getElementById('budgetYearSelect').value, 10);
    return { month, year };
}

function loadBudgets() {
    const { month, year } = getSelectedPeriod();
    const container = document.getElementById('budgetCardsContainer');
    const emptyState = document.getElementById('budgetEmptyState');
    const overallCard = document.getElementById('overallBudgetCard');

    container.innerHTML = `
        <div class="col-12 text-center py-5 text-muted">
            <i class="fa-solid fa-spinner fa-spin fs-4 mb-2 d-block"></i>
            Loading monthly budgets...
        </div>`;
    emptyState.classList.add('d-none');

    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    document.getElementById('overallBudgetTitle').textContent = `Budget Overview for ${monthNames[month - 1]} ${year}`;

    SmartSpend.get('/api/budgets', { month, year })
        .then(res => {
            currentBudgets = res.data || [];

            if (currentBudgets.length === 0) {
                container.innerHTML = '';
                emptyState.classList.remove('d-none');
                overallCard.classList.add('d-none');
                return;
            }

            emptyState.classList.add('d-none');
            overallCard.classList.remove('d-none');

            updateOverallBudgetSummary(currentBudgets);
            renderBudgetCrads(currentBudgets);
        })
        .catch(err => {
            container.innerHTML = `<div class="col-12 text-center py-4 text-danger">${err.message}</div>`;
        });
}

function updateOverallBudgetSummary(budgets) {
    let totalLimit = 0;
    let totalSpent = 0;

    budgets.forEach(b => {
        totalLimit += Number(b.monthlyLimit);
        totalSpent += Number(b.spentAmount);
    });

    const totalRemaining = totalLimit - totalSpent;
    const overallPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    document.getElementById('overallTotalLimit').textContent = SmartSpend.formatCurrency(totalLimit);
    document.getElementById('overallTotalSpent').textContent = SmartSpend.formatCurrency(totalSpent);
    document.getElementById('overallTotalRemaining').textContent = SmartSpend.formatCurrency(totalRemaining);
    document.getElementById('overallUtilizationPct').textContent = `${overallPct.toFixed(1)}%`;

    const progressBar = document.getElementById('overallProgressBar');
    const badge = document.getElementById('overallBudgetBadge');

    progressBar.style.width = `${Math.min(100, Math.max(0, overallPct))}%`;

    if (overallPct >= 100) {
        progressBar.className = 'progress-bar-custom progress-exceeded';
        badge.className = 'badge badge-custom badge-expense';
        badge.textContent = 'Exceeded Budget';
    } else if (overallPct >= 80) {
        progressBar.className = 'progress-bar-custom progress-warning';
        badge.className = 'badge badge-custom badge-warning';
        badge.textContent = '80%+ Reached';
    } else {
        progressBar.className = 'progress-bar-custom progress-normal';
        badge.className = 'badge badge-custom badge-income';
        badge.textContent = 'On Track';
    }
}

function renderBudgetCrads(budgets) {
    const container = document.getElementById('budgetCardsContainer');

    container.innerHTML = budgets.map(b => {
        const catIcon = SmartSpend.getCategoryIcon(b.category, 'EXPENSE');
        const limit = Number(b.monthlyLimit);
        const spent = Number(b.spentAmount);
        const remaining = Number(b.remainingAmount);
        const pct = b.utilizationPercentage || 0;

        let statusClass = 'progress-normal';
        let statusBadge = '<span class="badge badge-custom badge-income">On Track</span>';

        if (b.status === 'EXCEEDED') {
            statusClass = 'progress-exceeded';
            statusBadge = `<span class="badge badge-custom badge-expense">Exceeded by ${SmartSpend.formatCurrency(Math.abs(remaining))}</span>`;
        } else if (b.status === 'WARNING') {
            statusClass = 'progress-warning';
            statusBadge = `<span class="badge badge-custom badge-warning">Near Limit (${pct.toFixed(1)}%)</span>`;
        }

        return `
            <div class="col-12 col-md-6 col-xl-4">
                <div class="budget-card">
                    <div class="budget-header">
                        <div class="budget-category-title">
                            <span class="badge badge-custom badge-category p-2">
                                <i class="fa-solid ${catIcon} fs-6"></i>
                            </span>
                            <span>${b.category}</span>
                        </div>
                        <div class="budget-actions">
                            <button type="button" class="btn btn-sm btn-icon" onclick="editBudget(${b.id})" title="Edit Budget">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-icon text-danger" onclick="confirmDeleteBudget(${b.id})" title="Delete Budget">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fs-4 fw-bold text-dark">${SmartSpend.formatCurrency(spent)}</span>
                        <span class="small text-muted">Limit: ${SmartSpend.formatCurrency(limit)}</span>
                    </div>

                    <div class="progress-custom">
                        <div class="progress-bar-custom ${statusClass}" style="width: ${Math.min(100, Math.max(0, pct))}%;"></div>
                    </div>

                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="small ${remaining >= 0 ? 'text-muted' : 'text-danger fw-bold'}">
                            ${remaining >= 0 ? `${SmartSpend.formatCurrency(remaining)} remaining` : `Over by ${SmartSpend.formatCurrency(Math.abs(remaining))}`}
                        </span>
                        <div>${statusBadge}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function initBudgetFormEvents() {
    const form = document.getElementById('budgetForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const budgetId = document.getElementById('budgetId').value;
        const category = document.getElementById('budgetCategory').value;
        const monthlyLimit = parseFloat(document.getElementById('budgetLimit').value);
        const budgetMonth = parseInt(document.getElementById('modalBudgetMonth').value, 10);
        const budgetYear = parseInt(document.getElementById('modalBudgetYear').value, 10);

        if (isNaN(monthlyLimit) || monthlyLimit <= 0) {
            SmartSpend.showToast('Please enter a valid monthly limit greater than zero', 'warning');
            return;
        }

        const payload = {
            category,
            monthlyLimit,
            budgetMonth,
            budgetYear
        };

        const isUpdate = budgetId && budgetId.length > 0;
        const promise = isUpdate ?
            SmartSpend.put(`/api/budgets/${budgetId}`, payload) :
            SmartSpend.post('/api/budgets', payload);

        promise
            .then(() => {
                budgetModal.hide();
                SmartSpend.showToast(isUpdate ? 'Budget updated successfully' : 'Budget created successfully', 'success');
                // Sync main page dropdowns with the budget's month and year
                document.getElementById('budgetMonthSelect').value = budgetMonth;
                document.getElementById('budgetYearSelect').value = budgetYear;
                loadBudgets();
            })
            .catch(err => {
                SmartSpend.showToast(err.message, 'danger');
            });
    });
}

function openAddBudgetModal() {
    const form = document.getElementById('budgetForm');
    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('budgetId').value = '';
    document.getElementById('budgetModalTitle').innerHTML = `
        <i class="fa-solid fa-bullseye text-primary me-2"></i>
        <span>Create Monthly Budget</span>`;

    const { month, year } = getSelectedPeriod();
    document.getElementById('modalBudgetMonth').value = month;
    document.getElementById('modalBudgetYear').value = year;

    // Filter categories: disable or hide already budgeted categories for this month/year
    const categorySelect = document.getElementById('budgetCategory');
    categorySelect.innerHTML = '';

    const existingCats = new Set(currentBudgets.map(b => b.category.toLowerCase()));
    const allExpenseCats = SmartSpend.categories.EXPENSE;

    allExpenseCats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name + (existingCats.has(c.name.toLowerCase()) ? ' (Already budgeted)' : '');
        if (existingCats.has(c.name.toLowerCase())) {
            opt.disabled = true;
        }
        categorySelect.appendChild(opt);
    });

    // Select the first non-disabled category
    const firstAvailable = Array.from(categorySelect.options).find(o => !o.disabled);
    if (firstAvailable) {
        firstAvailable.selected = true;
    }

    budgetModal.show();
}

window.editBudget = function(id) {
    SmartSpend.get(`/api/budgets/${id}`)
        .then(res => {
            const b = res.data;
            const form = document.getElementById('budgetForm');
            form.reset();
            form.classList.remove('was-validated');

            document.getElementById('budgetId').value = b.id;
            document.getElementById('budgetModalTitle').innerHTML = `
                <i class="fa-solid fa-pen-to-square text-primary me-2"></i>
                <span>Edit ${b.category} Budget</span>`;

            const categorySelect = document.getElementById('budgetCategory');
            categorySelect.innerHTML = '';
            SmartSpend.categories.EXPENSE.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                if (c.name.toLowerCase() === b.category.toLowerCase()) {
                    opt.selected = true;
                }
                categorySelect.appendChild(opt);
            });

            document.getElementById('budgetLimit').value = b.monthlyLimit;
            document.getElementById('modalBudgetMonth').value = b.budgetMonth;
            document.getElementById('modalBudgetYear').value = b.budgetYear;

            budgetModal.show();
        })
        .catch(err => {
            SmartSpend.showToast(err.message, 'danger');
        });
};

window.confirmDeleteBudget = function(id) {
    pendingDeleteBudgetId = id;
    deleteBudgetModal.show();
};
