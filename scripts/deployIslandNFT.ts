import { network } from 'hardhat'

async function main() {
  const { ethers } = await network.create()
  const [deployer] = await ethers.getSigners()
  console.log('Deploying AtlasIslandNFT with:', deployer.address)

  const IslandNFT = await ethers.getContractFactory('AtlasIslandNFT')
  const islandNFT = await IslandNFT.deploy()
  await islandNFT.waitForDeployment()
  const address = await islandNFT.getAddress()

  console.log('✓ AtlasIslandNFT deployed:', address)
  console.log('\nAdd to .env.local:')
  console.log(`NEXT_PUBLIC_ATLAS_ISLAND_NFT_ADDRESS=${address}`)
}

main().catch(e => { console.error(e); process.exit(1) })
