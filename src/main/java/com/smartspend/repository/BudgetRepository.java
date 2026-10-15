package com.smartspend.repository;

import com.smartspend.entity.Budget;
import com.smartspend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserAndBudgetMonthAndBudgetYearOrderByCategoryAsc(User user, Integer budgetMonth, Integer budgetYear);

    Optional<Budget> findByUserAndCategoryAndBudgetMonthAndBudgetYear(User user, String category, Integer budgetMonth, Integer budgetYear);

    boolean existsByUserAndCategoryAndBudgetMonthAndBudgetYear(User user, String category, Integer budgetMonth, Integer budgetYear);

    boolean existsByUserAndCategoryAndBudgetMonthAndBudgetYearAndIdNot(User user, String category, Integer budgetMonth, Integer budgetYear, Long id);
}
