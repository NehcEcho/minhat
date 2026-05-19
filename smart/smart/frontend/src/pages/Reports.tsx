import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, Select,
  Tag, Upload, message, Popconfirm, Empty, Typography, Image, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  CameraOutlined, EnvironmentOutlined,
  AimOutlined, UndoOutlined, SaveOutlined, ReloadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';

const { Text, Title } = Typography;
const { TextArea } = Input;

const CSS = `
.reports-root { padding: 0; }
.rpt-card { border-radius: 8px; }
.rpt-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
.rpt-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
.rpt-annotate-wrap { position: relative; display: inline-block; overflow: hidden; border-radius: 8px; border: 1px solid #E5E6EB; }
.rpt-annotate-canvas { position: absolute; top: 0; left: 0; cursor: crosshair; }
.rpt-image-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.rpt-image-item { width: 180px; position: relative; border-radius: 6px; overflow: hidden; border: 1px solid #F0F0F0; cursor: pointer; }
.rpt-image-item:hover { border-color: #1890FF; }
.rpt-image-item img { width: 100%; height: 120px; object-fit: cover; display: block; }
.rpt-image-item .rpt-img-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: #fff; font-size: 11px; padding: 2px 6px; display: flex; align-items: center; gap: 4px; }
`;

type Annotation = { type: 'rect' | 'text'; x: number; y: number; w?: number; h?: number; label: string; color: string };
type Report = { id: number; title: string; description: string; location: string; worker_name: string; status: string; image_count: number; created_at: string };
type ReportDetail = Report & { images: { id: number; filename: string; annotations: Annotation[]; sort_order: number; url: string }[] };

