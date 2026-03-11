import request from 'supertest';
import express from 'express';
import { assessmentRouter } from '../api/routes';
import type { ComplianceAssessment } from '../ai/compliance';

// Mock the compliance module with the real response shape
jest.mock('../ai/compliance', () => ({
  runComplianceAnalysis: jest.fn().mockResolvedValue({
    compliance_score: 55,
    standard: 'ERC-8004',
    findings: ['Missing transfer restriction hook'],
    remediation: ['Implement canTransfer() check'],
    risk_level: 'high',
    summary: 'Test assessment summary'
  } satisfies ComplianceAssessment)
}));

const app = express();
app.use(express.json());
app.use('/api', assessmentRouter);

describe('Assessment API', () => {
  it('POST /api/assess returns compliance result', async () => {
    const res = await request(app)
      .post('/api/assess')
      .send({ query: 'Check this contract', standard: 'ERC-8004' });

    expect(res.status).toBe(200);
    expect(typeof res.body.compliance_score).toBe('number');
    expect(Array.isArray(res.body.findings)).toBe(true);
    expect(res.body.agent).toBe('NEXUS');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('POST /api/assess returns 400 when query is missing', async () => {
    const res = await request(app)
      .post('/api/assess')
      .send({ standard: 'ERC-8004' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('query is required');
  });

  it('POST /api/assess includes contract_address in query when provided', async () => {
    const { runComplianceAnalysis } = require('../ai/compliance');
    (runComplianceAnalysis as jest.Mock).mockClear();

    await request(app)
      .post('/api/assess')
      .send({ query: 'Check compliance', contract_address: '0x1234567890abcdef' });

    expect(runComplianceAnalysis).toHaveBeenCalledWith(
      expect.stringContaining('0x1234567890abcdef'),
      expect.any(String)
    );
  });
});
