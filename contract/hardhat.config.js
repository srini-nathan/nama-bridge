require("@nomiclabs/hardhat-waffle");
require('dotenv').config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
require('./tasks/transfer');
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'bsct',
  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC || "https://rinkeby.infura.io/v3/55fa2103e26d4e7b9d6ce8b3280815b1", // <---- YOUR INFURA ID! (or it won't work)
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    kovan: {
      url: process.env.KOVAN_RPC || "https://kovan.infura.io/v3/460f40a260564ac4a4f4b3fffb032dad", // <---- YOUR INFURA ID! (or it won't work)
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    bsct: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    mumbai: {
      url: process.env.MUMBAI_RPC,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHER_SCAN_API_KEY || '',
  },
};
