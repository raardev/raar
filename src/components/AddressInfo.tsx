import type React from 'react'

interface AddressInfoProps {
  addressData: {
    address: string
    balance: string
    isContract: boolean
    transactionCount: number
  }
}

const AddressInfo: React.FC<AddressInfoProps> = ({ addressData }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold">Address Information</h3>
      <p>
        <strong>Address:</strong> {addressData.address}
      </p>
      <p>
        <strong>Balance:</strong> {addressData.balance} ETH
      </p>
      <p>
        <strong>Type:</strong>{' '}
        {addressData.isContract ? 'Contract' : 'Externally Owned Account (EOA)'}
      </p>
      <p>
        <strong>Transaction Count:</strong> {addressData.transactionCount}
      </p>
    </div>
  )
}

export default AddressInfo
