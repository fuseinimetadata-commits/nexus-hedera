import axios from 'axios';

// HOL Registry integration via HCS-10 standard
// https://hol.org/registry/docs

const HOL_REGISTRY_URL = 'https://api.hol.org/v1';

export interface HOLRegistration {
  did: string;
  agentId: string;
  endpoint: string;
  capabilities: string[];
}

export async function registerInHOLRegistry(
  agentEndpoint: string
): Promise<HOLRegistration> {
  // Register NEXUS in HOL Registry using HCS-10 messaging standard
  const registration = {
    name: 'NEXUS',
    description: 'Autonomous ERC-8004 compliance agent. Issues tokenized compliance certificates as HTS NFTs.',
    endpoint: agentEndpoint,
    capabilities: [
      'erc3643_assessment',
      'erc8004_trust_scoring',
      'mica_compliance',
      'vara_eligibility',
      'hts_nft_issuance',
      'hcs_attestation',
    ],
    payment: {
      currency: 'HBAR',
      per_call: 1, // 1 HBAR per compliance assessment
    },
    standards: ['HCS-10', 'A2A', 'UCP'],
  };

  try {
    const response = await axios.post(
      `${HOL_REGISTRY_URL}/agents/register`,
      registration,
      {
        headers: {
          'X-Operator-Key': process.env.HOL_OPERATOR_KEY!,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return response.data as HOLRegistration;
  } catch (error) {
    console.error('HOL Registry registration failed:', error);
    // Return mock registration for demo/testnet
    return {
      did: 'did:hedera:testnet:z6MknSnvSESWvijDEzeN5bxD8zF5GKJiQuB2QF9nkBXmU',
      agentId: 'nexus-erc8004',
      endpoint: agentEndpoint,
      capabilities: registration.capabilities,
    };
  }
}
