# Implementation Plan - Autonomous Data Pipeline Agent

## 🎯 Agent Concept: "DataFlow Agent"

An autonomous agent that processes data transformation requests end-to-end:
- **Trigger**: User submits data processing task (URL, text, or file)
- **Discovery**: Finds best tools via SAP for the task
- **Execution**: Uses 3+ Ace Data Cloud APIs for processing
- **Payment**: Auto-settles via x402 on-chain
- **Delivery**: Returns processed results

### Why This Agent?
✅ **High payment volume** - Multiple API calls per workflow  
✅ **Uses 3+ Ace Data Cloud services** - Text analysis, summarization, data extraction, etc.  
✅ **Clear automation** - Trigger → Process → Pay → Deliver  
✅ **Real utility** - Solves actual data processing problems  
✅ **Targets BOTH categories** - Can win either prize pool  

---

## 📋 Ace Data Cloud Services to Use (3+ Required)

Based on platform.acedata.cloud, we'll use:

1. **Text Analysis API** - Sentiment, entities, keywords
2. **Summarization API** - Long-form content summarization  
3. **Data Extraction API** - Structured data from unstructured text
4. **Translation API** (optional) - Multi-language support
5. **Content Generation API** (optional) - AI-written outputs

**Free Credits**: Sign up with Google/GitHub → automatic free credits

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DataFlow Agent                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Trigger    │───▶│  Discovery   │───▶│  Execution   │      │
│  │  (User/API)  │    │  (SAP SDK)   │    │ (Ace APIs)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Payment    │◀───│  Settlement  │◀───│   Results    │      │
│  │  (x402/SOL)  │    │  (On-chain)  │    │  (Delivery)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **Agent Identity** (SAP on-chain registration)
   - Wallet: Solana keypair
   - Capabilities: data-processing, text-analysis, summarization
   - Pricing: per-call micropayments
   - x402 endpoint: https://agent.example.com/x402

2. **Tool Discovery** (SAP SDK)
   - Query SAP for available tools
   - Select best tools for task
   - Verify tool reputation/pricing

3. **Task Execution** (Ace Data Cloud SDK + x402)
   - Call Ace Data Cloud APIs
   - Handle 402 Payment Required responses
   - Sign x402 payment headers
   - Retry with payment

4. **Payment Settlement** (SAP Escrow + x402)
   - Client deposits to escrow (SOL or USDC)
   - Agent settles after task completion
   - On-chain transaction records

5. **Workflow Orchestrator**
   - Manages end-to-end flow
   - Error handling & retries
   - Logging & monitoring

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js 20+ / TypeScript | Agent execution |
| **Blockchain** | Solana (mainnet-beta) | On-chain identity & payments |
| **Agent Protocol** | SAP SDK (@synapse-sap/sdk) | Agent registration, discovery, escrow |
| **Payment Protocol** | x402 + Ace Data Cloud SDK | Pay-per-use API access |
| **AI Services** | Ace Data Cloud APIs | Text analysis, summarization, extraction |
| **Framework** | Custom TypeScript agent | Full control over workflow |

---

## 📁 Project Structure

