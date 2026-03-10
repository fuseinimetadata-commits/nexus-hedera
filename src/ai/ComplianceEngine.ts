import Anthropic from '@anthropic-ai/sdk';
import { AssessmentRequest, AssessmentResult } from '../agent/NexusAgent';

export class ComplianceEngine {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyze(request: AssessmentRequest): Promise<Omit<AssessmentResult, 'certificateNftId' | 'hcsAttestation' | 'reportIpfs'>> {
    const prompt = this.buildPrompt(request);

    const message = await this.client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const responseText = (message.content[0] as { type: string; text: string }).text;
    return this.parseResponse(responseText);
  }

  private buildPrompt(request: AssessmentRequest): string {
    return `You are NEXUS, an autonomous ERC-8004 compliance assessment agent.

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
- <60: F (Non-compliant)

Focus on: identity verification, transfer restrictions, token supply controls, on-chain attestations, and regulatory alignment.

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
