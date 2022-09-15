import { BALANSOL_PROGRAM } from '../balansolAmm/constant'

import { AccountInfo, PublicKey, Connection } from '@solana/web3.js'
import { Amm } from '@jup-ag/core'

import { BALANSOL_PROGRAM_ID } from '../balansolAmm/constant'
import { BalansolAmm } from '../balansolAmm'
import { SOLANA_RPC_ENDPOINT } from '../constants'
import { AccountInfoMap } from './type'

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
  const connection = new Connection(SOLANA_RPC_ENDPOINT)
  const pools = await BALANSOL_PROGRAM.account.pool.all()
  const accounts = await connection.getMultipleAccountsInfo(
    pools.map((pool) => pool.publicKey),
  )
  const wrapAccounts = accounts.map((accountData, idx) => {
    return {
      ...accountData,
      owner: BALANSOL_PROGRAM_ID.toBase58(),
      pubkey: pools[idx].publicKey.toBase58(),
      data: [accountData?.data.toString('base64'), 'base64'],
    }
  })
  return wrapAccounts
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