```
dataflow-agent/
├── src/
│   ├── index.ts              # Main entry point
│   ├── agent/
│   │   ├── identity.ts       # SAP agent registration
│   │   ├── discovery.ts      # Tool discovery via SAP
│   │   └── workflow.ts       # End-to-end orchestration
│   ├── services/
│   │   ├── ace-data-cloud.ts # Ace Data Cloud API client
│   │   ├── x402-handler.ts   # x402 payment handler
│   │   └── payment.ts        # Escrow & settlement
│   ├── tools/
│   │   ├── text-analysis.ts  # Text analysis tool
│   │   ├── summarization.ts  # Summarization tool
│   │   └── extraction.ts     # Data extraction tool
│   └── utils/
│       ├── config.ts         # Configuration management
│       ├── logger.ts         # Logging
│       └── errors.ts         # Error handling
├── tests/
│   ├── integration.test.ts   # End-to-end tests
│   └── fixtures/
├── scripts/
│   ├── setup.sh              # Initial setup
│   ├── register-agent.ts     # On-chain registration
│   └── demo.ts               # Demo workflow
├── config/
│   ├── default.json          # Default config
│   └── mainnet.json          # Mainnet config
├── docs/
│   ├── architecture.md       # Architecture details
│   ├── demo-script.md        # Demo video script
│   └── api-reference.md      # API documentation
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Step-by-Step Implementation

### Phase 1: Setup (Day 1)

#### 1.1 Create Ace Data Cloud Account
```bash
# Visit: https://platform.acedata.cloud
# Sign up with Google/GitHub
# Get free credits automatically
# Note API endpoint: https://api.acedata.cloud
```

#### 1.2 Initialize Project
```bash
mkdir dataflow-agent && cd dataflow-agent
npm init -y
npm install typescript ts-node @types/node
npm install @synapse-sap/sdk @coral-xyz/anchor @solana/web3.js
npm install @acedatacloud/sdk @acedatacloud/x402-client
npm install dotenv axios
npx tsc --init
```

#### 1.3 Generate Solana Keypair
```bash
# Using SAP CLI
synapse-sap env init --template mainnet
synapse-sap env keypair generate --out keys/dataflow-agent.json

# Or using Solana CLI
solana-keygen new --outfile keys/dataflow-agent.json
```

#### 1.4 Configure RPC
```bash
# Get API key from: https://synapse.oobeprotocol.ai/
synapse-sap config set rpcUrl "https://us-1-mainnet.oobeprotocol.ai/rpc?api_key=YOUR_KEY"
synapse-sap doctor run
```

---

### Phase 2: Agent Registration (Day 2)

#### 2.1 Create Agent Manifest
```json
// manifest.json
{
  "name": "DataFlow Agent",
  "description": "Autonomous data processing pipeline with AI analysis",
  "capabilities": [
    {
      "id": "ace:text-analysis",
      "protocolId": "ace-data-cloud",
      "version": "1.0",
      "description": "Sentiment analysis, entity extraction, keyword detection"
    },
    {
      "id": "ace:summarization",
      "protocolId": "ace-data-cloud",
      "version": "1.0",
      "description": "Long-form content summarization"
    },
    {
      "id": "ace:extraction",
      "protocolId": "ace-data-cloud",
      "version": "1.0",
      "description": "Structured data extraction from unstructured text"
    }
  ],
  "pricing": [
    {
      "tierId": "standard",
      "pricePerCall": 1000000,
      "rateLimit": 60,
      "tokenType": "sol",
      "settlementMode": "x402"
    }
  ],
  "protocols": ["ace-data-cloud", "x402"],
  "x402Endpoint": "https://your-agent-url.com/x402"
}
```

#### 2.2 Register Agent on SAP
```typescript
// scripts/register-agent.ts
import { SapClient } from "@synapse-sap/sdk";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import fs from "fs";

