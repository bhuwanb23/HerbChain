# HerbChain Blockchain Base (Hyperledger Fabric)

A permissioned blockchain base for HerbChain using Hyperledger Fabric with Python-driven orchestration.

If you are new to blockchain, think of Fabric as a distributed database where only approved parties (organizations) can write data, and some data can be kept private between specific groups using channels.

## Key Concepts (Beginner-friendly)
- **Permissioned blockchain**: Only verified organizations can participate (unlike public chains). Identity is enforced via certificates.
- **Organization (Org)**: A stakeholder group, e.g., Farmers, Labs, Processors, AYUSH.
- **Peer**: A server run by an Org that stores the ledger and runs smart contracts.
- **Orderer**: A service that orders transactions into blocks (consensus). We plan to use Raft.
- **Channel**: A private sub-ledger between a subset of Orgs. Each channel has its own chain of blocks.
- **Chaincode (Smart contract)**: The business logic that validates and writes data (e.g., register harvest, record lab results).

## Channels for HerbChain
- `farmer-lab`: Harvest records + lab quality validation (private to Farmers and Labs).
- `lab-processor`: Quality-verified herbs moving into production (Labs and Processors).
- `processor-ayush`: Compliance validation and audits (Processors and AYUSH).
- `consumer-read`: Public read-only access exposed via an app gateway (ledger remains permissioned).

---

## Repository Layout (What each file does)

### backend/blockchain/config/
- `configtx.yaml`: Main Fabric network configuration.
  - Defines Organizations (Farmers, Labs, Processors, AYUSH, Orderer).
  - Sets capabilities (Fabric feature gates) and multiple Profiles:
    - `HerbChainGenesis`: Used to build the genesis block for the ordering system channel.
    - `FarmerLabChannel`, `LabProcessorChannel`, `ProcessorAyushChannel`, `ConsumerReadChannel`: Profiles for each app channel.
- `core.yaml`: Minimal peer overrides (e.g., CouchDB state database connection).
- `crypto-config.yaml`: Template for generating crypto material (certificates/keys) for Orgs and Orderer with `cryptogen`.
- `channels/`
  - `farmer-lab.tx.yaml`, `lab-processor.tx.yaml`, `processor-ayush.tx.yaml`, `consumer-read.tx.yaml`:
    - Small stubs indicating channel IDs and which Profile to use when generating channel creation transactions with `configtxgen`.

### backend/blockchain/docker/
- `docker-compose.yaml`: Minimal example Compose file for base services (orderer, CouchDB). Extend this to add peers, certificate authorities (CAs), and CLI containers per Org.
- `env.example`: Example environment variables read by Docker Compose. Copy to `.env` and adjust if needed.

### backend/blockchain/scripts/
- `network.py`: Python CLI to orchestrate the network lifecycle.
  - `up --generate`:
    - Runs `cryptogen` to generate crypto material from `crypto-config.yaml`.
    - Runs `configtxgen` to build `genesis.block` from `configtx.yaml` using the `HerbChainGenesis` profile.
    - Starts containers via Docker Compose.
  - `down`: Stops and removes containers/volumes.
- `channel_ops.py`: Python CLI to generate channel creation transactions for all four channels using `configtxgen` and the corresponding Profiles.
- `chaincode_ops.py`: Python CLI to package the sample chaincode (stub) into a `.tgz` (illustrative—extend to full install/approve/commit lifecycle).
- `utils/`
  - `fabric_cli.py`: Small wrapper to run external commands with pretty logging.
  - `config_loader.py`: YAML/env loader helper.

### backend/blockchain/client/
- `herbchain_client.py`: Minimal Python client placeholder. Currently supports a `ping` command and illustrates where to plug in the Fabric Gateway SDK.
- `.env.example`: Example client-side environment variables (gateway URL, wallet path, default channel/contract). Copy to `.env` and adjust.

### backend/blockchain/chaincode/herbchain_stub/
- `package.json`: Node chaincode package that depends on `fabric-contract-api` and `fabric-shim`.
- `index.js`: Registers a simple `HerbChainContract` with a `ping` method (returns "pong").
- `lib/contract.js`: Placeholder for future business logic modules.

### backend/blockchain/README.md (this file)
- Explains concepts, layout, and usage instructions.

---

## Quickstart
1) Prerequisites
- Docker and Docker Compose
- OpenSSL
- Python 3.10+
- Fabric binaries and Docker images (v2.5+)

2) Configure
- Copy `backend/blockchain/docker/env.example` to `backend/blockchain/docker/.env` and adjust if needed.
- Copy `backend/blockchain/client/.env.example` to `backend/blockchain/client/.env` and set gateway variables when you wire up the SDK.

3) Install Python deps
```bash
pip install -r backend/requirements.txt
```

4) Bring up network and generate artifacts
```bash
python backend/blockchain/scripts/network.py up --generate
python backend/blockchain/scripts/channel_ops.py create-all
python backend/blockchain/scripts/chaincode_ops.py deploy --name herbchain --version 0.1.0
```

5) Client sanity check
```bash
python backend/blockchain/client/herbchain_client.py ping
```

---

## How this maps to the design prompt
- **Permissioned Fabric network** with four organizations (Farmers, Labs, Processors, AYUSH) and modular onboarding.
- **Channels**: Farmer-Lab, Lab-Processor, Processor-AYUSH, Consumer-Read, each defined via Profiles in `configtx.yaml`.
- **Peer nodes**: To be added per Org in Docker Compose (the scaffold shows where they will live).
- **Genesis block**: Generated using `HerbChainGenesis` profile.
- **Python tooling**: Orchestrates generation, startup, channel TX creation, and chaincode packaging.

---

## Next steps (to reach a full network)
- Add Certificate Authorities (fabric-ca) and enroll identities.
- Add peers for each Org in `docker-compose.yaml`, configure MSP/TLS volumes.
- Join peers to each channel; update anchor peers.
- Implement chaincode lifecycle (install/approve/commit) and endorsement policies per channel.
- Replace stub chaincode with production logic (Go/TypeScript) for traceability.
- Implement a real Python/Node client using the Fabric Gateway SDK for submit/evaluate transactions.
