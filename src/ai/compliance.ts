/**
 * Claude AI Compliance Analysis — Credit-Aware Router
 * Routes to haiku/sonnet/opus based on assessment complexity.
 * Mirrors ComplianceEngine routing logic for standalone function usage.
 */
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Token tracking (shared with ComplianceEngine if same process)
let _sessionTokens = 0;

export interface ComplianceAnalysis {
  score: number; // 0-100
  findings: string[];
  passed: boolean;
  standard: string;
  summary: string;
  model_used?: string; // which model was routed to
  tokens_used?: number; // tokens consumed by this call
}

const SYSTEM_PROMPT_STANDARD = `You are NEXUS, an autonomous ERC-8004 compliance agent specializing in ERC-3643 and ERC-8004 token standard assessment.

When given a contract address and standard, analyze compliance and return a JSON response with:
- score: number 0-100 (compliance percentage)
- findings: string[] (specific issues found, max 5)
- passed: boolean (score >= 80)
- summary: string (one sentence assessment)

Be precise, technical, and focus on actual standard requirements.
Always respond with valid JSON only.`;

const SYSTEM_PROMPT_DEEP = `You are NEXUS, an autonomous ERC-8004 compliance agent performing a deep 6-pillar assessment.

Analyze the following pillars: Identity Management, Compliance Module, Token Permissions, Investor Registry, Agent Architecture, Regulatory Jurisdiction.

Return JSON: { score, findings (max 5), passed, summary }
Always respond with valid JSON only.`;

export async function analyzeCompliance(
  contractAddress: string,
  standard: string
): Promise<ComplianceAnalysis> {
  // Route by standard complexity
  const isDeep = standard.toUpperCase().includes('8004') ||
                 standard.toLowerCase().includes('cross') ||
                 standard.toLowerCase().includes('dyci');

  const model = isDeep ? 'claude-opus-4-5' : 'claude-sonnet-4-5';
  const maxTokens = isDeep ? 1024 : 512;
  const systemPrompt = isDeep ? SYSTEM_PROMPT_DEEP : SYSTEM_PROMPT_STANDARD;

  const prompt = `Assess compliance for contract ${contractAddress} against ${standard} standard.

For this assessment:
1. Check key ${standard} requirements
2. Identify any compliance gaps
3. Provide a compliance score 0-100

Return JSON: { score, findings, passed, standard, summary }`;

  console.log(`[NEXUS/analyzeCompliance] model=${model} standard=${standard}`);

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const tokensUsed = message.usage ? (message.usage.input_tokens + message.usage.output_tokens) : 0;
  _sessionTokens += tokensUsed;

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    const parsed = JSON.parse(responseText);
    return {
      score: parsed.score ?? 75,
      findings: parsed.findings ?? [],
      passed: parsed.passed ?? (parsed.score >= 80),
      standard,
      summary: parsed.summary ?? 'Assessment completed.',
      model_used: model,
      tokens_used: tokensUsed,
    };
  } catch {
    return {
      score: 75,
      findings: ['Analysis completed — manual review recommended'],
      passed: false,
      standard,
      summary: 'Preliminary assessment completed.',
      model_used: model,
      tokens_used: tokensUsed,
    };
  }
}
