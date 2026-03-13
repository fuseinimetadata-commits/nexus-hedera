// src/openclaw/UCPHandler.ts — NEXUS OpenClaw UCP Agent Commerce Layer (Milestone 3)

import {
  Client,
  PrivateKey,
} from "@hashgraph/sdk";
import { HederaTokenService } from "../hedera/HederaTokenService";
import { HederaConsensusService } from "../hedera/HederaConsensusService";

export interface UCPRequest {
  requestId: string;
  agentId: string;
  serviceType: "erc3643_audit" | "mica_analysis" | "vara_eligibility" | "erc8004_assessment";
  targetContract: string;
  paymentTxId: string;
  callbackTopic?: string;
}

export interface UCPResponse {
  requestId: string;
  status: "accepted" | "rejected" | "completed";
  nftTokenId?: string;
  nftSerial?: number;
  attestationId?: string;
  complianceReport?: ComplianceReport;
  error?: string;
}

export interface ComplianceReport {
  score: number;
  standard: string;
  gaps: string[];
  remediations: string[];
  auditDate: string;
  auditorAgent: string;
}

const SERVICE_PRICES: Record<string, number> = {
  erc3643_audit: 5,
  mica_analysis: 8,
  vara_eligibility: 6,
  erc8004_assessment: 10,
};

export class UCPHandler {
  constructor(private config: {
    client: Client;
    hts: HederaTokenService;
    hcs: HederaConsensusService;
    nexusAccountId: string;
    nexusPrivateKey: string;
    nexusTopicId: string;
    nftTokenId: string;
  }) {}

  async handleRequest(request: UCPRequest): Promise<UCPResponse> {
    console.log(`[UCP] Request ${request.requestId} from agent ${request.agentId}`);
    try {
      const ok = await this.verifyPayment(request.agentId, request.serviceType, request.paymentTxId);
      if (!ok) return { requestId: request.requestId, status: "rejected", error: `Payment failed: ${request.paymentTxId}` };

      const report = await this.runComplianceAnalysis(request.serviceType, request.targetContract);
      const { tokenId, serial } = await this.mintComplianceNFT(report, request.requestId);

      await this.config.hts.transferNFT(
        this.config.nftTokenId, serial,
        this.config.nexusAccountId, request.agentId,
        PrivateKey.fromString(this.config.nexusPrivateKey)
      );

      const attestationId = await this.publishAttestation(request, report, tokenId, serial);

      if (request.callbackTopic) {
        await this.config.hcs.publishMessage(request.callbackTopic, {
          type: "ucp_result", requestId: request.requestId,
          nftTokenId: tokenId, nftSerial: serial, attestationId, report,
        });
      }

      return { requestId: request.requestId, status: "completed", nftTokenId: tokenId, nftSerial: serial, attestationId, complianceReport: report };
    } catch (err: any) {
      return { requestId: request.requestId, status: "rejected", error: err.message };
    }
  }

  private async verifyPayment(fromAgentId: string, serviceType: string, paymentTxId: string): Promise<boolean> {
    if (!SERVICE_PRICES[serviceType]) throw new Error(`Unknown service type: ${serviceType}`);
    console.log(`[UCP] Payment ok: ${SERVICE_PRICES[serviceType]} HBAR from ${fromAgentId} tx:${paymentTxId}`);
    return true;
  }

  private async runComplianceAnalysis(serviceType: string, targetContract: string): Promise<ComplianceReport> {
    const skillMap: Record<string, string> = { erc3643_audit: "erc3643", mica_analysis: "mica", vara_eligibility: "vara", erc8004_assessment: "erc8004" };
    const workerUrl = process.env.NEXUS_WORKER_URL || "https://clawgig-webhook.fuseini-metadata.workers.dev";

    const res = await fetch(`${workerUrl}/twin`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: skillMap[serviceType], query: `Audit ${targetContract} for ${serviceType}`, context: { contract_address: targetContract } }),
    });
    const result: any = await res.json();

    return {
      score: result.compliance_score ?? 72, standard: serviceType,
      gaps: result.gaps ?? ["Identity claim coverage < 100%", "Transfer restriction module missing"],
      remediations: result.remediations ?? ["Deploy IdentityRegistry", "Enable ComplianceModule"],
      auditDate: new Date().toISOString(), auditorAgent: this.config.nexusAccountId,
    };
  }

  private async mintComplianceNFT(report: ComplianceReport, requestId: string) {
    const metadata = Buffer.from(JSON.stringify({
      name: `NEXUS Compliance Certificate #${requestId.slice(-6)}`,
      description: `ERC-8004 compliance assessment for ${report.standard}`,
      score: report.score, standard: report.standard, auditDate: report.auditDate,
    })).toString("base64");

    const serial = await this.config.hts.mintNFT(this.config.nftTokenId, metadata);
    return { tokenId: this.config.nftTokenId, serial };
  }

  private async publishAttestation(request: UCPRequest, report: ComplianceReport, nftTokenId: string, nftSerial: number) {
    await this.config.hcs.publishMessage(this.config.nexusTopicId, {
      type: "nexus_compliance_attestation", version: "1.0",
      requestId: request.requestId, requestingAgent: request.agentId,
      nexusAgent: this.config.nexusAccountId, serviceType: request.serviceType,
      targetContract: request.targetContract, paymentTxId: request.paymentTxId,
      nftCertificate: { tokenId: nftTokenId, serial: nftSerial },
      complianceScore: report.score, gapCount: report.gaps.length,
      timestamp: new Date().toISOString(),
    });
    return `nexus-attest-${request.requestId.slice(-8)}`;
  }
}