# `_archive/` — out-of-scope, kept for reference

These folders are not part of the v1 HerbChain stack but are preserved here so
the git history and design notes stay intact.

| Folder | Why it's archived |
| --- | --- |
| [`prototype/`](prototype/) | The original static HTML/CSS click-through prototype. Useful as visual reference for the role pages but superseded by the React Native app under `App/`. |
| [`blockchain/`](blockchain/) | Hyperledger Fabric scaffold (chaincode, configtx, docker-compose). Dropped from v1 in favour of a centralised SQL ledger; the QR JWT model gives most of the same audit guarantees at a fraction of the operational cost. Bring this back if/when you need cross-org consensus. |

Nothing in this folder is imported by the live backend, mobile, or website code.
