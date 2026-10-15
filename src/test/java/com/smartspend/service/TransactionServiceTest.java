package com.smartspend.service;

import com.smartspend.dto.TransactionRequest;
import com.smartspend.dto.TransactionResponse;
import com.smartspend.entity.Transaction;
import com.smartspend.entity.TransactionType;
import com.smartspend.entity.User;
import com.smartspend.exception.ResourceNotFoundException;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TransactionService transactionService;

    private User sampleUser;
    private Transaction sampleTransaction;
    private TransactionRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleUser = new User("Alex Morgan", "demo@smartspend.com", "password123");
        sampleUser.setId(1L);

        UserPrincipal principal = new UserPrincipal(sampleUser);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        sampleTransaction = new Transaction(
                sampleUser,
                "Supermarket Grocery",
                new BigDecimal("4500.00"),
                TransactionType.EXPENSE,
                "Food",
                LocalDate.of(2026, 10, 5),
                "Credit Card",
                "Weekly pantry items"
        );
        sampleTransaction.setId(1L);

        sampleRequest = new TransactionRequest();
        sampleRequest.setTitle("Supermarket Grocery");
        sampleRequest.setAmount(new BigDecimal("4500.00"));
        sampleRequest.setType(TransactionType.EXPENSE);
        sampleRequest.setCategory("Food");
        sampleRequest.setTransactionDate(LocalDate.of(2026, 10, 5));
        sampleRequest.setPaymentMethod("Credit Card");
        sampleRequest.setDescription("Weekly pantry items");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should create transaction successfully")
    void testCreateTransaction() {
        when(transactionRepository.save(any(Transaction.class))).thenReturn(sampleTransaction);

        TransactionResponse response = transactionService.createTransaction(sampleRequest);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Supermarket Grocery", response.getTitle());
        assertEquals(new BigDecimal("4500.00"), response.getAmount());
        assertEquals(TransactionType.EXPENSE, response.getType());
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should get transaction by ID successfully")
    void testGetTransactionById() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));

        TransactionResponse response = transactionService.getTransactionById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Food", response.getCategory());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when transaction does not exist")
    void testGetTransactionById_NotFound() {
        when(transactionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> transactionService.getTransactionById(999L));
    }

    @Test
    @DisplayName("Should update transaction successfully")
    void testUpdateTransaction() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(sampleTransaction);

        sampleRequest.setTitle("Updated Grocery");
        sampleRequest.setAmount(new BigDecimal("5000.00"));

        TransactionResponse response = transactionService.updateTransaction(1L, sampleRequest);

        assertNotNull(response);
        verify(transactionRepository, times(1)).save(sampleTransaction);
    }

    @Test
    @DisplayName("Should delete transaction successfully")
    void testDeleteTransaction() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));
        doNothing().when(transactionRepository).delete(sampleTransaction);

        assertDoesNotThrow(() -> transactionService.deleteTransaction(1L));
        verify(transactionRepository, times(1)).delete(sampleTransaction);
    }
}
