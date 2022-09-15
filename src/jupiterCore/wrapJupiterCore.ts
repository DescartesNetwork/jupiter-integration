import { AccountInfo, PublicKey } from '@solana/web3.js'
import { Amm } from '@jup-ag/core'

import { AccountInfoMap } from './type'

import { BalansolAmm } from '../balansolAmm'
import { BALANSOL_PROGRAM_ID } from '../balansolAmm/constant'
import { getBalansolMarkets } from '../balansolAmm/helper'

export function ammFactory(
  address: PublicKey,
  accountInfo: AccountInfo<Buffer>,
  params?: any,
): Amm | undefined {
  const programId = new PublicKey(accountInfo.owner)

  if (programId.equals(BALANSOL_PROGRAM_ID)) {
    return new BalansolAmm(address, accountInfo, params)
  }
  return
}

export const fetchMarketCache = async (url: string) => {
  return getBalansolMarkets()
}

export const mapAddressToAccountInfos = (
  accountInfoMap: AccountInfoMap,
  addresses: PublicKey[],
): AccountInfo<Buffer>[] => {
  const accountInfos = addresses.map((address) => {
    const accountInfo = accountInfoMap.get(address.toString())

    if (!accountInfo) {
      throw new Error(`Account info ${address.toBase58()} missing`)
    }

    return accountInfo
  })
  return accountInfos
}
