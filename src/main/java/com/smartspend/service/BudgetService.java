package com.smartspend.service;

import com.smartspend.dto.BudgetRequest;
import com.smartspend.dto.BudgetResponse;
import com.smartspend.entity.Budget;
import com.smartspend.entity.User;
import com.smartspend.exception.DuplicateResourceException;
import com.smartspend.exception.ResourceNotFoundException;
import com.smartspend.repository.BudgetRepository;
import com.smartspend.repository.TransactionRepository;
import com.smartspend.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@Transactional
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository, TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
    }

    public BudgetResponse createBudget(BudgetRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        String category = request.getCategory().trim();
        Integer month = request.getBudgetMonth();
        Integer year = request.getBudgetYear();

        if (budgetRepository.existsByUserAndCategoryAndBudgetMonthAndBudgetYear(currentUser, category, month, year)) {
            throw new DuplicateResourceException(
                    String.format("A budget for category '%s' already exists for %02d/%d", category, month, year)
            );
        }

        Budget budget = new Budget(currentUser, category, request.getMonthlyLimit(), month, year);
        Budget saved = budgetRepository.save(budget);
        return mapToResponse(saved, currentUser);
    }

    public BudgetResponse updateBudget(Long id, BudgetRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        Budget budget = budgetRepository.findById(id)
                .filter(b -> b.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with ID: " + id));

        String category = request.getCategory().trim();
        Integer month = request.getBudgetMonth();
        Integer year = request.getBudgetYear();

        if (budgetRepository.existsByUserAndCategoryAndBudgetMonthAndBudgetYearAndIdNot(currentUser, category, month, year, id)) {
            throw new DuplicateResourceException(
                    String.format("Another budget for category '%s' already exists for %02d/%d", category, month, year)
            );
        }

        budget.setCategory(category);
        budget.setMonthlyLimit(request.getMonthlyLimit());
        budget.setBudgetMonth(month);
        budget.setBudgetYear(year);

        Budget updated = budgetRepository.save(budget);
        return mapToResponse(updated, currentUser);
    }

    public void deleteBudget(Long id) {
        User currentUser = SecurityUtils.getCurrentUser();

        Budget budget = budgetRepository.findById(id)
                .filter(b -> b.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with ID: " + id));

        budgetRepository.delete(budget);
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudgetById(Long id) {
        User currentUser = SecurityUtils.getCurrentUser();

        Budget budget = budgetRepository.findById(id)
                .filter(b -> b.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with ID: " + id));
        return mapToResponse(budget, currentUser);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgetsForMonthAndYear(Integer month, Integer year) {
        User currentUser = SecurityUtils.getCurrentUser();
        List<Budget> budgets = budgetRepository.findByUserAndBudgetMonthAndBudgetYearOrderByCategoryAsc(currentUser, month, year);
        return budgets.stream().map(b -> mapToResponse(b, currentUser)).toList();
    }

    private BudgetResponse mapToResponse(Budget budget, User user) {
        YearMonth ym = YearMonth.of(budget.getBudgetYear(), budget.getBudgetMonth());
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        BigDecimal spent = transactionRepository.sumExpenseByUserAndCategoryAndDateRange(
                user, budget.getCategory(), startDate, endDate
        );
        if (spent == null) {
            spent = BigDecimal.ZERO;
        }

        BigDecimal limit = budget.getMonthlyLimit();
        BigDecimal remaining = limit.subtract(spent);

        double utilization = 0.0;
        if (limit.compareTo(BigDecimal.ZERO) > 0) {
            utilization = spent.multiply(BigDecimal.valueOf(100))
                    .divide(limit, 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        String status = "NORMAL";
        if (utilization >= 100.0) {
            status = "EXCEEDED";
        } else if (utilization >= 80.0) {
            status = "WARNING";
        }

        BudgetResponse response = new BudgetResponse();
        response.setId(budget.getId());
        response.setCategory(budget.getCategory());
        response.setMonthlyLimit(limit);
        response.setBudgetMonth(budget.getBudgetMonth());
        response.setBudgetYear(budget.getBudgetYear());
        response.setCreatedAt(budget.getCreatedAt());
        response.setSpentAmount(spent);
        response.setRemainingAmount(remaining);
        response.setUtilizationPercentage(utilization);
        response.setStatus(status);

        return response;
    }
}
