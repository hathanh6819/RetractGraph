# RetractGraph v4 — Studio Next evidence

Contract: [`0xe9113918395E93948A24FFb3b0cAe20a933586A4`](https://explorer-studio-dev.genlayer.com/address/0xe9113918395E93948A24FFb3b0cAe20a933586A4), chain ID `61997`.

Production frontend: [retractgraph.pages.dev](https://retractgraph.pages.dev), Cloudflare deployment `3fa1ae2f-d076-4100-9935-53cb8be1291e`.

Finalized protocol readback: version `4`, architecture `claim-bound-collective-support-and-impact-wave`, seal policy `ALL_CLAIMS_COLLECTIVELY_VERIFIED`. The constructor has no inputs and the deployer has no privileged runtime role.

Two independent test roles:

- graph author: `0x1D283b45974B0be9630DFD1deC6A62a9B72B2760`
- observer/validator caller: `0xf96Cf822F9f4e76956AB9fAAa22B3BdCD7b10aD6`

## Graph construction and authorization

- [create workspace](https://explorer-studio-dev.genlayer.com/transactions/0xa0df6e7df9b47445ac0f76a543eb016a08fbe49f0426a82d716b59746b6fb2f1)
- [add root claim](https://explorer-studio-dev.genlayer.com/transactions/0xa9b89bd6588dd0e7c85c546a2b1abef8a410aff329b242768a8a7f58db73f793)
- [add root citation](https://explorer-studio-dev.genlayer.com/transactions/0xa9a1f68ec65988eb0fb2cfa0deaff27ac0195a8d49af6528d1190e2f39da1468)
- [add child claim](https://explorer-studio-dev.genlayer.com/transactions/0xe1783dbcc8f99c3c07462e38f809d9d1a8531acf84977caf69f6fb40724411db)
- [add child citation](https://explorer-studio-dev.genlayer.com/transactions/0x2d77cfdefbec64a9354898e01f732fac0084fae8a07f46397f0feba5dc58c674)
- [link dependency](https://explorer-studio-dev.genlayer.com/transactions/0xd9aa1e1f0fe50475bf819b138c8bbbdc0c7297ad91082c2a8c010cd9e5fd53be)
- [unauthorized observer edit](https://explorer-studio-dev.genlayer.com/transactions/0x08011eb0ae79866acd1ea9399d8029fce987feec10e9a41c2bcf8f320233df4d): finalized without state mutation.

## Collective support and sealing gate

- [verify root support](https://explorer-studio-dev.genlayer.com/transactions/0x8c50a8d9b21e378dd1f981575845c896d89c68123a44df1d6cae07b9325b28eb): assessment #1, `CURRENT / SUPPORT_SUFFICIENT`.
- First child verification returned `MAJORITY_DISAGREE`; assessment count stayed `1` and sealing remained blocked. This is the expected fail-closed consensus path.
- [retry child support](https://explorer-studio-dev.genlayer.com/transactions/0x096d6b2b370b602541996354e2d7cf23407235224a575412071e6213f7c07bda): assessment #2, `CURRENT / SUPPORT_SUFFICIENT`.
- [seal verified workspace](https://explorer-studio-dev.genlayer.com/transactions/0x90c47de282cb2239a03802a98bae879baf0764e99b03ea629704125a26a46db6): workspace changed from `DRAFT` to `SEALED` only after both claim commitments were current.

## Conflict, impact and replay

- [cross-object control](https://explorer-studio-dev.genlayer.com/transactions/0x907ba095e91da80fc9b7840f9542b7b07e727e463c5dccc6f416a63f7fcc2786): assessment #3, `UNRESOLVED / NOTICE_RELATION_MISMATCH`; claims unchanged.
- [valid retraction](https://explorer-studio-dev.genlayer.com/transactions/0x34953210ea5c35c4a51dd711fa72ff533c8857690dc11bae67aa8424689d96b7): assessment #4; root became `BROKEN / INVALIDATED`, child became `RECHECK_REQUIRED / STALE`.
- [exact replay](https://explorer-studio-dev.genlayer.com/transactions/0x819e0a73dde2b1ecd333458679fe78964ff55ee861221968e7d3064fd7c2c1de): rejected without increasing the assessment count.

## Repair, adversarial reassessment and terminal state

- [add root replacement citation](https://explorer-studio-dev.genlayer.com/transactions/0xc8303fdd23fca2e0e8610615440585b7ddd5d4d1d0f7eddb6e88878469877ae1)
- [reassess repaired root](https://explorer-studio-dev.genlayer.com/transactions/0x2d92c5f1a4165cc4a5c70f910fb0b59bf94a69f4afa18ef16b88b8186b65233d): assessment #5, root returned to `CURRENT / SUPPORT_SUFFICIENT`.
- [reassess child with insufficient evidence](https://explorer-studio-dev.genlayer.com/transactions/0x465870e0fe602ffb5970086ae103d430cb7752f175e976c97814207204721fed): assessment #6, genuine `BROKEN / SUPPORT_INSUFFICIENT`; the audit invariant intentionally failed.
- [add child support citation](https://explorer-studio-dev.genlayer.com/transactions/0x9148f6f04284af93597e4d6117674ecf7dce665ade5cde7b15d1112bb1b8e97f)
- [reassess repaired child](https://explorer-studio-dev.genlayer.com/transactions/0x285397f787d5ca62afb7d86e78701f4afdc005bf64bee1bb6187fa7826a89221): assessment #7.

Final finalized state:

- workspace #1: `SEALED`
- root #1: `CURRENT / SUPPORT_SUFFICIENT`, `support_revision == revision == 6`
- child #2: `CURRENT / SUPPORT_SUFFICIENT`, `support_revision == revision == 8`
- counts: `1 workspace / 2 claims / 7 assessments`

Every write finalized with `FINISHED_WITH_RETURN`. The evidence matrix includes successful lifecycle, authorization failure, validator disagreement, source conflict, replay rejection, insufficient-support failure and evidence-backed recovery.
