package com.smartspend.dto;

import java.math.BigDecimal;

public class CategoryExpenseDto {

    private String category;
    private BigDecimal amount;
    private Double percentage;
    private Long transactionCount;

    public CategoryExpenseDto() {
    }

    public CategoryExpenseDto(String category, BigDecimal amount, Double percentage, Long transactionCount) {
        this.category = category;
        this.amount = amount;
        this.percentage = percentage;
        this.transactionCount = transactionCount;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }

    public Long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Long transactionCount) {
        this.transactionCount = transactionCount;
    }
}
