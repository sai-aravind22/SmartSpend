/**
 * SmartSpend - Reports & Analytics Controller
 */

let annualBarChartInstance = null;
let categoryReportChartInstance = null;
let dailyExpenseChartInstance = null;
let paymentMethodChartInstance = null;
let savingsTrendChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initDateSelectors();
    loadAllReports();

    document.getElementById('btnExportReportCsv').addEventListener('click', () => {
        exportReportCsv();
    });
});

function initDateSelectors() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const monthSelect = document.getElementById('reportMonthSelect');
    const yearSelect = document.getElementById('reportYearSelect');

    if (monthSelect) monthSelect.value = currentMonth;
    if (yearSelect) yearSelect.value = currentYear;

    // Load available years
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

    monthSelect.addEventListener('change', () => loadAllReports());
    yearSelect.addEventListener('change', () => loadAllReports());
}

function getSelectedPeriod() {
    const month = parseInt(document.getElementById('reportMonthSelect').value, 10);
    const year = parseInt(document.getElementById('reportYearSelect').value, 10);
    return { month, year };
}

function loadAllReports() {
    const { month, year } = getSelectedPeriod();
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];

    document.getElementById('annualChartTitle').textContent = `Monthly Income vs Expenses (${year})`;
    document.getElementById('monthlyTableTitle').textContent = `Monthly Financial Breakdown (${year})`;
    document.getElementById('reportCategoryPeriodBadge').textContent = `${monthNames[month - 1]} ${year}`;
    document.getElementById('dailyChartPeriodBadge').textContent = `${monthNames[month - 1]} ${year}`;

    loadMonthlyReports(year, month);
    loadCategoryReport(month, year);
    loadDailyReport(month, year);
    loadPaymentMethodReport(month, year);
}

// 1. Annual Monthly Data + Table + Savings Trend
function loadMonthlyReports(year, selectedMonth) {
    SmartSpend.get('/api/reports/monthly', { year })
        .then(res => {
            const reports = res.data || [];
            renderAnnualBarChart(reports);
            renderSavingsTrendChart(reports);
            renderMonthlyTable(reports, selectedMonth);

            // Calculate Period Metric Cards (for selected month or entire year)
            const selReport = reports.find(r => r.month === selectedMonth);
            if (selReport) {
                document.getElementById('reportTotalIncome').textContent = SmartSpend.formatCurrency(selReport.income);
                document.getElementById('reportTotalExpense').textContent = SmartSpend.formatCurrency(selReport.expenses);
                document.getElementById('reportNetSavings').textContent = SmartSpend.formatCurrency(selReport.savings);
                document.getElementById('reportSavingsRate').textContent = `${selReport.savingsRate.toFixed(1)}%`;
            }
        })
        .catch(err => {
            console.error('Failed to load monthly reports:', err);
        });
}

function renderAnnualBarChart(reports) {
    const ctx = document.getElementById('annualBarChart').getContext('2d');

    if (annualBarChartInstance) {
        annualBarChartInstance.destroy();
    }

    const labels = reports.map(r => r.monthYear.split(' ')[0]);
    const incomeData = reports.map(r => r.income);
    const expenseData = reports.map(r => r.expenses);

    annualBarChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: '#ef4444',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${SmartSpend.formatCurrency(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (v) => SmartSpend.formatCurrency(v)
                    }
                }
            }
        }
    });
}

function renderSavingsTrendChart(reports) {
    const ctx = document.getElementById('savingsTrendChart').getContext('2d');

    if (savingsTrendChartInstance) {
        savingsTrendChartInstance.destroy();
    }

    const labels = reports.map(r => r.monthYear.split(' ')[0]);
    const savingsData = reports.map(r => r.savings);

    savingsTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Savings',
                data: savingsData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                tension: 0.35,
                fill: true,
                pointBackgroundColor: '#4f46e5',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Net Savings: ${SmartSpend.formatCurrency(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    ticks: {
                        callback: (v) => SmartSpend.formatCurrency(v)
                    }
                }
            }
        }
    });
}

