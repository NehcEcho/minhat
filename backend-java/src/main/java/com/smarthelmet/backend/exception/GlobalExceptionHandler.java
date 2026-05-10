package com.smarthelmet.backend.exception;

import com.smarthelmet.backend.model.GatewayResponse;
import java.time.Instant;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<GatewayResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new GatewayResponse(false, HttpStatus.BAD_REQUEST.value(), message, null, Instant.now()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<GatewayResponse> handleReadableException(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new GatewayResponse(false, HttpStatus.BAD_REQUEST.value(), "JSON 请求体格式错误", null, Instant.now()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<GatewayResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new GatewayResponse(false, HttpStatus.BAD_REQUEST.value(), ex.getMessage(), null, Instant.now()));
    }

    @ExceptionHandler(RemoteApiException.class)
    public ResponseEntity<GatewayResponse> handleRemoteApiException(RemoteApiException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new GatewayResponse(false, HttpStatus.BAD_GATEWAY.value(), ex.getMessage(), null, Instant.now()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<GatewayResponse> handleException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new GatewayResponse(false, HttpStatus.INTERNAL_SERVER_ERROR.value(), ex.getMessage(), null, Instant.now()));
    }
}
