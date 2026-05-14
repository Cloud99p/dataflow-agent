# ⚡ Quick Start Guide

**Get DataFlow Agent running in 15 minutes**

---

## Step 1: Prerequisites (2 min)

Ensure you have:
- ✅ Node.js 20+ (`node -v`)
- ✅ npm (`npm -v`)
- ✅ Git (for cloning)

**Install Node.js** (if needed):
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

---

## Step 2: Get API Keys (3 min)

### 2.1 Synapse RPC API Key
1. Visit: https://synapse.oobeprotocol.ai/
2. Sign up / Log in
3. Generate API key
4. Copy the key (starts with `sk_...`)

### 2.2 Ace Data Cloud Account
1. Visit: https://platform.acedata.cloud
2. Sign up with Google or GitHub
3. **Free credits automatically added** ✅
4. No API key needed (x402 handles payments)

---

## Step 3: Setup Project (5 min)

```bash
# Navigate to project
cd /mnt/data/openclaw/workspace/.openclaw/workspace/bounties/oobe-ace-data-cloud

# Install dependencies
npm install

# Create keys directory
mkdir -p keys

# Generate agent keypair
# Option A: Using SAP CLI (if installed)
synapse-sap env keypair generate --out keys/dataflow-agent.json

# Option B: Using Solana CLI
solana-keygen new --outfile keys/dataflow-agent.json

# Option C: Using Node.js (fallback)
node -e "
const web3 = require('@solana/web3.js');
const fs = require('fs');
const kp = web3.Keypair.generate();
fs.writeFileSync('keys/dataflow-agent.json', JSON.stringify(Array.from(kp.secretKey)));
console.log('Agent:', kp.publicKey.toString());
"
```

---

## Step 4: Configure (2 min)

### 4.1 Copy Templates
```bash
cp .env.example .env
cp manifest.example.json manifest.json
```

### 4.2 Edit .env
```bash
# Open .env in your editor
nano .env
# or: code .env
# or: vim .env
```

**Update these lines**:
```bash
SOLANA_RPC_URL=https://us-1-mainnet.oobeprotocol.ai/rpc?api_key=sk_YOUR_KEY_HERE
SOLANA_CLUSTER=mainnet-beta
```

### 4.3 Edit manifest.json (optional)
```bash
nano manifest.json
```

Update:
- `x402Endpoint`: Your agent URL (can use placeholder for demo)
- `metadata.website`: Your website/GitHub
- `metadata.contact`: Your email

---

## Step 5: Fund Wallet (1 min)

Your agent needs SOL for:
- Registration (~0.01 SOL)
- Transaction fees
- Escrow deposits

**Send 0.1 SOL to your agent**:
```bash
# Get agent address
cat keys/dataflow-agent.json | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
const web3 = require('@solana/web3.js');
const kp = web3.Keypair.fromSecretKey(Uint8Array.from(data));
console.log(kp.publicKey.toString());
"

# Send SOL from your wallet
# (Use Phantom, Solflare, or Solana CLI)
```

---

## Step 6: Register Agent (1 min)

```bash
npm run register
```

**You'll see**:
- ✅ Agent registered transaction
- ✅ Agent address
- ✅ Link to SAP Explorer

**Verify on explorer**:
```
https://explorer.oobeprotocol.ai/agents/[YOUR_AGENT_ADDRESS]
```

---

## Step 7: Run Demo (1 min)

```bash
npm run demo
```

**Expected output**:
```
🚀 DataFlow Agent Starting...
✅ Configuration validated
✅ Agent loaded: [address]
✅ Connected to mainnet-beta
✅ SAP client initialized
✅ All services initialized
🎯 DataFlow Agent ready!

📝 Running demo task...
📊 Analyzing text...
✅ Text analysis completed
📝 Summarizing text...
✅ Summarization completed
🔍 Extracting structured data...
✅ Data extraction completed
💸 Settling payment...
✅ Payment settled: [tx_hash]
✅ Task completed successfully!
```

---

## 🎉 You're Done!

Your agent is now:
- ✅ Registered on SAP mainnet
- ✅ Integrated with Ace Data Cloud
- ✅ Processing data autonomously
- ✅ Settling payments on-chain

---

## Next Steps

### For Bounty Submission:

1. **Record Demo Video** (2-3 min)
   - Follow `docs/demo-script.md`
   - Show SAP Explorer, live demo, payment proof
   - Upload to YouTube/Loom

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: DataFlow Agent"
   git remote add origin [your-repo]
   git push -u origin main
   ```

3. **Submit to Bounty**
   - Post on X/Twitter
   - Tag @OOBEonSol @AceDataCloud
   - Include demo video + GitHub repo
   - Specify category (or both)

---

## 🆘 Troubleshooting

### "SOLANA_RPC_URL must be set"
→ Edit `.env` and add your Synapse API key

### "Agent keypair not found"
→ Run keypair generation (Step 3)

### "Insufficient balance"
→ Send SOL to agent address (Step 5)

### "Registration failed"
→ Check balance, RPC URL, and network status

### "402 Payment Required" (in demo)
→ This is expected! x402 should handle it automatically
→ If it fails, check Ace Data Cloud account has credits

---

## 📚 Full Documentation

- `README.md` - Project overview
- `IMPLEMENTATION.md` - Detailed implementation guide
- `docs/demo-script.md` - Demo video script
- `src/` - Source code with comments

---

**Need help?** Check the full docs or open an issue on GitHub.

**Good luck with the bounty!** 🚀
