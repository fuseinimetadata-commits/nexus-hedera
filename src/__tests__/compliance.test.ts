import { runComplianceAnalysis } from '../ai/compliance';

// Mock the Anthropic client so tests run without a real API key
jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              compliant: false,
              violations: [
                {
                  rule: 'ERC-8004-3.1',
                  severity: 'Critical',
                  description: 'Missing KYC gate on transfer function',
                  recommendation: 'Add identity registry check before transfer'
                }
              ],
              summary: 'Contract has 1 critical compliance violation'
            })
          }]
        })
      }
    }))
  };
});

describe('ComplianceEngine', () => {
  it('detects ERC-8004 violations in non-compliant contract', async () => {
    const result = await runComplianceAnalysis(
      'Analyze this ERC-20 token without transfer restrictions',
      'ERC-8004'
    );
    expect(result).toBeDefined();
    expect(result.violations).toBeDefined();
    expect(Array.isArray(result.violations)).toBe(true);
  });

  it('returns compliant result for valid contract description', async () => {
    // Override mock for this test
    const anthropicModule = require('@anthropic-ai/sdk');
    anthropicModule.default.mockImplementationOnce(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              compliant: true,
              violations: [],
              summary: 'Contract is fully ERC-8004 compliant'
            })
          }]
        })
      }
    }));

    const result = await runComplianceAnalysis(
      'ERC-3643 compliant token with identity registry and transfer restrictions',
      'ERC-8004'
    );
    expect(result.violations).toHaveLength(0);
  });

  it('includes standard in analysis context', async () => {
    const createMock = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ compliant: true, violations: [], summary: 'ok' }) }]
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
