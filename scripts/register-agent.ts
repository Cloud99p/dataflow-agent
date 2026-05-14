/**
 * Agent Registration Script
 * 
 * Registers the DataFlow Agent on SAP mainnet.
 */

import dotenv from 'dotenv';
import { Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { SapClient } from '@synapse-sap/sdk';
import { loadKeypair, loadAgentManifest } from '../src/utils/config.js';
import { AgentIdentityManager } from '../src/agent/identity.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

async function registerAgent() {
  logger.info('🆔 DataFlow Agent Registration');
  logger.info('==============================\n');
  
  // Load configuration
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl || rpcUrl.includes('YOUR_KEY')) {
    logger.error('❌ SOLANA_RPC_URL must be set in .env');
    logger.error('   Get your API key from: https://synapse.oobeprotocol.ai/');
    process.exit(1);
  }
  
  const keypairPath = process.env.AGENT_KEYPAIR_PATH || './keys/dataflow-agent.json';
  
  // Load keypair
  logger.info(`Loading keypair from: ${keypairPath}`);
  const keypair = loadKeypair(keypairPath);
  logger.info(`✅ Agent address: ${keypair.publicKey.toString()}`);
  
  // Load manifest
  logger.info('Loading agent manifest...');
  const manifest = loadAgentManifest();
  logger.info(`✅ Agent name: ${manifest.name}`);
  
  // Setup connection
  logger.info(`Connecting to: ${rpcUrl}`);
  const connection = new Connection(rpcUrl, 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  logger.info(`💰 Balance: ${balance / 1e9} SOL`);
  
  if (balance < 0.1e9) {
    logger.warn('⚠️  Low balance! Recommend at least 0.1 SOL for registration and operations');
  }
  
  // Setup provider
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: keypair.publicKey,
      signTransaction: async (tx) => {
        tx.sign(keypair);
        return tx;
      },
      signAllTransactions: async (txs) => {
        txs.forEach(tx => tx.sign(keypair));
        return txs;
      }
    },
    { commitment: 'confirmed' }
  );
  
  // Initialize SAP client
  const sapClient = SapClient.from(provider);
  const identityManager = new AgentIdentityManager(sapClient);
  
  // Check if already registered
  try {
    const profile = await identityManager.fetchProfile();
    if (profile.isActive) {
      logger.warn('⚠️  Agent already registered and active!');
      logger.info('Profile:', JSON.stringify(profile, null, 2));
      
      const answer = await prompt('Update existing registration? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        logger.info('Exiting...');
        process.exit(0);
      }
    }
  } catch (error) {
    logger.info('Agent not yet registered (this is expected for first-time setup)');
  }
  
  // Register agent
  logger.info('\n📝 Registering agent on SAP...');
  logger.info('This will create on-chain accounts for:');
  logger.info('  - Agent identity');
  logger.info('  - Capabilities index');
  logger.info('  - Pricing tiers');
  logger.info('');
  
  const answer = await prompt('Continue with registration? (y/n): ');
  if (answer.toLowerCase() !== 'y') {
    logger.info('Registration cancelled');
    process.exit(0);
  }
  
  try {
    const tx = await identityManager.register(manifest);
    
    logger.success('\n✅ Agent registered successfully!');
    logger.info(`Transaction: ${tx}`);
    logger.info(`Agent address: ${keypair.publicKey.toString()}`);
    logger.info('');
    logger.info('View your agent on SAP Explorer:');
    logger.info(`https://explorer.oobeprotocol.ai/agents/${keypair.publicKey.toString()}`);
    logger.info('');
    logger.info('Next steps:');
    logger.info('1. Wait for transaction confirmation (~30 seconds)');
    logger.info('2. Verify on SAP Explorer');
    logger.info('3. Run: npm run demo  (to test the workflow)');
    logger.info('');
    
  } catch (error: any) {
    logger.error('❌ Registration failed:', error.message);
    logger.error('');
    logger.error('Common issues:');
    logger.error('  - Insufficient SOL balance');
    logger.error('  - Invalid RPC URL or API key');
    logger.error('  - Network congestion (try again)');
    process.exit(1);
  }
}

// Simple prompt function
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    import('readline').then((rl) => {
      const readline = rl.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      readline.question(question, (answer) => {
        readline.close();
        resolve(answer);
      });
    });
  });
}

registerAgent().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
