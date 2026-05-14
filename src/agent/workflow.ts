/**
 * DataFlow Workflow Orchestrator (Enhanced)
 * 
 * Manages end-to-end autonomous workflow with:
 * - Tool discovery via SAP
 * - Sentinel security verification
 * - Retry logic with exponential backoff
 * - Comprehensive JSON logging
 * - x402 payment settlement
 */

import { SapClient } from '@synapse-sap/sdk';
import { PublicKey, Connection } from '@solana/web3.js';
import { AceDataCloudService, TextAnalysisResult, SummarizationResult, DataExtractionResult } from '../services/ace-data-cloud.js';
import { PaymentService } from '../services/payment.js';
import { SentinelService, SentinelSecurityScore, SentinelVerification } from '../services/sentinel.js';
import { DiscoveryService, AceDataCloudService as AceService } from '../services/discovery.js';
import { logger } from '../utils/logger.js';

// ============== Types ==============

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'onchain-event';
  data?: any;
  timestamp: number;
}

export interface ServiceCall {
  serviceName: string;
  toolName: string;
  input: any;
  output?: any;
  outputHash?: string;
  txSignature?: string;
  paymentAmount: number;
  paymentTx?: string;
  status: 'pending' | 'success' | 'failed' | 'retried';
  retries: number;
  error?: string;
  duration: number;
}

export interface WorkflowLog {
  // Agent Identity
  agentId: string;
  agentRegistrationTx?: string;
  
  // Discovery
  discoveredTools: Array<{
    name: string;
    protocolId: string;
    category: string;
    provider?: string;
  }>;
  selectedServices: Array<{
    name: string;
    description: string;
    pricePerCall: number;
  }>;
  
  // Workflow
  workflowId: string;
  trigger: WorkflowTrigger;
  startTime: number;
  endTime?: number;
  status: 'running' | 'success' | 'failed' | 'halted';
  
  // Service Execution
  serviceCalls: ServiceCall[];
  
  // Sentinel
  sentinelSecurityScore?: SentinelSecurityScore;
  sentinelVerification?: SentinelVerification;
  sentinelMonitoring?: any;
  workflowHalted?: boolean;
  haltReason?: string;
  
  // Payments
  totalCostLamports: number;
  totalCostSOL: number;
  paymentTransactions: string[];
  
  // Error Handling
  errors: Array<{
    step: string;
    error: string;
    timestamp: number;
    retried: boolean;
  }>;
  
  // Summary
  successSteps: number;
  failedSteps: number;
  totalRetries: number;
}

// ============== Workflow Engine ==============

export class DataFlowWorkflow {
  private sentinelService: SentinelService;
  private discoveryService: DiscoveryService;
  
  constructor(
    private aceService: AceDataCloudService,
    private paymentService: PaymentService,
    private sapClient: SapClient,
    private connection: Connection
  ) {
    this.sentinelService = new SentinelService(sapClient, connection);
    this.discoveryService = new DiscoveryService(sapClient);
  }
  
  /**
   * Execute complete autonomous workflow
   */
  async execute(
    trigger: WorkflowTrigger,
    clientWallet: PublicKey
  ): Promise<WorkflowLog> {
    const workflowId = `wf-${Date.now()}-${clientWallet.toString().slice(0, 8)}`;
    
    logger.info(`🚀 Starting autonomous workflow: ${workflowId}`);
    
    const log: WorkflowLog = {
      agentId: this.sapClient.walletPubkey.toString(),
      discoveredTools: [],
      selectedServices: [],
      workflowId,
      trigger,
      startTime: Date.now(),
      status: 'running',
      serviceCalls: [],
      totalCostLamports: 0,
      totalCostSOL: 0,
      paymentTransactions: [],
      errors: [],
      successSteps: 0,
      failedSteps: 0,
      totalRetries: 0
    };
    
    try {
      // Step 1: Tool Discovery
      logger.info('\n📋 Phase 1: Tool Discovery');
      await this.phase1Discovery(log);
      
      // Step 2: Security Check (Sentinel)
      logger.info('\n🛡️ Phase 2: Security Verification');
      const securityApproved = await this.phase2SecurityCheck(log);
      
      if (!securityApproved) {
        log.status = 'halted';
        log.workflowHalted = true;
        log.haltReason = 'Security score below threshold';
        logger.warn('⚠️ Workflow halted by Sentinel security check');
        return this.finalizeLog(log);
      }
      
      // Step 3: Service Execution (3 distinct services)
      logger.info('\n⚙️ Phase 3: Service Execution');
      await this.phase3ExecuteServices(log, clientWallet);
      
      // Step 4: Verification (Sentinel)
      logger.info('\n✅ Phase 4: Execution Verification');
      await this.phase4Verification(log);
      
      // Success
      log.status = 'success';
      logger.success('\n🎉 Workflow completed successfully!');
      
    } catch (error: any) {
      logger.error('❌ Workflow failed:', error.message);
      log.status = 'failed';
      log.errors.push({
        step: 'workflow',
        error: error.message,
        timestamp: Date.now(),
        retried: false
      });
    } finally {
      return this.finalizeLog(log);
    }
  }
  
