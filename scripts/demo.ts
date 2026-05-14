/**
 * Demo Script
 * 
 * Demonstrates the complete DataFlow Agent workflow.
 */

import dotenv from 'dotenv';
import { Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { SapClient } from '@synapse-sap/sdk';
import { AceDataCloudService } from '../src/services/ace-data-cloud.js';
import { PaymentService } from '../src/services/payment.js';
import { DataFlowWorkflow } from '../src/agent/workflow.js';
import { loadKeypair, validateConfig } from '../src/utils/config.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

async function runDemo() {
  logger.info('🎬 DataFlow Agent Demo');
  logger.info('=====================\n');
  
  try {
    // Validate config
    const config = validateConfig();
    
    // Load agent keypair
    const agentKeypair = loadKeypair(config.agentKeypairPath);
    logger.info(`🤖 Agent: ${agentKeypair.publicKey.toString()}`);
    
    // Setup connection
    const connection = new Connection(config.solanaRpcUrl, 'confirmed');
    
    // Setup provider
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
    
    // Initialize clients
    const sapClient = SapClient.from(provider);
    const aceService = new AceDataCloudService(agentKeypair, connection);
    const paymentService = new PaymentService(sapClient);
    const workflow = new DataFlowWorkflow(aceService, paymentService, sapClient);
    
    logger.info('✅ All services initialized\n');
    
    // Demo Task 1: Full processing pipeline
    logger.info('📋 Demo Task 1: Full Processing Pipeline');
    logger.info('─'.repeat(50));
    
    const task1 = {
      id: 'demo-001',
      input: `Bitcoin surged past $95,000 today as institutional adoption continues to accelerate. 
      Major corporations including MicroStrategy and Tesla are adding BTC to their treasury reserves, 
      while ETF inflows reached record highs of $996.4M this week. Analysts predict further growth 
      driven by decreasing supply from the recent halving and increasing demand from both retail 
      and institutional investors. The market sentiment remains bullish despite occasional volatility.`,
      tasks: ['analyze', 'summarize', 'extract'] as const,
      schema: {
        type: 'object',
        properties: {
          price: { type: 'number', description: 'Mentioned Bitcoin price' },
          sentiment: { type: 'string', description: 'Overall market sentiment' },
          keyEntities: { type: 'array', items: { type: 'string' }, description: 'Companies mentioned' }
        }
      }
    };
    
    logger.info('Input text:', task1.input.substring(0, 100) + '...');
    logger.info('Tasks: analyze, summarize, extract');
    logger.info('');
    
    const result1 = await workflow.execute(task1, agentKeypair.publicKey);
    
    logger.info('\n📊 Results:');
    logger.info('Status:', result1.status);
    logger.info('API calls:', result1.apiCallsCount);
    logger.info('Payment TX:', result1.paymentTx);
    logger.info('Total cost:', result1.totalCostLamports, 'lamports');
    
    if (result1.analysis) {
      logger.info('\nAnalysis:');
      logger.info('  Sentiment:', result1.analysis.sentiment.label, `(score: ${result1.analysis.sentiment.score})`);
      logger.info('  Keywords:', result1.analysis.keywords.slice(0, 3).map(k => k.text).join(', '));
    }
    
    if (result1.summary) {
      logger.info('\nSummary:');
      logger.info(' ', result1.summary.summary);
    }
    
    if (result1.extracted) {
      logger.info('\nExtracted Data:');
      logger.info(' ', JSON.stringify(result1.extracted.extracted, null, 2));
    }
    
    logger.info('\n' + '═'.repeat(50));
    logger.info('✅ Demo completed successfully!');
    logger.info('');
    logger.info('This demonstrates:');
    logger.info('  ✓ Tool discovery via SAP');
    logger.info('  ✓ Ace Data Cloud API integration (3 services)');
    logger.info('  ✓ x402 automatic payment handling');
    logger.info('  ✓ On-chain settlement via SAP escrow');
    logger.info('  ✓ Complete autonomous workflow');
    logger.info('');
    logger.info('Ready for bounty submission! 🚀');
    
  } catch (error: any) {
    logger.error('❌ Demo failed:', error.message);
    logger.error('');
    logger.error('Troubleshooting:');
    logger.error('  - Check .env configuration');
    logger.error('  - Ensure agent is registered on SAP');
    logger.error('  - Verify Ace Data Cloud account has credits');
    logger.error('  - Check Solana balance for gas fees');
    process.exit(1);
  }
}

runDemo();
