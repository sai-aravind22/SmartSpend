package com.smartspend.dto;

import java.math.BigDecimal;

public class MonthlyReportDto {

    private String monthYear;
    private Integer month;
    private Integer year;
    private BigDecimal income;
    private BigDecimal expenses;
    private BigDecimal savings;
    private Double savingsRate;
    private Long transactionCount;

    public MonthlyReportDto() {
    }

    public MonthlyReportDto(String monthYear, Integer month, Integer year, BigDecimal income,
                            BigDecimal expenses, BigDecimal savings, Double savingsRate, Long transactionCount) {
        this.monthYear = monthYear;
        this.month = month;
        this.year = year;
        this.income = income;
        this.expenses = expenses;
        this.savings = savings;
        this.savingsRate = savingsRate;
        this.transactionCount = transactionCount;
    }

    public String getMonthYear() {
        return monthYear;
    }

    public void setMonthYear(String monthYear) {
        this.monthYear = monthYear;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public BigDecimal getIncome() {
        return income;
    }

    public void setIncome(BigDecimal income) {
        this.income = income;
    }

    public BigDecimal getExpenses() {
        return expenses;
    }

    public void setExpenses(BigDecimal expenses) {
        this.expenses = expenses;
    }

    public BigDecimal getSavings() {
        return savings;
    }

    public void setSavings(BigDecimal savings) {
        this.savings = savings;
    }

    public Double getSavingsRate() {
        return savingsRate;
    }

    public void setSavingsRate(Double savingsRate) {
        this.savingsRate = savingsRate;
    }

    public Long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Long transactionCount) {
        this.transactionCount = transactionCount;
    }
}
