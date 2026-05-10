package com.smarthelmet.backend.model;

import java.util.List;

public record PageData<T>(
        int pageIndex,
        int pageSize,
        int pageCount,
        long total,
        List<T> items
) {
}