const STATUS_COLORS: Record<string, string> = { pending: 'blue', in_progress: 'orange', resolved: 'green', closed: 'default' };
const STATUS_LABELS: Record<string, string> = { pending: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭' };
const ANNOT_COLORS = ['#ff4d4f', '#1890FF', '#52c41a', '#faad14', '#722ed1'];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [form] = Form.useForm();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [annotateImg, setAnnotateImg] = useState<{ id: number; url: string } | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawColor, setDrawColor] = useState(ANNOT_COLORS[0]);
  const [drawMode, setDrawMode] = useState<'rect' | 'text'>('rect');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const imgLoadRef = useRef(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/reports').then(res => res.json());
      setReports(r.data || []);
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  };

  const loadDetail = async (id: number) => {
    try {
      const r = await fetch(`/api/reports/${id}`).then(res => res.json());
      setDetail(r.data);
    } catch { setDetail(null); }
  };

  useEffect(() => { loadReports(); }, []);

  const columns = [
    { title: '标题', dataIndex: 'title', width: 200, render: (v: string, r: Report) => <a onClick={() => { loadDetail(r.id); }}>{v}</a> },
    { title: '位置', dataIndex: 'location', width: 120, render: (v: string) => v || '-' },
    { title: '人员', dataIndex: 'worker_name', width: 80, render: (v: string) => v || '-' },
    { title: '图片', dataIndex: 'image_count', width: 60 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v}</Tag> },
    { title: '时间', dataIndex: 'created_at', width: 160, render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
    {
      title: '操作', width: 140,
      render: (_: unknown, r: Report) => (
        <Space size={0}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r.id)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => deleteReport(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const openCreate = () => {
    setEditingId(null);
    setDetail(null);
    form.resetFields();
    setUploadFiles([]);
    setAnnotateImg(null);
    setAnnotations([]);
    setModalOpen(true);
  };

  const openEdit = async (id: number) => {
    setEditingId(id);
    setUploadFiles([]);
    setAnnotateImg(null);
    setAnnotations([]);
    try {
      const r = await fetch(`/api/reports/${id}`).then(res => res.json());
      const d = r.data;
      form.setFieldsValue({ title: d.title, description: d.description, location: d.location, worker_name: d.worker_name, status: d.status });
      setDetail(d);
      setModalOpen(true);
      imgLoadRef.current = false;
    } catch { message.error('加载失败'); }
  };

  const deleteReport = async (id: number) => {
    try {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      message.success('已删除');
      loadReports();
    } catch { message.error('删除失败'); }
  };

  const handleSave = async () => {
    const vals = form.getFieldsValue();
    const formData = new FormData();
    formData.append('title', vals.title || '');
    formData.append('description', vals.description || '');
    formData.append('location', vals.location || '');
    formData.append('worker_name', vals.worker_name || '');
    if (vals.status) formData.append('status', vals.status);

    try {
      let reportId = editingId;

      if (reportId) {
        await fetch(`/api/reports/${reportId}`, { method: 'PUT', body: formData });
      } else {
        const r = await fetch('/api/reports', { method: 'POST', body: formData }).then(res => res.json());
        reportId = r.data.id;
        formData.append('report_id', String(reportId));
      }

      // Upload new images
      for (const f of uploadFiles) {
        if (f.originFileObj) {
          const fd = new FormData();
          fd.append('file', f.originFileObj);
          await fetch(`/api/reports/${reportId}/images`, { method: 'POST', body: fd });
        }
      }

      message.success('已保存');
      setModalOpen(false);
      loadReports();
    } catch { message.error('保存失败'); }
  };

  // ------------- Annotation Canvas -------------

  const openAnnotator = async (img: { id: number; url: string }) => {
    setAnnotateImg(img);
    setAnnotations([]);
    imgLoadRef.current = false;
    // Load existing annotations
    if (detail) {
      const match = detail.images.find(i => i.id === img.id);
      if (match?.annotations) setAnnotations(match.annotations);
    }
  };

  const saveAnnotations = async () => {
    if (!annotateImg) return;
    try {
      await fetch(`/api/reports/images/${annotateImg.id}/annotations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations }),
      });
      message.success('标注已保存');
      setAnnotateImg(null);
      if (editingId) openEdit(editingId);
    } catch { message.error('保存失败'); }
  };

  const deleteImage = async (imgId: number) => {
    try {
      await fetch(`/api/reports/images/${imgId}`, { method: 'DELETE' });
      message.success('已删除');
      if (editingId) openEdit(editingId);
    } catch { message.error('删除失败'); }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scaleX = canvas.width / img.clientWidth;
    const scaleY = canvas.height / img.clientHeight;

    for (const a of annotations) {
      ctx.strokeStyle = a.color || ANNOT_COLORS[0];
      ctx.lineWidth = 3;
      ctx.font = 'bold 14px "PingFang SC", sans-serif';
      ctx.setLineDash([]);

      if (a.type === 'rect' && a.w && a.h) {
        ctx.strokeRect(a.x * scaleX, a.y * scaleY, a.w * scaleX, a.h * scaleY);
        ctx.fillStyle = a.color + '30';
        ctx.fillRect(a.x * scaleX, a.y * scaleY, a.w * scaleX, a.h * scaleY);
      }
      if (a.label) {
        ctx.fillStyle = a.color || ANNOT_COLORS[0];
        ctx.fillText(a.label, a.x * scaleX + 4, a.y * scaleY + 18);
      }
    }
  }, [annotations]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing(true);
    setDrawStart({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !drawStart) return;
    redrawCanvas();
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = x - drawStart.x;
    const h = y - drawStart.y;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);

    if (drawMode === 'rect') {
      ctx.strokeRect(drawStart.x, drawStart.y, w, h);
      ctx.fillStyle = drawColor + '20';
      ctx.fillRect(drawStart.x, drawStart.y, w, h);
    }
  };

  const handleCanvasMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !drawStart) return;
    setDrawing(false);

    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = x - drawStart.x;
    const h = y - drawStart.y;

    if (Math.abs(w) < 10 && Math.abs(h) < 10) {
      setDrawStart(null);
      return;
    }

    const ann: Annotation = {
      type: drawMode,
      x: Math.min(drawStart.x, x),
      y: Math.min(drawStart.y, y),
      w: Math.abs(w),
      h: drawMode === 'rect' ? Math.abs(h) : undefined,
      label: '',
      color: drawColor,
    };

    if (drawMode === 'text') {
      const txt = window.prompt('输入标注文字') || '';
      if (!txt.trim()) { setDrawStart(null); return; }
      ann.label = txt;
    } else {
      const txt = window.prompt('输入矩形标注文字（可选）');
      if (txt?.trim()) ann.label = txt;
    }

    setAnnotations(prev => [...prev, ann]);
    setDrawStart(null);
    setTimeout(redrawCanvas, 50);
  };

  useEffect(() => {
    if (annotateImg) setTimeout(redrawCanvas, 100);
  }, [annotateImg, redrawCanvas]);

  const undoAnnotation = () => {
    setAnnotations(prev => prev.slice(0, -1));
    setTimeout(redrawCanvas, 50);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="reports-root">
        <Card className="rpt-card" title={<Space><IcnCheckCircle /><span>工作作业报告</span></Space>} extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建报告</Button>
        }>
          <div className="rpt-toolbar">
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadReports} size="small">刷新</Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={reports}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{ pageSize: 15 }}
            locale={{ emptyText: <Empty description="暂无作业报告，点击新建" /> }}
            scroll={{ x: 850 }}
          />
        </Card>

        {/* Detail Modal */}
        <Modal title={detail?.title || '报告详情'} open={!!detail && !modalOpen} onCancel={() => setDetail(null)} width={800} footer={null}>
          {detail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Space><Tag color={STATUS_COLORS[detail.status]}>{STATUS_LABELS[detail.status]}</Tag><Text type="secondary"><EnvironmentOutlined /> {detail.location || '-'}</Text><Text type="secondary">人员：{detail.worker_name || '-'}</Text></Space>
              <Text>{detail.description}</Text>
              {detail.images.length > 0 && (
                <div className="rpt-image-list">
                  {detail.images.map(img => (
                    <div key={img.id} className="rpt-image-item" onClick={() => openAnnotator(img)}>
                      <Image src={img.url} preview={false} />
                      <div className="rpt-img-overlay">
                        <AimOutlined /> {img.annotations?.length || 0} 标注
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {detail.images.length === 0 && <Empty description="无图片" />}
              <Button onClick={() => openEdit(detail.id)} icon={<EditOutlined />}>编辑报告</Button>
            </div>
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          title={editingId ? '编辑报告' : '新建报告'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleSave}
          width={800}
          okText="保存"
        >
          <Form form={form} layout="vertical">
            <div className="rpt-form-grid">
              <Form.Item name="title" label="报告标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="如：2025-05-20 矿井安全巡检报告" />
              </Form.Item>
              <Form.Item name="worker_name" label="作业人员">
                <Input placeholder="作业人员姓名" />
              </Form.Item>
              <Form.Item name="location" label="作业位置">
                <Input placeholder="如：A矿区-3号巷道" />
              </Form.Item>
              {editingId && (
                <Form.Item name="status" label="状态">
                  <Select options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
                </Form.Item>
              )}
            </div>
            <Form.Item name="description" label="报告描述">
              <TextArea rows={3} placeholder="描述作业内容、发现的问题等..." />
            </Form.Item>

            <Form.Item label="现场图片">
              <Upload
                listType="picture-card"
                fileList={uploadFiles}
                onChange={({ fileList }) => setUploadFiles(fileList)}
                beforeUpload={() => false}
                multiple
              >
                {uploadFiles.length < 9 && <div><PlusOutlined /><div>上传</div></div>}
              </Upload>
            </Form.Item>

            {editingId && detail && detail.images.length > 0 && (
              <div>
                <Text type="secondary">已有图片（点击标注）：</Text>
                <div className="rpt-image-list">
                  {detail.images.map(img => (
                    <Tooltip key={img.id} title={`${img.annotations?.length || 0} 个标注 - 点击标注`}>
                      <div className="rpt-image-item" onClick={() => openAnnotator(img)}>
                        <img src={img.url} alt="" />
                        <div className="rpt-img-overlay">
                          <AimOutlined style={{ fontSize: 10 }} />
                          <span>{img.annotations?.length || 0} 标注</span>
                          <DeleteOutlined
                            style={{ marginLeft: 'auto', fontSize: 12 }}
                            onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                          />
                        </div>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
          </Form>
        </Modal>

        {/* Annotation Modal */}
        <Modal
          title="图片标注"
          open={!!annotateImg}
          onCancel={() => { setAnnotateImg(null); }}
          onOk={saveAnnotations}
          width="max(60vw, 640px)"
          okText="保存标注"
          footer={[
            <Space key="tools" style={{ marginRight: 'auto' }}>
              <Select value={drawMode} onChange={setDrawMode} size="small" style={{ width: 80 }}
                options={[{ value: 'rect', label: '矩形' }, { value: 'text', label: '文字' }]} />
              <Select value={drawColor} onChange={setDrawColor} size="small" style={{ width: 80 }}
                options={ANNOT_COLORS.map(c => ({ value: c, label: <span style={{ color: c, fontWeight: 700 }}>■ 色标</span> }))} />
              <Button size="small" icon={<UndoOutlined />} onClick={undoAnnotation} disabled={annotations.length === 0}>撤销</Button>
            </Space>,
            <Button key="cancel" onClick={() => setAnnotateImg(null)}>取消</Button>,
            <Button key="save" type="primary" icon={<SaveOutlined />} onClick={saveAnnotations}>保存标注</Button>,
          ]}
        >
          {annotateImg && (
            <div>
              <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                拖拽绘制矩形区域标注问题，点击文字模式添加文字标注。{annotations.length} 个标注。
              </Text>
              <div className="rpt-annotate-wrap" style={{ maxWidth: '100%' }}>
                <img
                  ref={imgRef}
                  src={annotateImg.url}
                  alt=""
                  style={{ maxWidth: '100%', display: 'block' }}
                  onLoad={() => { imgLoadRef.current = true; setTimeout(redrawCanvas, 100); }}
                />
                <canvas
                  ref={canvasRef}
                  className="rpt-annotate-canvas"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}

function IcnCheckCircle() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" />
      </svg>
    </span>
  );
}
