"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Syringe, FlaskConical, Snowflake, Users, Tag, ScrollText, ArrowRight, Microscope } from "lucide-react";

const MODULES = [
  {
    key: "clinical",
    path: "/clinical",
    label: "Clinical",
    description: "Sample collection, CPMA processing, and study management",
    icon: Syringe,
    accent: "#3A6B9B",
    accentBg: "#EAF2FA",
    accentBorder: "#9bc0e0",
  },
  {
    key: "bioanalytical",
    path: "/ba-lab",
    label: "Bioanalytical",
    description: "Project setup, distribution sheets, and LC-MS/MS analysis",
    icon: FlaskConical,
    accent: "#5C6E4E",
    accentBg: "#EBF0E7",
    accentBorder: "#a8bfa0",
  },
  {
    key: "instruments",
    path: "/instruments",
    label: "Instruments",
    description: "Calibration tracking, qualification status, and usage logs for all lab equipment",
    icon: Microscope,
    accent: "#5E7A8A",
    accentBg: "#EAF0F2",
    accentBorder: "#a9c1ca",
  },
  {
    key: "freezer",
    path: "/freezer",
    label: "Freezer Room",
    description: "Sample inventory, temperature monitoring, mastersheet, and retrieval",
    icon: Snowflake,
    accent: "#2A6B8F",
    accentBg: "#E6F3FA",
    accentBorder: "#7ab8d8",
  },
  {
    key: "label-creation",
    path: "/label-creation",
    label: "Label Creation",
    description: "Sample tube labels, pouch labels, barcode generation, and print queue",
    icon: Tag,
    accent: "#B05E2A",
    accentBg: "#FDF2EA",
    accentBorder: "#e0aa80",
  },
  {
    key: "form-creation",
    path: "/form-creation",
    label: "Form Creation",
    description: "Design GxP-compliant data capture forms, worksheets, and batch records",
    icon: ScrollText,
    accent: "#7A4F3A",
    accentBg: "#F5EDE8",
    accentBorder: "#d4a898",
  },
  {
    key: "user-management",
    path: "/user-management",
    label: "User Management",
    description: "Role assignment, module access rights, and account control",
    icon: Users,
    accent: "#7B5EA7",
    accentBg: "#F3EEF9",
    accentBorder: "#c4ace8",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div
        className="flex flex-col items-center justify-center"
        style={{ minHeight: "calc(100vh - 56px)", padding: "48px 36px" }}
      >
        {/* Module cards */}
        <div
          className="grid grid-cols-3 gap-5"
          style={{ width: "100%", maxWidth: 840 }}
        >
          {MODULES.map((mod) => (
            <ModuleCard key={mod.key} mod={mod} onClick={() => router.push(mod.path)} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

type Mod = typeof MODULES[number];

function ModuleCard({ mod, onClick }: { mod: Mod; onClick: () => void }) {
  const Icon = mod.icon;
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl transition-all duration-150 group"
      style={{
        background: "white",
        border: `1px solid ${mod.accentBorder}`,
        padding: "28px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Icon + arrow */}
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: mod.accentBg, color: mod.accent }}
        >
          <Icon size={24} />
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: mod.accentBg, color: mod.accent }}
        >
          <ArrowRight size={13} />
        </div>
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: "DM Serif Display, serif",
          fontSize: 20,
          color: "var(--text-primary)",
          marginBottom: 6,
          lineHeight: 1.2,
        }}
      >
        {mod.label}
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {mod.description}
      </div>

      {/* Accent bar */}
      <div
        className="mt-5 rounded-full"
        style={{
          height: 3,
          background: `linear-gradient(to right, ${mod.accent}, ${mod.accentBg})`,
          width: "36%",
        }}
      />
    </button>
  );
}
