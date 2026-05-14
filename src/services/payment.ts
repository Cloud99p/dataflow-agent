/**
 * Payment Service
 * 
 * Handles SAP escrow management and x402 payment settlement.
 */

import { SapClient } from '@synapse-sap/sdk';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { logger } from '../utils/logger.js';

export interface EscrowConfig {
  pricePerCall: number;
  maxCalls: number;
  initialDeposit: number;
  expiresAt?: number;
}

export interface Settlement {
  callsToSettle: number;
  serviceHash: Uint8Array;
}

export class PaymentService {
  constructor(private client: SapClient) {}
  
  /**
   * Open escrow for a client
   * Client deposits funds that will be used for payments
   */
  async openEscrow(
    clientWallet: PublicKey,
    config: EscrowConfig
  ): Promise<string> {
    logger.info(`💰 Opening escrow for ${clientWallet.toString()}...`);
    
    try {
      const tx = await this.client.escrow.create(clientWallet, {
        pricePerCall: new BN(config.pricePerCall),
        maxCalls: new BN(config.maxCalls),
        initialDeposit: new BN(config.initialDeposit),
        expiresAt: new BN(config.expiresAt || 0),
        volumeCurve: [],
        tokenMint: null,
        tokenDecimals: 9,
      });
      
      logger.success(`Escrow opened: ${tx}`);
      return tx;
    } catch (error) {
      logger.error('Failed to open escrow:', error);
      throw error;
    }
  }
  
  /**
   * Deposit additional funds to escrow
   */
  async deposit(
    agentWallet: PublicKey,
    amountLamports: number
  ): Promise<string> {
    logger.info(`💵 Depositing ${amountLamports} lamports to escrow...`);
    
    try {
      const tx = await this.client.escrow.deposit(agentWallet, new BN(amountLamports));
      logger.success(`Deposit completed: ${tx}`);
      return tx;
    } catch (error) {
      logger.error('Failed to deposit:', error);
      throw error;
    }
  }
  
  /**
   * Settle payment after task completion
   * Agent calls this to receive payment for services rendered
   */
  async settle(
    clientWallet: PublicKey,
    callsCount: number,
    serviceHash: Uint8Array
  ): Promise<string> {
    logger.info(`💸 Settling payment for ${callsCount} calls...`);
    
    try {
      const tx = await this.client.escrow.settle(clientWallet, callsCount, serviceHash);
      logger.success(`Payment settled: ${tx}`);
      return tx;
    } catch (error) {
      logger.error('Failed to settle payment:', error);
      throw error;
    }
  }
  
  /**
   * Batch settle multiple services (up to 10 per TX)
   * More efficient for multiple API calls
   */
  async batchSettle(
    clientWallet: PublicKey,
    settlements: Settlement[]
  ): Promise<string> {
    logger.info(`💸 Batch settling ${settlements.length} services...`);
    
    if (settlements.length > 10) {
      throw new Error('Batch settlement limited to 10 services per transaction');
    }
    
    try {
      const tx = await this.client.escrow.settleBatch(clientWallet,
        settlements.map(s => ({
          callsToSettle: new BN(s.callsToSettle),
          serviceHash: s.serviceHash,
        }))
      );
      
      logger.success(`Batch settlement completed: ${tx}`);
      return tx;
    } catch (error) {
      logger.error('Failed to batch settle:', error);
      throw error;
    }
  }
  
  /**
   * Withdraw remaining funds from escrow
   */
  async withdraw(
    agentWallet: PublicKey,
    amountLamports: number
  ): Promise<string> {
    logger.info(`💰 Withdrawing ${amountLamports} lamports from escrow...`);
    
    try {
      const tx = await this.client.escrow.withdraw(agentWallet, new BN(amountLamports));
      logger.success(`Withdrawal completed: ${tx}`);
      return tx;
    } catch (error) {
      logger.error('Failed to withdraw:', error);
      throw error;
    }
  }
  
  /**
   * Check escrow balance
   */
  async getBalance(
    agentWallet: PublicKey,
    clientWallet: PublicKey
  ): Promise<{ balance: number; callsRemaining: number }> {
    try {
      const balance = await this.client.x402.getBalance(agentWallet, clientWallet);
      
      return {
        balance: balance.toNumber(),
        callsRemaining: balance.div(new BN(1000000)).toNumber(), // Assuming 0.001 SOL per call
      };
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw error;
    }
  }
  
  /**
   * Estimate cost for a task
   */
  async estimateCost(
    agentWallet: PublicKey,
    apiCallsCount: number
  ): Promise<{ totalLamports: number; perCallLamports: number }> {
    try {
      const cost = await this.client.x402.estimateCost(agentWallet, apiCallsCount);
      
      return {
        totalLamports: cost.totalLamports.toNumber(),
        perCallLamports: cost.perCallLamports.toNumber(),
      };
    } catch (error) {
      logger.error('Failed to estimate cost:', error);
      throw error;
    }
  }
}
