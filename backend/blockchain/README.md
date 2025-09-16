# HerbChain Blockchain Base (Hyperledger Fabric)

This folder scaffolds a permissioned blockchain base for HerbChain using Hyperledger Fabric, with Python-based orchestration.

## Overview
- Permissioned network for verified actors: Farmers, Transporters, Labs, Processors, AYUSH.
- Channels for privacy:
  - `farmer-lab`
  - `lab-processor`
  - `processor-ayush`
  - `consumer-read` (read-only/public query gateway)
- Modular org onboarding.
- Python tooling to generate crypto, bring network up/down, create channels, and deploy contract stubs.

## Structure
```
backend/blockchain/
  config/
    configtx.yaml
    core.yaml
    crypto-config.yaml
    channels/
      farmer-lab.tx.yaml
      lab-processor.tx.yaml
      processor-ayush.tx.yaml
      consumer-read.tx.yaml
  docker/
    docker-compose.yaml
    env.example
  scripts/
    network.py
    channel_ops.py
    chaincode_ops.py
    utils/
      fabric_cli.py
      config_loader.py
  client/
    herbchain_client.py
    .env.example
  chaincode/
    herbchain_stub/
      package.json
      index.js
      lib/
        contract.js
  README.md
```

## Quickstart
1) Prerequisites
- Docker and Docker Compose
- OpenSSL
- Python 3.10+
- Fabric binaries and images (v2.5+)

2) Configure
- Copy `docker/env.example` to `docker/.env` and adjust ports/paths.
- Copy `client/.env.example` to `client/.env` with gateway settings.

3) Install Python deps
```bash
pip install -r backend/requirements.txt
```

4) Bring network up, create channels, deploy chaincode
```bash
# From repo root or backend/blockchain
python backend/blockchain/scripts/network.py up --generate
python backend/blockchain/scripts/channel_ops.py create-all
python backend/blockchain/scripts/chaincode_ops.py deploy --name herbchain --version 0.1.0
```

5) Test client
```bash
python backend/blockchain/client/herbchain_client.py ping
```

## Design notes
- Each stakeholder runs a peer; orderers are Raft.
- Channels segregate data; policies set per-channel endorsement.
- `consumer-read` is exposed through a read-only app gateway; the ledger stays permissioned.

## Next steps
- Replace `chaincode/herbchain_stub` with production smart contracts (Go/TS).
- Add org onboarding scripts: `network.py add-org`.
- Integrate mobile and web via `client/herbchain_client.py`.