  /**
   * Phase 1: Discover tools and select services
   */
  private async phase1Discovery(log: WorkflowLog): Promise<void> {
    const discoveredTools = await this.discoveryService.discoverAllTools();
    
    log.discoveredTools = discoveredTools.map(t => ({
      name: t.name,
      protocolId: t.protocolId,
      category: t.category,
      provider: t.provider
    }));
    
    logger.info(`Discovered ${log.discoveredTools.length} tools`);
    
    // Select 3 distinct Ace Data Cloud services
    const selectedServices = await this.discoveryService.selectAceDataCloudServices();
    
    log.selectedServices = selectedServices.map(s => ({
      name: s.serviceName,
      description: s.description,
      pricePerCall: s.pricePerCall
    }));
    
    logger.info(`Selected ${log.selectedServices.length} services for workflow`);
  }
  
  /**
   * Phase 2: Security verification with Sentinel
   */
  private async phase2SecurityCheck(log: WorkflowLog): Promise<boolean> {
    // Get security score
    const securityScore = await this.sentinelService.getSecurityScore(
      log.workflowId,
      []
    );
    
    log.sentinelSecurityScore = securityScore;
    
    // Check if we should proceed
    const shouldProceed = this.sentinelService.shouldProceed(securityScore);
    
    if (!shouldProceed) {
      log.errors.push({
        step: 'security-check',
        error: `Security score too low: ${securityScore.score}/100 (${securityScore.riskLevel})`,
        timestamp: Date.now(),
        retried: false
      });
      return false;
    }
    
    logger.success(`Security check passed: ${securityScore.score}/100`);
    return true;
  }
  
