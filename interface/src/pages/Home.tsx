import {
  Box,
  Text,
  VStack,
  Image,
  SimpleGrid,
  Flex,
  Badge,
  Divider,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  FormControl,
  FormLabel,
  Container,
  useToast,
} from '@chakra-ui/react'
import { useEffect, useState, useCallback, FC } from 'react'
import { Select } from 'chakra-react-select'
import { useMoralis, useWeb3Transfer } from 'react-moralis'
import { RiArrowLeftRightLine } from 'react-icons/ri'
import axios from 'axios'
import { ethers } from 'ethers'
import { sortBy } from 'lodash'
import './Home.css'
import Wallet from '../components/Wallet'
import { CustomRoundedCheckbox } from '../components/CustomRoundedCheckbox'
import { ChainId } from '@web3app/core'
import { useNetwork } from '../hooks/use-network'
const FileType = require('file-type/browser')


const COVALENT_URI = process.env.REACT_APP_COVALENT_BASE_URI || 'https://api.covalenthq.com/v1'
const ERC721Abi = [
  'function ownerOf(uint256 _tokenId) external view returns (address)'
]

const mumbaiBridgeFacadeContractAddr = '0x89B399CddAD46d1BFd29d160eCd542Dd3D2868f5'
const bscBridgeFacadeContractAddr = '0x87d5159313b3a9f8Aa7eCCd5Df5C29a41AC4Db3d'
const kovanBridgeFacadeContractAddr = '0x89B399CddAD46d1BFd29d160eCd542Dd3D2868f5'

interface HomeProps {
  account: string
  chainId: number | string | undefined
}

