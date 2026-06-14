"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Badge, Dropdown, Modal, Form, Input, message } from "antd";
import type { MenuProps } from "antd";
import {
  LayoutDashboard, FlaskConical, Columns3, ClipboardList,
  TestTube2, BarChart3, Bell, ChevronRight,
  Microscope, PackageSearch, FileSpreadsheet, Snowflake,
  Activity, ChevronDown, Menu, X,
  Syringe, Beaker, Users, ShieldCheck, Tag, Clock,
  QrCode, KeyRound, FolderKanban, LogOut, ScrollText,
  FileStack, UploadCloud,
  Pipette, Inbox, Filter, Droplet, FileSearch, RefreshCw, Repeat,
} from "lucide-react";

type NavChild = { label: string; icon: React.ElementType; path: string; isHub?: boolean };
type Module   = { key: string; label: string; icon: React.ElementType; path: string; color: string; children: NavChild[] };

/** True if `pathname` is exactly `itemPath` or one of its sub-routes. */
function pathMatches(itemPath: string, pathname: string): boolean {
  return pathname === itemPath || (itemPath !== "/" && pathname.startsWith(itemPath + "/"));
}

/** Among items whose path matches `pathname`, picks the one with the longest (most specific) path. */
function mostSpecificMatch<T extends { path: string }>(items: T[], pathname: string): T | undefined {
  return items
    .filter(i => pathMatches(i.path, pathname))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

const MODULES: Module[] = [
  { key: "home",            label: "Home",            icon: LayoutDashboard, path: "/",                color: "var(--text-muted)", children: [] },
  { key: "clinical",        label: "Clinical",         icon: Syringe,         path: "/clinical",        color: "#3A6B9B", children: [
    { label: "Clinical",           icon: Syringe,       path: "/clinical",    isHub: true },
    { label: "Projects",           icon: ClipboardList, path: "/projects" },
    { label: "Time Point Mapping", icon: Clock,         path: "/timepoints" },
    { label: "Sample Collection",  icon: TestTube2,     path: "/collection" },
    { label: "CPMA Processing",    icon: FlaskConical,  path: "/cpma" },
  ]},
  { key: "bioanalytical",   label: "Bioanalytical",   icon: Beaker,          path: "/ba-lab",          color: "#5C6E4E", children: [
    { label: "Bioanalytical",      icon: Beaker,          path: "/ba-lab",      isHub: true },
    { label: "Project Setup",      icon: FileSpreadsheet, path: "/ba-setup" },
    { label: "Distribution Sheet", icon: Columns3,        path: "/distribution" },
    { label: "Sample Preparation", icon: Pipette,         path: "/sample-prep" },
    { label: "Sample Request",     icon: Inbox,           path: "/sample-request" },
    { label: "Sample Extraction",  icon: Filter,          path: "/sample-extraction" },
    { label: "Sample Injection",   icon: Droplet,         path: "/sample-injection" },
    { label: "Data Review",        icon: FileSearch,      path: "/data-review" },
    { label: "LC-MS/MS Auto Review & Repeat", icon: Activity, path: "/lcms" },
    { label: "Repeat Analysis",    icon: Repeat,          path: "/repeat-analysis" },
    { label: "ISR",                 icon: RefreshCw,       path: "/isr" },
    { label: "Analytics",          icon: BarChart3,       path: "/analytics" },
    { label: "Column Management",  icon: PackageSearch,   path: "/columns" },
  ]},
  { key: "instruments",     label: "Instruments",     icon: Microscope,      path: "/instruments",     color: "#5E7A8A", children: [
    { label: "Instruments", icon: Microscope, path: "/instruments", isHub: true },
  ]},
  { key: "freezer",         label: "Freezer Room",    icon: Snowflake,       path: "/freezer",         color: "#2A6B8F", children: [
    { label: "Freezer Room", icon: Snowflake, path: "/freezer", isHub: true },
  ]},
  { key: "label-creation",  label: "Label Creation",  icon: Tag,             path: "/label-creation",  color: "#B05E2A", children: [
    { label: "Label Creation", icon: Tag, path: "/label-creation", isHub: true },
  ]},
  { key: "form-creation",   label: "Form Creation",   icon: ScrollText,      path: "/form-creation",   color: "#7A4F3A", children: [
    { label: "Form Creation",    icon: ScrollText,      path: "/form-creation",           isHub: true },
    { label: "Dashboard",        icon: LayoutDashboard, path: "/form-creation/dashboard" },
    { label: "Issued Instances", icon: FileStack,       path: "/form-creation/instances" },
    { label: "New from Document",icon: UploadCloud,     path: "/form-creation/upload" },
    { label: "Audit Trail",      icon: ShieldCheck,      path: "/form-creation/audit" },
  ]},
  { key: "user-management", label: "User Management", icon: Users,           path: "/user-management", color: "#7B5EA7", children: [
    { label: "User Management", icon: Users,       path: "/user-management", isHub: true },
    { label: "Audit Trail",     icon: ShieldCheck, path: "/audit-trail" },
  ]},
];

const RAIL_WIDTH  = 56;
const PANEL_WIDTH = 184;

function useBreakpoint() {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setBp(w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const bp         = useBreakpoint();
  const isMobile   = bp === "mobile";
  const isTablet   = bp === "tablet";

  /* On mobile/tablet sidebar starts closed; desktop starts open */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  /* Auto-collapse on tablet, auto-open on desktop */
  useEffect(() => {
    if (isTablet) setCollapsed(true);
    if (!isMobile && !isTablet) setCollapsed(false);
  }, [isMobile, isTablet]);

  /* Close drawer on route change */
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const activeModule = useMemo<Module>(() => {
    for (const mod of MODULES) {
      if (mod.path === pathname) return mod;
      if (mod.children.some(c => c.path === pathname || (c.path !== "/" && pathname.startsWith(c.path)))) return mod;
    }
    return MODULES[0];
  }, [pathname]);

  const allItems    = MODULES.flatMap(m => m.children.length ? m.children : [{ label: m.label, icon: m.icon, path: m.path }]);
  const currentLabel = mostSpecificMatch(allItems, pathname)?.label ?? "Dashboard";
  const activeChildPath = mostSpecificMatch(activeModule.children, pathname)?.path;

  const sidebarWidth = collapsed ? RAIL_WIDTH : RAIL_WIDTH + PANEL_WIDTH;

  const navigate = useCallback((path: string) => {
    router.push(path);
    setDrawerOpen(false);
  }, [router]);

  /* ── User menu modals ── */
  const [pwdOpen,     setPwdOpen]     = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [pwdForm] = Form.useForm();

  const userMenuItems: MenuProps["items"] = [
    {
      key: "barcode",
      icon: <QrCode size={13} />,
      label: "Print User Barcode",
      onClick: () => setBarcodeOpen(true),
    },
    {
      key: "password",
      icon: <KeyRound size={13} />,
      label: "Change Password",
      onClick: () => setPwdOpen(true),
    },
    {
      key: "projects",
      icon: <FolderKanban size={13} />,
      label: "Assigned Projects",
      onClick: () => setProjectOpen(true),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogOut size={13} />,
      label: "Sign Out",
      danger: true,
      onClick: () => message.info("Sign-out coming soon"),
    },
  ];

  /* ── Sidebar inner content (shared between desktop & mobile drawer) ── */
  const SidebarContent = (
    <aside
      className="flex flex-col h-full"
      style={{ background: "var(--sidebar-bg)", width: isMobile ? RAIL_WIDTH + PANEL_WIDTH : sidebarWidth }}
    >
      {/* Logo strip */}
      <div className="flex items-center flex-shrink-0"
        style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingLeft: 14, paddingRight: 10, gap: 10 }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
          style={{ background: "var(--accent)" }} onClick={() => navigate("/")}>
          <FlaskConical size={16} color="white" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="flex-1 min-w-0">
            <div className="font-serif text-sm font-normal" style={{ color: "var(--sidebar-text)", lineHeight: 1.2 }}>LIMS</div>
          </div>
        )}
        <button className="opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ color: "var(--sidebar-text)", marginLeft: (collapsed && !isMobile) ? "auto" : 0 }}
          onClick={() => isMobile ? setDrawerOpen(false) : setCollapsed(!collapsed)}>
          {isMobile ? <X size={14} /> : <Menu size={14} />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex flex-1 overflow-hidden">
        {/* Icon Rail */}
        <div className="flex flex-col py-3 flex-shrink-0"
          style={{ width: RAIL_WIDTH, borderRight: (collapsed && !isMobile) ? "none" : "1px solid rgba(255,255,255,0.07)", overflowY: "auto", overflowX: "hidden" }}>
          {MODULES.map(mod => {
            const Icon    = mod.icon;
            const isActive = activeModule.key === mod.key;
            return (
              <button key={mod.key} title={mod.label} onClick={() => navigate(mod.path)}
                className="flex items-center justify-center flex-shrink-0 transition-all duration-100"
                style={{ width: RAIL_WIDTH, height: 44,
                  background: isActive ? "var(--sidebar-active)" : "transparent",
                  color: isActive ? "white" : "var(--sidebar-muted)",
                  borderLeft: isActive ? `3px solid ${mod.color}` : "3px solid transparent" }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <Icon size={17} style={{ color: isActive ? mod.color : undefined }} />
              </button>
            );
          })}
        </div>

        {/* Sub-panel (hidden when collapsed on desktop, always shown on mobile) */}
        {(!collapsed || isMobile) && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center px-3 flex-shrink-0"
              style={{ height: 36, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: activeModule.color }}>
                {activeModule.label}
              </span>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 px-2">
              {activeModule.children.length === 0 ? (
                <div>
                  <div className="px-2 mb-2" style={{ fontSize: 10, color: "var(--sidebar-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Modules</div>
                  {MODULES.filter(m => m.key !== "home").map(mod => {
                    const Icon = mod.icon;
                    return (
                      <button key={mod.key} onClick={() => navigate(mod.path)}
                        className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 mb-0.5 transition-all"
                        style={{ color: "var(--sidebar-muted)", background: "transparent", fontSize: 12 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <Icon size={13} style={{ color: mod.color, flexShrink: 0 }} />
                        <span className="truncate font-medium">{mod.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                activeModule.children.map(item => {
                  const Icon     = item.icon;
                  const isActive = item.path === activeChildPath;
                  return (
                    <button key={item.path} onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-2.5 rounded-lg mb-0.5 transition-all"
                      style={{ padding: "8px 10px", marginBottom: item.isHub ? 6 : 1,
                        background: isActive ? "var(--sidebar-active)" : item.isHub ? "rgba(255,255,255,0.05)" : "transparent",
                        color: isActive ? "var(--sidebar-text)" : item.isHub ? "var(--sidebar-text)" : "var(--sidebar-muted)",
                        borderBottom: item.isHub ? "1px solid rgba(255,255,255,0.07)" : "none",
                        borderRadius: item.isHub ? 8 : 6 }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)"; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = isActive ? "var(--sidebar-active)" : item.isHub ? "rgba(255,255,255,0.05)" : "transparent"; }}>
                      <Icon size={item.isHub ? 13 : 14} className="flex-shrink-0"
                        style={{ color: isActive ? activeModule.color : item.isHub ? activeModule.color : undefined, opacity: item.isHub && !isActive ? 0.8 : 1 }} />
                      <span style={{ fontSize: item.isHub ? 12 : 12.5, fontWeight: item.isHub ? 600 : 400 }} className="truncate">{item.label}</span>
                      {isActive && <ChevronRight size={11} className="ml-auto flex-shrink-0 opacity-50" />}
                    </button>
                  );
                })
              )}
            </nav>
          </div>
        )}
      </div>

    </aside>
  );

  return (
    <>
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>

      {/* ── Mobile drawer overlay ── */}
      {isMobile && drawerOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setDrawerOpen(false)} />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 flex flex-col" style={{ width: RAIL_WIDTH + PANEL_WIDTH }}>
            {SidebarContent}
          </div>
        </>
      )}

      {/* ── Desktop / Tablet sidebar (in-flow) ── */}
      {!isMobile && (
        <div className="flex-shrink-0 transition-all duration-200" style={{ width: sidebarWidth, borderRight: "1px solid #1a1a17" }}>
          {SidebarContent}
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center px-4 flex-shrink-0"
          style={{ height: 56, background: "white", borderBottom: "1px solid var(--border)" }}>

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button className="mr-3 flex-shrink-0"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setDrawerOpen(true)}>
              <Menu size={20} />
            </button>
          )}

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 min-w-0" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-muted)", fontSize: 12, flexShrink: 0 }}>LIMS</span>
            <ChevronRight size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            {activeModule.key !== "overview" && !isMobile && (
              <>
                <span className="cursor-pointer hover:underline truncate"
                  style={{ fontSize: 12, color: "var(--text-muted)" }}
                  onClick={() => router.push(activeModule.path)}>
                  {activeModule.label}
                </span>
                <ChevronRight size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              </>
            )}
            <span className="font-medium truncate" style={{ color: "var(--text-primary)", fontSize: 13 }}>
              {currentLabel}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <Badge count={3} size="small" style={{ background: "var(--status-warn)" }}>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                <Bell size={14} />
              </button>
            </Badge>
            {/* User profile */}
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
              <div className="flex items-center gap-2 rounded-lg px-2 py-1 cursor-pointer"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                  AL
                </div>
                {!isMobile && (
                  <div className="flex flex-col leading-tight">
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>A. Liang</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Analyst</span>
                  </div>
                )}
                {!isMobile && <ChevronDown size={11} style={{ color: "var(--text-muted)" }} />}
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>

      {/* ── Change Password Modal ── */}
      <Modal
        title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 17 }}>Change Password</span>}
        open={pwdOpen}
        onCancel={() => { setPwdOpen(false); pwdForm.resetFields(); }}
        onOk={() => {
          pwdForm.validateFields().then(() => {
            message.success("Password updated successfully");
            setPwdOpen(false);
            pwdForm.resetFields();
          });
        }}
        okText="Update Password"
        width={400}
      >
        <Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="current"
            label={<span style={{ fontSize: 12, fontWeight: 600 }}>Current Password</span>}
            rules={[{ required: true, message: "Enter your current password" }]}
          >
            <Input.Password placeholder="Current password" />
          </Form.Item>
          <Form.Item
            name="newpwd"
            label={<span style={{ fontSize: 12, fontWeight: 600 }}>New Password</span>}
            rules={[{ required: true, min: 8, message: "Minimum 8 characters" }]}
          >
            <Input.Password placeholder="New password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label={<span style={{ fontSize: 12, fontWeight: 600 }}>Confirm New Password</span>}
            dependencies={["newpwd"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newpwd") === value) return Promise.resolve();
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Assigned Projects Modal ── */}
      <Modal
        title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 17 }}>Assigned Projects</span>}
        open={projectOpen}
        onCancel={() => setProjectOpen(false)}
        footer={null}
        width={480}
      >
        <div style={{ marginTop: 16 }}>
          {[
            { id: "SID-2026-001", name: "Metformin BE",    role: "Analyst",    status: "Active"    },
            { id: "SID-2026-002", name: "Atorvastatin PK", role: "Co-Analyst", status: "Active"    },
            { id: "SID-2025-018", name: "Amlodipine BE",   role: "Analyst",    status: "Completed" },
          ].map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-3"
              style={{ borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-light)", color: "var(--accent)", fontSize: 11, fontWeight: 700 }}>
                {p.id.slice(-3)}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.id} · {p.role}</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                background: p.status === "Active" ? "var(--status-pass-bg)" : "var(--bg-card)",
                color: p.status === "Active" ? "var(--status-pass)" : "var(--text-muted)",
                border: `1px solid ${p.status === "Active" ? "var(--status-pass)" : "var(--border)"}`,
              }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── User Barcode Modal ── */}
      <Modal
        title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 17 }}>User Barcode</span>}
        open={barcodeOpen}
        onCancel={() => setBarcodeOpen(false)}
        onOk={() => { message.success("Sent to printer"); setBarcodeOpen(false); }}
        okText="Print"
        width={320}
      >
        <div className="flex flex-col items-center py-6 gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: "var(--accent-light)", color: "var(--accent)", fontFamily: "DM Serif Display, serif" }}>
            AL
          </div>
          <div className="text-center">
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>A. Liang</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Analyst · LIMS-USR-0042</div>
          </div>
          {/* Barcode placeholder */}
          <div className="flex flex-col items-center gap-1 w-full px-6">
            <div className="flex gap-px" style={{ height: 48 }}>
              {Array.from({ length: 40 }, (_, i) => (
                <div key={i} style={{
                  width: i % 3 === 0 ? 3 : i % 5 === 0 ? 1 : 2,
                  height: "100%",
                  background: i % 4 === 0 ? "transparent" : "var(--text-primary)",
                  borderRadius: 1,
                }} />
              ))}
            </div>
            <span style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", color: "var(--text-secondary)" }}>
              LIMS-USR-0042
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
}
