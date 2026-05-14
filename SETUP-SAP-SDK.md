# 🔧 Setup SAP SDK

The SAP SDK from GitHub needs to be built before use.

## Option 1: Build SAP SDK Locally

```bash
cd node_modules/@oobe-protocol-labs/synapse-sap-sdk
npm install
npm run build
cd ../../../
```

## Option 2: Use Pre-built Version (Recommended)

Check if there's a pre-built version on npm or use the CLI instead.

## Option 3: Simplified Demo (For Now)

The code is structured to work with SAP SDK, but for initial testing you can:

1. Use the SAP CLI for registration:
```bash
npm install -g @oobe-protocol-labs/synapse-sap-cli
synapse-sap env init --template mainnet
synapse-sap agent register --manifest manifest.json
```

2. Run the agent for demo purposes (SAP calls will be stubbed)

---

## Quick Test Without Full SAP Integration

For testing the workflow logic without full SAP integration:

```bash
# The agent will log what it would do
# without actually making SAP calls
npm run demo
```

---

**For production bounty submission**, build the SAP SDK properly or use the CLI for on-chain operations.
