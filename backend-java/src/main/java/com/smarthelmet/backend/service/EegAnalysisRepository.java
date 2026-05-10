package com.smarthelmet.backend.service;

import com.smarthelmet.backend.model.AnalysisModelType;
import com.smarthelmet.backend.model.AnalysisResultLevel;
import com.smarthelmet.backend.model.EegAnalysisQuery;
import com.smarthelmet.backend.model.EegAnalysisRecord;
import com.smarthelmet.backend.model.PageData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class EegAnalysisRepository {

    private static final RowMapper<EegAnalysisRecord> ROW_MAPPER = EegAnalysisRepository::mapRow;

    private final JdbcTemplate jdbcTemplate;

    public EegAnalysisRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public EegAnalysisRecord insert(EegAnalysisRecord record) {
        String now = OffsetDateTime.now().toString();
        jdbcTemplate.update(
                """
                INSERT INTO eeg_analysis_records (
                    result_id, employee, model, result, confidence, trend,
                    device_id, data_file_path, sampling_rate, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                record.resultId(),
                record.employee(),
                record.model().name(),
                record.result().name(),
                record.confidence(),
                record.trend(),
                record.deviceId(),
                record.dataFilePath(),
                record.samplingRate(),
                now,
                now
        );
        Long id = jdbcTemplate.queryForObject("SELECT id FROM eeg_analysis_records WHERE result_id = ?", Long.class, record.resultId());
        return new EegAnalysisRecord(
                id,
                record.resultId(),
                record.employee(),
                record.model(),
                record.result(),
                record.confidence(),
                record.trend(),
                record.deviceId(),
                record.dataFilePath(),
                record.samplingRate(),
                now,
                now
        );
    }

    public PageData<EegAnalysisRecord> findPage(EegAnalysisQuery query) {
        List<Object> args = new ArrayList<>();
        String whereClause = buildWhereClause(query, args);

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM eeg_analysis_records" + whereClause,
                Long.class,
                args.toArray()
        );

        int safePageSize = Math.max(1, query.pageSize());
        long totalCount = total == null ? 0 : total;
        int pageCount = Math.max(1, (int) Math.ceil(totalCount / (double) safePageSize));
        int safePageIndex = Math.max(1, Math.min(query.pageIndex(), pageCount));
        int offset = (safePageIndex - 1) * safePageSize;

        List<Object> listArgs = new ArrayList<>(args);
        listArgs.add(safePageSize);
        listArgs.add(offset);

        List<EegAnalysisRecord> items = jdbcTemplate.query(
                """
                SELECT id, result_id, employee, model, result, confidence, trend,
                       device_id, data_file_path, sampling_rate, created_at, updated_at
                FROM eeg_analysis_records
                """ + whereClause + " ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?",
                ROW_MAPPER,
                listArgs.toArray()
        );

        return new PageData<>(safePageIndex, safePageSize, pageCount, totalCount, items);
    }

    private String buildWhereClause(EegAnalysisQuery query, List<Object> args) {
        List<String> clauses = new ArrayList<>();
        String keyword = query.keyword() == null ? "" : query.keyword().trim();
        if (!keyword.isEmpty()) {
            clauses.add("(result_id LIKE ? OR employee LIKE ? OR trend LIKE ? OR device_id LIKE ?)");
            String fuzzy = "%" + keyword + "%";
            args.add(fuzzy);
            args.add(fuzzy);
            args.add(fuzzy);
            args.add(fuzzy);
        }
        String model = query.model() == null ? "" : query.model().trim();
        if (!model.isEmpty()) {
            clauses.add("model = ?");
            args.add(model);
        }
        String result = query.result() == null ? "" : query.result().trim();
        if (!result.isEmpty()) {
            clauses.add("result = ?");
            args.add(result);
        }
        return clauses.isEmpty() ? "" : " WHERE " + String.join(" AND ", clauses);
    }

    private static EegAnalysisRecord mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new EegAnalysisRecord(
                rs.getLong("id"),
                rs.getString("result_id"),
                rs.getString("employee"),
                AnalysisModelType.valueOf(rs.getString("model")),
                AnalysisResultLevel.valueOf(rs.getString("result")),
                rs.getInt("confidence"),
                rs.getString("trend"),
                rs.getString("device_id"),
                rs.getString("data_file_path"),
                rs.getDouble("sampling_rate"),
                rs.getString("created_at"),
                rs.getString("updated_at")
        );
    }
}
