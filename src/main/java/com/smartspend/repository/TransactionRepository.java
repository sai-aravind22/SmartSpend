package com.smartspend.repository;

import com.smartspend.entity.Transaction;
import com.smartspend.entity.TransactionType;
import com.smartspend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    List<Transaction> findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
            User user, LocalDate startDate, LocalDate endDate);

    List<Transaction> findTop10ByUserOrderByTransactionDateDescIdDesc(User user);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user = :user AND t.type = :type AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByUserAndTypeAndDateRange(
            @Param("user") User user,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.user = :user AND t.transactionDate BETWEEN :startDate AND :endDate")
    long countByUserAndDateRange(@Param("user") User user, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT t.category, COALESCE(SUM(t.amount), 0), COUNT(t) FROM Transaction t " +
           "WHERE t.user = :user AND t.type = 'EXPENSE' AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.category ORDER BY SUM(t.amount) DESC")
    List<Object[]> findCategoryExpensesByUserAndDateRange(
            @Param("user") User user,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user = :user AND t.type = 'EXPENSE' AND t.category = :category AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumExpenseByUserAndCategoryAndDateRange(
            @Param("user") User user,
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT t.transactionDate, COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user = :user AND t.type = 'EXPENSE' AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.transactionDate ORDER BY t.transactionDate ASC")
    List<Object[]> findDailyExpensesByUserAndDateRange(
            @Param("user") User user,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT t.paymentMethod, COALESCE(SUM(t.amount), 0), COUNT(t) FROM Transaction t " +
           "WHERE t.user = :user AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.paymentMethod ORDER BY SUM(t.amount) DESC")
    List<Object[]> findPaymentMethodBreakdownByUserAndDateRange(
            @Param("user") User user,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT DISTINCT YEAR(t.transactionDate) FROM Transaction t WHERE t.user = :user ORDER BY YEAR(t.transactionDate) DESC")
    List<Integer> findDistinctYearsByUser(@Param("user") User user);
}
