"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Button, Table, Tooltip, Progress, Modal, Input, Alert } from "antd";
import { CheckCircle2, XCircle, AlertTriangle, Info, TrendingUp, Download, Eye } from "lucide-react";

type ResultRow = {
  pos: number;
  sampleId: string;
  name: string;
  type: "CC" | "QC" | "Subject" | "Blank+IS" | "Double Blank";
  level?: string;
  nominal: number | null;
  area: number;
  isArea: number;
  ratio: number;
  calcConc: number | null;
  pctDev: number | null;
  rt: number;
  flag: "pass" | "fail" | "warn" | "blank" | "repeat" | null;
  flagReason?: string;
  repeat?: boolean;
};

const RESULTS: ResultRow[] = [
  { pos: 1,  sampleId: "CC-2026-001-MET-CC1-001", name: "CC Level 1",  type: "CC",  level: "CC1", nominal: 1.00, area: 4210,   isArea: 42100, ratio: 0.100, calcConc: 0.98,  pctDev: -2.0, rt: 1.421, flag: "pass" },
  { pos: 2,  sampleId: "CC-2026-001-MET-CC2-001", name: "CC Level 2",  type: "CC",  level: "CC2", nominal: 2.50, area: 10520,  isArea: 42050, ratio: 0.250, calcConc: 2.51,  pctDev:  0.4, rt: 1.419, flag: "pass" },
  { pos: 3,  sampleId: "CC-2026-001-MET-CC3-001", name: "CC Level 3",  type: "CC",  level: "CC3", nominal: 5.00, area: 21080,  isArea: 42160, ratio: 0.500, calcConc: 5.03,  pctDev:  0.6, rt: 1.422, flag: "pass" },
  { pos: 4,  sampleId: "CC-2026-001-MET-CC4-001", name: "CC Level 4",  type: "CC",  level: "CC4", nominal: 10.0, area: 42200,  isArea: 42200, ratio: 1.000, calcConc: 10.05, pctDev:  0.5, rt: 1.420, flag: "pass" },
  { pos: 5,  sampleId: "CC-2026-001-MET-CC5-001", name: "CC Level 5",  type: "CC",  level: "CC5", nominal: 25.0, area: 106100, isArea: 42440, ratio: 2.500, calcConc: 25.1,  pctDev:  0.4, rt: 1.418, flag: "pass" },
  { pos: 6,  sampleId: "CC-2026-001-MET-CC6-001", name: "CC Level 6",  type: "CC",  level: "CC6", nominal: 50.0, area: 211000, isArea: 42200, ratio: 5.000, calcConc: 50.2,  pctDev:  0.4, rt: 1.421, flag: "pass" },
  { pos: 7,  sampleId: "CC-2026-001-MET-CC7-001", name: "CC Level 7",  type: "CC",  level: "CC7", nominal: 75.0, area: 316500, isArea: 42200, ratio: 7.500, calcConc: 75.3,  pctDev:  0.4, rt: 1.419, flag: "pass" },
  { pos: 8,  sampleId: "CC-2026-001-MET-CC8-001", name: "CC Level 8",  type: "CC",  level: "CC8", nominal: 100,  area: 422800, isArea: 42280, ratio: 10.00, calcConc: 100.5, pctDev:  0.5, rt: 1.420, flag: "pass" },
  { pos: 9,  sampleId: "BLK-IS-001",              name: "Blank+IS (1)", type: "Blank+IS", nominal: null, area: 0, isArea: 41900, ratio: 0, calcConc: null, pctDev: null, rt: 1.420, flag: "blank" },
  { pos: 10, sampleId: "BLK-IS-002",              name: "Blank+IS (2)", type: "Blank+IS", nominal: null, area: 0, isArea: 42100, ratio: 0, calcConc: null, pctDev: null, rt: 1.421, flag: "blank" },
  { pos: 11, sampleId: "QC-2026-001-MET-HQC-001", name: "HQC anchor",  type: "QC",  level: "HQC", nominal: 80.0, area: 338240, isArea: 42280, ratio: 8.000, calcConc: 80.4, pctDev: 0.5, rt: 1.421, flag: "pass" },
  { pos: 12, sampleId: "SID-2026-001-007-P1-0H-MET-1",   name: "007 / P1 / 0H",   type: "Subject", nominal: null, area: 0,      isArea: 41800, ratio: 0.000, calcConc: 0.00,  pctDev: null, rt: 1.420, flag: null },
  { pos: 13, sampleId: "SID-2026-001-007-P1-0.5H-MET-1", name: "007 / P1 / 0.5H", type: "Subject", nominal: null, area: 52600,  isArea: 42100, ratio: 1.249, calcConc: 12.48, pctDev: null, rt: 1.419, flag: null },
  { pos: 14, sampleId: "SID-2026-001-007-P1-1H-MET-1",   name: "007 / P1 / 1H",   type: "Subject", nominal: null, area: 198400, isArea: 41900, ratio: 4.735, calcConc: 47.4,  pctDev: null, rt: 1.421, flag: null },
  { pos: 15, sampleId: "SID-2026-001-008-P1-0H-MET-1",   name: "008 / P1 / 0H",   type: "Subject", nominal: null, area: 0,      isArea: 42200, ratio: 0.000, calcConc: 0.00,  pctDev: null, rt: 1.420, flag: null },
  { pos: 16, sampleId: "SID-2026-001-008-P1-0.5H-MET-1", name: "008 / P1 / 0.5H", type: "Subject", nominal: null, area: 38100,  isArea: 41800, ratio: 0.912, calcConc: 9.10,  pctDev: null, rt: 1.421, flag: null },
  { pos: 17, sampleId: "SID-2026-001-008-P1-1H-MET-1",   name: "008 / P1 / 1H",   type: "Subject", nominal: null, area: 562000, isArea: 42000, ratio: 13.38, calcConc: 115.2, pctDev: null, rt: 1.420, flag: "warn", flagReason: "Concentration > ULOQ (100 ng/mL) — dilution required", repeat: false },
  { pos: 18, sampleId: "QC-2026-001-MET-MQC-001", name: "MQC (mid)",    type: "QC",  level: "MQC", nominal: 30.0, area: 127500, isArea: 42500, ratio: 3.000, calcConc: 30.1, pctDev: 0.3, rt: 1.420, flag: "pass" },
  { pos: 19, sampleId: "SID-2026-001-009-P1-0H-MET-1",   name: "009 / P1 / 0H",   type: "Subject", nominal: null, area: 0,      isArea: 42000, ratio: 0.000, calcConc: 0.00,  pctDev: null, rt: 1.421, flag: null },
  { pos: 20, sampleId: "SID-2026-001-009-P1-1H-MET-1",   name: "009 / P1 / 1H",   type: "Subject", nominal: null, area: 89200,  isArea: 41900, ratio: 2.128, calcConc: 21.3,  pctDev: null, rt: 1.421, flag: "warn", flagReason: "IS response deviates > 30% from run mean — check extraction", repeat: true },
  { pos: 21, sampleId: "QC-2026-001-MET-LQC-001", name: "LQC (end)",    type: "QC",  level: "LQC", nominal: 3.00, area: 12690, isArea: 42300, ratio: 0.300, calcConc: 3.01, pctDev: 0.3, rt: 1.420, flag: "pass" },
];

