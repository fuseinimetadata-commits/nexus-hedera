import { Router, Request, Response } from 'express';
import { runComplianceAnalysis } from '../ai/compliance';

export const assessmentRouter = Router();

// Main compliance assessment endpoint
assessmentRouter.post('/assess', async (req: Request, res: Response) => {
  try {
    const { query, standard = 'ERC-8004', contract_address } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const fullQuery = contract_address
      ? `${query} (Contract: ${contract_address})`
      : query;

    const assessment = await runComplianceAnalysis(fullQuery, standard);

    return res.json({
      ...assessment,
      agent: 'NEXUS',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Assessment error:', error);
    return res.status(500).json({ error: 'Assessment failed' });
  }
});

// OpenClaw UCP skill endpoint
assessmentRouter.post('/skill', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    const { query, standard = 'ERC-8004' } = input || {};

    if (!query) {
      return res.status(400).json({ error: 'input.query is required' });
    }

    const assessment = await runComplianceAnalysis(query, standard);

    return res.json({
      output: assessment,
      agent_id: '20065',
      skill: 'nexus-erc8004-compliance',
    });
  } catch (error) {
    console.error('Skill error:', error);
    return res.status(500).json({ error: 'Skill execution failed' });
  }
});

// HOL Registry A2A endpoint
assessmentRouter.post('/a2a', async (req: Request, res: Response) => {
  try {
    const { method, params } = req.body;

    if (method === 'assess') {
      const assessment = await runComplianceAnalysis(
        params.query,
        params.standard || 'ERC-8004'
      );
      return res.json({ result: assessment, id: req.body.id });
    }

    return res.status(400).json({ error: `Unknown method: ${method}` });
  } catch (error) {
    console.error('A2A error:', error);
    return res.status(500).json({ error: 'A2A request failed' });
  }
});
