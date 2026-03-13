import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NEXUS — ERC-3643 Compliance Agent',
  description: 'Autonomous ERC-3643 & ERC-8004 compliance assessment with Hedera HTS certificates',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            background: #0a0a0f;
            color: #e2e8f0;
            min-height: 100vh;
          }
          :root {
            --green: #00d084;
            --red: #ff4757;
            --yellow: #ffd32a;
            --blue: #2196f3;
            --purple: #7c3aed;
            --bg-card: #13131a;
            --bg-input: #1a1a24;
            --border: #2d2d3d;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
