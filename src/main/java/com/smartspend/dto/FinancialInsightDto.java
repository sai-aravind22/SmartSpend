package com.smartspend.dto;

public class FinancialInsightDto {

    private String type; // SUCCESS, INFO, WARNING, DANGER
    private String icon;
    private String title;
    private String message;

    public FinancialInsightDto() {
    }

    public FinancialInsightDto(String type, String icon, String title, String message) {
        this.type = type;
        this.icon = icon;
        this.title = title;
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
