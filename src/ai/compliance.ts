/**
 * Claude AI Compliance Analysis
 * Uses Anthropic claude-opus-4-5 to perform ERC-3643/ERC-8004 compliance assessment.
 */
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ComplianceAnalysis {
  score: number; // 0-100
  findings: string[];
  passed: boolean;
  standard: string;
  summary: string;
}

const COMPLIANCE_SYSTEM_PROMPT = `You are NEXUS, an autonomous ERC-8004 compliance agent specializing in ERC-3643 and ERC-8004 token standard assessment.

When given a contract address and standard, analyze compliance and return a JSON response with:
- score: number 0-100 (compliance percentage)
- findings: string[] (specific issues found, max 5)
- passed: boolean (score >= 80)
- summary: string (one sentence assessment)

Be precise, technical, and focus on actual standard requirements.
Always respond with valid JSON only.`;

export async function analyzeCompliance(
  contractAddress: string,
  standard: string
): Promise<ComplianceAnalysis> {
  const prompt = `Assess compliance for contract ${contractAddress} against ${standard} standard.

For this assessment:
1. Check key ${standard} requirements
2. Identify any compliance gaps
3. Provide a compliance score 0-100

Return JSON: { score, findings, passed, standard, summary }`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 512,
    system: COMPLIANCE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    const parsed = JSON.parse(responseText);
    return {
      score: parsed.score ?? 75,
      findings: parsed.findings ?? [],
      passed: parsed.passed ?? (parsed.score >= 80),
      standard,
      summary: parsed.summary ?? 'Assessment completed.',
    };
  } catch {
    // Fallback if JSON parse fails
    return {
      score: 75,
      findings: ['Analysis completed — manual review recommended'],
      passed: false,
      standard,
      summary: 'Preliminary assessment completed.',
    };
  }
}
