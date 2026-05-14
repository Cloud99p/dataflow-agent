/**
 * DataFlow Agent - Autonomous Data Processing Pipeline
 * 
 * An autonomous agent for the OOBE x Ace Data Cloud bounty.
 * Processes data end-to-end with automatic on-chain payments via x402.
 */

import dotenv from 'dotenv';
import { Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { SapClient } from '@oobe-protocol-labs/synapse-sap-sdk';
import { AceDataCloudService } from './services/ace-data-cloud.js';
import { PaymentService } from './services/payment.js';
import { DataFlowWorkflow } from './agent/workflow.js';
import { loadKeypair, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

async function main() {
  logger.info('🚀 DataFlow Agent Starting...');
  
  // Validate configuration
  const config = validateConfig();
  logger.info('✅ Configuration validated');
  
  // Load agent keypair
  const agentKeypair = loadKeypair(config.agentKeypairPath);
  logger.info(`✅ Agent loaded: ${agentKeypair.publicKey.toString()}`);
  
  // Setup Solana connection
  const connection = new Connection(config.solanaRpcUrl, 'confirmed');
  logger.info(`✅ Connected to ${config.solanaCluster}`);
  
  // Setup Anchor provider
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: agentKeypair.publicKey,
      signTransaction: async (tx) => {
        tx.sign(agentKeypair);
        return tx;
      },
      signAllTransactions: async (txs) => {
        txs.forEach(tx => tx.sign(agentKeypair));
        return txs;
      }
    },
    { commitment: 'confirmed' }
  );
  
  // Initialize SAP client
  const sapClient = SapClient.from(provider);
  logger.info('✅ SAP client initialized');
  
  // Initialize services
  const aceService = new AceDataCloudService(agentKeypair, connection);
  const paymentService = new PaymentService(sapClient);
  const workflow = new DataFlowWorkflow(aceService, paymentService, sapClient);
  
  logger.info('✅ All services initialized');
  logger.info('🎯 DataFlow Agent ready!');
  
  // Example: Process a sample task
  await runDemo(workflow, agentKeypair.publicKey);
}

async function runDemo(workflow: DataFlowWorkflow, agentWallet: any) {
  logger.info('\n📝 Running demo task...');
  
  const sampleTask = {
    id: 'demo-001',
    input: `Bitcoin surged past $95,000 today as institutional adoption continues to accelerate. 
    Major corporations are adding BTC to their treasury reserves, while ETF inflows reached 
    record highs. Analysts predict further growth driven by decreasing supply and increasing 
    demand from both retail and institutional investors. The market sentiment remains bullish 
    despite occasional volatility.`,
    tasks: ['analyze', 'summarize', 'extract'] as const,
    schema: {
      type: 'object',
      properties: {
        price: { type: 'number' },
        sentiment: { type: 'string' },
        keyEntities: { type: 'array', items: { type: 'string' } }
      }
    }
  };
  
  try {
    const result = await workflow.execute(sampleTask, agentWallet);
    logger.info('✅ Task completed successfully!');
    logger.info('Results:', JSON.stringify(result, null, 2));
  } catch (error) {
    logger.error('❌ Task failed:', error);
  }
}

// Start the agent
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
