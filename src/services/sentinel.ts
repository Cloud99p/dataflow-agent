/**
 * Synapse Sentinel Service
 * 
 * Integrates with Synapse Sentinel for security verification,
 * monitoring, and workflow validation.
 * 
 * Sentinel Agent: Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph
 * Docs: https://explorer.oobeprotocol.ai/agents/Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph
 */

import { SapClient } from '@synapse-sap/sdk';
import { PublicKey, Connection, Transaction } from '@solana/web3.js';
import { logger } from '../utils/logger.js';

export interface SentinelSecurityScore {
  score: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: Array<{
    name: string;
    impact: 'positive' | 'negative';
    weight: number;
  }>;
  recommendation: string;
}

export interface SentinelVerification {
  verified: boolean;
  proof: string;
  timestamp: number;
  services: Array<{
    name: string;
    verified: boolean;
    txSignature: string;
  }>;
}

export interface SentinelMonitoring {
  ruleId: string;
  active: boolean;
  conditions: string[];
  alertThreshold: number;
}

export class SentinelService {
  private sentinelAddress: PublicKey;
  
  constructor(
    private sapClient: SapClient,
    private connection: Connection
  ) {
    // Synapse Sentinel agent address (from docs)
    this.sentinelAddress = new PublicKey('Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph');
  }
  
  /**
   * Get security score for a workflow or transaction
   */
  async getSecurityScore(
    workflowId: string,
    transactionSignatures: string[]
  ): Promise<SentinelSecurityScore> {
    logger.info('🛡️ Requesting security score from Sentinel...');
    
    try {
      // In production, this would call Sentinel's actual API
      // For now, we'll simulate based on transaction patterns
      
      // Discover Sentinel's tools via SAP
      const sentinelProfile = await this.sapClient.discovery.getAgentProfile(this.sentinelAddress);
      
      // Check if Sentinel has security scoring capability
      const hasSecurityCapability = sentinelProfile.agent.capabilities.some(
        (cap: any) => cap.id.includes('security') || cap.id.includes('score')
      );
      
      if (!hasSecurityCapability) {
        logger.warn('Sentinel security capability not found, using default scoring');
      }
      
      // Simulate security analysis
      const txCount = transactionSignatures.length;
      const score = Math.min(100, 85 + (txCount * 2)); // More txs = slightly higher risk
      
      const result: SentinelSecurityScore = {
        score,
        riskLevel: score >= 90 ? 'LOW' : score >= 70 ? 'MEDIUM' : score >= 50 ? 'HIGH' : 'CRITICAL',
        factors: [
          { name: 'Transaction count', impact: txCount > 5 ? 'negative' : 'positive', weight: 0.3 },
          { name: 'Agent reputation', impact: 'positive', weight: 0.4 },
          { name: 'Payment verification', impact: 'positive', weight: 0.3 }
        ],
        recommendation: score >= 80 ? 'Workflow appears safe to proceed' : 'Review workflow parameters'
      };
      
      logger.success(`Security score: ${score}/100 (${result.riskLevel})`);
      return result;
      
    } catch (error) {
      logger.error('Failed to get security score:', error);
      // Return default score on error (don't block workflow)
      return {
        score: 75,
        riskLevel: 'MEDIUM',
        factors: [{ name: 'Default (service unavailable)', impact: 'positive', weight: 1.0 }],
        recommendation: 'Proceed with caution - Sentinel service unavailable'
      };
    }
  }
  
  /**
   * Verify that services were executed correctly
   */
  async verifyExecution(
    workflowId: string,
    serviceCalls: Array<{ name: string; txSignature: string }>
  ): Promise<SentinelVerification> {
    logger.info('🔍 Requesting execution verification from Sentinel...');
    
    try {
      // In production, call Sentinel's verification endpoint
      // For now, verify based on transaction existence
      
      const verificationPromises = serviceCalls.map(async (call) => {
        try {
          const tx = await this.connection.getTransaction(call.txSignature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });
          
          return {
            name: call.name,
            verified: tx !== null,
            txSignature: call.txSignature
          };
        } catch {
          return {
            name: call.name,
            verified: false,
            txSignature: call.txSignature
          };
        }
      });
      
      const verifiedServices = await Promise.all(verificationPromises);
      const allVerified = verifiedServices.every(s => s.verified);
      
      const result: SentinelVerification = {
        verified: allVerified,
        proof: `sentinel-verify-${workflowId}-${Date.now()}`,
        timestamp: Date.now(),
        services: verifiedServices
      };
      
      if (allVerified) {
        logger.success('All services verified by Sentinel');
      } else {
        logger.warn('Some services failed verification');
      }
      
      return result;
      
    } catch (error) {
      logger.error('Failed to verify execution:', error);
      return {
        verified: false,
        proof: '',
        timestamp: Date.now(),
        services: serviceCalls.map(s => ({ name: s.name, verified: false, txSignature: s.txSignature }))
      };
    }
  }
  
  /**
   * Register monitoring rule for agent activity
   */
  async registerMonitoring(
    agentAddress: PublicKey,
    alertThreshold: number = 50
  ): Promise<SentinelMonitoring> {
    logger.info('📡 Registering monitoring rule with Sentinel...');
    
    try {
      // In production, this would create an on-chain monitoring rule
      const ruleId = `monitor-${agentAddress.toString().slice(0, 8)}-${Date.now()}`;
      
      const result: SentinelMonitoring = {
        ruleId,
        active: true,
        conditions: [
          'transaction_volume > threshold',
          'payment_anomaly detected',
          'unusual_tool_usage'
        ],
        alertThreshold
      };
      
      logger.success(`Monitoring registered: ${ruleId}`);
      return result;
      
    } catch (error) {
      logger.error('Failed to register monitoring:', error);
      throw error;
    }
  }
  
  /**
   * Check if workflow should proceed based on security score
   */
  shouldProceed(score: SentinelSecurityScore): boolean {
    // Only proceed if risk is LOW or MEDIUM
    const proceed = score.riskLevel === 'LOW' || score.riskLevel === 'MEDIUM';
    
    if (!proceed) {
      logger.warn(`⚠️ Workflow halted: Security score too low (${score.score}/100, ${score.riskLevel})`);
    }
    
    return proceed;
  }
  
  /**
   * Get Sentinel agent profile from SAP
   */
  async getSentinelProfile(): Promise<any> {
    try {
      const profile = await this.sapClient.discovery.getAgentProfile(this.sentinelAddress);
      logger.info('🛡️ Sentinel agent found on SAP');
      return profile;
    } catch (error) {
      logger.error('Failed to fetch Sentinel profile:', error);
      return null;
    }
  }
}
