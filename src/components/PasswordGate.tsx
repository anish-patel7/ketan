"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";

const CORRECT = "150826";
const SESSION_KEY = "lims-auth";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
  }, []);

  function submit(code: string) {
    if (code === CORRECT) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setDigits(Array(6).fill(""));
      refs.current[0]?.focus();
      setTimeout(() => setShake(false), 600);
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    setError(false);
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
    if (value && index === 5) {
      const code = [...next].join("");
      if (code.length === 6) submit(code);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const code = digits.join("");
      if (code.length === 6) submit(code);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("").map((_, i) => text[i] ?? "");
    setDigits(next);
    setError(false);
    const focusIdx = Math.min(text.length, 5);
    refs.current[focusIdx]?.focus();
    if (text.length === 6) submit(text);
  }

  if (unlocked) return <>{children}</>;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#FAF9F6",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Logo / branding */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 28, fontWeight: 400,
          color: "#1C1B18", letterSpacing: "-0.5px",
          marginBottom: 6,
        }}>
          LIMS
        </div>
        <div style={{ fontSize: 13, color: "#9B9590", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          BA/BE Laboratory Management
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: "#F2F0EB",
        border: "1px solid #E0DBD3",
        borderRadius: 16,
        padding: "40px 48px",
        width: 360,
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "#EBF0E7", border: "1px solid #C8C2B8",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5C6E4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <div style={{ fontSize: 18, fontWeight: 600, color: "#1C1B18", marginBottom: 6 }}>
          Enter Access Code
        </div>
        <div style={{ fontSize: 13, color: "#9B9590", marginBottom: 28 }}>
          Enter your 6-digit PIN to continue
        </div>

        {/* Digit boxes */}
        <div
          style={{
            display: "flex", gap: 10, justifyContent: "center", marginBottom: 20,
            animation: shake ? "shake 0.5s ease" : "none",
          }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              autoFocus={i === 0}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                width: 44, height: 52,
                textAlign: "center",
                fontSize: 22, fontWeight: 600,
                background: "#FFFFFF",
                border: `2px solid ${error ? "#9B3A3A" : d ? "#5C6E4E" : "#E0DBD3"}`,
                borderRadius: 10,
                outline: "none",
                color: "#1C1B18",
                caretColor: "transparent",
                transition: "border-color 0.15s",
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            fontSize: 13, color: "#9B3A3A",
            background: "#FAEAEA", border: "1px solid #E8C4C4",
            borderRadius: 8, padding: "8px 14px",
            marginBottom: 16,
          }}>
            Incorrect code. Please try again.
          </div>
        )}

        <button
          onClick={() => { const code = digits.join(""); if (code.length === 6) submit(code); }}
          style={{
            width: "100%",
            padding: "11px 0",
            background: "#5C6E4E",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#4A5A3D")}
          onMouseLeave={e => (e.currentTarget.style.background = "#5C6E4E")}
        >
          Unlock
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