function renderMonthlyTable(reports, selectedMonth) {
    const tbody = document.getElementById('monthlyReportTableBody');

    tbody.innerHTML = reports.map(r => {
        const isCurrent = r.month === selectedMonth;
        const isPositive = Number(r.savings) >= 0;
        const statusBadge = isPositive ?
            '<span class="badge badge-custom badge-income">Surplus</span>' :
            '<span class="badge badge-custom badge-expense">Deficit</span>';

        return `
            <tr class="${isCurrent ? 'table-primary bg-primary-subtle' : ''}">
                <td>
                    <strong>${r.monthYear}</strong>
                    ${isCurrent ? '<span class="badge badge-sm badge-custom badge-category ms-1">Selected</span>' : ''}
                </td>
                <td class="text-end text-success fw-bold">${SmartSpend.formatCurrency(r.income)}</td>
                <td class="text-end text-danger fw-bold">${SmartSpend.formatCurrency(r.expenses)}</td>
                <td class="text-end fw-bold ${isPositive ? 'text-success' : 'text-danger'}">
                    ${isPositive ? '+' : ''}${SmartSpend.formatCurrency(r.savings)}
                </td>
                <td class="text-center">${r.savingsRate.toFixed(1)}%</td>
                <td class="text-center">${r.transactionCount}</td>
                <td class="text-center">${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

// 2. Category Report Chart
function loadCategoryReport(month, year) {
    SmartSpend.get('/api/reports/categories', { month, year })
        .then(res => {
            const list = res.data || [];
            renderCategoryReportChart(list);
        })
        .catch(err => {
            console.error('Failed to load category report:', err);
        });
}

function renderCategoryReportChart(list) {
    const ctx = document.getElementById('categoryReportChart').getContext('2d');

    if (categoryReportChartInstance) {
        categoryReportChartInstance.destroy();
    }

    if (list.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px Plus Jakarta Sans';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('No category expenses recorded', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const labels = list.map(c => c.category);
    const amounts = list.map(c => c.amount);
    const percentages = list.map(c => c.percentage);

    const palette = [
        '#f97316', '#0ea5e9', '#ec4899', '#8b5cf6', '#a855f7',
        '#ef4444', '#eab308', '#14b8a6', '#06b6d4', '#f43f5e', '#64748b'
    ];

    categoryReportChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: palette.slice(0, labels.length),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.parsed;
                            const idx = ctx.dataIndex;
                            return ` ${ctx.label}: ${SmartSpend.formatCurrency(val)} (${percentages[idx]}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 3. Daily Expenses Line Chart
function loadDailyReport(month, year) {
    SmartSpend.get('/api/reports/daily', { month, year })
        .then(res => {
            const list = res.data || [];
            renderDailyExpenseChart(list);
        })
        .catch(err => {
            console.error('Failed to load daily report:', err);
        });
}

function renderDailyExpenseChart(list) {
    const ctx = document.getElementById('dailyExpenseChart').getContext('2d');

    if (dailyExpenseChartInstance) {
        dailyExpenseChartInstance.destroy();
    }

    if (list.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px Plus Jakarta Sans';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('No daily expenses recorded', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const labels = list.map(d => {
        const parts = d.date.split('-');
        return `${parts[2]}`; // day number
    });
    const amounts = list.map(d => d.amount);

    dailyExpenseChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Spending',
                data: amounts,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#ef4444'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `Day ${items[0].label}`,
                        label: (ctx) => `Expense: ${SmartSpend.formatCurrency(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Day of Month' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { callback: (v) => SmartSpend.formatCurrency(v) }
                }
            }
        }
    });
}

// 4. Payment Method Breakdown Chart
function loadPaymentMethodReport(month, year) {
    SmartSpend.get('/api/reports/payment-methods', { month, year })
        .then(res => {
            const list = res.data || [];
            renderPaymentMethodChart(list);
        })
        .catch(err => {
            console.error('Failed to load payment method report:', err);
        });
}

function renderPaymentMethodChart(list) {
    const ctx = document.getElementById('paymentMethodChart').getContext('2d');

    if (paymentMethodChartInstance) {
        paymentMethodChartInstance.destroy();
    }

    if (list.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px Plus Jakarta Sans';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('No payment method data', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const labels = list.map(p => p.paymentMethod);
    const amounts = list.map(p => p.amount);
    const percentages = list.map(p => p.percentage);

    const palette = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    paymentMethodChartInstance = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: palette.slice(0, labels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.parsed.r;
                            const idx = ctx.dataIndex;
                            return ` ${ctx.label}: ${SmartSpend.formatCurrency(val)} (${percentages[idx]}%)`;
                        }
                    }
                }
            }
        }
    });
}

function exportReportCsv() {
    const { month, year } = getSelectedPeriod();
    const exportUrl = `/api/reports/export?month=${month}&year=${year}`;

    SmartSpend.showToast('Generating CSV report for selected period...', 'info');

    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', `smartspend-${year}-${month}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}
