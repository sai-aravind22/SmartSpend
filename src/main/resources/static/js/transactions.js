/**
 * SmartSpend - Transactions Management Controller
 */

let currentPage = 0;
const pageSize = 10;
let totalPages = 1;
let totalElements = 0;
let searchDebounceTimer = null;

let txModal = null;
let viewModal = null;
let deleteModal = null;
let pendingDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
    initModals();
    populateCategoryFilter();
    initFilterEventListeners();
    initTransactionFormEvents();
    loadTransactions();
});

function initModals() {
    txModal = new bootstrap.Modal(document.getElementById('transactionModal'));
    viewModal = new bootstrap.Modal(document.getElementById('viewTransactionModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    const prefixEl = document.getElementById('currencyPrefix');
    if (prefixEl) {
        prefixEl.textContent = SmartSpend.settings.currency || '₹';
    }

    document.getElementById('btnOpenAddModal').addEventListener('click', () => {
        openAddTransactionModal('EXPENSE');
    });

    document.getElementById('btnConfirmDelete').addEventListener('click', () => {
        if (pendingDeleteId) {
            SmartSpend.delete(`/api/transactions/${pendingDeleteId}`)
                .then(() => {
                    deleteModal.hide();
                    SmartSpend.showToast('Transaction deleted successfully', 'success');
                    loadTransactions();
                })
                .catch(err => {
                    SmartSpend.showToast(err.message, 'danger');
                });
        }
    });

    // CSV Export button
    document.getElementById('btnExportCsv').addEventListener('click', () => {
        exportFilteredCsv();
    });
}

function populateCategoryFilter(selectedType = '') {
    const filterCatSelect = document.getElementById('filterCategory');
    filterCatSelect.innerHTML = '<option value="">All Categories</option>';

    let list = [];
    if (selectedType === 'INCOME') {
        list = SmartSpend.categories.INCOME;
    } else if (selectedType === 'EXPENSE') {
        list = SmartSpend.categories.EXPENSE;
    } else {
        // Union of both
        const set = new Set();
        SmartSpend.categories.EXPENSE.forEach(c => set.add(c.name));
        SmartSpend.categories.INCOME.forEach(c => set.add(c.name));
        list = Array.from(set).map(name => ({ name }));
    }

    list.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.name;
        opt.textContent = item.name;
        filterCatSelect.appendChild(opt);
    });
}

function initFilterEventListeners() {
    const searchInput = document.getElementById('filterSearch');
    const typeSelect = document.getElementById('filterType');
    const categorySelect = document.getElementById('filterCategory');
    const paymentSelect = document.getElementById('filterPayment');
    const startDateInput = document.getElementById('filterStartDate');
    const endDateInput = document.getElementById('filterEndDate');
    const sortBySelect = document.getElementById('filterSortBy');
    const sortDirectionSelect = document.getElementById('filterSortDirection');
    const clearBtn = document.getElementById('btnClearFilters');

    // Debounced search input
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            currentPage = 0;
            loadTransactions();
        }, 300);
    });

    // When type changes, adapt category options
    typeSelect.addEventListener('change', () => {
        populateCategoryFilter(typeSelect.value);
        currentPage = 0;
        loadTransactions();
    });

    categorySelect.addEventListener('change', () => {
        currentPage = 0;
        loadTransactions();
    });

    paymentSelect.addEventListener('change', () => {
        currentPage = 0;
        loadTransactions();
    });

    startDateInput.addEventListener('change', () => {
        currentPage = 0;
        loadTransactions();
    });

    endDateInput.addEventListener('change', () => {
        currentPage = 0;
        loadTransactions();
    });

    sortBySelect.addEventListener('change', () => {
        currentPage = 0;
        loadTransactions();
    });

    sortDirectionSelect.addEventListener('change', () => {
        currentPage = 0;
        loadTransactions();
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        typeSelect.value = '';
        populateCategoryFilter('');
        paymentSelect.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
        sortBySelect.value = 'transactionDate';
        sortDirectionSelect.value = 'DESC';
        currentPage = 0;
        loadTransactions();
    });
}

function getFilterParams() {
    return {
        search: document.getElementById('filterSearch').value.trim(),
        type: document.getElementById('filterType').value,
        category: document.getElementById('filterCategory').value,
        paymentMethod: document.getElementById('filterPayment').value,
        startDate: document.getElementById('filterStartDate').value,
        endDate: document.getElementById('filterEndDate').value,
        sortBy: document.getElementById('filterSortBy').value,
        sortDirection: document.getElementById('filterSortDirection').value
    };
}

function loadTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    const emptyState = document.getElementById('tableEmptyState');
    const paginationContainer = document.getElementById('paginationContainer');

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-5 text-muted">
                <i class="fa-solid fa-spinner fa-spin fs-4 mb-2 d-block"></i>
                Loading transactions...
            </td>
        </tr>`;
    emptyState.classList.add('d-none');

    const params = {
        ...getFilterParams(),
        page: currentPage,
        size: pageSize
    };

    SmartSpend.get('/api/transactions', params)
        .then(res => {
            const pageData = res.data;
            totalElements = pageData.totalElements;
            totalPages = pageData.totalPages;
            const records = pageData.content;

            if (records.length === 0) {
                tbody.innerHTML = '';
                emptyState.classList.remove('d-none');
                paginationContainer.classList.add('d-none');
                document.getElementById('paginationInfo').textContent = 'Showing 0 records';
                updateSummaryStrip([]);
                return;
            }

            emptyState.classList.add('d-none');
            paginationContainer.classList.remove('d-none');

            // Render table rows
            tbody.innerHTML = records.map(tx => {
                const isIncome = tx.type === 'INCOME';
                const typeBadge = isIncome ? 'badge-income' : 'badge-expense';
                const amountClass = isIncome ? 'amount-income' : 'amount-expense';
                const sign = isIncome ? '+' : '-';
                const catIcon = SmartSpend.getCategoryIcon(tx.category, tx.type);
                const payIcon = SmartSpend.getPaymentIcon(tx.paymentMethod);

                return `
                    <tr>
                        <td>
                            <span class="text-dark fw-medium">${SmartSpend.formatDisplayDate(tx.transactionDate)}</span>
                        </td>
                        <td>
                            <div class="fw-semibold text-dark">${tx.title}</div>
                            ${tx.description ? `<small class="text-muted text-truncate d-inline-block" style="max-width: 250px;">${tx.description}</small>` : ''}
                        </td>
                        <td>
                            <span class="badge badge-custom badge-category">
                                <i class="fa-solid ${catIcon}"></i> ${tx.category}
                            </span>
                        </td>
                        <td>
                            <span class="badge badge-custom ${typeBadge}">
                                ${tx.type}
                            </span>
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
                                <button type="button" class="btn btn-sm btn-icon" onclick="viewTransaction(${tx.id})" title="View Details">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-icon" onclick="editTransaction(${tx.id})" title="Edit">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-icon text-danger" onclick="confirmDeleteTransaction(${tx.id})" title="Delete">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Update Pagination info
            const startIdx = (currentPage * pageSize) + 1;
            const endIdx = Math.min((currentPage + 1) * pageSize, totalElements);
            document.getElementById('paginationInfo').textContent = `Showing ${startIdx} to ${endIdx} of ${totalElements} records`;
            document.getElementById('paginationDetails').textContent = `Page ${currentPage + 1} of ${Math.max(1, totalPages)}`;

            renderPaginationControls();
            computeFilterSummary();
        })
        .catch(err => {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${err.message}</td></tr>`;
        });
}

function renderPaginationControls() {
    const ul = document.getElementById('paginationControls');
    ul.innerHTML = '';

    if (totalPages <= 1) return;

    // First & Prev buttons
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 0 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<button class="page-link" aria-label="Previous"><i class="fa-solid fa-chevron-left"></i></button>`;
    prevLi.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadTransactions();
        }
    });
    ul.appendChild(prevLi);

    // Numbered pages
    const maxVisible = 5;
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${p === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<button class="page-link">${p + 1}</button>`;
        pageLi.addEventListener('click', () => {
            if (currentPage !== p) {
                currentPage = p;
                loadTransactions();
            }
        });
        ul.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}`;
    nextLi.innerHTML = `<button class="page-link" aria-label="Next"><i class="fa-solid fa-chevron-right"></i></button>`;
    nextLi.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            loadTransactions();
        }
    });
    ul.appendChild(nextLi);
}

function computeFilterSummary() {
    // Request full filtered list (up to 1000 items) to compute total income, total expense, and net
    const params = {
        ...getFilterParams(),
        page: 0,
        size: 1000
    };

    SmartSpend.get('/api/transactions', params)
        .then(res => {
            const list = res.data.content || [];
            updateSummaryStrip(list);
        })
        .catch(() => {});
}

function updateSummaryStrip(records) {
    let income = 0;
    let expense = 0;

    records.forEach(r => {
        const amt = Number(r.amount);
        if (r.type === 'INCOME') {
            income += amt;
        } else {
            expense += amt;
        }
    });

    const net = income - expense;

    document.getElementById('summaryFilteredIncome').textContent = SmartSpend.formatCurrency(income);
    document.getElementById('summaryFilteredExpense').textContent = SmartSpend.formatCurrency(expense);
    document.getElementById('summaryFilteredNet').textContent = SmartSpend.formatCurrency(net);
    document.getElementById('summaryFilteredCount').textContent = totalElements;
}

function exportFilteredCsv() {
    const params = getFilterParams();
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
    });

    const exportUrl = `/api/reports/export?${query.toString()}`;
    SmartSpend.showToast('Preparing your CSV export...', 'info');

    // Trigger download
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', 'smartspend-transactions.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// Transaction Modal Logic
function initTransactionFormEvents() {
    const form = document.getElementById('transactionForm');
    const typeRadios = document.querySelectorAll('input[name="txType"]');

    typeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            populateModalCategories(radio.value);
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
                loadTransactions();
            })
            .catch(err => {
                SmartSpend.showToast(err.message, 'danger');
            });
    });
}

function populateModalCategories(type, selectedCategory = '') {
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

function openAddTransactionModal(type = 'EXPENSE') {
    const form = document.getElementById('transactionForm');
    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('txId').value = '';
    document.getElementById('transactionModalTitle').innerHTML = `
        <i class="fa-solid fa-circle-plus text-primary me-2"></i>
        <span>Add ${type === 'INCOME' ? 'Income' : 'Expense'}</span>`;

    if (type === 'INCOME') {
        document.getElementById('typeIncome').checked = true;
    } else {
        document.getElementById('typeExpense').checked = true;
    }

    populateModalCategories(type);
    document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
    txModal.show();
}

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

            populateModalCategories(tx.type, tx.category);

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
