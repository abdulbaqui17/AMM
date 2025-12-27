/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/amm.json`.
 */
export type Amm = {
  "address": "GusCwDKH6aEkejKcGKDoVpRaeYPBRHwxn1k5kGFK4Guu",
  "metadata": {
    "name": "amm",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Constant Product AMM"
  },
  "instructions": [
    {
      "name": "addLiquidity",
      "discriminator": [
        181,
        157,
        89,
        67,
        143,
        182,
        52,
        72
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "pool.token_mint_a",
                "account": "pool"
              },
              {
                "kind": "account",
                "path": "pool.token_mint_b",
                "account": "pool"
              }
            ]
          }
        },
        {
          "name": "tokenMintA"
        },
        {
          "name": "tokenMintB"
        },
        {
          "name": "vaultA",
          "writable": true
        },
        {
          "name": "vaultB",
          "writable": true
        },
        {
          "name": "lpMint",
          "writable": true
        },
        {
          "name": "userTokenA",
          "writable": true
        },
        {
          "name": "userTokenB",
          "writable": true
        },
        {
          "name": "userLp",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amountA",
          "type": "u64"
        },
        {
          "name": "amountB",
          "type": "u64"
        },
        {
          "name": "minLpTokens",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializePool",
      "discriminator": [
        95,
        180,
        10,
        172,
        84,
        174,
        232,
        40
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "tokenMintA"
              },
              {
                "kind": "account",
                "path": "tokenMintB"
              }
            ]
          }
        },
        {
          "name": "tokenMintA"
        },
        {
          "name": "tokenMintB"
        },
        {
          "name": "vaultA"
        },
        {
          "name": "vaultB"
        },
        {
          "name": "lpMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "removeLiquidity",
      "discriminator": [
        80,
        85,
        209,
        72,
        24,
        206,
        177,
        108
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "pool.token_mint_a",
                "account": "pool"
              },
              {
                "kind": "account",
                "path": "pool.token_mint_b",
                "account": "pool"
              }
            ]
          }
        },
        {
          "name": "tokenMintA"
        },
        {
          "name": "tokenMintB"
        },
        {
          "name": "vaultA",
          "writable": true
        },
        {
          "name": "vaultB",
          "writable": true
        },
        {
          "name": "lpMint",
          "writable": true
        },
        {
          "name": "userLp",
          "writable": true
        },
        {
          "name": "userTokenA",
          "writable": true
        },
        {
          "name": "userTokenB",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "lpAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "discriminator": [
        248,
        198,
        158,
        145,
        225,
        117,
        135,
        200
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "pool.token_mint_a",
                "account": "pool"
              },
              {
                "kind": "account",
                "path": "pool.token_mint_b",
                "account": "pool"
              }
            ]
          }
        },
        {
          "name": "tokenMintA"
        },
        {
          "name": "tokenMintB"
        },
        {
          "name": "userInput",
          "writable": true
        },
        {
          "name": "userOutput",
          "writable": true
        },
        {
          "name": "vaultInput",
          "writable": true
        },
        {
          "name": "vaultOutput",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minimumAmountOut",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "identicalMints",
      "msg": "Token mints must be different"
    },
    {
      "code": 6001,
      "name": "invalidMintOrder",
      "msg": "Token mints must be in canonical order"
    },
    {
      "code": 6002,
      "name": "zeroLiquidity",
      "msg": "Liquidity amount cannot be zero"
    },
    {
      "code": 6003,
      "name": "insufficientLiquidity",
      "msg": "Pool has insufficient liquidity"
    },
    {
      "code": 6004,
      "name": "slippageExceeded",
      "msg": "Slippage tolerance exceeded"
    },
    {
      "code": 6005,
      "name": "mathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6006,
      "name": "invalidVault",
      "msg": "Invalid vault account"
    },
    {
      "code": 6007,
      "name": "invalidLpMint",
      "msg": "Invalid LP mint"
    }
  ],
  "types": [
    {
      "name": "pool",
      "docs": [
        "Pool account holding AMM state and vault references"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMintA",
            "docs": [
              "First token mint in the pair"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenMintB",
            "docs": [
              "Second token mint in the pair"
            ],
            "type": "pubkey"
          },
          {
            "name": "vaultA",
            "docs": [
              "Vault holding token A reserves"
            ],
            "type": "pubkey"
          },
          {
            "name": "vaultB",
            "docs": [
              "Vault holding token B reserves"
            ],
            "type": "pubkey"
          },
          {
            "name": "lpMint",
            "docs": [
              "LP token mint for liquidity providers"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "docs": [
              "Trading fee in basis points (1 bps = 0.01%)"
            ],
            "type": "u16"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};
