package com.smarthelmet.backend.model;

public record ApiResponse<T>(String code, String message, T data) {
}
