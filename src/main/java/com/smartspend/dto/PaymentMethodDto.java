package com.smartspend.dto;

import java.math.BigDecimal;

public class PaymentMethodDto {

    private String paymentMethod;
    private BigDecimal amount;
    private Long transactionCount;
    private Double percentage;

    public PaymentMethodDto() {
    }

    public PaymentMethodDto(String paymentMethod, BigDecimal amount, Long transactionCount, Double percentage) {
        this.paymentMethod = paymentMethod;
        this.amount = amount;
        this.transactionCount = transactionCount;
        this.percentage = percentage;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Long transactionCount) {
        this.transactionCount = transactionCount;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }
}