const Home: FC<HomeProps> = ({ account, chainId }) => {
  const { web3, Moralis, isWeb3Enabled, isAuthenticated, isInitialized, enableWeb3, logout } = useMoralis()

  const [assets, setAssets] = useState<any>([])
  const [selectedAssets, setSelectedAssets] = useState<any>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [ensName, setEnsName] = useState<string>('')
  const [selectedOriginChain, setSelectedOriginChain] = useState<any>()
  const [selectedDestChain, setSelectedDestChain] = useState<any>()

  const { addBscTestnet, addPolygonTestnet, switchNetwork } = useNetwork()

  const toast = useToast()

  useEffect(() => {
    if (!isWeb3Enabled) {
      enableWeb3()
    }
  }, [enableWeb3, isWeb3Enabled])
  
  const onRootCidReady = (cid: string) => {
    console.log('uploading files with cid:', cid)
  }

  const extractNFTInfo = useCallback(async (item: any) => {
    const token_address = item['contract_address']
    const symbol = item['contract_ticker_symbol']
    const name = item['contract_name']
    const contract_type = item['supports_erc'][1]

    const nftData = item['nft_data']
    for(let i = 0; i < nftData.length; i++) {
      const nft = nftData[i]
      
      let image = nft['external_data']['image']
      let cid
      if (image) {
        cid = image.includes('ipfs://') ? image.split('ipfs://')[1]
          : image.includes('ipfs/') ? image.split('ipfs/')[1] : ''
        image = cid ? `https://gateway.img8.io/ipfs/${cid}?w=176` : image
      }

      const asset = {
        token_address,
        token_id: nft['token_id'],
        contract_type,
        symbol,
        name,
        metadata: JSON.stringify({
          name: nft['external_data']['name'],
          description: nft['external_data']['description'],
          token_url: nft['token_url'],
          cid: cid,
          image
        })
      }
      setAssets((assets: any) => [...assets, asset])
    }
  }, [])

  const getNFTs = useCallback(async () => {
    if (!chainId || !account) return
    const { data } = await axios.get(`${COVALENT_URI}/${Number(chainId)}/address/${account}/balances_v2/?format=JSON&nft=true`, {
      responseType: 'json',
      auth: {
        username: process.env.REACT_APP_COVALENT_API_KEY || '',
        password: ''
      },
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

    if (data.error) {
      console.error('Error to fetch NFTs, error code:', data.error_code, 'error message:', data.error_message)
      return []
    }

    setAssets([])
    data.data.items
      .filter((item: any) => item.type === 'nft' && item['nft_data'] && item['nft_data'].length > 0)
      .forEach(async (item: any) => {
        await extractNFTInfo(item)
      })
    setIsLoading(false)
  }, [account, chainId, extractNFTInfo])

  const fetchNFTsByUsingMoralis = async () => {
    const metaData = await Moralis.Web3API.account.getNFTs({ chain: 'polygon', address: account })
    console.log('meta data:', metaData)

    setAssets([])
    sortBy(metaData?.result, ['token_address', 'token_id']).forEach(async (asset) => {
      if (!asset.metadata && !asset.token_uri) {
        return
      }

      if (asset.metadata) {
        let metadata = JSON.parse(asset.metadata)
        const image = metadata?.image?.startsWith('ipfs://')
          ? `https://ipfs.io/ipfs/${metadata?.image?.split('ipfs://')[1]}` : metadata?.image

        const response = await fetch(image)
        const fileType = await FileType.fromStream(response.body)
        if (fileType && fileType.mime && !fileType.mime.startsWith('image/')) {
          // @ts-ignore
          asset.ext = fileType.ext
          // @ts-ignore
          asset.mime = fileType.mime
        }

        setAssets((assets: any) => [...assets, asset])
      }
    })
    setIsLoading(false)
  }
  
  const onAssetSelect = async (asset: any) => {
    if (!isSameContractAddr(asset) || !shouldEnableToSelect(asset) || isFetching) return

    if (isSelected(asset)) {
      const data = selectedAssets.filter((a: any) => a.token_id !== asset.token_id)
      setSelectedAssets(data)
      return
    }

    console.log('asset:', asset)

    setSelectedAssets((preValue: any) => [...preValue, asset])
  }

  const checkEnsName = useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(web3?.givenProvider)
    
    if (Number(chainId) === 1) {
      const ensName = await provider.lookupAddress(account)
      setEnsName(ensName)
    }
  }, [account, chainId, web3?.givenProvider])

  useEffect(() => {
    setIsLoading(true)

    checkEnsName()

    getNFTs()
    // x1()
    // x2()
    // fetchNFTsByUsingMoralis()
  }, [checkEnsName, getNFTs])

  const isSelected = (asset: any) => {
    const filter = selectedAssets.filter((a: any) => a.token_address === asset.token_address && a.token_id === asset.token_id)
    return filter && filter.length > 0
  }

  const isSameContractAddr = (asset: any) => {
    if (!selectedAssets || selectedAssets.length === 0) return true

    const filter = selectedAssets.filter((a: any) => a.token_address === asset.token_address)
    return filter && filter.length > 0
  }

  async function x1(){
    const x = await fetch('https://ipfs.moralis.io:2053/ipfs/QmdFfRraiNPbJ4PcTJ8AoXe37ixvkAZJ4JZp3tRCc15j3G')
    const y = await x.text()
    console.log("fetch", y)
  }

  async function x2(){
    const data = await axios.get('https://ipfs.moralis.io:2053/ipfs/QmdFfRraiNPbJ4PcTJ8AoXe37ixvkAZJ4JZp3tRCc15j3G',
      { 
        headers: {
          "Content-Type": "application/json",
          //"Access-Control-Allow-Origin": "*"
        }
      });
    console.log("axios", data.data);
  }

  const getERC721Tokens = () => {
    return assets.filter((a: any) => a.contract_type.toLowerCase() === 'erc721' && a.token_address !== '0xd8139239e9406b5ceb3f9e0d7ddfac7ff42551b6')
  }

  const getERC1155Tokens = () => {
    return assets.filter((a: any) => a.contract_type.toLowerCase() === 'erc1155')
  }

  const optionLength = [
    { label: 'BSC', value: ChainId.BSCTestnet },
    { label: 'Polygon', value: ChainId.Mumbai },
    { label: 'Kovan', value: ChainId.Kovan },
  ]

  useEffect(() => {
    if (!selectedDestChain) {
      setSelectedDestChain(getDestOptions()[0])
    } else {
      setSelectedDestChain(selectedOriginChain)
    }

    setSelectedOriginChain(getOriginDefaultValue()[0])
  }, [chainId])

  const getOriginDefaultValue = () => {
    return optionLength.filter((o: any) => o.value === chainId)
  }

  const getDestOptions = () => {
    return optionLength.filter((o: any) => o.value !== chainId)
  }

  const switchNet = async (netId: number) => {
    if (netId === ChainId.Kovan) {
      return switchNetwork(`${netId}`)
    } else if (netId === ChainId.BSCTestnet) {
      return addBscTestnet()
    } else if (netId === ChainId.Mumbai) {
      return addPolygonTestnet()
    }
  }

  const switchOriginDestNetwork = async () => {
    try {
      await switchNet(selectedDestChain.value)
    } catch(err) {
      console.error('Error to switch network:', err)
    }
  }

  const shouldEnableToSelect = (asset: any) => {
    const selectedAsset = selectedAssets[0]
    if (!asset || !selectedAsset) return true
    
    return selectedAssets.length === 0 || (asset.token_address === selectedAsset.token_address && asset.token_id === selectedAsset.token_id)
  }

  const { fetch: bridgeToken, error: bridgeError, isFetching } = useWeb3Transfer({
    receiver: chainId === ChainId.BSCTestnet
      ? bscBridgeFacadeContractAddr : chainId === ChainId.Mumbai ? mumbaiBridgeFacadeContractAddr : chainId === ChainId.Kovan
      ? kovanBridgeFacadeContractAddr : '',
    type: 'erc721',
    contractAddress: selectedAssets && selectedAssets[0] && selectedAssets[0].token_address,
    tokenId: selectedAssets && selectedAssets[0] && selectedAssets[0].token_id
  })

  const onTokenBridge = async () => {
    try {
      await bridgeToken()
      await getNFTs()
    } catch(err) {
      console.error('Error on token bridge:', err)
    }
  }

  useEffect(() => {
    if (bridgeError) {
      console.log('bridge error:', bridgeError)
      toast({
        title: 'Error',
        status: 'error',
        description: bridgeError?.message || bridgeError,
        variant: 'left-accent',
        position: 'top-right',
        isClosable: true,
      })
    }
  }, [bridgeError, toast])

  return (
    <Box>
      <Box mb={5}>
        <VStack>
          <Wallet ensName={ensName} account={account} logout={logout} />
        </VStack>
      </Box>

      {
        isLoading ? (
          <Box as={Flex} justifyContent={'center'} alignItems={'center'} h={300}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
          </Box>
        ) : (
          <Box mt={5}>
            {/* {
              selectedAssets && selectedAssets.length > 0 ? (
                <Accordion defaultIndex={[0]} allowMultiple>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <Text fontSize={'xl'} fontWeight={'bold'}>Selected Tokens</Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <SimpleGrid columns={{sm: 2, md: 4, lg: 5, xl: 6}} spacing={3}>
                        {
                          selectedAssets.map((asset: any, idx: number) => {
                            const metadata = JSON.parse(asset.metadata)
                            const image = metadata?.image.startsWith('ipfs://')
                              ? `https://ipfs.io/ipfs/${metadata?.image?.split('ipfs://')[1]}` : metadata?.image

                            return (
                              <Box
                                cursor="pointer"
                                key={idx}
                                borderWidth="1px"
                                maxW={'xs'}
                                borderRadius="lg"
                                _hover={{ boxShadow: '0 10px 16px 0 rgb(0 0 0 / 20%), 0 6px 20px 0 rgb(0 0 0 / 19%)' }}
                                onClick={() => onAssetSelect(asset)}
                              >
                                <Box w={'100%'} height={{sm: 160, md: 180, lg: 160, xl: 190}} alignItems={'center'} justifyContent={'center'} my={2}>
                                  <Box as={Flex} alignItems={'center'} justifyContent={'center'}>
                                    {
                                      asset?.mime?.startsWith('video') ? (
                                        <video width="90%" src={image} autoPlay loop muted data-loaded="loaded" style={{'borderRadius': '0.5rem', 'maxHeight': '250px'}}></video>
                                      ) : <Image maxW={'90%'} maxH={{sm: 160, md: 180, lg: 160, xl: 190}} lineHeight={{sm: 160, md: 180, lg: 160, xl: 190}} src={image} alt={asset.name} borderRadius="lg" />
                                    }
                                  </Box>
                                </Box>
                              </Box>
                            )
                          })
                        }
                      </SimpleGrid>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              ) : <Divider />
            } */}

            <Container>
              <Flex justifyContent={'space-between'} my={5} alignItems={'center'}>
                <FormControl p={4}>
                  <FormLabel>Origin</FormLabel>
                  <Select
                    name="origin"
                    options={optionLength}
                    closeMenuOnSelect={true}
                    value={selectedOriginChain}
                    isDisabled={isFetching}
                    onChange={(e: any) => {
                      switchNet(e.value)
                   }}
                  />
                </FormControl>
                <Box px={4}>
                  <Box
                    as={Flex}
                    justifyContent={'center'}
                    pb={2}
                    cursor={'pointer'}
                  >
                    <RiArrowLeftRightLine onClick={() => switchOriginDestNetwork()} size={'1.5rem'} color={'gray.500'} />
                  </Box>
                  <Button colorScheme={'teal'} onClick={() => onTokenBridge()} isLoading={isFetching}>Bridge To</Button>
                </Box>
                <FormControl p={4}>
                  <FormLabel>Destination</FormLabel>
                  <Select
                    name="origin"
                    options={getDestOptions()}
                    value={selectedDestChain}
                    isDisabled={isFetching}
                    closeMenuOnSelect={true}
                    onChange={(e: any) => {
                      setSelectedDestChain(e)
                   }}
                  />
                </FormControl>
              </Flex>
            </Container>

            <Accordion allowMultiple defaultIndex={[0, 1]}>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight={'bold'}>
                    <Text fontSize={'xl'}>ERC-721 Tokens</Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <SimpleGrid columns={{sm: 2, md: 4, lg: 5, xl: 6}} spacing={3}>
                    {
                      getERC721Tokens().length === 0 ? 'No data found' :
                      getERC721Tokens().map((asset: any, idx: number) => {
                        const metadata = JSON.parse(asset.metadata)
                        const image = metadata?.image.startsWith('ipfs://')
                          ? `https://ipfs.io/ipfs/${metadata?.image?.split('ipfs://')[1]}` : metadata?.image
                        // if (idx < 3) return ''

                        return (
                          <Box
                            key={idx}
                            borderWidth="1px"
                            maxW={'xs'}
                            borderRadius="lg"
                            _hover={{ boxShadow: shouldEnableToSelect(asset) ? '0 10px 16px 0 rgb(0 0 0 / 20%), 0 6px 20px 0 rgb(0 0 0 / 19%)' : '' }}
                            onClick={() => onAssetSelect(asset)}
                            style={{
                              backgroundColor: isSelected(asset) ? 'grey' : '',
                              color: isSelected(asset) ? 'white' : 'inherit',
                              cursor: shouldEnableToSelect(asset) ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <Box height='5' m='2'>
                              <CustomRoundedCheckbox isFullyChecked={isSelected(asset)} />
                            </Box>
                            <Box w={'100%'} height={{sm: 160, md: 180, lg: 160, xl: 190}} alignItems={'center'} justifyContent={'center'} my={2}>
                              <Box as={Flex} alignItems={'center'} justifyContent={'center'}>
                                {
                                  asset?.mime?.startsWith('video') ? (
                                    <video width="90%" src={image} autoPlay loop muted data-loaded="loaded" style={{'borderRadius': '0.5rem', 'maxHeight': '250px'}}></video>
                                  ) : <Image maxW={'90%'} maxH={{sm: 160, md: 180, lg: 160, xl: 190}} lineHeight={{sm: 160, md: 180, lg: 160, xl: 190}} src={image} alt={asset.name} borderRadius="lg" />
                                }
                              </Box>
                            </Box>
                            <Box mx="3">
                              <Box display="flex" alignItems="baseline">
                                <Box
                                  color={isSelected(asset) ? 'white' : 'gray.500'}
                                  fontWeight="semibold"
                                  letterSpacing="wide"
                                  fontSize="xs"
                                  textTransform="uppercase"
                                  isTruncated
                                  title={`${asset.name} ∙ ${asset.symbol}`}
                                >
                                  {asset.name} &bull; {asset.symbol}
                                </Box>
                              </Box>

                              <Box
                                mt="1"
                                fontWeight="semibold"
                                lineHeight="tight"
                                isTruncated
                                title={metadata?.name}
                                mb={3}
                              >
                                {metadata?.name}
                              </Box>

                            </Box>
                          </Box>
                        )
                      })
                    }
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight={'bold'}>
                    <Text fontSize={'xl'}>ERC-1155 Tokens</Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <SimpleGrid minChildWidth="5rem" spacing={3}>
                    {
                      getERC1155Tokens().length === 0 ? 'No data found' :
                      getERC1155Tokens().map((asset: any, idx: number) => {
                        const metadata = JSON.parse(asset.metadata)
                        const image = metadata?.image.startsWith('ipfs://')
                          ? `https://ipfs.io/ipfs/${metadata?.image?.split('ipfs://')[1]}` : metadata?.image

                        return (
                          <Box
                            cursor="pointer"
                            key={idx}
                            borderWidth="1px"
                            maxW={'xs'}
                            borderRadius="lg"
                            _hover={{ boxShadow: '0 10px 16px 0 rgb(0 0 0 / 20%), 0 6px 20px 0 rgb(0 0 0 / 19%)' }}
                            onClick={() => onAssetSelect(asset)}
                          >
                            <Box w={'100%'} height={{sm: 160, md: 180, lg: 160, xl: 190}} alignItems={'center'} justifyContent={'center'} my={2}>
                              <Box as={Flex} alignItems={'center'} justifyContent={'center'}>
                                {
                                  asset?.mime?.startsWith('video') ? (
                                    <video width="90%" src={image} autoPlay loop muted data-loaded="loaded" style={{'borderRadius': '0.5rem', 'maxHeight': '250px'}}></video>
                                  ) : <Image maxW={'90%'} maxH={{sm: 160, md: 180, lg: 160, xl: 190}} lineHeight={{sm: 160, md: 180, lg: 160, xl: 190}} src={image} alt={asset.name} borderRadius="lg" />
                                }
                              </Box>
                            </Box>
                            <Box px="3">
                              <Box display="flex" alignItems="baseline">
                                <Badge borderRadius="full" px="2" colorScheme="teal">
                                  {asset.contract_type}
                                </Badge>
                                <Box
                                  color="gray.500"
                                  fontWeight="semibold"
                                  letterSpacing="wide"
                                  fontSize="xs"
                                  textTransform="uppercase"
                                  ml="2"
                                  isTruncated
                                  title={`${asset.name} ∙ ${asset.symbol}`}
                                >
                                  {asset.name} &bull; {asset.symbol}
                                </Box>
                              </Box>

                              <Box
                                mt="1"
                                fontWeight="semibold"
                                lineHeight="tight"
                                isTruncated
                                title={metadata?.name}
                                mb={3}
                              >
                                {metadata?.name}
                              </Box>

                            </Box>
                          </Box>
                        )
                      })
                    }
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
        )
      }
      
    </Box>
  )
}

export default Home
