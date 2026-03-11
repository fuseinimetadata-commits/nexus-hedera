import { runComplianceAnalysis } from '../ai/compliance';
import type { ComplianceAssessment } from '../ai/compliance';

// Mock the Anthropic client so tests run without a real API key
jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              compliance_score: 40,
              standard: 'ERC-8004',
              findings: ['Missing KYC gate on transfer function'],
              remediation: ['Add identity registry check before transfer'],
              risk_level: 'critical',
              summary: 'Contract has 1 critical compliance finding'
            } satisfies ComplianceAssessment)
          }]
        })
      }
    }))
  };
});

describe('ComplianceEngine', () => {
  it('returns a ComplianceAssessment with required fields', async () => {
    const result = await runComplianceAnalysis(
      'Analyze this ERC-20 token without transfer restrictions',
      'ERC-8004'
    );
    expect(result).toBeDefined();
    expect(typeof result.compliance_score).toBe('number');
    expect(typeof result.standard).toBe('string');
    expect(Array.isArray(result.findings)).toBe(true);
    expect(Array.isArray(result.remediation)).toBe(true);
    expect(['low', 'medium', 'high', 'critical']).toContain(result.risk_level);
    expect(typeof result.summary).toBe('string');
  });

  it('returns low score for non-compliant contract', async () => {
    const result = await runComplianceAnalysis(
      'Basic ERC-20 with no transfer restrictions or KYC',
      'ERC-8004'
    );
    expect(result.compliance_score).toBeLessThan(100);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('includes standard in analysis context', async () => {
    const createMock = jest.fn().mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          compliance_score: 95,
          standard: 'ERC-3643',
          findings: [],
          remediation: [],
          risk_level: 'low',
          summary: 'Fully compliant'
        } satisfies ComplianceAssessment)
      }]
    });
    const anthropicModule = require('@anthropic-ai/sdk');
    anthropicModule.default.mockImplementationOnce(() => ({
      messages: { create: createMock }
    }));

    await runComplianceAnalysis('Test query', 'ERC-3643');
    const callArgs = createMock.mock.calls[0][0];
    const promptContent = JSON.stringify(callArgs);
    expect(promptContent).toContain('ERC-3643');
  });
});
