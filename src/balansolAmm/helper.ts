import { BN, utils } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'

// Balansol AMM
import { BALANSOL_PROGRAM, BALANSOL_PROGRAM_ID, PRECISION } from './constant'
import { PoolPairData } from './type'

export const calcOutGivenInSwap = (
  amountIn: number,
  balanceOut: BN,
  balanceIn: BN,
  weightOut: number,
  weightIn: number,
  swapFee: BN,
) => {
  const numBalanceOut = Number(balanceOut.toString())
  const numBalanceIn = Number(balanceIn.toString())
  const numSwapFee = Number(swapFee.toString()) / PRECISION
  const ratioBeforeAfterBalance = numBalanceIn / (numBalanceIn + amountIn)
  const ratioInOutWeight = weightIn / weightOut
  return (
    numBalanceOut *
    (1 - ratioBeforeAfterBalance ** ratioInOutWeight) *
    (1 - numSwapFee)
  )
}

export const calcNormalizedWeight = (
  weights: BN[],
  weightToken: BN,
): number => {
  const numWeights = weights.map((value) => value.toNumber() / PRECISION)
  const numWeightToken = weightToken.toNumber() / PRECISION
  const weightSum = numWeights.reduce((pre, curr) => pre + curr, 0)
  return numWeightToken / weightSum
}

export const calcSpotPriceExactInSwap = (
  amount: number,
  poolPairData: PoolPairData,
) => {
  const { balanceIn, balanceOut, weightIn, weightOut, swapFee } = poolPairData
  // TODO: Consider whether use decimal or not here
  const Bi = Number(balanceIn.toString())
  const Bo = Number(balanceOut.toString())
  const wi = weightIn
  const wo = weightOut
  const f = Number(swapFee.toString()) / PRECISION
  return -(
    (Bi * wo) /
    (Bo * (-1 + f) * (Bi / (amount + Bi - amount * f)) ** ((wi + wo) / wo) * wi)
  )
}

export const calcPriceImpactSwap = (
  bidAmount: number,
  poolPairData: PoolPairData,
) => {
  const currentSpotPrice = calcSpotPriceExactInSwap(0, poolPairData)
  const spotPriceAfterSwap = calcSpotPriceExactInSwap(bidAmount, poolPairData)
  if (spotPriceAfterSwap < currentSpotPrice) return 0
  const impactPrice = 1 - currentSpotPrice / spotPriceAfterSwap
  return impactPrice
}

export const getBalansolParams = async (
  poolPublicKey: PublicKey,
  taxMan: PublicKey,
  mints: PublicKey[],
): Promise<{ treasurer: PublicKey; taxmanTokenAccounts: PublicKey[] }> => {
  const [treasurer] = await PublicKey.findProgramAddress(
    [Buffer.from('treasurer'), poolPublicKey.toBuffer()],
    BALANSOL_PROGRAM_ID,
  )
  const taxmanTokenAccounts = await Promise.all(
    mints.map((mint) => utils.token.associatedAddress({ mint, owner: taxMan })),
  )
  return { treasurer, taxmanTokenAccounts }
}

export const getBalansolMarkets = async () => {
  const pools = await BALANSOL_PROGRAM.account.pool.all()
  // Parser Account Data
  const markets = await Promise.all(
    pools.map(async (pool) => {
      // Build Data
      const poolData = pool.account
      const buff = await BALANSOL_PROGRAM.coder.accounts.encode(
        'pool',
        pool.account,
      )
      // Build Params
      const params = await getBalansolParams(
        pool.publicKey,
        poolData.taxMan,
        poolData.mints,
      )
      return {
        owner: BALANSOL_PROGRAM_ID.toBase58(),
        pubkey: pool.publicKey.toBase58(),
        data: [buff.toString('base64'), 'base64'],
        params,
      }
    }),
  )
  return markets
}
