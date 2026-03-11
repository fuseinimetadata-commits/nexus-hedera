import request from 'supertest';
import express from 'express';
import { assessmentRouter } from '../api/routes';

// Mock the compliance module
jest.mock('../ai/compliance', () => ({
  runComplianceAnalysis: jest.fn().mockResolvedValue({
    compliant: false,
    violations: [{ rule: 'ERC-8004-3.1', severity: 'High', description: 'Test violation', recommendation: 'Fix it' }],
    summary: 'Test summary'
  })
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
    expect(res.body.violations).toBeDefined();
    expect(res.body.agent).toBe('NEXUS');
    expect(res.body.timestamp).toBeDefined();
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
    const res = await request(app)
      .post('/api/assess')
      .send({ query: 'Check compliance', contract_address: '0x1234567890abcdef' });

    expect(res.status).toBe(200);
    const callArg = (runComplianceAnalysis as jest.Mock).mock.calls.at(-1)[0];
    expect(callArg).toContain('0x1234567890abcdef');
  });
});
