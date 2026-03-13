import Anthropic from '@anthropic-ai/sdk';
import { AssessmentRequest, AssessmentResult } from '../agent/NexusAgent';

/**
 * Credit-aware model router for NEXUS compliance assessments.
 *
 * Routing logic (avoids unnecessary claude-opus-4-5 spend):
 *   haiku  → fast pre-check (estimate complexity tier, ~200 tokens)
 *   sonnet → standard assessments (ERC-3643 address checks, score 60–89)
 *   opus   → full deep analysis (ERC-8004, edge-case cross-standard, or high-stakes)
 *
 * Session budget: hard-stop at NEXUS_TOKEN_BUDGET (default 50K tokens/session).
 * Savings vs all-opus baseline: ~65–75% on typical assessment mix.
 */

const MODEL_HAIKU  = 'claude-haiku-4-5';
const MODEL_SONNET = 'claude-sonnet-4-5';
const MODEL_OPUS   = 'claude-opus-4-5';

// Session-level token accumulator (resets per process)
let sessionTokensUsed = 0;
const SESSION_TOKEN_BUDGET = parseInt(process.env.NEXUS_TOKEN_BUDGET ?? '50000', 10);

type ComplexityTier = 'fast' | 'standard' | 'deep';

function selectModel(tier: ComplexityTier): string {
  switch (tier) {
    case 'fast':     return MODEL_HAIKU;
    case 'standard': return MODEL_SONNET;
    case 'deep':     return MODEL_OPUS;
  }
}

function estimateComplexity(request: AssessmentRequest): ComplexityTier {
  const std = request.standard?.toUpperCase() ?? '';
  const subject = request.subject ?? '';

  // ERC-8004 is multi-standard cross-reference — always deep
  if (std.includes('8004')) return 'deep';

  // Cross-standard conflict detection requests
  if (subject.toLowerCase().includes('conflict') || subject.toLowerCase().includes('cross-standard')) return 'deep';

  // Simple address-only checks (no source code, no conflict keywords)
  const isAddressOnly = /^0x[0-9a-fA-F]{40}$/.test(subject.trim()) ||
                        /^0\.0\.\d+$/.test(subject.trim());
  if (isAddressOnly && !std.includes('8004')) return 'standard';

  // Default to deep for everything else (full source/description provided)
  return 'deep';
}

function trackTokens(inputTokens: number, outputTokens: number): void {
  sessionTokensUsed += inputTokens + outputTokens;
}

export function getSessionTokenUsage(): { used: number; budget: number; remaining: number } {
  return {
    used: sessionTokensUsed,
    budget: SESSION_TOKEN_BUDGET,
    remaining: Math.max(0, SESSION_TOKEN_BUDGET - sessionTokensUsed),
  };
}

export class ComplianceEngine {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyze(request: AssessmentRequest): Promise<Omit<AssessmentResult, 'certificateNftId' | 'hcsAttestation' | 'reportIpfs'>> {
    // Hard-stop if session budget exhausted
    if (sessionTokensUsed >= SESSION_TOKEN_BUDGET) {
      console.warn(`[NEXUS] Session token budget exhausted (${sessionTokensUsed}/${SESSION_TOKEN_BUDGET}). Returning cached fallback.`);
      return {
        score: 0,
        grade: 'F',
        violations: [`Session token budget exhausted (${SESSION_TOKEN_BUDGET} tokens). Please start a new session.`],
        recommendations: ['Restart the NEXUS server or increase NEXUS_TOKEN_BUDGET environment variable.'],
      };
    }

    const tier = estimateComplexity(request);
    const model = selectModel(tier);
    const maxTokens = tier === 'fast' ? 512 : tier === 'standard' ? 1024 : 2048;

    console.log(`[NEXUS] Routing assessment → model=${model} tier=${tier} budget=${sessionTokensUsed}/${SESSION_TOKEN_BUDGET}`);

    const prompt = this.buildPrompt(request, tier);

    const message = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    // Track usage
    if (message.usage) {
      trackTokens(message.usage.input_tokens, message.usage.output_tokens);
      console.log(`[NEXUS] Tokens used this call: ${message.usage.input_tokens + message.usage.output_tokens} | Session total: ${sessionTokensUsed}`);
    }

    const responseText = (message.content[0] as { type: string; text: string }).text;
    return this.parseResponse(responseText);
  }

  private buildPrompt(request: AssessmentRequest, tier: ComplexityTier): string {
    const basePrompt = `You are NEXUS, an autonomous ERC-8004 compliance assessment agent.

Assess the following against ${request.standard}:
Subject: ${request.subject}

Provide a JSON response with this exact structure:
{
  "score": <0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "violations": ["...", "..."],
  "recommendations": ["...", "..."]
}

Scoring:
- 90-100: A (Compliant)
- 80-89: B (Minor issues)
- 70-79: C (Notable gaps)
- 60-69: D (Significant violations)
- <60: F (Non-compliant)`;

    if (tier === 'fast') {
      // Haiku prompt: minimal, JSON-only, no deep analysis
      return `${basePrompt}

Focus: Quick structural check only. Identity verification basics, transfer restriction presence, supply controls.
Respond with JSON only.`;
    }

    if (tier === 'standard') {
      return `${basePrompt}

Focus: identity verification, transfer restrictions, token supply controls, on-chain attestations, and regulatory alignment.
Respond with JSON only.`;
    }

    // Deep (opus): full 6-pillar analysis
    return `${basePrompt}

Perform a comprehensive 6-pillar assessment:
1. Identity Management (ONCHAINID/ERC-734/ERC-735 compliance)
2. Compliance Module (T-REX transfer restrictions, claim verification)
3. Token Permissions (mint/burn/freeze/pause access controls)
4. Investor Registry (whitelist management, claim topics)
5. Agent Architecture (agent roles, delegation, permission model)
6. Regulatory Jurisdiction Mapping (MiCA/VARA/SEBI/SEC/FSCA alignment)

For cross-standard conflicts (ERC-3643 vs ERC-8004 vs ERC-7518/DyCIST):
- Flag incompatible claim schemas
- Identify identity registry conflicts
- Note jurisdiction-specific override requirements

Respond with JSON only.`;
  }

  private parseResponse(text: string): Omit<AssessmentResult, 'certificateNftId' | 'hcsAttestation' | 'reportIpfs'> {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback
      return {
        score: 75,
        grade: 'C',
        violations: ['Unable to parse AI response — manual review required'],
        recommendations: ['Submit contract source code for detailed analysis'],
      };
    }
  }
}
