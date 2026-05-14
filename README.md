# DataFlow Agent 🚀

**Autonomous Data Processing Pipeline for Solana**

An autonomous agent built for the **OOBE x Ace Data Cloud Bounty**—processing data end-to-end with automatic on-chain payments via x402 protocol.

---

## 🎯 What It Does

DataFlow Agent automatically:
1. **Discovers** tools via Synapse Agent Protocol (SAP)
2. **Executes** AI services from Ace Data Cloud
3. **Settles payments** using x402 on-chain
4. **Delivers results** without human intervention

**Complete workflow**: Trigger → Execution → Payment → Delivery

---

## 🏆 Bounty Categories

This agent qualifies for **BOTH** prize pools:

### Category 1: General Payment Volume ($700/$500)
- ✅ Registered on SAP mainnet
- ✅ Uses escrow for payments
- ✅ Synapse RPC in execution
- ✅ AI capabilities integrated
- ✅ Synapse Sentinel compatible

### Category 2: Ace Data Cloud Usage ($700/$500)
- ✅ Ace Data Cloud account integrated
- ✅ x402 with AceDataCloud facilitator
- ✅ 3+ distinct services used:
  - Text Analysis (sentiment, entities, keywords)
  - Summarization (long-form content)
  - Data Extraction (structured output)
- ✅ Synapse RPC in execution

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js 20+ / TypeScript |
| **Blockchain** | Solana (mainnet-beta) |
| **Agent Protocol** | SAP SDK (@synapse-sap/sdk) |
| **Payment Protocol** | x402 + Ace Data Cloud SDK |
| **AI Services** | Ace Data Cloud APIs |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Solana CLI (optional, for keypair generation)
- SAP CLI (`synapse-sap`)

### 1. Clone & Install
```bash
git clone [your-repo-url]
cd dataflow-agent
npm install
```

### 2. Setup
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
- Install dependencies
- Create keys directory
- Generate config templates

### 3. Configure
Edit `.env`:
```bash
SOLANA_RPC_URL=https://us-1-mainnet.oobeprotocol.ai/rpc?api_key=YOUR_KEY
SOLANA_CLUSTER=mainnet-beta
AGENT_KEYPAIR_PATH=./keys/dataflow-agent.json
```

**Get your Synapse API key**: https://synapse.oobeprotocol.ai/

### 4. Generate Keypair
```bash
synapse-sap env keypair generate --out keys/dataflow-agent.json
# Or: solana-keygen new --outfile keys/dataflow-agent.json
```

### 5. Register Agent
```bash
npm run register
```

### 6. Run Demo
```bash
npm run demo
```

---

## 📋 Project Structure

```
dataflow-agent/
├── src/
│   ├── index.ts              # Main entry point
│   ├── agent/
│   │   ├── identity.ts       # SAP agent registration
│   │   └── workflow.ts       # Workflow orchestrator
│   ├── services/
│   │   ├── ace-data-cloud.ts # Ace Data Cloud client
│   │   └── payment.ts        # Payment settlement
│   └── utils/
│       ├── config.ts         # Configuration
│       └── logger.ts         # Logging
├── scripts/
│   ├── setup.sh              # Setup script
│   ├── register-agent.ts     # Agent registration
│   └── demo.ts               # Demo workflow
├── docs/
│   └── demo-script.md        # Video demo script
├── manifest.json             # Agent manifest
├── .env                      # Configuration
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SOLANA_RPC_URL` | Synapse RPC with API key | ✅ |
| `SOLANA_CLUSTER` | mainnet-beta / devnet | ✅ |
| `AGENT_KEYPAIR_PATH` | Path to agent keypair | ✅ |
| `ACE_DATA_CLOUD_API_URL` | Ace Data Cloud endpoint | ✅ |
| `PRICE_PER_CALL_LAMPORTS` | Price per API call | ❌ |
| `MAX_CALLS_PER_ESCROW` | Max calls per escrow | ❌ |

### Agent Manifest

Edit `manifest.json` with your agent details:
- Name and description
- Capabilities (text-analysis, summarization, extraction)
- Pricing tiers
- x402 endpoint

---

## 📖 Usage Examples

### Programmatic Usage

```typescript
import { DataFlowWorkflow } from './src/agent/workflow.js';

// Initialize workflow
const workflow = new DataFlowWorkflow(aceService, paymentService, sapClient);

// Execute task
const result = await workflow.execute({
  id: 'task-001',
  input: 'Your text here...',
  tasks: ['analyze', 'summarize', 'extract'],
  schema: { /* JSON Schema */ }
}, clientWalletPublicKey);

console.log(result);
```

### CLI Commands

```bash
# Register agent on SAP
npm run register

# Run demo workflow
npm run demo

# Build for production
npm run build

# Run tests
npm test
```

---

## 💰 Payment Flow

1. **Client opens escrow** with SOL deposit
2. **Agent executes tasks** using Ace Data Cloud APIs
3. **x402 handles payments** automatically (402 → sign → retry)
4. **Agent settles** via SAP escrow contract
5. **Funds transferred** on-chain

All payments are verifiable on Solana.

---

## 🎬 Demo

Watch the agent in action: [YouTube/Loom link]

**Demo shows**:
- Agent registration on SAP
- Live workflow execution
- Payment settlement on-chain
- Code walkthrough

---

## 📝 Bounty Submission

**Social Post**:
```
🚀 DataFlow Agent for @OOBEonSol x @AceDataCloud bounty!

Autonomous data processing with:
✅ SAP on-chain identity
✅ 3+ Ace Data Cloud AI services
✅ x402 automatic payments
✅ Full workflow automation

Demo: [video link]
Code: [this repo]

#Solana #AI #AutonomousAgents #x402
```

**Categories**: Entering BOTH (will accept higher reward if ranked in both)

---

## 🔗 Resources

- **SAP SDK**: https://github.com/OOBE-PROTOCOL/synapse-sap-sdk
- **SAP Explorer**: https://explorer.oobeprotocol.ai/
- **Ace Data Cloud**: https://platform.acedata.cloud
- **x402 Client**: https://github.com/AceDataCloud/X402Client
- **Synapse RPC**: https://synapse.oobeprotocol.ai/

---

## 📄 License

MIT

---

**Built for the OOBE x Ace Data Cloud Bounty** 🏆
