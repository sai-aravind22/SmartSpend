package com.smartspend.service;

import com.smartspend.dto.BudgetRequest;
import com.smartspend.dto.BudgetResponse;
import com.smartspend.entity.Budget;
import com.smartspend.entity.User;
import com.smartspend.exception.DuplicateResourceException;
import com.smartspend.repository.BudgetRepository;
import com.smartspend.repository.TransactionRepository;
import com.smartspend.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private BudgetService budgetService;

    private User sampleUser;
    private Budget sampleBudget;
    private BudgetRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleUser = new User("Alex Morgan", "demo@smartspend.com", "password123");
        sampleUser.setId(1L);

        UserPrincipal principal = new UserPrincipal(sampleUser);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        sampleBudget = new Budget(sampleUser, "Food", new BigDecimal("10000.00"), 10, 2026);
        sampleBudget.setId(1L);

        sampleRequest = new BudgetRequest();
        sampleRequest.setCategory("Food");
        sampleRequest.setMonthlyLimit(new BigDecimal("10000.00"));
        sampleRequest.setBudgetMonth(10);
        sampleRequest.setBudgetYear(2026);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should create budget successfully when no duplicate exists")
    void testCreateBudget_Success() {
        when(budgetRepository.existsByUserAndCategoryAndBudgetMonthAndBudgetYear(eq(sampleUser), eq("Food"), eq(10), eq(2026))).thenReturn(false);
        when(budgetRepository.save(any(Budget.class))).thenReturn(sampleBudget);
        when(transactionRepository.sumExpenseByUserAndCategoryAndDateRange(eq(sampleUser), eq("Food"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("3500.00"));

        BudgetResponse response = budgetService.createBudget(sampleRequest);

        assertNotNull(response);
        assertEquals("Food", response.getCategory());
        assertEquals(new BigDecimal("10000.00"), response.getMonthlyLimit());
        assertEquals(new BigDecimal("3500.00"), response.getSpentAmount());
        assertEquals(new BigDecimal("6500.00"), response.getRemainingAmount());
        assertEquals(35.0, response.getUtilizationPercentage());
        assertEquals("NORMAL", response.getStatus());
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException on duplicate category/month/year")
    void testCreateBudget_Duplicate() {
        when(budgetRepository.existsByUserAndCategoryAndBudgetMonthAndBudgetYear(eq(sampleUser), eq("Food"), eq(10), eq(2026))).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> budgetService.createBudget(sampleRequest));
    }

    @Test
    @DisplayName("Should calculate WARNING status when spending reaches 80%")
    void testBudgetWarningStatus() {
        when(budgetRepository.findByUserAndBudgetMonthAndBudgetYearOrderByCategoryAsc(eq(sampleUser), eq(10), eq(2026)))
                .thenReturn(List.of(sampleBudget));
        when(transactionRepository.sumExpenseByUserAndCategoryAndDateRange(eq(sampleUser), eq("Food"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("8500.00"));

        List<BudgetResponse> budgets = budgetService.getBudgetsForMonthAndYear(10, 2026);

        assertEquals(1, budgets.size());
        assertEquals(85.0, budgets.get(0).getUtilizationPercentage());
        assertEquals("WARNING", budgets.get(0).getStatus());
    }

    @Test
    @DisplayName("Should calculate EXCEEDED status when spending exceeds 100%")
    void testBudgetExceededStatus() {
        when(budgetRepository.findByUserAndBudgetMonthAndBudgetYearOrderByCategoryAsc(eq(sampleUser), eq(10), eq(2026)))
                .thenReturn(List.of(sampleBudget));
        when(transactionRepository.sumExpenseByUserAndCategoryAndDateRange(eq(sampleUser), eq("Food"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("11200.00"));

        List<BudgetResponse> budgets = budgetService.getBudgetsForMonthAndYear(10, 2026);

        assertEquals(1, budgets.size());
        assertEquals(112.0, budgets.get(0).getUtilizationPercentage());
        assertEquals("EXCEEDED", budgets.get(0).getStatus());
    }
}