const CC_SUMMARY = { levels: 8, passing: 8, r2: 0.9998, equation: "y = 42,240x + 42", weighting: "1/x²" };
const QC_SUMMARY = [
  { level: "HQC", nominal: 80.0, calcConc: 80.4, pctDev: 0.5, pass: true },
  { level: "MQC", nominal: 30.0, calcConc: 30.1, pctDev: 0.3, pass: true },
  { level: "LQC", nominal: 3.00, calcConc: 3.01, pctDev: 0.3, pass: true },
];

const FLAG_BG: Record<string, string> = {
  pass: "transparent",
  fail: "var(--status-fail-bg)",
  warn: "#FFFCF0",
  repeat: "#F0F4FF",
  blank: "transparent",
};

export default function LcmsPage() {
  const [acceptOpen, setAcceptOpen] = useState(false);
  const flaggedCount = RESULTS.filter(r => r.flag === "warn" || r.flag === "fail").length;
  const repeatCount  = RESULTS.filter(r => r.repeat).length;

  const columns = [
    { title: "Pos", dataIndex: "pos", key: "pos", width: 44,
      render: (v: number) => <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{v}</span> },
    { title: "Sample ID", dataIndex: "sampleId", key: "sampleId",
      render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--accent)" }}>{v}</span> },
    { title: "Name", dataIndex: "name", key: "name",
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
    { title: "Type", dataIndex: "type", key: "type",
      render: (v: string, r: ResultRow) => (
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 11, color: v === "CC" ? "#3A6B9B" : v === "QC" ? "var(--accent)" : "var(--text-secondary)", fontWeight: 600 }}>{v}</span>
          {r.level && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.level}</span>}
        </div>
      )
    },
    { title: "Area", dataIndex: "area", key: "area",
      render: (v: number) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v.toLocaleString()}</span> },
    { title: "IS Area", dataIndex: "isArea", key: "isArea",
      render: (v: number) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)" }}>{v.toLocaleString()}</span> },
    { title: "Calc. Conc (ng/mL)", dataIndex: "calcConc", key: "calcConc",
      render: (v: number | null, r: ResultRow) => (
        v === null || v === undefined ? <span style={{ color: "var(--text-muted)" }}>—</span>
          : <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600,
              color: r.flag === "warn" ? "var(--status-warn)" : r.flag === "fail" ? "var(--status-fail)" : "var(--text-primary)" }}>
              {v === 0 ? "BLQ" : v.toFixed(2)}
            </span>
      )
    },
    { title: "% Dev", dataIndex: "pctDev", key: "pctDev",
      render: (v: number | null, r: ResultRow) => (
        v === null ? <span style={{ color: "var(--text-muted)" }}>—</span>
          : <span style={{ fontFamily: "monospace", fontSize: 12,
              color: Math.abs(v) > 15 ? "var(--status-fail)" : Math.abs(v) > 10 ? "var(--status-warn)" : "var(--status-pass)",
              fontWeight: 600 }}>
              {v > 0 ? "+" : ""}{v.toFixed(1)}%
            </span>
      )
    },
    { title: "RT (min)", dataIndex: "rt", key: "rt",
      render: (v: number) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v.toFixed(3)}</span> },
    { title: "Flag", key: "flag",
      render: (_: unknown, r: ResultRow) => {
        if (r.flag === "pass" || r.flag === "blank" || !r.flag) return null;
        if (r.flag === "warn") return (
          <Tooltip title={r.flagReason}>
            <AlertTriangle size={14} style={{ color: "var(--status-warn)", cursor: "help" }} />
          </Tooltip>
        );
        if (r.flag === "fail") return <XCircle size={14} style={{ color: "var(--status-fail)" }} />;
        if (r.repeat) return (
          <Tooltip title="Repeat sample detected in prior run">
            <span style={{ fontSize: 10, background: "#E8EEFF", color: "#3A5B9B", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>REPEAT</span>
          </Tooltip>
        );
        return null;
      }
    },
  ];

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">LC-MS/MS Auto Review</h1>
            <p className="section-subtitle">Run RUN-2026-001-005 · DS-2026-001-007 · Metformin · Sciex OS 4.0 · Column 260001</p>
          </div>
          <div className="flex gap-2">
            <Button icon={<Download size={14} />} style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Export Run Report
            </Button>
            <Button type="primary" icon={<CheckCircle2 size={14} />} onClick={() => setAcceptOpen(true)}>
              Accept Run
            </Button>
          </div>
        </div>

        {/* Run decision summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Calibration curve */}
          <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
            <div className="block-label">Calibration Curve</div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} style={{ color: "var(--status-pass)" }} />
              <span style={{ fontWeight: 600, color: "var(--status-pass)", fontSize: 13 }}>PASS</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{CC_SUMMARY.passing}/{CC_SUMMARY.levels} levels</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <div><span style={{ color: "var(--text-muted)" }}>Equation:</span> {CC_SUMMARY.equation}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Weighting:</span> {CC_SUMMARY.weighting}</div>
              <div><span style={{ color: "var(--text-muted)" }}>R²:</span> <strong style={{ color: "var(--status-pass)" }}>{CC_SUMMARY.r2}</strong></div>
            </div>
          </div>

          {/* QC Summary */}
          <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
            <div className="block-label">QC Acceptance</div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} style={{ color: "var(--status-pass)" }} />
              <span style={{ fontWeight: 600, color: "var(--status-pass)", fontSize: 13 }}>PASS</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>All 3 levels within ±15%</span>
            </div>
            {QC_SUMMARY.map(q => (
              <div key={q.level} className="flex items-center justify-between" style={{ fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}>{q.level}</span>
                <span style={{ fontFamily: "monospace" }}>{q.calcConc.toFixed(2)} ng/mL</span>
                <span style={{ color: "var(--status-pass)", fontWeight: 600 }}>+{q.pctDev}%</span>
                <CheckCircle2 size={11} style={{ color: "var(--status-pass)" }} />
              </div>
            ))}
          </div>

          {/* Flags */}
          <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
            <div className="block-label">Flagged Items</div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} style={{ color: "var(--status-warn)" }} />
              <span style={{ fontWeight: 600, color: "var(--status-warn)", fontSize: 13 }}>REVIEW REQUIRED</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 2 }}>
              <div>⚠ {flaggedCount} sample(s) flagged (amber)</div>
              <div style={{ color: "var(--status-info)" }}>↻ {repeatCount} repeat sample(s) detected</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>
                Analyst must add justification for all flags before acceptance.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={RESULTS}
            columns={columns}
            rowKey="pos"
            size="small"
            pagination={false}
            scroll={{ y: 440 }}
            rowClassName={(r) => {
              if (r.flag === "warn" || r.repeat) return "bg-amber-flagged";
              if (r.flag === "fail") return "bg-red-flagged";
              return "";
            }}
            onRow={(r) => ({
              style: {
                background: r.flag === "fail" ? "var(--status-fail-bg)"
                  : r.flag === "warn" || r.repeat ? "var(--status-warn-bg)"
                  : "transparent",
              }
            })}
          />
        </div>

        {/* Accept modal */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>Accept Analytical Run</span>}
          open={acceptOpen}
          onCancel={() => setAcceptOpen(false)}
          footer={null}
          width={440}
        >
          <div style={{ padding: "12px 0" }}>
            {flaggedCount > 0 && (
              <Alert
                type="warning"
                showIcon
                message={`${flaggedCount} flagged sample(s) require justification before accepting.`}
                style={{ marginBottom: 16, fontSize: 12 }}
              />
            )}
            <div style={{ marginBottom: 12 }}>
              <div className="block-label">Justification for Flagged Samples</div>
              <Input.TextArea rows={3} placeholder="Add scientific justification for flagged samples…" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="block-label">Project Leader E-Signature</div>
              <Input.Password placeholder="Enter password to accept run" />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Meaning: "I accept this analytical run and confirm the data is suitable for reporting."
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setAcceptOpen(false)}>Cancel</Button>
              <Button type="primary" icon={<CheckCircle2 size={13} />}>Accept Run</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
