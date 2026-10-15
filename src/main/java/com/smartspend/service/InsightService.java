package com.smartspend.service;

import com.smartspend.dto.BudgetResponse;
import com.smartspend.dto.FinancialInsightDto;
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
import java.util.ArrayList;
import java.util.List;

@Service
public class InsightService {

    private final TransactionRepository transactionRepository;
    private final BudgetService budgetService;

    public InsightService(TransactionRepository transactionRepository, BudgetService budgetService) {
        this.transactionRepository = transactionRepository;
        this.budgetService = budgetService;
    }

    @Transactional(readOnly = true)
    public List<FinancialInsightDto> generateInsights(Integer month, Integer year) {
        User currentUser = SecurityUtils.getCurrentUser();
        List<FinancialInsightDto> insights = new ArrayList<>();

        YearMonth currentYm = YearMonth.of(year, month);
        LocalDate start = currentYm.atDay(1);
        LocalDate end = currentYm.atEndOfMonth();

        long txCount = transactionRepository.countByUserAndDateRange(currentUser, start, end);
        if (txCount == 0) {
            insights.add(new FinancialInsightDto(
                    "INFO",
                    "fa-lightbulb",
                    "No Data For Selected Period",
                    "You have no transactions recorded for this month. Click '+ Add Transaction' to start logging your finances."
            ));
            return insights;
        }

        BigDecimal income = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.INCOME, start, end);
        BigDecimal expenses = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.EXPENSE, start, end);
        if (income == null) income = BigDecimal.ZERO;
        if (expenses == null) expenses = BigDecimal.ZERO;

        // 1. Highest Spending Category
        List<Object[]> categoryExpenses = transactionRepository.findCategoryExpensesByUserAndDateRange(currentUser, start, end);
        if (!categoryExpenses.isEmpty()) {
            Object[] top = categoryExpenses.get(0);
            String topCategory = (String) top[0];
            BigDecimal topAmount = (BigDecimal) top[1];
            insights.add(new FinancialInsightDto(
                    "INFO",
                    "fa-receipt",
                    "Top Expense Category",
                    String.format("Your highest spending category this month is %s (%s).",
                            topCategory, topAmount.setScale(2, RoundingMode.HALF_UP).toPlainString())
            ));
        }

        // 2. Month-over-Month Comparison
        YearMonth prevYm = currentYm.minusMonths(1);
        LocalDate prevStart = prevYm.atDay(1);
        LocalDate prevEnd = prevYm.atEndOfMonth();
        BigDecimal prevExpenses = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.EXPENSE, prevStart, prevEnd);
        if (prevExpenses != null && prevExpenses.compareTo(BigDecimal.ZERO) > 0 && expenses.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = expenses.subtract(prevExpenses);
            BigDecimal percentage = diff.multiply(BigDecimal.valueOf(100))
                    .divide(prevExpenses, 1, RoundingMode.HALF_UP);
            if (percentage.compareTo(BigDecimal.ZERO) < 0) {
                insights.add(new FinancialInsightDto(
                        "SUCCESS",
                        "fa-arrow-trend-down",
                        "Decreased Spending",
                        String.format("You spent %s%% less this month compared to last month. Great job keeping your expenses down!",
                                percentage.abs().toPlainString())
                ));
            } else if (percentage.compareTo(BigDecimal.ZERO) > 0) {
                insights.add(new FinancialInsightDto(
                        "WARNING",
                        "fa-arrow-trend-up",
                        "Increased Spending",
                        String.format("Your expenses increased by %s%% compared to last month. Consider reviewing non-essential spending.",
                                percentage.toPlainString())
                ));
            }
        }

        // 3. Savings Rate and Evaluation
        BigDecimal balance = income.subtract(expenses);
        if (income.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal savingsRate = balance.multiply(BigDecimal.valueOf(100))
                    .divide(income, 1, RoundingMode.HALF_UP);
            if (balance.compareTo(BigDecimal.ZERO) < 0) {
                insights.add(new FinancialInsightDto(
                        "DANGER",
                        "fa-triangle-exclamation",
                        "Spending Deficit",
                        String.format("Alert: Your expenses exceeded your income by %s this month. Monitor upcoming purchases.",
                                balance.abs().setScale(2, RoundingMode.HALF_UP).toPlainString())
                ));
            } else if (savingsRate.compareTo(BigDecimal.valueOf(25)) >= 0) {
                insights.add(new FinancialInsightDto(
                        "SUCCESS",
                        "fa-piggy-bank",
                        "High Savings Rate",
                        String.format("Outstanding! You saved %s%% of your income this month, exceeding the 20%% personal finance target.",
                                savingsRate.toPlainString())
                ));
            } else {
                insights.add(new FinancialInsightDto(
                        "INFO",
                        "fa-wallet",
                        "Positive Net Balance",
                        String.format("Your income exceeded expenses with a savings rate of %s%% (Net: %s).",
                                savingsRate.toPlainString(), balance.setScale(2, RoundingMode.HALF_UP).toPlainString())
                ));
            }
        }

        // 4. Budget Status Alerts
        List<BudgetResponse> budgets = budgetService.getBudgetsForMonthAndYear(month, year);
        for (BudgetResponse b : budgets) {
            if ("EXCEEDED".equals(b.getStatus())) {
                BigDecimal over = b.getSpentAmount().subtract(b.getMonthlyLimit());
                insights.add(new FinancialInsightDto(
                        "DANGER",
                        "fa-circle-exclamation",
                        "Budget Exceeded: " + b.getCategory(),
                        String.format("You have exceeded your %s budget by %s (%s%% utilized).",
                                b.getCategory(), over.setScale(2, RoundingMode.HALF_UP).toPlainString(),
                                b.getUtilizationPercentage())
                ));
            } else if ("WARNING".equals(b.getStatus())) {
                insights.add(new FinancialInsightDto(
                        "WARNING",
                        "fa-bell",
                        "Budget Near Limit: " + b.getCategory(),
                        String.format("You have reached %s%% of your %s monthly budget (%s remaining).",
                                b.getUtilizationPercentage(), b.getCategory(),
                                b.getRemainingAmount().setScale(2, RoundingMode.HALF_UP).toPlainString())
                ));
            }
        }

        return insights;
    }
}
