export function formatBinaryData(hexString: string): string {
  if (!hexString.startsWith('0x')) {
    return hexString
  }

  const withoutPrefix = hexString.slice(2)

  // Format as transaction hash
  if (withoutPrefix.length === 64) {
    return `0x${withoutPrefix.slice(0, 6)}...${withoutPrefix.slice(-6)}`
  }

  // Format as address
  if (withoutPrefix.length === 40) {
    return `0x${withoutPrefix.slice(0, 4)}...${withoutPrefix.slice(-4)}`
  }

  // For other binary data, show the first and last 8 characters
  return `0x${withoutPrefix.slice(0, 8)}...${withoutPrefix.slice(-8)}`
}