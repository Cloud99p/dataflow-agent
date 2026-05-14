/**
 * Tool Discovery Service
 * 
 * Discovers and filters available tools via SAP protocol.
 * Identifies Ace Data Cloud services from the discovered tool set.
 */

import { SapClient } from '@oobe-protocol-labs/synapse-sap-sdk';
import { PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger.js';

export interface DiscoveredTool {
  name: string;
  protocolId: string;
  description: string;
  category: string;
  provider?: string;
  pricing?: {
    pricePerCall: number;
    currency: string;
  };
}

export interface AceDataCloudService {
  toolName: string;
  serviceName: string;
  description: string;
  endpoint: string;
  pricePerCall: number;
}

export class DiscoveryService {
  constructor(private sapClient: SapClient) {}
  
  /**
   * Discover all available tools via SAP
   */
  async discoverAllTools(): Promise<DiscoveredTool[]> {
    logger.info('🔍 Discovering tools via SAP...');
    
    try {
      const tools: DiscoveredTool[] = [];
      
      // Get network overview
      const overview = await this.sapClient.discovery.getNetworkOverview();
      logger.info(`Network has ${overview.totalAgents} agents with ${overview.totalTools} tools`);
      
      // Discover agents by protocol (Ace Data Cloud)
      const aceAgents = await this.sapClient.discovery.findAgentsByProtocol('ace-data-cloud');
      logger.info(`Found ${aceAgents.length} Ace Data Cloud agents`);
      
      for (const agent of aceAgents) {
        try {
          const profile = await this.sapClient.discovery.getAgentProfile(agent.wallet);
          
          if (profile.tools && Array.isArray(profile.tools)) {
            for (const tool of profile.tools) {
              tools.push({
                name: tool.name || 'unknown',
                protocolId: tool.protocolId || 'unknown',
                description: tool.description || '',
                category: tool.category || 'general',
                provider: 'ace-data-cloud',
                pricing: tool.pricing ? {
                  pricePerCall: Number(tool.pricing.pricePerCall || 0),
                  currency: 'SOL'
                } : undefined
              });
            }
          }
        } catch (error) {
          logger.debug(`Failed to fetch profile for agent ${agent.wallet.toString()}`);
        }
      }
      
      // Also scan general tools
      if (tools.length === 0) {
        logger.info('No Ace Data Cloud agents found, scanning all agents...');
        
        const allAgents = await this.sapClient.discovery.findAgentsByProtocol('synapse');
        
        for (const agent of allAgents.slice(0, 10)) { // Limit to first 10
          try {
            const profile = await this.sapClient.discovery.getAgentProfile(agent.wallet);
            
            if (profile.tools) {
              for (const tool of profile.tools) {
                tools.push({
                  name: tool.name || 'unknown',
                  protocolId: tool.protocolId || 'unknown',
                  description: tool.description || '',
                  category: tool.category || 'general',
                  pricing: tool.pricing ? {
                    pricePerCall: Number(tool.pricing.pricePerCall || 0),
                    currency: 'SOL'
                  } : undefined
                });
              }
            }
          } catch (error) {
            // Skip failed agents
          }
        }
      }
      
      logger.success(`Discovered ${tools.length} tools total`);
      return tools;
      
    } catch (error) {
      logger.error('Tool discovery failed:', error);
      // Return default tools if discovery fails
      return this.getDefaultTools();
    }
  }
  
  /**
   * Filter and select Ace Data Cloud services
   * Returns exactly 3 distinct services for the workflow
   */
  async selectAceDataCloudServices(): Promise<AceDataCloudService[]> {
    const allTools = await this.discoverAllTools();
    
    logger.info('🎯 Selecting 3 distinct Ace Data Cloud services...');
    
    // Map discovered tools to Ace Data Cloud services
    const serviceMapping: Record<string, AceDataCloudService> = {
      'text-analysis': {
        toolName: 'text-analysis',
        serviceName: 'Text Analysis',
        description: 'Sentiment analysis, entity extraction, keyword detection',
        endpoint: '/nlp/analyze',
        pricePerCall: 1000000 // 0.001 SOL
      },
      'summarization': {
        toolName: 'summarization',
        serviceName: 'Content Summarization',
        description: 'Long-form text summarization',
        endpoint: '/nlp/summarize',
        pricePerCall: 1500000 // 0.0015 SOL
      },
      'data-extraction': {
        toolName: 'data-extraction',
        serviceName: 'Structured Data Extraction',
        description: 'Extract structured data from unstructured text',
        endpoint: '/nlp/extract',
        pricePerCall: 2000000 // 0.002 SOL
      },
      'translation': {
        toolName: 'translation',
        serviceName: 'Language Translation',
        description: 'Multi-language translation',
        endpoint: '/nlp/translate',
        pricePerCall: 1000000
      },
      'content-generation': {
        toolName: 'content-generation',
        serviceName: 'AI Content Generation',
        description: 'Generate content from prompts',
        endpoint: '/ai/generate',
        pricePerCall: 2500000
      }
    };
    
    // Try to find 3 distinct services from discovered tools
    const selected: AceDataCloudService[] = [];
    const usedServices = new Set<string>();
    
    // Priority order for services
    const priorityOrder = ['text-analysis', 'summarization', 'data-extraction', 'translation', 'content-generation'];
    
    for (const toolName of priorityOrder) {
      if (selected.length >= 3) break;
      
      const tool = allTools.find(t => 
        t.name.toLowerCase().includes(toolName) || 
        t.category.toLowerCase().includes(toolName)
      );
      
      if (tool && !usedServices.has(toolName)) {
        const service = serviceMapping[toolName];
        if (service) {
          selected.push({
            ...service,
            pricing: tool.pricing
          });
          usedServices.add(toolName);
          logger.info(`  ✓ Selected: ${service.serviceName}`);
        }
      }
    }
    
    // If we couldn't find 3 from discovery, use defaults
    while (selected.length < 3) {
      const remaining = priorityOrder.filter(name => !usedServices.has(name));
      if (remaining.length === 0) break;
      
      const nextService = serviceMapping[remaining[0]];
      if (nextService) {
        selected.push(nextService);
        usedServices.add(remaining[0]);
        logger.info(`  ✓ Added (default): ${nextService.serviceName}`);
      }
    }
    
    logger.success(`Selected ${selected.length} distinct services`);
    return selected;
  }
  
  /**
   * Get default tools if discovery fails
   */
  private getDefaultTools(): DiscoveredTool[] {
    logger.warn('Using default tool list (discovery failed)');
    
    return [
      {
        name: 'text-analysis',
        protocolId: 'ace-data-cloud',
        description: 'Sentiment analysis and entity extraction',
        category: 'nlp',
        provider: 'ace-data-cloud',
        pricing: { pricePerCall: 1000000, currency: 'SOL' }
      },
      {
        name: 'summarization',
        protocolId: 'ace-data-cloud',
        description: 'Content summarization',
        category: 'nlp',
        provider: 'ace-data-cloud',
        pricing: { pricePerCall: 1500000, currency: 'SOL' }
      },
      {
        name: 'data-extraction',
        protocolId: 'ace-data-cloud',
        description: 'Structured data extraction',
        category: 'nlp',
        provider: 'ace-data-cloud',
        pricing: { pricePerCall: 2000000, currency: 'SOL' }
      }
    ];
  }
  
  /**
   * Find tool by name
   */
  async findToolByName(name: string): Promise<DiscoveredTool | null> {
    const tools = await this.discoverAllTools();
    return tools.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
  }
  
  /**
   * Find tools by category
   */
  async findToolsByCategory(category: string): Promise<DiscoveredTool[]> {
    const tools = await this.discoverAllTools();
    return tools.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }
}
