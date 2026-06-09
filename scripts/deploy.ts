import { network } from 'hardhat'
import type { Log } from 'ethers'

async function main() {
  const { ethers } = await network.create()

  const [deployer] = await ethers.getSigners()
  console.log('Deploying with:', deployer.address)
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'MNT')

  // Deploy registry
  const Registry = await ethers.getContractFactory('AtlasIdentityRegistry')
  const registry = await Registry.deploy()
  await registry.waitForDeployment()
  const registryAddress = await registry.getAddress()
  console.log('\n✓ AtlasIdentityRegistry deployed:', registryAddress)

  // Register the Atlas Navigator agent
  const agentURI = 'https://atlas.finance/agent/navigator.json'
  const tx = await registry['register(string,(string,bytes)[])'](agentURI, [
    { metadataKey: 'name',        metadataValue: ethers.toUtf8Bytes('Atlas Navigator') },
    { metadataKey: 'type',        metadataValue: ethers.toUtf8Bytes('wealth_exploration_ai') },
    { metadataKey: 'version',     metadataValue: ethers.toUtf8Bytes('1.0.0') },
    { metadataKey: 'model',       metadataValue: ethers.toUtf8Bytes('claude-opus-4-8') },
    { metadataKey: 'network',     metadataValue: ethers.toUtf8Bytes('mantle') },
    { metadataKey: 'description', metadataValue: ethers.toUtf8Bytes('AI navigator for wealth exploration on Mantle. Every decision recorded on-chain.') },
  ])

  const receipt = await tx.wait()
  const logs: readonly Log[] = receipt?.logs ?? []
  const event = logs
    .map((log) => { try { return registry.interface.parseLog(log) } catch { return null } })
    .find((e) => e?.name === 'Registered')

  const agentId = event?.args?.agentId ?? 1n
  console.log('✓ Atlas Navigator registered — Agent ID:', agentId.toString())

  // Record the genesis decision
  await registry.recordDecision(
    agentId,
    'genesis',
    JSON.stringify({
      event: 'Atlas Navigator identity established on Mantle',
      timestamp: new Date().toISOString(),
      capabilities: ['route_suggestion', 'opportunity_discovery', 'portfolio_analysis'],
      platform: 'Atlas — The Wealth Exploration Layer for Web3',
    })
  )
  console.log('✓ Genesis decision recorded on-chain')

  console.log('\n─────────────────────────────────────────────')
  console.log('Add to .env.local:')
  console.log(`NEXT_PUBLIC_ATLAS_REGISTRY_ADDRESS=${registryAddress}`)
  console.log(`NEXT_PUBLIC_ATLAS_AGENT_ID=${agentId.toString()}`)
  console.log('─────────────────────────────────────────────')
}

main().catch(e => { console.error(e); process.exit(1) })
