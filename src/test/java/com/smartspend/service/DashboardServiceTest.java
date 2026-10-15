package com.smartspend.service;

import com.smartspend.dto.DashboardSummaryResponse;
import com.smartspend.entity.TransactionType;
import com.smartspend.entity.User;
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
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User("Alex Morgan", "demo@smartspend.com", "password123");
        sampleUser.setId(1L);

        UserPrincipal principal = new UserPrincipal(sampleUser);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should correctly calculate dashboard summary statistics and savings rate")
    void testGetSummary() {
        when(transactionRepository.sumAmountByUserAndTypeAndDateRange(eq(sampleUser), eq(TransactionType.INCOME), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("100000.00"));
        when(transactionRepository.sumAmountByUserAndTypeAndDateRange(eq(sampleUser), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("40000.00"));
        when(transactionRepository.countByUserAndDateRange(eq(sampleUser), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(15L);

        List<Object[]> categoryRows = new ArrayList<>();
        categoryRows.add(new Object[]{"Food", new BigDecimal("12000.00"), 5L});

        when(transactionRepository.findCategoryExpensesByUserAndDateRange(eq(sampleUser), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(categoryRows);

        DashboardSummaryResponse summary = dashboardService.getSummary(10, 2026);

        assertNotNull(summary);
        assertEquals(new BigDecimal("100000.00"), summary.getTotalIncome());
        assertEquals(new BigDecimal("40000.00"), summary.getTotalExpenses());
        assertEquals(new BigDecimal("60000.00"), summary.getCurrentBalance());
        assertEquals(60.0, summary.getSavingsRate());
        assertEquals(15L, summary.getTransactionCount());
        assertEquals("Food", summary.getHighestSpendingCategory());
        assertEquals(new BigDecimal("12000.00"), summary.getHighestSpendingCategoryAmount());
    }
}
