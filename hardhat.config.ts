import { defineConfig } from 'hardhat/config'
import HardhatEthers from '@nomicfoundation/hardhat-ethers'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? ''

export default defineConfig({
  plugins: [HardhatEthers],
  solidity: {
    version: '0.8.26',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    mantleSepolia: {
      type: 'http',
      url: 'https://rpc.sepolia.mantle.xyz',
      chainId: 5003,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    mantleMainnet: {
      type: 'http',
      url: 'https://rpc.mantle.xyz',
      chainId: 5000,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
})
