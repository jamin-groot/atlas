import { network } from 'hardhat'

async function main() {
  const { ethers } = await network.create()
  const [deployer] = await ethers.getSigners()
  console.log('Deploying with:', deployer.address)

  const Achievements = await ethers.getContractFactory('AtlasAchievements')
  const achievements = await Achievements.deploy()
  await achievements.waitForDeployment()
  const address = await achievements.getAddress()
  console.log('✓ AtlasAchievements deployed:', address)
  console.log('\nAdd to .env.local:')
  console.log(`NEXT_PUBLIC_ATLAS_ACHIEVEMENTS_ADDRESS=${address}`)
}

main().catch(e => { console.error(e); process.exit(1) })
