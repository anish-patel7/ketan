"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import {
  Button, Select, Table, Tag, Modal, Input, message,
} from "antd";
import {
  Plus, Download, Eye, CheckCircle2, AlertTriangle,
  Snowflake, PackageSearch,
} from "lucide-react";
import {
  PROJECTS_LIST,
  type DSRecord, type SampleRow,
  loadDsRecords, persistDsRecords,
} from "./data";
import { getApprovedSamples } from "../freezer/mastersheet";
import { runCols } from "./runColumns";

const { Option } = Select;

export default function DistributionPage() {
  const router = useRouter();
  const [records, setRecords] = useState<DSRecord[]>(() => loadDsRecords());

  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [filterStatus,    setFilterStatus]    = useState<string | undefined>();

  const [detailDs,    setDetailDs]    = useState<DSRecord | null>(null);
  const [approveDs,   setApproveDs]   = useState<DSRecord | null>(null);
  const [approvePass, setApprovePass] = useState("");
  const [retrievalDs, setRetrievalDs] = useState<DSRecord | null>(null);
  const [retUrgency,  setRetUrgency]  = useState("normal");
  const [retNotes,    setRetNotes]    = useState("");

  // ── Derived ───────────────────────────────────────────────────────────────
  const ledgerFiltered = records.filter(r =>
    r.project === selectedProject && (!filterStatus || r.status === filterStatus)
  );

  const projectRecords = records.filter(r => r.project === selectedProject);
  const counts = {
    total:     projectRecords.length,
    pending:   projectRecords.filter(r => r.status === "pending").length,
    approved:  projectRecords.filter(r => r.status === "approved").length,
    retrieved: projectRecords.filter(r => r.status === "retrieved").length,
  };

  type RetSample = { id: string; subject?: string; tp?: string; freezer?: string; location?: string };
  const retrievalSamples = useMemo<RetSample[]>(() => {
    if (!retrievalDs) return [];
    if (retrievalDs.rows) return retrievalDs.rows.filter(r => r.type === "Subject");
    return getApprovedSamples(retrievalDs.project, retrievalDs.analyte)
      .slice(0, retrievalDs.subjectSamples);
  }, [retrievalDs]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function confirmApprove() {
    if (!approveDs) return;
    const approvedAt = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
    setRecords(prev => {
      const next = prev.map(r =>
        r.id === approveDs.id ? { ...r, status:"approved" as const, approvedBy:"J. Chen", approvedAt } : r
      );
      persistDsRecords(next);
      return next;
    });
    message.success(`${approveDs.id} approved`);
    setApproveDs(null); setApprovePass("");
  }

  function sendRetrieval() {
    if (!retrievalDs) return;
    const reqId = `RET-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    setRecords(prev => {
      const next = prev.map(r =>
        r.id === retrievalDs.id ? { ...r, status:"retrieved" as const, retrievalReqId: reqId } : r
      );
      persistDsRecords(next);
      return next;
    });
    message.success(`Retrieval request ${reqId} sent to Freezer Room`);
    setRetrievalDs(null); setRetUrgency("normal"); setRetNotes("");
  }

  // ── Ledger columns ────────────────────────────────────────────────────────
  const ledgerCols = [
    {
      title: "DS ID", dataIndex: "id", key: "id",
      render: (v: string) => (
        <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"var(--accent)" }}>{v}</span>
      ),
    },
    {
      title: "Project", key: "proj",
      render: (_: unknown, r: DSRecord) => (
        <div>
          <div style={{ fontFamily:"monospace", fontSize:11, fontWeight:600 }}>{r.project}</div>
          <div style={{ fontSize:10, color:"var(--text-muted)" }}>{r.projectName}</div>
        </div>
      ),
    },
    {
      title: "Analyte", dataIndex: "analyte", key: "analyte",
      render: (v: string) => <Tag style={{ fontSize:11, fontFamily:"monospace", fontWeight:600 }}>{v}</Tag>,
    },
    {
      title: "Run Name", key: "runName",
      render: (_: unknown, r: DSRecord) => r.runName
        ? <span style={{ fontSize:11 }}>{r.runName}</span>
        : <span style={{ fontSize:11, color:"var(--text-muted)" }}>—</span>,
    },
    {
      title: "Run", dataIndex: "runNo", key: "runNo",
      render: (v: number) => <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13 }}>#{v}</span>,
    },
    {
      title: "Composition", key: "comp",
      render: (_: unknown, r: DSRecord) => (
        <div className="flex gap-1 flex-wrap">
          {[
            { label:`CC×${r.ccLevels}`,        bg:"#E8F0FB",              color:"#3A6B9B"             },
            { label:`QC×${r.qcSamples}`,       bg:"var(--accent-light)",  color:"var(--accent)"      },
            { label:`Subj×${r.subjectSamples}`,bg:"var(--bg-card)",       color:"var(--text-secondary)" },
          ].map(c => (
            <span key={c.label} style={{
              fontSize:10, fontWeight:600, background:c.bg, color:c.color,
              padding:"1px 6px", borderRadius:4,
            }}>{c.label}</span>
          ))}
        </div>
      ),
    },
    {
      title: "Status", dataIndex: "status", key: "status",
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: "Created", key: "created",
      render: (_: unknown, r: DSRecord) => (
        <div>
          <div style={{ fontSize:12 }}>{r.createdAt}</div>
          <div style={{ fontSize:10, color:"var(--text-muted)" }}>{r.createdBy}</div>
        </div>
      ),
    },
    {
      title: "Approval", key: "approval",
      render: (_: unknown, r: DSRecord) => r.approvedBy
        ? (
          <div>
            <div style={{ fontSize:11, color:"var(--status-pass)", fontWeight:600 }}>✓ {r.approvedBy}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>{r.approvedAt}</div>
          </div>
        ) : r.status === "pending" ? (
          <button
            onClick={() => { setApproveDs(r); setApprovePass(""); }}
            style={{ fontSize:11, fontWeight:600, color:"#1565c0", background:"#e3f2fd",
              border:"1px solid #90caf9", borderRadius:5, padding:"2px 8px", cursor:"pointer" }}>
            Approve
          </button>
        ) : <span style={{ fontSize:11, color:"var(--text-muted)" }}>—</span>,
    },
    {
      title: "Retrieval", key: "retrieval",
      render: (_: unknown, r: DSRecord) => r.retrievalReqId
        ? <div style={{ fontSize:11, fontWeight:600, color:"var(--status-info)" }}>↑ {r.retrievalReqId}</div>
        : r.status === "approved"
          ? (
            <Button size="small" icon={<Snowflake size={11} />}
              style={{ fontSize:11, color:"var(--status-info)", borderColor:"var(--status-info)" }}
              onClick={() => setRetrievalDs(r)}>
              Request
            </Button>
          ) : <span style={{ fontSize:11, color:"var(--text-muted)" }}>—</span>,
    },
    {
      title: "", key: "actions",
      render: (_: unknown, r: DSRecord) => (
        <Button size="small" icon={<Eye size={11} />} style={{ fontSize:11 }} onClick={() => setDetailDs(r)}>
          View
        </Button>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="mb-6">
          <h1 className="section-title">Distribution Sheet</h1>
          <p className="section-subtitle">
            Project-linked run preparation · CC Set &amp; QC ID traceability · approval workflow · Freezer Room retrieval
          </p>
        </div>

        {/* Project selector */}
        <div className="rounded-xl p-5 mb-6" style={{ background:"white", border:"1px solid var(--border)" }}>
          <div className="block-label mb-2">
            Project Number <span style={{ color:"var(--status-fail)" }}>*</span>
          </div>
          <Select
            style={{ width:380 }} size="large"
            placeholder="Select a project number to view its Distribution Sheets…"
            value={selectedProject} allowClear
            onChange={v => { setSelectedProject(v); setFilterStatus(undefined); }}
          >
            {PROJECTS_LIST.map(p => (
              <Option key={p.id} value={p.id}>
                <span style={{ fontFamily:"monospace", fontWeight:600, color:"var(--accent)" }}>{p.id}</span>
                <span style={{ color:"var(--text-muted)", marginLeft:8, fontSize:12 }}>— {p.name}</span>
              </Option>
            ))}
          </Select>
        </div>

        {!selectedProject ? (
          <div className="flex flex-col items-center py-16 rounded-xl"
            style={{ border:"1px dashed var(--border)", color:"var(--text-muted)" }}>
            <PackageSearch size={28} style={{ marginBottom:8 }} />
            <span style={{ fontSize:13 }}>Select a project number above to view its Distribution Sheets</span>
          </div>
        ) : (
          <>
            {/* Stats + New button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-3">
                {[
                  { label:"Total DS",         value:counts.total,     color:"var(--text-secondary)" },
                  { label:"Pending Approval", value:counts.pending,   color:"var(--status-warn)"   },
                  { label:"Approved",         value:counts.approved,  color:"var(--status-pass)"   },
                  { label:"Retrieved",        value:counts.retrieved, color:"var(--status-info)"   },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
                    style={{ background:"white", border:"1px solid var(--border)" }}>
                    <span style={{ fontSize:20, fontWeight:700, fontFamily:"DM Serif Display, serif", color:s.color }}>{s.value}</span>
                    <span style={{ fontSize:12, color:"var(--text-secondary)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <Button
                type="primary" size="large" icon={<Plus size={14} />}
                onClick={() => router.push("/distribution/new")}
              >
                New Sample Distribution Preparation
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <Select placeholder="Filter by status" style={{ width:180 }} allowClear
                value={filterStatus} onChange={setFilterStatus}>
                {["draft","pending","approved","retrieved","rejected"].map(s => (
                  <Option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</Option>
                ))}
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)", background:"white" }}>
              <Table
                dataSource={ledgerFiltered} columns={ledgerCols} rowKey="id"
                size="small" pagination={{ pageSize:10, showSizeChanger:false }}
                rowClassName={r => r.status === "rejected" ? "opacity-50" : ""}
              />
            </div>
          </>
        )}


        {/* ── Detail modal ────────────────────────────────────────────────── */}
        <Modal
          title={
            <div>
              <span style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>{detailDs?.id}</span>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, fontFamily:"inherit" }}>
                {detailDs?.projectName} · {detailDs?.analyte} · Run #{detailDs?.runNo} · APS {detailDs?.aps}
                {detailDs?.runName && <> · <strong>"{detailDs.runName}"</strong></>}
              </div>
            </div>
          }
          open={!!detailDs} onCancel={() => setDetailDs(null)}
          footer={
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <StatusTag status={detailDs?.status ?? "draft"} />
                {detailDs?.approvedBy && (
                  <span style={{ fontSize:11, color:"var(--status-pass)", fontWeight:600 }}>
                    ✓ {detailDs.approvedBy} · {detailDs.approvedAt}
                  </span>
                )}
                {detailDs?.retrievalReqId && (
                  <span style={{ fontSize:11, color:"var(--status-info)", fontWeight:600 }}>
                    ↑ {detailDs.retrievalReqId}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button icon={<Download size={13} />} style={{ color:"var(--text-secondary)" }}>Export</Button>
                {detailDs?.status === "approved" && !detailDs?.retrievalReqId && (
                  <Button type="primary" icon={<Snowflake size={13} />}
                    onClick={() => { setDetailDs(null); setRetrievalDs(detailDs); }}>
                    Request Retrieval
                  </Button>
                )}
                <Button onClick={() => setDetailDs(null)}>Close</Button>
              </div>
            </div>
          }
          width={900}
        >
          {detailDs && (
            <div style={{ marginTop:12 }}>
              <div className="flex items-center gap-4 rounded-xl px-4 py-3 mb-4"
                style={{ background:"var(--accent-light)", border:"1px solid #c2d4b8" }}>
                <span style={{ fontSize:12, color:"var(--accent)", fontWeight:500 }}>
                  {detailDs.project} · {detailDs.analyte} · Run #{detailDs.runNo}
                  &nbsp;· {detailDs.ccLevels} CC · {detailDs.qcSamples} QC · {detailDs.subjectSamples} subjects
                  &nbsp;· {detailDs.totalPositions} total positions
                </span>
              </div>
              {detailDs.rows ? (
                <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)" }}>
                  <Table dataSource={detailDs.rows} columns={runCols} rowKey="pos"
                    size="small" pagination={false} scroll={{ y:420 }}
                    onRow={r => ({
                      style: {
                        background: r.type==="QC" ? "var(--accent-light)"
                          : r.type==="CC" ? "#f0f5fb" : "transparent",
                      },
                    })}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center py-8" style={{ color:"var(--text-muted)" }}>
                  <PackageSearch size={24} style={{ marginBottom:8 }} />
                  <span style={{ fontSize:13 }}>Run layout not stored for this record</span>
                </div>
              )}
            </div>
          )}
        </Modal>


        {/* ── Approve modal ───────────────────────────────────────────────── */}
        <Modal
          title={<span style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>Approve Distribution Sheet</span>}
          open={!!approveDs} onCancel={() => { setApproveDs(null); setApprovePass(""); }}
          footer={null} width={440}
        >
          {approveDs && (
            <div style={{ padding:"12px 0" }}>
              <div className="rounded-xl p-4 mb-4" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                {[
                  { label:"DS ID",     value:approveDs.id },
                  { label:"Project",   value:`${approveDs.project} — ${approveDs.projectName}` },
                  { label:"Analyte",   value:approveDs.analyte },
                  { label:"Run",       value:`#${approveDs.runNo}${approveDs.runName ? ` — "${approveDs.runName}"` : ""}` },
                  { label:"Positions", value:String(approveDs.totalPositions) },
                ].map((f, i, arr) => (
                  <div key={f.label} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ fontSize:11, color:"var(--text-muted)" }}>{f.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, fontFamily:"monospace" }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <div className="block-label mb-2">Project Leader E-Signature</div>
                <Input.Password placeholder="Enter password to approve…"
                  value={approvePass} onChange={e => setApprovePass(e.target.value)} />
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>
                  Meaning: &ldquo;I approve this Distribution Sheet for analytical run and Freezer Room retrieval.&rdquo;
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => { setApproveDs(null); setApprovePass(""); }}>Cancel</Button>
                <Button type="primary" icon={<CheckCircle2 size={13} />}
                  disabled={!approvePass} onClick={confirmApprove}>
                  Approve
                </Button>
              </div>
            </div>
          )}
        </Modal>


        {/* ── Retrieval request modal ─────────────────────────────────────── */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Snowflake size={18} style={{ color:"var(--status-info)" }} />
              <span style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>
                Retrieval Request — {retrievalDs?.id}
              </span>
            </div>
          }
          open={!!retrievalDs}
          onCancel={() => { setRetrievalDs(null); setRetUrgency("normal"); setRetNotes(""); }}
          footer={null} width={600}
        >
          {retrievalDs && (
            <div style={{ marginTop:16 }}>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label:"Project",  value:retrievalDs.project   },
                  { label:"Analyte",  value:retrievalDs.analyte   },
                  { label:"Run No.",  value:`#${retrievalDs.runNo}` },
                ].map(f => (
                  <div key={f.label} className="rounded-lg p-3" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                    <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", color:"var(--text-muted)", marginBottom:4 }}>{f.label}</div>
                    <div style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"var(--accent)" }}>{f.value}</div>
                  </div>
                ))}
              </div>

              <div className="block-label mb-2">
                Subject Samples to Retrieve
                <span style={{ fontSize:11, fontWeight:400, color:"var(--text-muted)", marginLeft:6 }}>
                  {retrievalDs.subjectSamples} samples
                </span>
              </div>
              <div className="rounded-xl overflow-hidden mb-4" style={{ border:"1px solid var(--border)" }}>
                <div className="grid px-3 py-2"
                  style={{ gridTemplateColumns:"1fr 60px 60px 90px 80px", gap:8,
                    background:"var(--bg-card)", borderBottom:"1px solid var(--border)" }}>
                  {["Sample ID","Subj","T.Pt","Freezer","Location"].map(h => (
                    <span key={h} style={{ fontSize:9, fontWeight:700, letterSpacing:"0.07em",
                      textTransform:"uppercase", color:"var(--text-muted)" }}>{h}</span>
                  ))}
                </div>
                {retrievalSamples.map((r, i) => (
                  <div key={r.id} className="grid items-center px-3 py-2"
                    style={{ gridTemplateColumns:"1fr 60px 60px 90px 80px", gap:8,
                      borderBottom: i < retrievalSamples.length-1 ? "1px solid var(--border)" : "none",
                      background:"white" }}>
                    <span style={{ fontSize:10, fontFamily:"monospace", color:"var(--accent)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.id}</span>
                    <span style={{ fontSize:11, fontWeight:600 }}>{r.subject ?? "—"}</span>
                    <span style={{ fontSize:11, fontFamily:"monospace" }}>{r.tp ?? "—"}</span>
                    <span style={{ fontSize:11, color:"var(--status-info)", fontFamily:"monospace" }}>{r.freezer ?? "—"}</span>
                    <span style={{ fontSize:10, fontFamily:"monospace" }}>{r.location ?? "—"}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="block-label mb-2">Urgency</div>
                  <Select value={retUrgency} onChange={setRetUrgency} style={{ width:"100%" }}>
                    <Option value="normal">Normal — within 4 hours</Option>
                    <Option value="urgent">Urgent — within 1 hour</Option>
                    <Option value="immediate">Immediate — ASAP</Option>
                  </Select>
                </div>
                <div>
                  <div className="block-label mb-2">Notes for Freezer Room</div>
                  <Input.TextArea rows={2} placeholder="Handling instructions…"
                    value={retNotes} onChange={e => setRetNotes(e.target.value)}
                    style={{ resize:"none" }} />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg px-4 py-3 mb-4"
                style={{ background:"var(--status-info-bg)", border:"1px solid #9bc0e0" }}>
                <AlertTriangle size={13} style={{ color:"var(--status-info)", flexShrink:0, marginTop:1 }} />
                <span style={{ fontSize:12, color:"var(--status-info)", lineHeight:1.5 }}>
                  Once submitted, the retrieval request will appear in the Freezer Room queue.
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={() => { setRetrievalDs(null); setRetUrgency("normal"); setRetNotes(""); }}>Cancel</Button>
                <Button type="primary" icon={<Snowflake size={13} />} onClick={sendRetrieval}
                  style={{ background:"var(--status-info)", borderColor:"var(--status-info)" }}>
                  Send Retrieval Request to Freezer Room
                </Button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </AppLayout>
  );
}
