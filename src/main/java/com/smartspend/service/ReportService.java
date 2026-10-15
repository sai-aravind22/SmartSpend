package com.smartspend.service;

import com.smartspend.dto.CategoryExpenseDto;
import com.smartspend.dto.DailyExpenseDto;
import com.smartspend.dto.MonthlyReportDto;
import com.smartspend.dto.PaymentMethodDto;
import com.smartspend.dto.TransactionResponse;
import com.smartspend.entity.TransactionType;
import com.smartspend.entity.User;
import com.smartspend.repository.TransactionRepository;
import com.smartspend.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    public ReportService(TransactionRepository transactionRepository, TransactionService transactionService) {
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
    }

    public List<MonthlyReportDto> getMonthlyReport(Integer year) {
        User currentUser = SecurityUtils.getCurrentUser();
        List<MonthlyReportDto> reports = new ArrayList<>();
        DateTimeFormatter monthNameFmt = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int m = 1; m <= 12; m++) {
            YearMonth ym = YearMonth.of(year, m);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.atEndOfMonth();

            BigDecimal income = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.INCOME, start, end);
            BigDecimal expenses = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.EXPENSE, start, end);
            if (income == null) income = BigDecimal.ZERO;
            if (expenses == null) expenses = BigDecimal.ZERO;

            BigDecimal savings = income.subtract(expenses);
            double savingsRate = 0.0;
            if (income.compareTo(BigDecimal.ZERO) > 0) {
                savingsRate = savings.multiply(BigDecimal.valueOf(100))
                        .divide(income, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }

            long count = transactionRepository.countByUserAndDateRange(currentUser, start, end);

            reports.add(new MonthlyReportDto(
                    ym.format(monthNameFmt),
                    m,
                    year,
                    income.setScale(2, RoundingMode.HALF_UP),
                    expenses.setScale(2, RoundingMode.HALF_UP),
                    savings.setScale(2, RoundingMode.HALF_UP),
                    savingsRate,
                    count
            ));
        }

        return reports;
    }

    public List<CategoryExpenseDto> getCategoryExpenses(Integer month, Integer year) {
        User currentUser = SecurityUtils.getCurrentUser();
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        BigDecimal totalExpenses = transactionRepository.sumAmountByUserAndTypeAndDateRange(currentUser, TransactionType.EXPENSE, start, end);
        if (totalExpenses == null) totalExpenses = BigDecimal.ZERO;

        List<Object[]> rawData = transactionRepository.findCategoryExpensesByUserAndDateRange(currentUser, start, end);
        List<CategoryExpenseDto> result = new ArrayList<>();

        for (Object[] row : rawData) {
            String category = (String) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            Long count = (Long) row[2];

            double percentage = 0.0;
            if (totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
                percentage = amount.multiply(BigDecimal.valueOf(100))
                        .divide(totalExpenses, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }

            result.add(new CategoryExpenseDto(category, amount.setScale(2, RoundingMode.HALF_UP), percentage, count));
        }

        return result;
    }

    public List<DailyExpenseDto> getDailyExpenses(Integer month, Integer year) {
        User currentUser = SecurityUtils.getCurrentUser();
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Object[]> rawData = transactionRepository.findDailyExpensesByUserAndDateRange(currentUser, start, end);
        List<DailyExpenseDto> result = new ArrayList<>();

        for (Object[] row : rawData) {
            LocalDate date = (LocalDate) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            result.add(new DailyExpenseDto(date.toString(), amount.setScale(2, RoundingMode.HALF_UP)));
        }

        return result;
    }

    public List<PaymentMethodDto> getPaymentMethodBreakdown(Integer month, Integer year) {
        User currentUser = SecurityUtils.getCurrentUser();
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<Object[]> rawData = transactionRepository.findPaymentMethodBreakdownByUserAndDateRange(currentUser, start, end);

        for (Object[] row : rawData) {
            BigDecimal amt = (BigDecimal) row[1];
            totalAmount = totalAmount.add(amt);
        }

        List<PaymentMethodDto> result = new ArrayList<>();
        for (Object[] row : rawData) {
            String method = (String) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            Long count = (Long) row[2];

            double percentage = 0.0;
            if (totalAmount.compareTo(BigDecimal.ZERO) > 0) {
                percentage = amount.multiply(BigDecimal.valueOf(100))
                        .divide(totalAmount, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }

            result.add(new PaymentMethodDto(method, amount.setScale(2, RoundingMode.HALF_UP), count, percentage));
        }

        return result;
    }

    public byte[] generateCsvExport(
            String search,
            TransactionType type,
            String category,
            String paymentMethod,
            LocalDate startDate,
            LocalDate endDate,
            Integer month,
            Integer year) {

        Page<TransactionResponse> page = transactionService.getTransactions(
                search, type, category, paymentMethod, startDate, endDate, month, year,
                0, 50000, "transactionDate", "DESC"
        );

        StringBuilder sb = new StringBuilder();
        sb.append("Transaction ID,Date,Title,Type,Category,Amount,Payment Method,Description,Created At\n");

        for (TransactionResponse tx : page.getContent()) {
            sb.append(escapeCsvField(String.valueOf(tx.getId()))).append(",");
            sb.append(escapeCsvField(tx.getTransactionDate().toString())).append(",");
            sb.append(escapeCsvField(tx.getTitle())).append(",");
            sb.append(escapeCsvField(tx.getType().name())).append(",");
            sb.append(escapeCsvField(tx.getCategory())).append(",");
            sb.append(tx.getAmount().setScale(2, RoundingMode.HALF_UP).toPlainString()).append(",");
            sb.append(escapeCsvField(tx.getPaymentMethod())).append(",");
            sb.append(escapeCsvField(tx.getDescription() != null ? tx.getDescription() : "")).append(",");
            sb.append(escapeCsvField(tx.getCreatedAt() != null ? tx.getCreatedAt().toString() : "")).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsvField(String data) {
        if (data == null) {
            return "";
        }
        String escaped = data.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains("\r")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}
