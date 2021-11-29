const { ethers } = require('hardhat')

const abi = [
  'function mint(string memory _tokenURI) external payable returns (uint256)',
  'function tokenURI(uint256 _tokenId) external view returns (string)',
]

async function bscBridge(tokenURI) {
  let url = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
  let bscProvider = new ethers.providers.JsonRpcProvider(url)
  let privateKey = process.env.PRIVATE_KEY
  let wallet = new ethers.Wallet(privateKey, bscProvider)

  const bscMeta = await new ethers.Contract('0xD8139239E9406B5cEb3f9e0d7DDfac7fF42551b6', abi, wallet)

  const mintTx = await bscMeta.mint(tokenURI)
  await mintTx.wait()
  console.log('BSC mint tx:', mintTx)
}

async function main() {
  let provider = ethers.provider

  const NFTBridgeFacade = await ethers.getContractFactory('NFTBridgeFacade')
  const bridgeFacadeContract = await NFTBridgeFacade.attach('0x89B399CddAD46d1BFd29d160eCd542Dd3D2868f5')

  const meta = await new ethers.Contract('0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b', abi)
  // const meta = await Meta.attach('0xD8139239E9406B5cEb3f9e0d7DDfac7fF42551b6')

  const startBlockNumber = 28582542 //await provider.getBlockNumber()

  bridgeFacadeContract.on('OnTokenReceived', async (chainId, from, tknId, data, event) => {
    if(event.blockNumber <= startBlockNumber) return

    console.log(`From chainId: ${chainId.toNumber()}, from: ${from}, tokenId: ${tknId.toNumber()}, data: ${data}`)
    // console.log(event.blockNumber, event.blockNumber)

    const tokenURI = await meta.tokenURI(tknId)
    console.log('Token uri:', tokenURI)
    await bscBridge(tokenURI)
  })
}

main()