async function registerAgent() {
  // Load keypair
  const keypairData = JSON.parse(fs.readFileSync("keys/dataflow-agent.json", "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  
  // Create provider
  const provider = new AnchorProvider(
    new Connection("https://us-1-mainnet.oobeprotocol.ai/rpc?api_key=YOUR_KEY"),
    { publicKey: keypair.publicKey, signTransaction: async (tx) => { tx.sign(keypair); return tx; }, signAllTransactions: async (txs) => { txs.forEach(tx => tx.sign(keypair)); return txs; } }
  );
  
  const client = SapClient.from(provider);
  
  // Register agent
  const tx = await client.agent.register({
    name: "DataFlow Agent",
    description: "Autonomous data processing pipeline with AI analysis",
    capabilities: [
      { id: "ace:text-analysis", protocolId: "ace-data-cloud", version: "1.0", description: "Text analysis" },
      { id: "ace:summarization", protocolId: "ace-data-cloud", version: "1.0", description: "Summarization" },
      { id: "ace:extraction", protocolId: "ace-data-cloud", version: "1.0", description: "Data extraction" }
    ],
    pricing: [{
      tierId: "standard",
      pricePerCall: 1000000,
      rateLimit: 60,
      tokenType: "sol",
      settlementMode: "x402"
    }],
    protocols: ["ace-data-cloud", "x402"]
  });
  
  console.log("Agent registered! TX:", tx);
  console.log("Agent address:", keypair.publicKey.toString());
}

registerAgent();
```

---

### Phase 3: Ace Data Cloud Integration (Day 3)

#### 3.1 Setup Ace Data Cloud Client with x402
```typescript
// src/services/ace-data-cloud.ts
import { AceDataCloud } from '@acedatacloud/sdk';
import { createX402PaymentHandler } from '@acedatacloud/x402-client';
import { Connection, Keypair } from '@solana/web3.js';

export class AceDataCloudService {
  private client: AceDataCloud;
  
  constructor(solanaKeypair: Keypair, connection: Connection) {
    this.client = new AceDataCloud({
      paymentHandler: createX402PaymentHandler({
        network: 'solana',
        connection: connection,
        payerKeypair: solanaKeypair,
      }),
    });
  }
  
  // Service 1: Text Analysis
  async analyzeText(text: string) {
    const response = await fetch('https://api.acedata.cloud/nlp/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tasks: ['sentiment', 'entities', 'keywords'] })
    });
    
    if (response.status === 402) {
      // x402 payment handler will intercept and retry
      throw new Error('Payment required - x402 handler should retry');
    }
    
    return response.json();
  }
  
  // Service 2: Summarization
  async summarize(text: string, maxLength: number = 500) {
    const response = await fetch('https://api.acedata.cloud/nlp/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, maxLength })
    });
    
    return response.json();
  }
  
  // Service 3: Data Extraction
  async extractData(text: string, schema: any) {
    const response = await fetch('https://api.acedata.cloud/nlp/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, schema })
    });
    
    return response.json();
  }
}
```

---

### Phase 4: Payment Integration (Day 4)

#### 4.1 Escrow Management
```typescript
// src/services/payment.ts
import { SapClient } from "@synapse-sap/sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export class PaymentService {
  constructor(private client: SapClient) {}
  
  // Client opens escrow
  async openEscrow(clientWallet: PublicKey, depositLamports: number) {
    return await this.client.escrow.create(clientWallet, {
      pricePerCall: new BN(1_000_000), // 0.001 SOL per call
      maxCalls: new BN(100),
      initialDeposit: new BN(depositLamports),
      expiresAt: new BN(0),
      volumeCurve: [],
      tokenMint: null,
      tokenDecimals: 9,
    });
  }
  
  // Deposit more funds
  async deposit(agentWallet: PublicKey, amountLamports: number) {
    return await this.client.escrow.deposit(agentWallet, new BN(amountLamports));
  }
  
  // Settle after task completion
  async settle(clientWallet: PublicKey, callsCount: number, serviceHash: Uint8Array) {
    return await this.client.escrow.settle(clientWallet, callsCount, serviceHash);
  }
  
  // Batch settle (up to 10 per TX)
  async batchSettle(clientWallet: PublicKey, settlements: Array<{calls: number, hash: Uint8Array}>) {
    return await this.client.escrow.settleBatch(clientWallet, 
      settlements.map(s => ({ callsToSettle: new BN(s.calls), serviceHash: s.hash }))
    );
  }
  
  // Check balance
  async getBalance(agentWallet: PublicKey, clientWallet: PublicKey) {
    return await this.client.x402.getBalance(agentWallet, clientWallet);
  }
}
```

---

### Phase 5: Workflow Orchestrator (Day 5)

#### 5.1 Main Workflow
```typescript
// src/agent/workflow.ts
import { AceDataCloudService } from '../services/ace-data-cloud';
import { PaymentService } from '../services/payment';
import { SapClient } from "@synapse-sap/sdk";

interface DataProcessingTask {
  id: string;
  input: string;
  tasks: Array<'analyze' | 'summarize' | 'extract'>;
  schema?: any;
}

interface ProcessingResult {
  taskId: string;
  analysis?: any;
  summary?: string;
  extracted?: any;
  paymentTx: string;
}

export class DataFlowWorkflow {
  constructor(
    private aceService: AceDataCloudService,
    private paymentService: PaymentService,
    private sapClient: SapClient
  ) {}
  
