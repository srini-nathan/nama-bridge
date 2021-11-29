require('@nomiclabs/hardhat-ethers')

const tokenAddress = '0xD8139239E9406B5cEb3f9e0d7DDfac7fF42551b6'
const tokenAbi = [
  'function safeTransfer(address _to, uint256 _tokenId) external',
]

// npx hardhat --network kovan transfer --tokenid 2
task('transfer', 'Transfer NFT to bridge contract')
  .addParam('tokenid', 'The account\'s address')
  .setAction(async ({tokenid}) => {
    const kovanProvider = new ethers.providers.AlchemyProvider('kovan', 'YIdw9NXt9xKwx39qGDHrbhCcrzQKp0w3')
    let privateKey = process.env.PRIVATE_KEY
    let wallet = new ethers.Wallet(privateKey, kovanProvider)

    const meta = await new ethers.Contract(tokenAddress, tokenAbi, wallet)
    const toContract = '0x54BcEf0006E2072d6EC0ef4E1fD087751AdC3cED'

    let transferTx = await meta.safeTransfer(toContract, tokenid)
    await transferTx.wait()
    console.log("Meta transfer tx:", transferTx.hash)
  })

module.exports = {}
