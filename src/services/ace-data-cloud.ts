/**
 * Ace Data Cloud Service
 * 
 * Integrates with Ace Data Cloud APIs using x402 payment protocol.
 * Handles automatic payments for API calls.
 */

import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger.js';

export interface TextAnalysisResult {
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
  keywords: Array<{
    text: string;
    relevance: number;
  }>;
}

export interface SummarizationResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

export interface DataExtractionResult {
  extracted: any;
  confidence: number;
  schema: any;
}

export class AceDataCloudService {
  private client: AxiosInstance;
  private connection: Connection;
  private payerKeypair: Keypair;
  
  constructor(payerKeypair: Keypair, connection: Connection) {
    this.payerKeypair = payerKeypair;
    this.connection = connection;
    
    this.client = axios.create({
      baseURL: 'https://api.acedata.cloud',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    // Add x402 payment interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 402) {
          // Payment required - handle x402 payment
          logger.warn('402 Payment Required - initiating x402 payment...');
          const paymentHeaders = await this.createX402PaymentHeaders(error.response);
          
          // Retry with payment headers
          const originalRequest = error.config!;
          originalRequest.headers = {
            ...originalRequest.headers,
            ...paymentHeaders,
          };
          
          return this.client.request(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Create x402 payment headers for Solana
   * This is a simplified version - in production, use the official @acedatacloud/x402-client
   */
  private async createX402PaymentHeaders(response: any): Promise<Record<string, string>> {
    const paymentRequired = response.data;
    const { network, payment_details } = paymentRequired;
    
    // For Solana, we need to sign a transaction
    // This is a simplified implementation
    // In production, use: @acedatacloud/x402-client
    
    const headers: Record<string, string> = {
      'X-Payment-Network': 'solana',
      'X-Payment-Version': '1.0',
      'X-Payment-Payer': this.payerKeypair.publicKey.toString(),
    };
    
    // Sign payment authorization
    // In production, this would create and sign a proper x402 transaction
    const message = Buffer.from(JSON.stringify(payment_details));
    const signature = this.payerKeypair.sign(message);
    
    headers['X-Payment-Signature'] = Buffer.from(signature.signature).toString('base64');
    
    return headers;
  }
  
  /**
   * Service 1: Text Analysis
   * Performs sentiment analysis, entity extraction, and keyword detection
   */
  async analyzeText(text: string): Promise<TextAnalysisResult> {
    logger.info('📊 Analyzing text...');
    
    try {
      const response = await this.client.post('/nlp/analyze', {
        text,
        tasks: ['sentiment', 'entities', 'keywords'],
      });
      
      logger.success('Text analysis completed');
      return response.data as TextAnalysisResult;
    } catch (error) {
      logger.error('Text analysis failed:', error);
      throw error;
    }
  }
  
  /**
   * Service 2: Summarization
   * Summarizes long-form content with configurable length
   */
  async summarize(text: string, maxLength: number = 500): Promise<SummarizationResult> {
    logger.info('📝 Summarizing text...');
    
    try {
      const response = await this.client.post('/nlp/summarize', {
        text,
        maxLength,
        style: 'concise',
      });
      
      const result = response.data as SummarizationResult;
      logger.success(`Summarization completed (${result.summaryLength} chars)`);
      return result;
    } catch (error) {
      logger.error('Summarization failed:', error);
      throw error;
    }
  }
  
  /**
   * Service 3: Data Extraction
   * Extracts structured data from unstructured text using JSON Schema
   */
  async extractData(text: string, schema: any): Promise<DataExtractionResult> {
    logger.info('🔍 Extracting structured data...');
    
    try {
      const response = await this.client.post('/nlp/extract', {
        text,
        schema,
      });
      
      const result = response.data as DataExtractionResult;
      logger.success(`Data extraction completed (confidence: ${result.confidence})`);
      return result;
    } catch (error) {
      logger.error('Data extraction failed:', error);
      throw error;
    }
  }
  
  /**
   * Service 4: Translation (Optional)
   * Translates text between languages
   */
  async translate(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
    logger.info('🌐 Translating text...');
    
    try {
      const response = await this.client.post('/nlp/translate', {
        text,
        sourceLang,
        targetLang,
      });
      
      const result = response.data as { translatedText: string };
      logger.success(`Translation completed (${sourceLang} → ${targetLang})`);
      return result.translatedText;
    } catch (error) {
      logger.error('Translation failed:', error);
      throw error;
    }
  }
  
  /**
   * Service 5: Content Generation (Optional)
   * Generates AI-written content based on prompts
   */
  async generateContent(prompt: string, maxLength: number = 1000): Promise<string> {
    logger.info('✍️ Generating content...');
    
    try {
      const response = await this.client.post('/ai/generate', {
        prompt,
        maxLength,
        model: 'gpt-4o-mini',
      });
      
      const result = response.data as { content: string };
      logger.success('Content generation completed');
      return result.content;
    } catch (error) {
      logger.error('Content generation failed:', error);
      throw error;
    }
  }
}
