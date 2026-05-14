/**
 * Agent Identity Manager
 * 
 * Handles SAP agent registration and management.
 */

import { SapClient } from '@synapse-sap/sdk';
import { PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger.js';

export interface AgentCapabilities {
  id: string;
  protocolId: string;
  version: string;
  description: string;
}

export interface PricingTier {
  tierId: string;
  pricePerCall: number;
  rateLimit: number;
  tokenType: 'sol' | 'usdc' | 'spl';
  settlementMode: 'x402' | 'escrow' | 'instant' | 'batched';
}

export interface AgentManifest {
  name: string;
  description: string;
  capabilities: AgentCapabilities[];
  pricing: PricingTier[];
  protocols: string[];
  x402Endpoint: string;
  metadata?: {
    website?: string;
    github?: string;
    contact?: string;
  };
}

export class AgentIdentityManager {
  constructor(private client: SapClient) {}
  
  /**
   * Register agent on SAP
   */
  async register(manifest: AgentManifest): Promise<string> {
    logger.info(`🆔 Registering agent: ${manifest.name}...`);
    
    try {
      const tx = await this.client.agent.register({
        name: manifest.name,
        description: manifest.description,
        capabilities: manifest.capabilities.map(cap => ({
          id: cap.id,
          protocolId: cap.protocolId,
          version: cap.version,
          description: cap.description,
        })),
        pricing: manifest.pricing.map(tier => ({
          tierId: tier.tierId,
          pricePerCall: BigInt(tier.pricePerCall),
          rateLimit: tier.rateLimit,
          tokenType: tier.tokenType,
          settlementMode: tier.settlementMode,
        })),
        protocols: manifest.protocols,
      });
      
      logger.success(`Agent registered: ${tx}`);
      logger.info(`Agent address: ${this.client.walletPubkey.toString()}`);
      
      return tx;
    } catch (error) {
      logger.error('Failed to register agent:', error);
      throw error;
    }
  }
  
  /**
   * Update agent metadata
   */
  async updateMetadata(updates: { name?: string; description?: string }): Promise<string> {
    logger.info('📝 Updating agent metadata...');
    
    try {
      const tx = await this.client.agent.update(updates);
      logger.success(`Agent updated: ${tx}`);
      return tx;
    } catch (error) {
      logger.error('Failed to update agent:', error);
      throw error;
    }
  }
  
  /**
   * Report usage metrics
   */
  async reportMetrics(callsCount: number, latencyMs: number, uptimePercent: number): Promise<void> {
    logger.info('📊 Reporting agent metrics...');
    
    try {
      await this.client.agent.reportCalls(callsCount);
      await this.client.agent.updateReputation(latencyMs, uptimePercent * 100);
      logger.success('Metrics reported');
    } catch (error) {
      logger.error('Failed to report metrics:', error);
    }
  }
  
  /**
   * Fetch agent profile from SAP
   */
  async fetchProfile(agentAddress?: PublicKey): Promise<any> {
    const address = agentAddress || this.client.walletPubkey;
    
    try {
      const agent = await this.client.agent.fetch(address);
      const stats = await this.client.agent.fetchStats(address);
      
      return {
        agent,
        stats,
        isActive: agent.isActive,
        totalCalls: stats.totalCalls,
        reputation: stats.reputation,
      };
    } catch (error) {
      logger.error('Failed to fetch agent profile:', error);
      throw error;
    }
  }
  
  /**
   * Deactivate agent (pause operations)
   */
  async deactivate(): Promise<string> {
    logger.warn('⏸️ Deactivating agent...');
    
    try {
      const tx = await this.client.agent.deactivate();
      logger.success(`Agent deactivated: ${tx}`);
      return tx;
    } catch (error) {
      logger.error('Failed to deactivate agent:', error);
      throw error;
    }
  }
  
  /**
   * Reactivate agent (resume operations)
   */
  async reactivate(): Promise<string> {
    logger.info('▶️ Reactivating agent...');
    
    try {
      const tx = await this.client.agent.reactivate();
      logger.success(`Agent reactivated: ${tx}`);
      return tx;
    } catch (error) {
      logger.error('Failed to reactivate agent:', error);
      throw error;
    }
  }
  
  /**
   * Close agent (permanent, cannot be undone)
   */
  async close(): Promise<string> {
    logger.warn('🚫 Closing agent permanently...');
    
    try {
      const tx = await this.client.agent.close();
      logger.success(`Agent closed: ${tx}`);
      return tx;
    } catch (error) {
      logger.error('Failed to close agent:', error);
      throw error;
    }
  }
}
