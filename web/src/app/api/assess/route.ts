import { NextRequest, NextResponse } from "next/server"

// Proxy to the NEXUS Express backend
export async function POST(req: NextRequest) {
  const body = await req.json()
  const apiUrl = process.env.NEXUS_API_URL || "http://localhost:3001"

  try {
    const res = await fetch(`${apiUrl}/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Backend unavailable"
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
