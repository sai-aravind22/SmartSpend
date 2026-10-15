package com.smartspend.service;

import com.smartspend.dto.TransactionRequest;
import com.smartspend.dto.TransactionResponse;
import com.smartspend.entity.Transaction;
import com.smartspend.entity.TransactionType;
import com.smartspend.entity.User;
import com.smartspend.exception.ResourceNotFoundException;
import com.smartspend.repository.TransactionRepository;
import com.smartspend.security.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public TransactionResponse createTransaction(TransactionRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        Transaction transaction = new Transaction(
                currentUser,
                request.getTitle().trim(),
                request.getAmount(),
                request.getType(),
                request.getCategory().trim(),
                request.getTransactionDate(),
                request.getPaymentMethod().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null
        );
        Transaction saved = transactionRepository.save(transaction);
        return TransactionResponse.fromEntity(saved);
    }

    public TransactionResponse updateTransaction(Long id, TransactionRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        Transaction transaction = transactionRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));

        transaction.setTitle(request.getTitle().trim());
        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setCategory(request.getCategory().trim());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setPaymentMethod(request.getPaymentMethod().trim());
        transaction.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        Transaction updated = transactionRepository.save(transaction);
        return TransactionResponse.fromEntity(updated);
    }

    public void deleteTransaction(Long id) {
        User currentUser = SecurityUtils.getCurrentUser();

        Transaction transaction = transactionRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));

        transactionRepository.delete(transaction);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long id) {
        User currentUser = SecurityUtils.getCurrentUser();

        Transaction transaction = transactionRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));
        return TransactionResponse.fromEntity(transaction);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactions(
            String search,
            TransactionType type,
            String category,
            String paymentMethod,
            LocalDate startDate,
            LocalDate endDate,
            Integer month,
            Integer year,
            int page,
            int size,
            String sortBy,
            String sortDirection) {

        User currentUser = SecurityUtils.getCurrentUser();

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Scoped to current authenticated user
            predicates.add(cb.equal(root.get("user"), currentUser));

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titlePredicate = cb.like(cb.lower(root.get("title")), searchPattern);
                Predicate descPredicate = cb.like(cb.lower(root.get("description")), searchPattern);
                predicates.add(cb.or(titlePredicate, descPredicate));
            }

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(root.get("category"), category.trim()));
            }

            if (paymentMethod != null && !paymentMethod.trim().isEmpty() && !paymentMethod.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(root.get("paymentMethod"), paymentMethod.trim()));
            }

            if (month != null && year != null) {
                YearMonth ym = YearMonth.of(year, month);
                LocalDate start = ym.atDay(1);
                LocalDate end = ym.atEndOfMonth();
                predicates.add(cb.between(root.get("transactionDate"), start, end));
            } else if (year != null) {
                LocalDate start = LocalDate.of(year, 1, 1);
                LocalDate end = LocalDate.of(year, 12, 31);
                predicates.add(cb.between(root.get("transactionDate"), start, end));
            } else {
                if (startDate != null && endDate != null) {
                    predicates.add(cb.between(root.get("transactionDate"), startDate, endDate));
                } else if (startDate != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
                } else if (endDate != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), endDate));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortProperty = "amount".equalsIgnoreCase(sortBy) ? "amount" :
                              "title".equalsIgnoreCase(sortBy) ? "title" : "transactionDate";

        Sort sort = Sort.by(direction, sortProperty).and(Sort.by(Sort.Direction.DESC, "id"));
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);

        return transactionRepository.findAll(spec, pageable).map(TransactionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getRecentTransactions() {
        User currentUser = SecurityUtils.getCurrentUser();
        return transactionRepository.findTop10ByUserOrderByTransactionDateDescIdDesc(currentUser)
                .stream()
                .map(TransactionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Integer> getAvailableYears() {
        User currentUser = SecurityUtils.getCurrentUser();
        List<Integer> years = transactionRepository.findDistinctYearsByUser(currentUser);
        int currentYear = LocalDate.now().getYear();
        if (!years.contains(currentYear)) {
            years.add(0, currentYear);
        }
        return years;
    }
}