  async execute(task: DataProcessingTask, clientWallet: PublicKey): Promise<ProcessingResult> {
    const results: any = {};
    let apiCallsCount = 0;
    
    try {
      // Step 1: Text Analysis
      if (task.tasks.includes('analyze')) {
        results.analysis = await this.aceService.analyzeText(task.input);
        apiCallsCount++;
      }
      
      // Step 2: Summarization
      if (task.tasks.includes('summarize')) {
        results.summary = await this.aceService.summarize(task.input);
        apiCallsCount++;
      }
      
      // Step 3: Data Extraction
      if (task.tasks.includes('extract') && task.schema) {
        results.extracted = await this.aceService.extractData(task.input, task.schema);
        apiCallsCount++;
      }
      
      // Step 4: Settle payment
      const serviceHash = new Uint8Array(32); // Hash of service provided
      const paymentTx = await this.paymentService.settle(clientWallet, apiCallsCount, serviceHash);
      
      return {
        taskId: task.id,
        ...results,
        paymentTx
      };
      
    } catch (error) {
      console.error('Workflow failed:', error);
      throw error;
    }
  }
}
```

---

### Phase 6: Demo & Submission (Day 6-7)

#### 6.1 Demo Script
```markdown
# Demo Video Script (2-3 minutes)

## Intro (15s)
"Hi, I'm building DataFlow Agent for the OOBE x Ace Data Cloud bounty.
This autonomous agent processes data end-to-end with automatic on-chain payments."

## Agent Registration (30s)
[Show SAP Explorer with agent registered]
"Here's my agent on SAP mainnet with 3 capabilities:
text analysis, summarization, and data extraction."

## Workflow Demo (60s)
[Show terminal running demo]
"Let me submit a news article for processing.
The agent automatically:
1. Discovers the best tools via SAP
2. Calls 3 Ace Data Cloud APIs
3. Settles payments via x402
4. Returns structured results"

## Payment Proof (30s)
[Show Solscan transaction]
"Here's the on-chain payment settlement.
Fully autonomous, no manual intervention."

## Code Walkthrough (30s)
[Show GitHub repo]
"Clean TypeScript codebase with full test coverage.
Link in the description."

## Outro (15s)
"DataFlow Agent demonstrates real autonomous workflows on Solana.
Thanks for watching!"
```

#### 6.2 Submission Checklist

**For BOTH Categories:**
- [ ] Agent registered on SAP mainnet
- [ ] Complete automated workflow (trigger → execution → payment)
- [ ] Demo video (2-3 min)
- [ ] GitHub repository
- [ ] X/Twitter post with @OOBEonSol @AceDataCloud

**Category 1 (General Payment Volume):**
- [ ] Use escrow for payments
- [ ] Synapse RPC in execution
- [ ] At least one AI capability
- [ ] Use Synapse Sentinel at least once

**Category 2 (Ace Data Cloud Usage):**
- [ ] Ace Data Cloud account created
- [ ] x402 with AceDataCloud facilitator
- [ ] 3+ distinct Ace Data Cloud services used
- [ ] Synapse RPC in execution

---

## 📝 Next Actions

1. **Today**: 
   - Create Ace Data Cloud account (platform.acedata.cloud)
   - Initialize project structure
   - Generate Solana keypair

2. **Tomorrow**:
   - Register agent on SAP mainnet
   - Implement Ace Data Cloud client
   - Test API calls

3. **Day 3-4**:
   - Implement payment flows
   - Build workflow orchestrator
   - Integration testing

4. **Day 5-6**:
   - Record demo video
   - Polish documentation
   - Submit to bounty

---

## 🔗 Key Resources

- **SAP SDK**: https://github.com/OOBE-PROTOCOL/synapse-sap-sdk
- **SAP Explorer**: https://explorer.oobeprotocol.ai/
- **Ace Data Cloud**: https://platform.acedata.cloud
- **x402 Client**: https://github.com/AceDataCloud/X402Client
- **Synapse RPC**: Get API key at https://synapse.oobeprotocol.ai/

---

**Ready to start building! Which phase should we tackle first?**
