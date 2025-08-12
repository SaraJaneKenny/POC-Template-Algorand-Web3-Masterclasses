// src/components/Tokenmint.tsx
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TokenMintProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Tokenmint = ({ openModal, setModalState }: TokenMintProps) => {
  const [assetName, setAssetName] = useState<string>('')
  const [unitName, setUnitName] = useState<string>('')
  const [totalSupply, setTotalSupply] = useState<string>('')
  const [decimals, setDecimals] = useState<string>('0')
  const [loading, setLoading] = useState<boolean>(false)

  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  const handleMintToken = async () => {
    setLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    if (!assetName || !unitName || !totalSupply) {
      enqueueSnackbar('Please fill out all fields', { variant: 'warning' })
      setLoading(false)
      return
    }

    try {
      enqueueSnackbar('Minting token...', { variant: 'info' })

      // Convert supply to BigInt considering decimals
      const decimalsBig = BigInt(decimals)
      const onChainTotal = BigInt(totalSupply) * BigInt(10) ** decimalsBig

      const createResult = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: onChainTotal,
        decimals: Number(decimalsBig),
        assetName,
        unitName,
        defaultFrozen: false,
      })

      enqueueSnackbar(`✅ Token Minted! ASA ID: ${createResult.assetId}`, { variant: 'success' })
      setAssetName('')
      setUnitName('')
      setTotalSupply('')
      setDecimals('0')
    } catch (e) {
      console.error(e)
      enqueueSnackbar('Failed to mint token', { variant: 'error' })
    }

    setLoading(false)
  }

  return (
    <dialog id="token_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-lg">Mint Fungible Token</h3>
        <br />
        <input
          type="text"
          placeholder="Enter Asset Name"
          className="input input-bordered w-full mb-2"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Unit Name"
          className="input input-bordered w-full mb-2"
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Enter Total Supply"
          className="input input-bordered w-full mb-2"
          value={totalSupply}
          onChange={(e) => setTotalSupply(e.target.value)}
        />
        <input
          type="number"
          placeholder="Enter Decimals (e.g., 0)"
          className="input input-bordered w-full mb-4"
          value={decimals}
          onChange={(e) => setDecimals(e.target.value)}
        />
        <div className="modal-action">
          <button className="btn" onClick={() => setModalState(false)}>Close</button>
          <button
            type="button"
            className={`btn btn-success ${(assetName && unitName && totalSupply) ? '' : 'btn-disabled'}`}
            onClick={handleMintToken}
          >
            {loading ? <span className="loading loading-spinner" /> : 'Mint Token'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default Tokenmint
