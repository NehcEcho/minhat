package com.smarthelmet.backend.util;

import java.util.List;
import java.util.Map;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

public final class RequestParamUtils {

    private RequestParamUtils() {
    }

    public static MultiValueMap<String, String> clean(MultiValueMap<String, String> source) {
        LinkedMultiValueMap<String, String> target = new LinkedMultiValueMap<>();
        if (source == null) {
            return target;
        }
        for (Map.Entry<String, List<String>> entry : source.entrySet()) {
            for (String value : entry.getValue()) {
                if (value != null && !value.isBlank()) {
                    target.add(entry.getKey(), value.trim());
                }
            }
        }
        return target;
    }
}
