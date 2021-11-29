import { useCallback } from 'react'
import { Web3Provider } from '@ethersproject/providers'
import { useMoralis } from 'react-moralis'
import { ethers } from 'ethers'

const EMERALD_MAINNET_PARAMS = {
  chainId: '0xA86A',
  chainName: 'Avalanche Mainnet C-Chain',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://emerald.rpc'],
  blockExplorerUrls: ['https://explorer.emerald.network/']
}

const BSC_TESTNET_PARAMS = {
  chainId: verifyChainId('97'),
  chainName: 'BSC Testnet',
  nativeCurrency: {
    name: 'BSC',
    symbol: 'BNB',
    decimals: 18
  },
  rpcUrls: [
    'https://data-seed-prebsc-1-s1.binance.org:8545/',
    'https://data-seed-prebsc-2-s1.binance.org:8545/',
    'https://data-seed-prebsc-1-s2.binance.org:8545/',
    'https://data-seed-prebsc-2-s2.binance.org:8545/',
    'https://data-seed-prebsc-1-s3.binance.org:8545/',
    'https://data-seed-prebsc-2-s3.binance.org:8545/',
  ],
  blockExplorerUrls: ['https://testnet.bscscan.com']
}

const BSC_MAINNET_PARAMS = {
  chainId: verifyChainId('56'),
  chainName: 'BSC Mainnet',
  nativeCurrency: {
    name: 'BSC',
    symbol: 'BNB',
    decimals: 18
  },
  rpcUrls: [
    'https://bsc-dataseed.binance.org/',
    'https://bsc-dataseed1.defibit.io/',
    'https://bsc-dataseed1.ninicoin.io/',
    'wss://bsc-ws-node.nariox.org:443'
  ],
  blockExplorerUrls: ['https://bscscan.com']
}

const POLYGON_MAINNET_PARAMS = {
  chainId: verifyChainId('137'),
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: [
    'https://polygon-mainnet.g.alchemy.com/v2/BBVrouvPija16ps8njsMrvr8XirvHX92',
  ],
  blockExplorerUrls: ['https://polygonscan.com/'],
}

const POLYGON_TESTNET_PARAMS = {
  chainId: verifyChainId('80001'),
  chainName: 'Mumbai Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: [
    'https://rpc-mumbai.maticvigil.com/',
  ],
  blockExplorerUrls: ['https://polygonscan.com/'],
}

interface NativeCurrency {
  name: string
  symbol: string
  decimals: number
}

export interface Network {
  name: string
  chainId: string
  shortName?: string
  chain?: string
  network?: string
  networkId?: string
  nativeCurrency: NativeCurrency
  rpc: string[]
  faucets?: string[]
  explorers?: string[]
  infoURL?: string
}

export function useNetwork() {
  const { web3 } = useMoralis()

  const getConnectedChainId = async () => {
    const provider = new ethers.providers.Web3Provider(web3?.givenProvider)
    const { chainId } = await provider.getNetwork()
    return chainId
  }

  const addNetwork = useCallback(async (network: Network) => {
    const hexedChainId = verifyChainId(network.chainId)
    const chainId = await getConnectedChainId()
    // @ts-ignore
    if (!web3 || !web3.givenProvider || chainId === ChainId.Mainnet) return
    
    await web3.givenProvider.request!({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: hexedChainId,
          chainName: network.name,
          nativeCurrency: network.nativeCurrency,
          rpcUrls: network.rpc,
          blockExplorerUrls: network.explorers
        }
      ]
    })
  }, [web3])

  const switchNetwork = useCallback(async (chainId?: string) => {
    if (!chainId) return
    const cId = verifyChainId(chainId)
    const connectedChainId = await getConnectedChainId()
    // Check if the user wallet is already on `chainId`
    const currentNetwork = fromDecimalToHex(connectedChainId || -1)
    if (currentNetwork === cId) return
    await web3 && web3?.givenProvider && web3.givenProvider.request!({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: cId }],
    })
  }, [web3])

  const addNetworkByParams = async (chainId: string | number, params: any) => {
    chainId = verifyChainId(chainId)
    // Check if the user wallet is already on `chainId`
    const connectedChainId = await getConnectedChainId()
    const currentNetwork = fromDecimalToHex(connectedChainId || -1)
    if (currentNetwork === chainId) return

    // @ts-ignore
    if (params && web3 && web3.givenProvider && connectedChainId !== 1) {
      return await web3.givenProvider.request({
        method: 'wallet_addEthereumChain',
        params: [params]
      })
    }
  }

  const addBscMainnet = async () => {
    return addNetworkByParams('56', BSC_MAINNET_PARAMS)
  }

  const addPolygonMainnet = async () => {
    return addNetworkByParams('137', POLYGON_MAINNET_PARAMS)
  }

  const addBscTestnet = async () => {
    return addNetworkByParams('56', BSC_TESTNET_PARAMS)
  }

  const addPolygonTestnet = async () => {
    return addNetworkByParams('137', POLYGON_TESTNET_PARAMS)
  }

  return { addNetwork, switchNetwork, addBscMainnet, addPolygonMainnet, addBscTestnet, addPolygonTestnet }
}

function fromDecimalToHex(number: number) {
  if (typeof number !== 'number') throw Error('The input provided should be a number')
  return `0x${number.toString(16)}`
}

// Convert the chainId to hex if it's a numeric type
function verifyChainId(chainId: number | string) {
  if (typeof chainId === 'number') {
    chainId = fromDecimalToHex(chainId)
  } else if (!chainId.startsWith('0x')) {
    chainId = `0x${Number(chainId).toString(16)}`
  }
  return chainId
}
