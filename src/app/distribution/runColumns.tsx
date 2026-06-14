import { Tooltip } from "antd";
import { Info } from "lucide-react";
import type { SampleRow } from "./data";

export const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "CC":      { bg:"#E8F0FB", color:"#3A6B9B" },
  "QC":      { bg:"var(--accent-light)", color:"var(--accent)" },
  "SES":     { bg:"#F0EBF5", color:"#6B4E8A" },
  "SP":      { bg:"#F5EBF0", color:"#8A4E6B" },
  "BLK/BLK": { bg:"#ECEAE5", color:"#6B6560" },
  "LLOQ":    { bg:"#E8F5F0", color:"#2E8A6B" },
  "ULOQ":    { bg:"#FBEEE0", color:"#B8702A" },
  "Subject": { bg:"var(--bg-card)", color:"var(--text-secondary)" },
};

export const runCols = [
  {
    title:"Pos", dataIndex:"pos", key:"pos", width:48,
    render:(v:number) => <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"monospace" }}>{v}</span>,
  },
  {
    title:"Sample ID", dataIndex:"id", key:"id",
    render:(v:string) => <span style={{ fontFamily:"monospace", fontSize:10, color:"var(--accent)" }}>{v}</span>,
  },
  { title:"Name", dataIndex:"name", key:"name", render:(v:string) => <span style={{ fontSize:12 }}>{v}</span> },
  {
    title:"Type", dataIndex:"type", key:"type",
    render:(v:string, r:SampleRow) => {
      const s = TYPE_COLORS[v] ?? { bg:"var(--bg-card)", color:"var(--text-secondary)" };
      return (
        <span style={{ background:s.bg, color:s.color, padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>
          {v}{r.level ? ` · ${r.level}` : ""}
        </span>
      );
    },
  },
  {
    title:(
      <span className="flex items-center gap-1">
        Nominal Conc.
        <Tooltip title="Auto-populated from APS. Not editable for CC/QC.">
          <Info size={11} style={{ color:"var(--text-muted)", cursor:"help" }} />
        </Tooltip>
      </span>
    ),
    dataIndex:"conc", key:"conc",
    render:(v:string|null) => v
      ? <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:500 }}>{v}</span>
      : <span style={{ color:"var(--text-muted)", fontSize:11 }}>—</span>,
  },
];
