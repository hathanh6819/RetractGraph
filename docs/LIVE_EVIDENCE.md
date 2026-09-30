# Studio Next live evidence

Final v3 contract: [`0x31ca5981ccd8a0b0E50a1d17977fA36b9d6FbbE7`](https://explorer-studio-dev.genlayer.com/address/0x31ca5981ccd8a0b0E50a1d17977fA36b9d6FbbE7), chain ID `61997`.

Finalized protocol readback: `RetractGraph / version 3 / pubmed-wrapper-safe-bidirectional-impact-wave`. The constructor has no inputs; the deployer has no privileged runtime role. Graph authorship and assessment were exercised with two different wallets.

## Graph construction and authorization

- [create workspace](https://explorer-studio-dev.genlayer.com/transactions/0xb0941399293bcedb77ea5f35d161e31752f049fd6567f7c3838e679f6072cf30)
- [add root claim](https://explorer-studio-dev.genlayer.com/transactions/0x6d994afd4e67bc1acb867c5c2951f5c45543d4ebb123cb495f80c74d9abae80d)
- [cite retracted article](https://explorer-studio-dev.genlayer.com/transactions/0x1c01c7a846d12192d0ffb1bf494b5175cfbcfe284cc64746ba65a8bd4cfc10ea)
- [add downstream claim](https://explorer-studio-dev.genlayer.com/transactions/0x0d716634cb5336dabf6280e3f7c83745ece747a478a9c0857de48e97c2b64d76)
- [cite independent article](https://explorer-studio-dev.genlayer.com/transactions/0x896dfff06e4731ef1da136504b1e08db75ad17b9fc11071daa1f77d4c495f55d)
- [link dependency](https://explorer-studio-dev.genlayer.com/transactions/0x49c7267fb4095af4da652da3321e3bd47bfd123452c7132a0ce2c3ae4ee3502e)
- [unauthorized observer edit](https://explorer-studio-dev.genlayer.com/transactions/0x8f95e9f55a6dab6465f8e6808b4c7c3764f131e7deb6769c3e79fbb65c2285c3): finalized with no state mutation
- [seal workspace](https://explorer-studio-dev.genlayer.com/transactions/0xf86118557326420c87842106787cdc26c66c51bd27c8b7d73c1de436c878abd0)

All transactions finalized with `FINISHED_WITH_RETURN / MAJORITY_AGREE`.

## Source, conflict and impact wave

- [cross-object control](https://explorer-studio-dev.genlayer.com/transactions/0xd58068bb2be510f7718dd777ceb88a0b1c8302133b21c893e4f08386efa5ba7f): assessment #1, `UNRESOLVED / NOTICE_RELATION_MISMATCH`; claims unchanged.
- [valid retraction pair](https://explorer-studio-dev.genlayer.com/transactions/0xf89dd73c51fb5fed927f89adcd114607e4153be8c5e5171ba58c1724caca83b5): assessment #2, `ASSESSED / RetractionOf / MATERIAL_INVALIDATION`; source digest `sha256:ccfbf13263173aea5df02ed80e01026ec4aa36102b0106961e42168ce08365a2`.
- Finalized post-state: root claim #1 became `BROKEN / RETRACTION_UNDERMINES_SUPPORT`; dependent claim #2 became `RECHECK_REQUIRED`.
- [exact replay](https://explorer-studio-dev.genlayer.com/transactions/0x863aaf25676a42ce1687b32d8da0783182a448d366d22a0a03191c617e77f95b): assessment count remained `2`.

The authoritative source pair is [PubMed article 27516793](https://pubmed.ncbi.nlm.nih.gov/27516793/) and [PubMed retraction notice 28515760](https://pubmed.ncbi.nlm.nih.gov/28515760/).

## Repair and independent audit

- [add replacement PMID 10969679](https://explorer-studio-dev.genlayer.com/transactions/0x9c1f29d3ee9666946a855ea3acea6f6725e4ade7a5347ea2bd32fa9554369aa5)
- [reassess repaired root](https://explorer-studio-dev.genlayer.com/transactions/0x58e1fa87dc820c079c50062f44a506fc36069bb552e6ed0bc06aa4107c46dbc0): assessment #3, `SUPPORT_SUFFICIENT / CLAIM_DIRECTLY_SUPPORTED`; root returned to `CURRENT`.
- [mismatched replacement/notice pair](https://explorer-studio-dev.genlayer.com/transactions/0xcce8d24a48519b8d3bf163035f6e0fea4cd3a2b23b27f11ed81a91d2f5a44b9a): assessment #4, safe `UNRESOLVED / NOTICE_RELATION_MISMATCH`; claim state unchanged.
- [invalid identical PMID pair](https://explorer-studio-dev.genlayer.com/transactions/0xb0dd5a33ce8112277d6b8b7d0f1fb091ad1ba7fd88c0c308b19dac939de0f49b): rejected without increasing assessment count.
- [stale revision reassessment](https://explorer-studio-dev.genlayer.com/transactions/0x43fab5234eb784a2d807a3beb3c8705cf71e8f5bd007ee783cb3df4b287e58c3): rejected without increasing assessment count.
- [independent reassessment of downstream claim](https://explorer-studio-dev.genlayer.com/transactions/0x1cfda0cc72772779e5ecb7ea4e3fb76f9f73b95698596616690a047329895518): assessment #5; claim #2 returned to `CURRENT / CLAIM_DIRECTLY_SUPPORTED`.

Finalized terminal state: `1 workspace / 2 claims / 5 assessments`; both claims are `CURRENT`. Every write above is independently inspectable on the Studio Next explorer.

## Superseded deployments

- [v1](https://explorer-studio-dev.genlayer.com/address/0xfcb907de18CDF07D64142bA1F6Ff7E7ABDC65314): retired after live testing exposed one-direction relation parsing.
- [v2](https://explorer-studio-dev.genlayer.com/address/0x9529Bc53f57ADB55Cf6a88FB3d91311093F0a3aB): retired after live testing exposed an XML wrapper regex collision.

Neither superseded address should be submitted or wired to the frontend.
