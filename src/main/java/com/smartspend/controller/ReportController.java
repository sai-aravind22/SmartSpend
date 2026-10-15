package com.smartspend.controller;

import com.smartspend.dto.*;
import com.smartspend.entity.TransactionType;
import com.smartspend.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<List<MonthlyReportDto>>> getMonthlyReport(
            @RequestParam(required = false) Integer year) {

        int targetYear = year != null ? year : LocalDate.now().getYear();
        List<MonthlyReportDto> reports = reportService.getMonthlyReport(targetYear);
        return ResponseEntity.ok(ApiResponse.ok("Monthly report retrieved", reports));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryExpenseDto>>> getCategoryExpenses(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        int targetYear = year != null ? year : LocalDate.now().getYear();

        List<CategoryExpenseDto> list = reportService.getCategoryExpenses(targetMonth, targetYear);
        return ResponseEntity.ok(ApiResponse.ok("Category expenses retrieved", list));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<DailyExpenseDto>>> getDailyExpenses(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        int targetYear = year != null ? year : LocalDate.now().getYear();

        List<DailyExpenseDto> list = reportService.getDailyExpenses(targetMonth, targetYear);
        return ResponseEntity.ok(ApiResponse.ok("Daily expenses retrieved", list));
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<ApiResponse<List<PaymentMethodDto>>> getPaymentMethods(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        int targetYear = year != null ? year : LocalDate.now().getYear();

        List<PaymentMethodDto> list = reportService.getPaymentMethodBreakdown(targetMonth, targetYear);
        return ResponseEntity.ok(ApiResponse.ok("Payment method breakdown retrieved", list));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportTransactionsCsv(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        byte[] csvData = reportService.generateCsvExport(
                search, type, category, paymentMethod, startDate, endDate, month, year
        );

        String filename = "smartspend-transactions.csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(csvData);
    }
}
