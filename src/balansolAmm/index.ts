import { Amm } from '@jup-ag/core'
import JSBI from 'jsbi'
import { PublicKey, AccountInfo, TransactionInstruction } from '@solana/web3.js'
import { BorshAccountsCoder, web3 } from '@project-serum/anchor'

import {
  calcNormalizedWeight,
  calcOutGivenInSwap,
  calcPriceImpactSwap,
} from './helper'

import { IDL } from './constant'
import {
  AccountInfoMap,
  Quote,
  QuoteParams,
  SwapParams,
} from '../jupiterCore/type'
import { PoolData } from './type'
import { mapAddressToAccountInfos } from '../jupiterCore/wrapJupiterCore'

const balansolCoder = new BorshAccountsCoder(IDL)

export class BalansolAmm implements Amm {
  label: string
  id: string
  reserveTokenMints: PublicKey[]
  shouldPrefetch: boolean
  exactOutputSupported: boolean
  poolData: PoolData | undefined

  constructor(
    address: PublicKey,
    accountInfo: AccountInfo<Buffer>,
    params: any,
  ) {
    const poolData: PoolData = balansolCoder.decode('pool', accountInfo.data)
    this.poolData = poolData

    this.label = 'Balansol'
    this.id = address.toBase58()
    this.reserveTokenMints = poolData.mints
    this.shouldPrefetch = false
    this.exactOutputSupported = false
  }

  getAccountsForUpdate(): PublicKey[] {
    return [new web3.PublicKey(this.id)]
  }

  update(accountInfoMap: AccountInfoMap): void {
    let [newPoolState] = mapAddressToAccountInfos(
      accountInfoMap,
      this.getAccountsForUpdate(),
    )
    const poolData: PoolData = balansolCoder.decode('pool', newPoolState.data)
    this.poolData = poolData
  }

  getQuote({ sourceMint, destinationMint, amount }: QuoteParams): Quote {
    console.log('getQuote')
    // Validate mint state
    if (!this.poolData) throw new Error('Invalid Pool Data')
    const mintList = this.poolData.mints.map((mint) => mint.toBase58())
    const bidMintIndex = mintList.indexOf(sourceMint.toBase58())
    const askMintIndex = mintList.indexOf(destinationMint.toBase58())
    const weightIn = calcNormalizedWeight(
      this.poolData.weights,
      this.poolData.weights[bidMintIndex],
    )
    const weightOut = calcNormalizedWeight(
      this.poolData.weights,
      this.poolData.weights[askMintIndex],
    )

    // Route
    const amountOut = calcOutGivenInSwap(
      Number(amount.toString()),
      this.poolData.reserves[askMintIndex],
      this.poolData.reserves[bidMintIndex],
      weightOut,
      weightIn,
      this.poolData.fee.add(this.poolData.taxFee),
    )
    const priceImpact = calcPriceImpactSwap(Number(amount.toString()), {
      balanceIn: this.poolData.reserves[bidMintIndex],
      balanceOut: this.poolData.reserves[askMintIndex],
      weightIn,
      weightOut,
      swapFee: this.poolData.fee.add(this.poolData.taxFee),
    })

    const totalFeeRatio = this.poolData.fee.add(this.poolData.taxFee)
    const feeRatio = totalFeeRatio.toNumber() / 10 ** 9
    const feeAmount = (amountOut / (1 - feeRatio)) * feeRatio

    console.log('amountOut', amountOut)
    console.log('OK')
    return {
      notEnoughLiquidity: false,
      inAmount: amount,
      outAmount: JSBI.BigInt(Math.floor(amountOut)),
      feeAmount: JSBI.BigInt(Math.floor(feeAmount)),
      feeMint: destinationMint.toBase58(),
      feePct: 0,
      priceImpactPct: priceImpact,
    }
  }

  createSwapInstructions(swapParams: SwapParams): TransactionInstruction[] {
    return []
  }
}