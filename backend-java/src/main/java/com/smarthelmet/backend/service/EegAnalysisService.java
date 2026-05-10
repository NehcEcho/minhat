package com.smarthelmet.backend.service;

import com.smarthelmet.backend.model.AnalysisModelType;
import com.smarthelmet.backend.model.AnalysisResultLevel;
import com.smarthelmet.backend.model.EegAnalysisQuery;
import com.smarthelmet.backend.model.EegAnalysisRecord;
import com.smarthelmet.backend.model.EegAnalysisTaskRequest;
import com.smarthelmet.backend.model.PageData;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class EegAnalysisService {

    private static final List<AnalysisModelType> MODELS = List.of(
            AnalysisModelType.疲劳识别,
            AnalysisModelType.姿态识别,
            AnalysisModelType.生命体征模型,
            AnalysisModelType.佩戴识别
    );

    private static final List<String> TRENDS = List.of(
            "近 30 分钟上升",
            "连续异常 3 次",
            "波动平稳",
            "需人工复核",
            "夜班后持续走高",
            "无显著异常",
            "区间偏离"
    );

    private final EegAnalysisRepository repository;

    public EegAnalysisService(EegAnalysisRepository repository) {
        this.repository = repository;
    }

    public EegAnalysisRecord createTask(EegAnalysisTaskRequest request) {
        AnalysisModelType model = pickModel(request);
        AnalysisResultLevel result = pickResult(request, model);
        int confidence = pickConfidence(request, result);
        String trend = pickTrend(request, result);
        return repository.insert(new EegAnalysisRecord(
                null,
                buildResultId(),
                request.employeeId(),
                model,
                result,
                confidence,
                trend,
                request.deviceId(),
                request.dataFilePath(),
                request.samplingRate(),
                OffsetDateTime.now().toString(),
                OffsetDateTime.now().toString()
        ));
    }

    public PageData<EegAnalysisRecord> getRecords(EegAnalysisQuery query) {
        return repository.findPage(query);
    }

    private String buildResultId() {
        return "AN-" + Math.abs(UUID.randomUUID().hashCode() % 900000 + 100000);
    }

    private AnalysisModelType pickModel(EegAnalysisTaskRequest request) {
        int index = Math.abs((request.employeeId() + request.deviceId()).hashCode()) % MODELS.size();
        return MODELS.get(index);
    }

    private AnalysisResultLevel pickResult(EegAnalysisTaskRequest request, AnalysisModelType model) {
        double score = request.samplingRate() + Math.abs((request.deviceId() + model.name()).hashCode() % 100);
        if (score >= 140) {
            return AnalysisResultLevel.高风险;
        }
        if (score >= 90) {
            return AnalysisResultLevel.关注;
        }
        return AnalysisResultLevel.正常;
    }

    private int pickConfidence(EegAnalysisTaskRequest request, AnalysisResultLevel result) {
        int base = switch (result) {
            case 高风险 -> 92;
            case 关注 -> 85;
            case 正常 -> 80;
        };
        return Math.min(99, base + Math.abs(request.employeeId().hashCode() % 6));
    }

    private String pickTrend(EegAnalysisTaskRequest request, AnalysisResultLevel result) {
        if (result == AnalysisResultLevel.高风险) {
            return "连续异常 3 次";
        }
        if (result == AnalysisResultLevel.关注) {
            return TRENDS.get(Math.abs(request.dataFilePath().hashCode()) % TRENDS.size());
        }
        return "无显著异常";
    }
}
