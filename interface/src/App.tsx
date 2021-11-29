import { useState, useEffect, useCallback } from 'react'
import { Switch, Route } from 'react-router-dom'
import {
  ChakraProvider,
  useColorModeValue,
  CSSReset,
  Box,
  Button,
  theme,
  Flex,
  Text,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react'
import { useMoralis } from 'react-moralis'
import { ethers } from 'ethers'
import Home from './pages/Home'
import { useNetwork } from './hooks/use-network'
import { supportedChains } from './utils/supported-chains'

function App() {
  const { Moralis, authenticate, isAuthenticated, isWeb3Enabled, enableWeb3, web3, user } = useMoralis()

  const [chainId, setChainId] = useState<number>()
  const [account, setAccount] = useState<string>('')

  const { addBscMainnet, addPolygonMainnet, switchNetwork } = useNetwork()

  useEffect(() => {
    if (isAuthenticated) {
      setAccount(user?.get('ethAddress'))
    }
  }, [isAuthenticated, user])

  const getChainId = useCallback(async () => {
    if (web3 && web3.givenProvider) {
      const provider = new ethers.providers.Web3Provider(web3.givenProvider)
      const { chainId } = await provider.getNetwork()
      setChainId(Number(chainId))
    }
  }, [web3])

  const isInSupportedChains = () => {
    if (chainId) {
      return supportedChains.includes(chainId)
    }
    return false
  }
  
  const switchNet = async (chainId: string) => {
    if (chainId === '1') {
      await switchNetwork(chainId)
    } else if (chainId === '137') {
      addPolygonMainnet()
    } else if (chainId === '56') {
      addBscMainnet()
    }
  }

  useEffect(() => {
    getChainId()

    Moralis.Web3.onChainChanged((chainId: string) => {
      setChainId(Number(chainId))
    })

    Moralis.Web3.onAccountsChanged((accounts: string[]) => {
      setAccount(accounts[0])
    })
  }, [Moralis.Web3, getChainId])

  return (
    <ChakraProvider theme={theme}>
      <CSSReset />

      <Box bg={useColorModeValue('gray.50', 'gray.900')} minH={'100vh'} as={Flex} margin={'auto'} justifyContent={'center'}>
        {
          !isAuthenticated ? (
            <Flex alignItems={'center'}>
              <VStack>
                <Text fontSize="2xl" pb={20} fontWeight={'5xl'}>Bridge your NFTs to any blockchain networks</Text>
                {
                  !isWeb3Enabled ? <Button colorScheme={'teal'} onClick={() => enableWeb3()}>Connect wallet</Button> :
                    <Button colorScheme={'teal'} onClick={() => authenticate()}>Authenticate</Button>
                }
              </VStack>
            </Flex>
          ) : !isInSupportedChains() ? (
            <Flex alignItems={'center'}>
              <VStack>
                <Text fontSize="2xl" pb={20} fontWeight={'5xl'}>Bridge your NFTs to any blockchain networks</Text>

                <Menu isLazy>
                  <MenuButton as={Button} colorScheme={'teal'}>Switch Network</MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => switchNet('1')}>Ethereum</MenuItem>
                    <MenuItem onClick={() => switchNet('137')}>Polygon</MenuItem>
                    <MenuItem onClick={() => switchNet('56')}>Binance Smart Chain</MenuItem>
                  </MenuList>
                </Menu>

                <Text size={'sm'} display={'block'} color={'red'}>* You are connected to an unsupported network</Text>
              </VStack>
            </Flex>
          ) : (
            <Box
              maxW={'7xl'}
              w={{ base: 'xl', sm: 'sm', md: '7xl' }}
              py={{ base: 10 }}
              alignItems={'center'}
              minH={950}>
              <Switch>
                <Route path="/">
                  <Home account={account} chainId={chainId} />
                </Route>
              </Switch>
            </Box>
          )
        }
      </Box>
    </ChakraProvider>
  )
}

export default App
