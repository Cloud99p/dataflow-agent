import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';
import { logger } from './logger.js';

export interface Config {
  solanaRpcUrl: string;
  solanaCluster: 'mainnet-beta' | 'devnet' | 'localnet';
  agentKeypairPath: string;
  aceDataCloudApiUrl: string;
  pricePerCallLamports: number;
  maxCallsPerEscrow: number;
  defaultDepositLamports: number;
  clientKeypairPath?: string;
}

export function loadConfig(): Config {
  return {
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://us-1-mainnet.oobeprotocol.ai/rpc?api_key=YOUR_KEY',
    solanaCluster: (process.env.SOLANA_CLUSTER as any) || 'mainnet-beta',
    agentKeypairPath: process.env.AGENT_KEYPAIR_PATH || './keys/dataflow-agent.json',
    aceDataCloudApiUrl: process.env.ACE_DATA_CLOUD_API_URL || 'https://api.acedata.cloud',
    pricePerCallLamports: parseInt(process.env.PRICE_PER_CALL_LAMPORTS || '1000000'),
    maxCallsPerEscrow: parseInt(process.env.MAX_CALLS_PER_ESCROW || '100'),
    defaultDepositLamports: parseInt(process.env.DEFAULT_DEPOSIT_LAMPORTS || '100000000'),
    clientKeypairPath: process.env.CLIENT_KEYPAIR_PATH
  };
}

export function validateConfig(): Config {
  const config = loadConfig();
  
  // Validate RPC URL
  if (!config.solanaRpcUrl || config.solanaRpcUrl.includes('YOUR_KEY')) {
    throw new Error('SOLANA_RPC_URL must be set with a valid Synapse API key');
  }
  
  // Validate cluster
  if (!['mainnet-beta', 'devnet', 'localnet'].includes(config.solanaCluster)) {
    throw new Error('SOLANA_CLUSTER must be mainnet-beta, devnet, or localnet');
  }
  
  // Validate keypair file exists
  if (!fs.existsSync(config.agentKeypairPath)) {
    throw new Error(`Agent keypair not found at: ${config.agentKeypairPath}\nRun: synapse-sap env keypair generate --out ${config.agentKeypairPath}`);
  }
  
  // Validate Ace Data Cloud URL
  if (!config.aceDataCloudApiUrl) {
    throw new Error('ACE_DATA_CLOUD_API_URL must be set');
  }
  
  logger.info('Configuration loaded successfully');
  return config;
}

export function loadKeypair(keypairPath: string): Keypair {
  try {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(keypairData));
  } catch (error) {
    throw new Error(`Failed to load keypair from ${keypairPath}: ${error}`);
  }
}

export function getAgentManifestPath(): string {
  return path.join(process.cwd(), 'manifest.json');
}

export function loadAgentManifest(): any {
  const manifestPath = getAgentManifestPath();
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Agent manifest not found at: ${manifestPath}\nCreate one from manifest.example.json`);
  }
  
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}
