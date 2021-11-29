const hre = require("hardhat");

async function main() {
  // const NFTBridgeFacade = await hre.ethers.getContractFactory("NFTBridgeFacade");
  // const bridgeFacade = await NFTBridgeFacade.deploy();

  // await bridgeFacade.deployed();

  // console.log("NFTBridgeFacade deployed to:", bridgeFacade.address);

  const Meta = await hre.ethers.getContractFactory("Meta");
  // const meta = await Meta.deploy('Meta Bridge', 'MB');
  // await meta.deployed();
  const meta = await Meta.attach('0xD8139239E9406B5cEb3f9e0d7DDfac7fF42551b6')
  console.log("Meta deployed to:", meta.address);

  // let mintTx = await meta.mint('https://bafybeigu7dgwkjfvy3p2t4p7j2hd34wososiycqxqpeqrptpqwfxewmg2u.ipfs.dweb.link/IPFS%20Awesome.json')
  // await mintTx.wait()
  // console.log("Meta mint tx:", mintTx);

  for (let i = 0; i < 100; i++) {
    mintTx = await meta.mint('https://bafybeigu7dgwkjfvy3p2t4p7j2hd34wososiycqxqpeqrptpqwfxewmg2u.ipfs.dweb.link/IPFS%20Awesome.json')
    await mintTx.wait()
    console.log("Meta mint tx:", mintTx.hash);
  }


    // let topic = ethers.utils.id("OnTokenReceived(address,uint256,bytes)")
  // let filter = {
  //     address: bridgeContractAddr,
  //     topics: [ topic ]
  // }
  // provider.on(filter, (result) => {
  //     console.log('provider fileter event:', result)
  // })
  // provider.resetEventsBlock(3133649)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
