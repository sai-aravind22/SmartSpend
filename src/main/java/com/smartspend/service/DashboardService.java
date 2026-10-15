package com.smartspend.service;

import com.smartspend.dto.DashboardChartsResponse;
import com.smartspend.dto.DashboardSummaryResponse;
import com.smartspend.entity.TransactionType;
import com.smartspend.entity.User;
import com.smartspend.repository.TransactionRepository;
import com.smartspend.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final TransactionRepository transactionRepository;

    public DashboardService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public DashboardSummaryResponse getSummary(Integer month, Integer year) {
        User currentUser = SecurityUtils.getCurrentUser();
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        BigDecimal income = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.INCOME, start, end);
        BigDecimal expenses = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.EXPENSE, start, end);
        if (income == null) income = BigDecimal.ZERO;
        if (expenses == null) expenses = BigDecimal.ZERO;

        BigDecimal balance = income.subtract(expenses);

        double savingsRate = 0.0;
        if (income.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = balance.multiply(BigDecimal.valueOf(100))
                    .divide(income, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        long count = transactionRepository.countByUserAndDateRange(currentUser, start, end);

        String topCategory = "None";
        BigDecimal topAmount = BigDecimal.ZERO;
        List<Object[]> categoryExpenses = transactionRepository.findCategoryExpensesByUserAndDateRange(currentUser, start, end);
        if (!categoryExpenses.isEmpty()) {
            Object[] top = categoryExpenses.get(0);
            topCategory = (String) top[0];
            topAmount = (BigDecimal) top[1];
        }

        DashboardSummaryResponse res = new DashboardSummaryResponse();
        res.setTotalIncome(income.setScale(2, RoundingMode.HALF_UP));
        res.setTotalExpenses(expenses.setScale(2, RoundingMode.HALF_UP));
        res.setCurrentBalance(balance.setScale(2, RoundingMode.HALF_UP));
        res.setSavingsRate(savingsRate);
        res.setTransactionCount(count);
        res.setHighestSpendingCategory(topCategory);
        res.setHighestSpendingCategoryAmount(topAmount.setScale(2, RoundingMode.HALF_UP));
        res.setSelectedMonth(month);
        res.setSelectedYear(year);

        return res;
    }

    public DashboardChartsResponse getCharts(Integer month, Integer year) {
        User currentUser = SecurityUtils.getCurrentUser();
        DashboardChartsResponse res = new DashboardChartsResponse();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");

        YearMonth targetYm = YearMonth.of(year, month);
        List<String> labels = new ArrayList<>();
        List<BigDecimal> incomeList = new ArrayList<>();
        List<BigDecimal> expenseList = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            YearMonth ym = targetYm.minusMonths(i);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.atEndOfMonth();

            labels.add(ym.format(monthFmt));

            BigDecimal inc = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.INCOME, start, end);
            BigDecimal exp = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.EXPENSE, start, end);

            incomeList.add(inc != null ? inc.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
            expenseList.add(exp != null ? exp.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        }

        res.setMonthlyLabels(labels);
        res.setMonthlyIncome(incomeList);
        res.setMonthlyExpense(expenseList);

        LocalDate start = targetYm.atDay(1);
        LocalDate end = targetYm.atEndOfMonth();
        List<Object[]> categoryData = transactionRepository.findCategoryExpensesByUserAndDateRange(currentUser, start, end);

        BigDecimal totalMonthExpenses = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.EXPENSE, start, end);
        if (totalMonthExpenses == null) totalMonthExpenses = BigDecimal.ZERO;

        List<String> catLabels = new ArrayList<>();
        List<BigDecimal> catAmounts = new ArrayList<>();
        List<Double> catPercentages = new ArrayList<>();

        for (Object[] row : categoryData) {
            String cat = (String) row[0];
            BigDecimal amt = (BigDecimal) row[1];

            catLabels.add(cat);
            catAmounts.add(amt.setScale(2, RoundingMode.HALF_UP));

            double pct = 0.0;
            if (totalMonthExpenses.compareTo(BigDecimal.ZERO) > 0) {
                pct = amt.multiply(BigDecimal.valueOf(100))
                        .divide(totalMonthExpenses, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            catPercentages.add(pct);
        }

        res.setCategoryLabels(catLabels);
        res.setCategoryAmounts(catAmounts);
        res.setCategoryPercentages(catPercentages);

        return res;
    }
}
