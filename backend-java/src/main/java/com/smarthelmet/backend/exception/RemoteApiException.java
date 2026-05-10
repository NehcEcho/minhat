package com.smarthelmet.backend.exception;

public class RemoteApiException extends RuntimeException {

    public RemoteApiException(String message, Throwable cause) {
        super(message, cause);
    }

    public RemoteApiException(String message) {
        super(message);
    }
}
