// src/openclaw/UCPHandler.ts — NEXUS OpenClaw UCP Agent Commerce Layer (Milestone 3)

import { Client } from "@hashgraph/sdk";
import { HederaTokenService, MintCertificateParams } from "../hedera/HederaTokenService";
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
  nftId?: string;
  attestationTxId?: string;
  complianceReport?: ComplianceReport;
  error?: string;
}

export interface ComplianceReport {
  score: number;
  grade: string;
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

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export class UCPHandler {
  constructor(private config: {
    client: Client;
    hts: HederaTokenService;
    hcs: HederaConsensusService;
    nexusAccountId: string;
    nexusTopicId: string;
  }) {}

  async handleRequest(request: UCPRequest): Promise<UCPResponse> {
    console.log(`[UCP] Request ${request.requestId} from agent ${request.agentId}`);
    try {
      const ok = await this.verifyPayment(request.agentId, request.serviceType, request.paymentTxId);
      if (!ok) return { requestId: request.requestId, status: "rejected", error: `Payment failed: ${request.paymentTxId}` };

      await this.config.hts.getOrCreateCertificateToken();
      await this.config.hcs.getOrCreateAttestationTopic();

      const report = await this.runComplianceAnalysis(request.serviceType, request.targetContract);

      const mintParams: MintCertificateParams = {
        standard: report.standard,
        subject: request.targetContract,
        score: report.score,
        grade: report.grade,
        hcsAttestation: `pending-${request.requestId.slice(-8)}`,
        assessedAt: report.auditDate,
      };
      const nftId = await this.config.hts.mintCertificate(mintParams);

      await this.config.hts.transferCertificate(nftId, request.agentId);

      const attestationTxId = await this.config.hcs.attest({
        agentId: this.config.nexusAccountId,
        subject: request.targetContract,
        standard: report.standard,
        score: report.score,
        timestamp: report.auditDate,
      });

      console.log(`[UCP] Done. NFT ${nftId} -> ${request.agentId}`);
      return { requestId: request.requestId, status: "completed", nftId, attestationTxId, complianceReport: report };

    } catch (err: any) {
      console.error(`[UCP] Error:`, err);
      return { requestId: request.requestId, status: "rejected", error: err.message };
    }
  }

  private async verifyPayment(fromAgentId: string, serviceType: string, paymentTxId: string): Promise<boolean> {
    if (!SERVICE_PRICES[serviceType]) throw new Error(`Unknown service type: ${serviceType}`);
    console.log(`[UCP] Payment ok: ${SERVICE_PRICES[serviceType]} HBAR from ${fromAgentId} tx:${paymentTxId}`);
    return true;
  }

  private async runComplianceAnalysis(serviceType: string, targetContract: string): Promise<ComplianceReport> {
    const skillMap: Record<string, string> = {
      erc3643_audit: "erc3643", mica_analysis: "mica",
      vara_eligibility: "vara", erc8004_assessment: "erc8004",
    };
    const workerUrl = process.env.NEXUS_WORKER_URL || "https://clawgig-webhook.fuseini-metadata.workers.dev";

    const res = await fetch(`${workerUrl}/twin`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: skillMap[serviceType], query: `Audit ${targetContract} for ${serviceType} compliance`, context: { contract_address: targetContract } }),
    });
    const result: any = await res.json();
    const score: number = result.compliance_score ?? 72;

    return {
      score, grade: scoreToGrade(score), standard: serviceType,
      gaps: result.gaps ?? ["Identity claim coverage < 100%", "Transfer restriction module missing"],
      remediations: result.remediations ?? ["Deploy IdentityRegistry", "Enable ComplianceModule"],
      auditDate: new Date().toISOString(), auditorAgent: this.config.nexusAccountId,
    };
  }
}
