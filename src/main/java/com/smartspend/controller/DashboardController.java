package com.smartspend.controller;

import com.smartspend.dto.ApiResponse;
import com.smartspend.dto.DashboardChartsResponse;
import com.smartspend.dto.DashboardSummaryResponse;
import com.smartspend.dto.FinancialInsightDto;
import com.smartspend.service.DashboardService;
import com.smartspend.service.InsightService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;
    private final InsightService insightService;

    public DashboardController(DashboardService dashboardService, InsightService insightService) {
        this.dashboardService = dashboardService;
        this.insightService = insightService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        int targetYear = year != null ? year : LocalDate.now().getYear();

        DashboardSummaryResponse summary = dashboardService.getSummary(targetMonth, targetYear);
        return ResponseEntity.ok(ApiResponse.ok("Dashboard summary retrieved", summary));
    }

    @GetMapping("/charts")
    public ResponseEntity<ApiResponse<DashboardChartsResponse>> getCharts(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        int targetYear = year != null ? year : LocalDate.now().getYear();

        DashboardChartsResponse charts = dashboardService.getCharts(targetMonth, targetYear);
        return ResponseEntity.ok(ApiResponse.ok("Dashboard charts retrieved", charts));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<List<FinancialInsightDto>>> getInsights(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        int targetYear = year != null ? year : LocalDate.now().getYear();

        List<FinancialInsightDto> insights = insightService.generateInsights(targetMonth, targetYear);
        return ResponseEntity.ok(ApiResponse.ok("Financial insights generated", insights));
    }
}
