const { ethers } = require("hardhat");

async function main() {
  const Meta = await ethers.getContractFactory("Meta");
  const meta = await Meta.attach('0xD8139239E9406B5cEb3f9e0d7DDfac7fF42551b6');
  // console.log("Meta deployed to:", meta);

  const signer = await ethers.getSigner();
  const address = await signer.getAddress();
  const signers = await ethers.getSigners()
  const bob = signers[1]
  console.log('signer address:', address);
  const bytes = ethers.utils.formatBytes32String('')

  const toContract = '0x54BcEf0006E2072d6EC0ef4E1fD087751AdC3cED'

  let transferTx = await meta.safeTransfer(toContract, 2)
  await transferTx.wait()
  console.log("Meta transfer tx:", transferTx.hash);

  // let transferTx = await meta.safeTransferFrom(address, bob, 1, bytes)
  // await transferTx.wait()
  // console.log("Meta transfer tx:", transferTx);

  // let transferTx = await meta.safeTransferFrom(address, bob, 1, bytes)
  // await transferTx.wait()
  // console.log("Meta transfer tx:", transferTx);

  // let transferTx = await meta.safeTransferFrom(address, bob, 1, bytes)
  // await transferTx.wait()
  // console.log("Meta transfer tx:", transferTx);

  // let transferTx = await meta.safeTransferFrom(address, bob, 1, bytes)
  // await transferTx.wait()
  // console.log("Meta transfer tx:", transferTx);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
