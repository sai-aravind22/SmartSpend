package com.smartspend.service;

import com.smartspend.entity.Budget;
import com.smartspend.entity.Transaction;
import com.smartspend.entity.TransactionType;
import com.smartspend.entity.User;
import com.smartspend.repository.BudgetRepository;
import com.smartspend.repository.TransactionRepository;
import com.smartspend.repository.UserRepository;
import com.smartspend.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class DataSeedService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeedService.class);

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeedService(UserRepository userRepository,
                           TransactionRepository transactionRepository,
                           BudgetRepository budgetRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Ensure default demo user exists
        User demoUser = userRepository.findByEmail("demo@smartspend.com").orElse(null);
        if (demoUser == null) {
            log.info("Creating default demo user: demo@smartspend.com / password123");
            demoUser = new User("Alex Morgan", "demo@smartspend.com", passwordEncoder.encode("password123"));
            demoUser = userRepository.save(demoUser);
        } else {
            // Update password to ensure valid BCrypt
            demoUser.setPassword(passwordEncoder.encode("password123"));
            demoUser = userRepository.save(demoUser);
        }

        if (transactionRepository.count() == 0) {
            log.info("Seeding initial transactions and budgets for demo user...");
            seedDataForUser(demoUser);
            log.info("Initial demo data seeded successfully.");
        }
    }

    @Transactional
    public void seedDataForUser(User user) {
        int currentYear = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();

        // Income for current month
        transactionRepository.saveAll(List.of(
                new Transaction(user, "Monthly Software Engineer Salary", new BigDecimal("85000.00"), TransactionType.INCOME, "Salary", LocalDate.of(currentYear, currentMonth, 1), "Bank Transfer", "Direct payroll deposit"),
                new Transaction(user, "Web Design Freelance Project", new BigDecimal("22000.00"), TransactionType.INCOME, "Freelancing", LocalDate.of(currentYear, currentMonth, 5), "UPI", "Milestone payment for landing page"),
                new Transaction(user, "Mutual Fund Dividend Payout", new BigDecimal("4500.00"), TransactionType.INCOME, "Investment Returns", LocalDate.of(currentYear, currentMonth, 10), "Bank Transfer", "Index fund dividend")
        ));

        // Expenses for current month
        transactionRepository.saveAll(List.of(
                new Transaction(user, "Supermarket Monthly Grocery", new BigDecimal("4520.00"), TransactionType.EXPENSE, "Food", LocalDate.of(currentYear, currentMonth, 2), "Credit Card", "Vegetables and provisions"),
                new Transaction(user, "Electricity Bill Payment", new BigDecimal("2650.00"), TransactionType.EXPENSE, "Bills and Utilities", LocalDate.of(currentYear, currentMonth, 3), "UPI", "Online electricity bill"),
                new Transaction(user, "Fiber Internet Subscription", new BigDecimal("1180.00"), TransactionType.EXPENSE, "Bills and Utilities", LocalDate.of(currentYear, currentMonth, 4), "UPI", "300 Mbps unlimited fiber"),
                new Transaction(user, "Metro Rail Monthly Pass", new BigDecimal("1500.00"), TransactionType.EXPENSE, "Transportation", LocalDate.of(currentYear, currentMonth, 5), "Debit Card", "Metro commute recharge"),
                new Transaction(user, "Weekend Dining at Bistro", new BigDecimal("2150.00"), TransactionType.EXPENSE, "Food", LocalDate.of(currentYear, currentMonth, 6), "Credit Card", "Dinner with pizza"),
                new Transaction(user, "Vehicle Fuel Refill", new BigDecimal("2800.00"), TransactionType.EXPENSE, "Transportation", LocalDate.of(currentYear, currentMonth, 7), "UPI", "Full tank petrol"),
                new Transaction(user, "Casual Footwear & Sneakers", new BigDecimal("3499.00"), TransactionType.EXPENSE, "Shopping", LocalDate.of(currentYear, currentMonth, 8), "Credit Card", "Festival sale purchase"),
                new Transaction(user, "Cotton Formal Shirts", new BigDecimal("2199.00"), TransactionType.EXPENSE, "Shopping", LocalDate.of(currentYear, currentMonth, 9), "Debit Card", "Office apparel"),
                new Transaction(user, "Dental Consultation & Cleaning", new BigDecimal("1200.00"), TransactionType.EXPENSE, "Health", LocalDate.of(currentYear, currentMonth, 10), "UPI", "Dental checkup"),
                new Transaction(user, "Cloud Architecture Course", new BigDecimal("3500.00"), TransactionType.EXPENSE, "Education", LocalDate.of(currentYear, currentMonth, 11), "Net Banking", "Cloud certification course"),
                new Transaction(user, "Streaming & Music Subscriptions", new BigDecimal("899.00"), TransactionType.EXPENSE, "Entertainment", LocalDate.of(currentYear, currentMonth, 12), "Credit Card", "Netflix & Spotify"),
                new Transaction(user, "Coffee & Cafe Snacks", new BigDecimal("450.00"), TransactionType.EXPENSE, "Food", LocalDate.of(currentYear, currentMonth, 13), "UPI", "Espresso and muffin"),
                new Transaction(user, "Pharmacy Vitamins & Supplements", new BigDecimal("850.00"), TransactionType.EXPENSE, "Health", LocalDate.of(currentYear, currentMonth, 14), "Cash", "Multivitamins"),
                new Transaction(user, "Mobile Prepaid Annual Recharge", new BigDecimal("719.00"), TransactionType.EXPENSE, "Bills and Utilities", LocalDate.of(currentYear, currentMonth, 14), "UPI", "Prepaid plan recharge"),
                new Transaction(user, "Weekend Cinema & Popcorn", new BigDecimal("700.00"), TransactionType.EXPENSE, "Entertainment", LocalDate.of(currentYear, currentMonth, 15), "UPI", "Movie tickets"),
                new Transaction(user, "Artisan Bakery Bread & Pastries", new BigDecimal("950.00"), TransactionType.EXPENSE, "Food", LocalDate.of(currentYear, currentMonth, 15), "Debit Card", "Sourdough bread")
        ));

        // Previous month transactions
        int prevMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        int prevYear = currentMonth == 1 ? currentYear - 1 : currentYear;

        transactionRepository.saveAll(List.of(
                new Transaction(user, "Monthly Software Engineer Salary", new BigDecimal("85000.00"), TransactionType.INCOME, "Salary", LocalDate.of(prevYear, prevMonth, 1), "Bank Transfer", "Previous month salary"),
                new Transaction(user, "UI Consulting Project", new BigDecimal("15000.00"), TransactionType.INCOME, "Freelancing", LocalDate.of(prevYear, prevMonth, 15), "UPI", "Consulting fee"),
                new Transaction(user, "Monthly Groceries", new BigDecimal("5100.00"), TransactionType.EXPENSE, "Food", LocalDate.of(prevYear, prevMonth, 3), "Credit Card", "Provisions"),
                new Transaction(user, "Electricity & Water Bill", new BigDecimal("2900.00"), TransactionType.EXPENSE, "Bills and Utilities", LocalDate.of(prevYear, prevMonth, 5), "UPI", "Utility bills"),
                new Transaction(user, "Vehicle Fuel Refill", new BigDecimal("3200.00"), TransactionType.EXPENSE, "Transportation", LocalDate.of(prevYear, prevMonth, 8), "UPI", "Petrol refill"),
                new Transaction(user, "Autumn Clothing Sale", new BigDecimal("4800.00"), TransactionType.EXPENSE, "Shopping", LocalDate.of(prevYear, prevMonth, 12), "Credit Card", "Clothing purchase"),
                new Transaction(user, "Dining & Takeaways", new BigDecimal("3400.00"), TransactionType.EXPENSE, "Food", LocalDate.of(prevYear, prevMonth, 18), "Debit Card", "Restaurant meals")
        ));

        // Budgets for current month
        budgetRepository.saveAll(List.of(
                new Budget(user, "Food", new BigDecimal("10000.00"), currentMonth, currentYear),
                new Budget(user, "Transportation", new BigDecimal("6000.00"), currentMonth, currentYear),
                new Budget(user, "Shopping", new BigDecimal("5000.00"), currentMonth, currentYear),
                new Budget(user, "Bills and Utilities", new BigDecimal("5000.00"), currentMonth, currentYear),
                new Budget(user, "Entertainment", new BigDecimal("2500.00"), currentMonth, currentYear),
                new Budget(user, "Health", new BigDecimal("3000.00"), currentMonth, currentYear),
                new Budget(user, "Education", new BigDecimal("5000.00"), currentMonth, currentYear)
        ));
    }

    @Transactional
    public void resetData() {
        User currentUser = SecurityUtils.getCurrentUser();
        // Clear current user's records
        List<Budget> userBudgets = budgetRepository.findByUserAndBudgetMonthAndBudgetYearOrderByCategoryAsc(currentUser, LocalDate.now().getMonthValue(), LocalDate.now().getYear());
        budgetRepository.deleteAll(userBudgets);
        seedDataForUser(currentUser);
    }
}
