/**
 * Autonomous On-Chain Agent
 * 
 * Complete autonomous agent for OOBE Protocol bounty.
 * Executes end-to-end workflow without human intervention.
 * 
 * Usage: npm start
 * 
 * Environment Variables:
 * - SOLANA_RPC_URL: Synapse RPC with API key
 * - SOLANA_CLUSTER: mainnet-beta or devnet
 * - AGENT_KEYPAIR_PATH: Path to agent keypair JSON
 * - ACE_DATA_CLOUD_API_URL: Ace Data Cloud API endpoint
 * 
 * Output: JSON log to stdout with all workflow details
 * Exit Code: 0 on success, 1 on failure
 */

import dotenv from 'dotenv';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { SapClient } from '@oobe-protocol-labs/synapse-sap-sdk';
import { AceDataCloudService } from './services/ace-data-cloud.js';
import { PaymentService } from './services/payment.js';
import { DataFlowWorkflow, WorkflowTrigger } from './agent/workflow.js';
import { AgentIdentityManager } from './agent/identity.js';
import { loadKeypair, validateConfig, loadAgentManifest } from './utils/config.js';

dotenv.config();

// ============== Main Entry Point ==============

async function main() {
  const startTime = Date.now();
  
  console.log('='.repeat(70));
  console.log('🤖 Autonomous On-Chain Agent - OOBE Protocol Bounty');
  console.log('='.repeat(70));
  console.log('');
  
  try {
    // ========== Initialization ==========
    console.log('⚙️  Initializing agent...');
    
    // Validate configuration
    const config = validateConfig();
    
    // Load agent keypair
    const agentKeypair = loadKeypair(config.agentKeypairPath);
    const agentAddress = agentKeypair.publicKey.toString();
    
    console.log(`   Agent: ${agentAddress}`);
    console.log(`   Network: ${config.solanaCluster}`);
    console.log(`   RPC: ${config.solanaRpcUrl.split('?')[0]}...`);
    console.log('');
    
    // Setup Solana connection
    const connection = new Connection(config.solanaRpcUrl, 'confirmed');
    
    // Check balance
    const balance = await connection.getBalance(agentKeypair.publicKey);
    console.log(`   Balance: ${(balance / 1e9).toFixed(4)} SOL`);
    
    if (balance < 0.01e9) {
      console.warn('⚠️  WARNING: Low balance! May not have enough for transactions.');
    }
    console.log('');
    
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
    
    // Initialize services
    const aceService = new AceDataCloudService(agentKeypair, connection);
    const paymentService = new PaymentService(sapClient);
    const identityManager = new AgentIdentityManager(sapClient);
    const workflow = new DataFlowWorkflow(aceService, paymentService, sapClient, connection);
    
    console.log('✅ Agent initialized successfully');
    console.log('');
    
    // ========== Registration (if needed) ==========
    console.log('📋 Checking agent registration...');
    
    let registrationTx: string | undefined;
    
    try {
      const profile = await identityManager.fetchProfile();
      if (profile.isActive) {
        console.log('   ✓ Agent already registered and active');
      } else {
        console.log('   ⚠️  Agent registered but inactive, reactivating...');
        await identityManager.reactivate();
      }
    } catch (error: any) {
      console.log('   ⚠️  Agent not registered, registering now...');
      
      try {
        const manifest = loadAgentManifest();
        registrationTx = await identityManager.register(manifest);
        console.log(`   ✓ Agent registered: ${registrationTx}`);
        
        // Wait for confirmation
        console.log('   ⏳ Waiting for registration confirmation...');
        await sleep(5000);
      } catch (regError: any) {
        console.log(`   ✗ Registration failed: ${regError.message}`);
        console.log('   Continuing with workflow (registration may not be required for demo)');
      }
    }
    console.log('');
    
    // ========== Workflow Execution ==========
    console.log('🚀 Starting autonomous workflow...');
    console.log('');
    
    // Create trigger (simulated on-chain event)
    const trigger: WorkflowTrigger = {
      type: 'onchain-event',
      data: {
        eventType: 'workflow_trigger',
        blockTime: Date.now(),
        slot: await connection.getSlot()
      },
      timestamp: Date.now()
    };
    
    // Execute workflow
    const log = await workflow.execute(trigger, agentKeypair.publicKey);
    
    // Add registration tx to log
    if (registrationTx) {
      log.agentRegistrationTx = registrationTx;
    }
    
    // ========== Final Summary ==========
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('');
    console.log('='.repeat(70));
    console.log('📊 WORKFLOW SUMMARY');
    console.log('='.repeat(70));
    console.log(`Status: ${log.status.toUpperCase()}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Services Used: ${log.successSteps}/${log.selectedServices.length}`);
    console.log(`Total Cost: ${log.totalCostSOL.toFixed(6)} SOL`);
    console.log(`Success Steps: ${log.successSteps}`);
    console.log(`Failed Steps: ${log.failedSteps}`);
    console.log(`Total Retries: ${log.totalRetries}`);
    
    if (log.sentinelSecurityScore) {
      console.log(`Security Score: ${log.sentinelSecurityScore.score}/100 (${log.sentinelSecurityScore.riskLevel})`);
    }
    
    if (log.sentinelVerification) {
      console.log(`Sentinel Verified: ${log.sentinelVerification.verified ? 'YES' : 'NO'}`);
    }
    
    console.log('');
    console.log('Payment Transactions:');
    log.paymentTransactions.forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.slice(0, 40)}...`);
    });
    
    console.log('');
    console.log('='.repeat(70));
    console.log('✅ Autonomous agent execution complete');
    console.log('='.repeat(70));
    
    // Exit with appropriate code
    if (log.status === 'success') {
      process.exit(0);
    } else if (log.status === 'halted') {
      console.warn('⚠️  Workflow was halted by security check');
      process.exit(2);
    } else {
      console.error('❌ Workflow failed');
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ FATAL ERROR');
    console.error('='.repeat(70));
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Check .env configuration');
    console.error('  2. Verify agent keypair exists');
    console.error('  3. Ensure sufficient SOL balance');
    console.error('  4. Check network connectivity');
    console.error('='.repeat(70));
    
    process.exit(1);
  }
}

// ============== Utilities ==============

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============== Run ==============

main();
