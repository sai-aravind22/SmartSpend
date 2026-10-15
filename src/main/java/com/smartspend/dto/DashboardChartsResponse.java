package com.smartspend.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class DashboardChartsResponse {

    private List<String> monthlyLabels = new ArrayList<>();
    private List<BigDecimal> monthlyIncome = new ArrayList<>();
    private List<BigDecimal> monthlyExpense = new ArrayList<>();
    private List<String> categoryLabels = new ArrayList<>();
    private List<BigDecimal> categoryAmounts = new ArrayList<>();
    private List<Double> categoryPercentages = new ArrayList<>();

    public DashboardChartsResponse() {
    }

    public List<String> getMonthlyLabels() {
        return monthlyLabels;
    }

    public void setMonthlyLabels(List<String> monthlyLabels) {
        this.monthlyLabels = monthlyLabels;
    }

    public List<BigDecimal> getMonthlyIncome() {
        return monthlyIncome;
    }

    public void setMonthlyIncome(List<BigDecimal> monthlyIncome) {
        this.monthlyIncome = monthlyIncome;
    }

    public List<BigDecimal> getMonthlyExpense() {
        return monthlyExpense;
    }

    public void setMonthlyExpense(List<BigDecimal> monthlyExpense) {
        this.monthlyExpense = monthlyExpense;
    }

    public List<String> getCategoryLabels() {
        return categoryLabels;
    }

    public void setCategoryLabels(List<String> categoryLabels) {
        this.categoryLabels = categoryLabels;
    }

    public List<BigDecimal> getCategoryAmounts() {
        return categoryAmounts;
    }

    public void setCategoryAmounts(List<BigDecimal> categoryAmounts) {
        this.categoryAmounts = categoryAmounts;
    }

    public List<Double> getCategoryPercentages() {
        return categoryPercentages;
    }

    public void setCategoryPercentages(List<Double> categoryPercentages) {
        this.categoryPercentages = categoryPercentages;
    }
}