  /**
   * Phase 3: Execute 3 distinct services with retry logic
   */
  private async phase3ExecuteServices(
    log: WorkflowLog,
    clientWallet: PublicKey
  ): Promise<void> {
    const services = log.selectedServices;
    
    // Sample input for all services
    const sampleInput = {
      text: `Bitcoin surged past $95,000 today as institutional adoption accelerates. 
      Major corporations are adding BTC to treasury reserves while ETF inflows reached 
      record highs. Market sentiment remains bullish despite volatility.`,
      schema: {
        type: 'object',
        properties: {
          price: { type: 'number' },
          sentiment: { type: 'string' },
          entities: { type: 'array', items: { type: 'string' } }
        }
      }
    };
    
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const serviceCall: ServiceCall = {
        serviceName: service.name,
        toolName: service.name.toLowerCase().replace(/\s+/g, '-'),
        input: sampleInput,
        paymentAmount: service.pricePerCall,
        status: 'pending',
        retries: 0,
        duration: 0
      };
      
      const startTime = Date.now();
      
      try {
        logger.info(`\n📞 Executing service ${i + 1}/3: ${service.name}`);
        
        // Execute with retry logic (max 3 retries)
        const result = await this.executeWithRetry(
          () => this.executeService(service.name, sampleInput, clientWallet),
          3, // max retries
          `Service: ${service.name}`
        );
        
        serviceCall.output = result.output;
        serviceCall.outputHash = this.hashOutput(result.output);
        serviceCall.paymentTx = result.paymentTx;
        serviceCall.txSignature = result.paymentTx;
        serviceCall.status = 'success';
        serviceCall.duration = Date.now() - startTime;
        
        log.serviceCalls.push(serviceCall);
        log.paymentTransactions.push(result.paymentTx);
        log.totalCostLamports += serviceCall.paymentAmount;
        log.successSteps++;
        
        logger.success(`✓ Service ${i + 1} completed (${serviceCall.duration}ms)`);
        
      } catch (error: any) {
        serviceCall.status = 'failed';
        serviceCall.error = error.message;
        serviceCall.duration = Date.now() - startTime;
        
        log.serviceCalls.push(serviceCall);
        log.errors.push({
          step: `service-${i + 1}-${service.name}`,
          error: error.message,
          timestamp: Date.now(),
          retried: serviceCall.retries > 0
        });
        log.failedSteps++;
        
        logger.error(`✗ Service ${i + 1} failed: ${error.message}`);
        
        // Don't fail entire workflow - continue with next service
      }
    }
  }
  
  /**
   * Execute a single service
   */
  private async executeService(
    serviceName: string,
    input: any,
    clientWallet: PublicKey
  ): Promise<{ output: any; paymentTx: string }> {
    let output: any;
    
    // Execute appropriate service
    switch (serviceName.toLowerCase()) {
      case 'text analysis':
        output = await this.aceService.analyzeText(input.text);
        break;
        
      case 'content summarization':
        output = await this.aceService.summarize(input.text);
        break;
        
      case 'structured data extraction':
        output = await this.aceService.extractData(input.text, input.schema);
        break;
        
      default:
        // Default to text analysis
        output = await this.aceService.analyzeText(input.text);
    }
    
    // Settle payment
    const serviceHash = this.createServiceHash(serviceName, Date.now().toString());
    const paymentTx = await this.paymentService.settle(clientWallet, 1, serviceHash);
    
    return { output, paymentTx };
  }
  
  /**
   * Execute with exponential backoff retry
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    context: string
  ): Promise<T> {
    let lastError: Error;
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        retries++;
        
        if (retries <= maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retries - 1), 10000); // Exponential backoff, max 10s
          logger.warn(`⚠️ ${context} failed (attempt ${retries}/${maxRetries + 1}), retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Phase 4: Verification with Sentinel
   */
  private async phase4Verification(log: WorkflowLog): Promise<void> {
    const serviceCalls = log.serviceCalls
      .filter(sc => sc.status === 'success' && sc.txSignature)
      .map(sc => ({ name: sc.serviceName, txSignature: sc.txSignature! }));
    
    if (serviceCalls.length === 0) {
      logger.warn('No successful services to verify');
      return;
    }
    
    // Request verification from Sentinel
    const verification = await this.sentinelService.verifyExecution(
      log.workflowId,
      serviceCalls
    );
    
    log.sentinelVerification = verification;
    
    if (verification.verified) {
      logger.success('All services verified by Sentinel');
    } else {
      logger.warn('Some services failed verification');
    }
  }
  
  /**
   * Finalize log and output
   */
  private finalizeLog(log: WorkflowLog): WorkflowLog {
    log.endTime = Date.now();
    log.totalCostSOL = log.totalCostLamports / 1e9;
    log.totalRetries = log.serviceCalls.reduce((sum, sc) => sum + sc.retries, 0);
    
    // Output final JSON log
    logger.info('\n📊 Final Workflow Log:');
    console.log(JSON.stringify(log, null, 2));
    
    return log;
  }
  
  // ============== Utilities ==============
  
  private createServiceHash(serviceName: string, nonce: string): Uint8Array {
    const data = `${serviceName}:${nonce}:${Date.now()}`;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    
    const hash = new Uint8Array(32);
    for (let i = 0; i < Math.min(bytes.length, 32); i++) {
      hash[i] = bytes[i];
    }
    return hash;
  }
  
  private hashOutput(output: any): string {
    const data = JSON.stringify(output);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `0x${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
