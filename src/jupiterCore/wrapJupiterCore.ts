import { AccountInfo, PublicKey } from '@solana/web3.js'
import { Amm } from '@jup-ag/core'

import { BALANSOL_PROGRAM_ID } from '../myAmm/constant'
import { BalansolAmm } from '../myAmm'

export function ammFactory(
  address: PublicKey,
  accountInfo: AccountInfo<Buffer>,
  params?: any,
): Amm | undefined {
  const programId = new PublicKey(accountInfo.owner)

  if (programId.equals(BALANSOL_PROGRAM_ID)) {
    new BalansolAmm(address, accountInfo, params)
  }
  return
}
