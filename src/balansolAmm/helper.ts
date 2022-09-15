import { BN } from '@project-serum/anchor'
import { PoolPairData } from './type'

const PRECISION = 10 ** 9

export const calcOutGivenInSwap = (
  amountIn: number,
  balanceOut: BN,
  balanceIn: BN,
  weightOut: number,
  weightIn: number,
  swapFee: BN,
) => {
  const numBalanceOut = utilsBN.toNumber(balanceOut)
  const numBalanceIn = utilsBN.toNumber(balanceIn)
  const numSwapFee = utilsBN.toNumber(swapFee) / PRECISION
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
  const Bi = utilsBN.toNumber(balanceIn)
  const Bo = utilsBN.toNumber(balanceOut)
  const wi = weightIn
  const wo = weightOut
  const f = utilsBN.toNumber(swapFee) / PRECISION
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

export const utilsBN = {
  /**
   * Add decimals to the number
   * @param num
   * @param decimals
   * @returns
   */
  decimalize: (num: string | number, decimals: number): BN => {
    if (!num) return new BN(0)
    if (decimals < 0 || decimals % 1 !== 0)
      throw new Error('decimals must be an integer greater than zero')
    const n = num.toString()
    if (!decimals) return new BN(n)
    const m = n.split('.')
    if (m.length > 2) throw new Error('Invalid number')
    if (m.length === 1) return new BN(num).mul(new BN(10 ** decimals))
    if (m[1].length >= decimals)
      return new BN(m[0] + m[1].substring(0, decimals))
    else return new BN(m[0] + m[1] + '0'.repeat(decimals - m[1].length))
  },

  toNumber: (numBN: BN): number => {
    return Number(numBN.toString())
  },
}
