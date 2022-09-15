import { Cluster } from '@solana/web3.js'
import bs58 from 'bs58'
import { Keypair } from '@solana/web3.js'

require('dotenv').config()

// Endpoints, connection
export const ENV: Cluster = (process.env.CLUSTER as Cluster) || 'mainnet-beta'

// Sometimes, your RPC endpoint may reject you if you spam too many RPC calls. Sometimes, your PRC server
// may have invalid cache and cause problems.
export const SOLANA_RPC_ENDPOINT =
  ENV === 'devnet'
    ? 'https://api.devnet.solana.com'
    : 'https://ssc-dao.genesysgo.net'

// Wallets
export const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY

//"PASTE YOUR WALLET PRIVATE KEY"
export const USER_KEYPAIR = Keypair.generate()

const TOKENS = {
  SNTR: 'SENBBKVCM7homnf5RX9zqpf1GFe935hnbU4uVzY1Y6M',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  SOL: 'So11111111111111111111111111111111111111112',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
}
// Token Mints
export const INPUT_MINT_ADDRESS =
  ENV === 'devnet'
    ? 'So11111111111111111111111111111111111111112' // SOL
    : TOKENS.SOL // USDC
export const OUTPUT_MINT_ADDRESS =
  ENV === 'devnet'
    ? 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt' // SRM
    : TOKENS.SNTR // SNTR

// Interface
export interface Token {
  chainId: number // 101,
  address: string // '8f9s1sUmzUbVZMoMh6bufMueYH1u4BJSM57RCEvuVmFp',
  symbol: string // 'TRUE',
  name: string // 'TrueSight',
  decimals: number // 9,
  logoURI: string // 'https://i.ibb.co/pKTWrwP/true.jpg',
  tags: string[] // [ 'utility-token', 'capital-token' ]
}
