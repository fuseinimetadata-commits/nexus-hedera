'use client';
import { useEffect, useState } from 'react';

interface AgentEvent {
  id: string;
  type: 'assessment' | 'nft_mint' | 'hcs_attestation' | 'ucp_request';
  subject: string;
  standard: string;
  score?: number;
  grade?: string;
  nftId?: string;
  attestation?: string;
  timestamp: string;
}

export default function ObserverUI() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [tokenId, setTokenId] = useState<string>('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Fetch agent health / token ID
    fetch('/health')
      .then(r => r.json())
      .then(data => {
        setTokenId(data.tokenId);
        setIsLive(data.status === 'ok');
      })
      .catch(() => setIsLive(false));

    // Poll for events (in production: use WebSocket)
    const interval = setInterval(() => {
      fetch('/api/events')
        .then(r => r.json())
        .then(data => setEvents(data.events || []))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const gradeColor = (grade?: string) => {
    switch (grade) {
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-yellow-400';
      case 'D': return 'text-orange-400';
      case 'F': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-purple-400">NEXUS Observer</h1>
          <p className="text-sm text-gray-500">ERC-8004 Compliance Agent · Hedera Network</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-sm">{isLive ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">HTS Token</div>
          <div className="text-sm text-purple-300">{tokenId || 'Initializing...'}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">Assessments</div>
          <div className="text-2xl font-bold">{events.filter(e => e.type === 'assessment').length}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">NFTs Minted</div>
          <div className="text-2xl font-bold">{events.filter(e => e.type === 'nft_mint').length}</div>
        </div>
      </div>

      {/* Event Feed */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">Agent Event Feed</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              Waiting for agent activity...
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="p-4 flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-purple-300">{event.type}</span>
                    <span className="text-xs text-gray-500">{event.standard}</span>
                    {event.grade && (
                      <span className={`text-sm font-bold ${gradeColor(event.grade)}`}>
                        {event.grade} ({event.score})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300 truncate">{event.subject}</div>
                  {event.nftId && (
                    <div className="text-xs text-gray-500 mt-1">NFT: {event.nftId}</div>
                  )}
                </div>
                <div className="text-xs text-gray-600">{new Date(event.timestamp).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
