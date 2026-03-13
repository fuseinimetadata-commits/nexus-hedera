"use client"
import { useState } from "react"

interface AssessmentResult {
  status: string
  compliance_score: number
  standard: string
  certificate: {
    token_id: string
    serial_number: number
    transaction_id: string
  }
  attestation: {
    topic_id: string
    sequence_number: number
    transaction_id: string
  }
  findings: string[]
  hashscan_url: string
}

const STANDARDS = ["ERC-3643", "ERC-8004", "ERC-3525"]

const GRADE_COLOR: Record<string, string> = {
  A: "var(--green)", B: "#00b4d8", C: "var(--yellow)",
  D: "orange", F: "var(--red)",
}

function scoreToGrade(score: number): string {
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}

function ScoreRing({ score }: { score: number }) {
  const grade = scoreToGrade(score)
  const color = GRADE_COLOR[grade] || "var(--green)"
  const r = 52, circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={r} fill="none" stroke="#2d2d3d" strokeWidth={10} />
        <circle
          cx={64} cy={64} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x={64} y={60} textAnchor="middle" fill={color} fontSize={28} fontWeight="bold">{score}</text>
        <text x={64} y={80} textAnchor="middle" fill="#94a3b8" fontSize={13}>/ 100</text>
      </svg>
      <span style={{ fontSize: 22, fontWeight: "bold", color, letterSpacing: 2 }}>Grade {grade}</span>
    </div>
  )
}

export default function Home() {
  const [contractAddress, setContractAddress] = useState("")
  const [standard, setStandard] = useState("ERC-3643")
  const [requesterAccount, setRequesterAccount] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contractAddress.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_address: contractAddress.trim(),
          standard,
          requester_account: requesterAccount.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Assessment failed")
    } finally {
      setLoading(false)
    }
  }

  const s: Record<string, React.CSSProperties> = {
    page: { maxWidth: 780, margin: "0 auto", padding: "40px 20px" },
    header: { textAlign: "center", marginBottom: 48 },
    logo: { fontSize: 42, fontWeight: 900, letterSpacing: -1, color: "var(--green)" },
    sub: { color: "#64748b", fontSize: 14, marginTop: 6, letterSpacing: 1 },
    card: {
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 32, marginBottom: 24,
    },
    label: { display: "block", fontSize: 12, color: "#64748b", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" as const },
    input: {
      width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "12px 16px", color: "#e2e8f0", fontSize: 14,
      outline: "none", marginBottom: 20,
    },
    select: {
      width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "12px 16px", color: "#e2e8f0", fontSize: 14,
      outline: "none", marginBottom: 20, cursor: "pointer",
    },
    btn: {
      width: "100%", padding: "14px 0", background: "var(--green)", color: "#000",
      border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
      cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
      letterSpacing: 0.5,
    },
    resultCard: {
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 32,
    },
    sectionTitle: { fontSize: 12, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" as const, marginBottom: 12 },
    finding: {
      background: "var(--bg-input)", borderRadius: 8, padding: "10px 14px",
      fontSize: 13, color: "#cbd5e1", marginBottom: 8, borderLeft: "3px solid var(--yellow)",
    },
    certRow: { display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 },
    certLabel: { color: "#64748b" },
    certVal: { color: "var(--green)", fontFamily: "monospace" },
    link: { color: "var(--blue)", fontSize: 13, textDecoration: "none" },
    error: {
      background: "#1a0a0a", border: "1px solid var(--red)", borderRadius: 10,
      padding: 16, color: "var(--red)", fontSize: 14, marginTop: 16,
    },
  }

  return (
    <main style={s.page}>
      <header style={s.header}>
        <div style={s.logo}>NEXUS</div>
        <div style={s.sub}>AUTONOMOUS ERC-3643 COMPLIANCE AGENT · HEDERA TESTNET</div>
      </header>

      <div style={s.card}>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Contract Address</label>
          <input
            style={s.input}
            placeholder="0x... or Hedera token ID (e.g. 0.0.8182680)"
            value={contractAddress}
            onChange={e => setContractAddress(e.target.value)}
            required
          />
          <label style={s.label}>Compliance Standard</label>
          <select style={s.select} value={standard} onChange={e => setStandard(e.target.value)}>
            {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label style={s.label}>Hedera Account (optional — for NFT delivery)</label>
          <input
            style={s.input}
            placeholder="0.0.XXXXXXX"
            value={requesterAccount}
            onChange={e => setRequesterAccount(e.target.value)}
          />
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "⏳ Assessing..." : "▶  Run Compliance Assessment"}
          </button>
        </form>
        {error && <div style={s.error}>⚠ {error}</div>}
      </div>

      {result && (
        <div style={s.resultCard}>
          <div style={{ display: "flex", gap: 32, alignItems: "center", marginBottom: 32, flexWrap: "wrap" as const }}>
            <ScoreRing score={result.compliance_score} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Assessment Complete</div>
              <div style={{ color: "#64748b", fontSize: 14, marginBottom: 12 }}>Standard: {result.standard}</div>
              <a href={result.hashscan_url} target="_blank" rel="noreferrer" style={s.link}>
                View Certificate on HashScan ↗
              </a>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={s.sectionTitle}>HTS Certificate</div>
            <div style={s.certRow}>
              <span style={s.certLabel}>Token ID</span>
              <span style={s.certVal}>{result.certificate.token_id}</span>
            </div>
            <div style={s.certRow}>
              <span style={s.certLabel}>Serial #</span>
              <span style={s.certVal}>{result.certificate.serial_number}</span>
            </div>
            <div style={s.certRow}>
              <span style={s.certLabel}>Transaction</span>
              <span style={{ ...s.certVal, fontSize: 11 }}>{result.certificate.transaction_id}</span>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={s.sectionTitle}>HCS Attestation</div>
            <div style={s.certRow}>
              <span style={s.certLabel}>Topic ID</span>
              <span style={s.certVal}>{result.attestation.topic_id}</span>
            </div>
            <div style={s.certRow}>
              <span style={s.certLabel}>Sequence #</span>
              <span style={s.certVal}>{result.attestation.sequence_number}</span>
            </div>
          </div>

          {result.findings?.length > 0 && (
            <div>
              <div style={s.sectionTitle}>Findings ({result.findings.length})</div>
              {result.findings.map((f, i) => (
                <div key={i} style={s.finding}>{f}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer style={{ textAlign: "center", marginTop: 48, color: "#334155", fontSize: 12, letterSpacing: 1 }}>
        NEXUS · Hedera Testnet · fuseinimetadata-commits/nexus-hedera
      </footer>
    </main>
  )
}
