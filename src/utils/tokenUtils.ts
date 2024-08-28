import type { TokenInfo } from '@/types/token'
import type { PublicClient } from 'viem'

export async function fetchTokenInfo(
  client: PublicClient,
  address: string,
): Promise<TokenInfo> {
  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: address as `0x${string}`,
        abi: [
          {
            name: 'name',
            type: 'function',
            inputs: [],
            outputs: [{ type: 'string' }],
          },
        ],
        functionName: 'name',
      }) as Promise<string>,
      client.readContract({
        address: address as `0x${string}`,
        abi: [
          {
            name: 'symbol',
            type: 'function',
            inputs: [],
            outputs: [{ type: 'string' }],
          },
        ],
        functionName: 'symbol',
      }) as Promise<string>,
      client.readContract({
        address: address as `0x${string}`,
        abi: [
          {
            name: 'decimals',
            type: 'function',
            inputs: [],
            outputs: [{ type: 'uint8' }],
          },
        ],
        functionName: 'decimals',
      }) as Promise<number>,
    ])

    return { address, name, symbol, decimals }
  } catch (error) {
    console.error(`Error fetching token info for ${address}:`, error)
    return { address, name: 'Unknown', symbol: 'Unknown', decimals: 18 }
  }
}
