// src/openclaw/UCPServer.ts — Express router for incoming UCP requests
import express, { Request, Response } from "express";
import { UCPHandler, UCPRequest } from "./UCPHandler";

export function createUCPRouter(ucpHandler: UCPHandler) {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok", agent: "NEXUS", protocol: "UCP/1.0", timestamp: new Date().toISOString() });
  });

  router.get("/services", (_req, res) => {
    res.json({
      agent: "NEXUS ERC-8004 Compliance Agent",
      accountId: process.env.NEXUS_ACCOUNT_ID,
      services: [
        { id: "erc3643_audit",      name: "ERC-3643 Compliance Audit",   priceHbar: 5,  deliverySeconds: 30 },
        { id: "mica_analysis",      name: "MiCA Compliance Analysis",    priceHbar: 8,  deliverySeconds: 45 },
        { id: "vara_eligibility",   name: "VARA Eligibility Assessment", priceHbar: 6,  deliverySeconds: 35 },
        { id: "erc8004_assessment", name: "ERC-8004 Trust Score",        priceHbar: 10, deliverySeconds: 60 },
      ],
      nexusTopicId: process.env.NEXUS_TOPIC_ID,
      nftTokenId: process.env.NFT_TOKEN_ID,
    });
  });

  router.post("/request", async (req: Request, res: Response) => {
    const body = req.body as UCPRequest;
    if (!body.requestId || !body.agentId || !body.serviceType || !body.paymentTxId) {
      return res.status(400).json({ error: "Missing required fields: requestId, agentId, serviceType, paymentTxId" });
    }
    const response = await ucpHandler.handleRequest(body);
    const code = response.status === "completed" ? 200 : response.status === "accepted" ? 202 : 400;
    res.status(code).json(response);
  });

  router.get("/request/:requestId", (req: Request, res: Response) => {
    res.json({ requestId: req.params.requestId, status: "completed", message: "Query HCS topic for full attestation" });
  });

  return router;
}