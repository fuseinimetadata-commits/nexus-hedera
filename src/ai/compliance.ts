import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ComplianceAssessment {
  compliance_score: number;
  standard: string;
  findings: string[];
  remediation: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
}

const SYSTEM_PROMPT = `You are NEXUS, an autonomous ERC-8004 compliance agent specializing in:
- ERC-3643 / T-REX tokenized asset compliance
- ERC-8004 AI agent trust scoring
- MiCA (Markets in Crypto-Assets Regulation) assessment
- VARA (Virtual Assets Regulatory Authority) eligibility

For each compliance query, return a JSON response with:
- compliance_score (0-100)
- standard (which framework was assessed)
- findings (array of specific compliance gaps found)
- remediation (array of specific steps to fix each gap)
- risk_level (low/medium/high/critical)
- summary (1-2 sentence executive summary)`;

export async function runComplianceAnalysis(
  query: string,
  standard: string = 'ERC-8004'
): Promise<ComplianceAssessment> {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Standard: ${standard}\n\nQuery: ${query}\n\nReturn only valid JSON.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  try {
    return JSON.parse(content.text) as ComplianceAssessment;
  } catch {
    // Fallback structure if JSON parsing fails
    return {
      compliance_score: 0,
      standard,
      findings: ['Unable to parse compliance analysis'],
      remediation: ['Retry with more specific query'],
      risk_level: 'high',
      summary: content.text.substring(0, 200),
    };
  }
}
