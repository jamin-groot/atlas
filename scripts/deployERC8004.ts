import { network } from 'hardhat'
import type { Log } from 'ethers'

async function main() {
  const { ethers } = await network.create()

  const [deployer] = await ethers.getSigners()
  console.log('Deploying with:', deployer.address)
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'MNT\n')

  // ── 1. Identity Registry ──────────────────────────────────────────────────
  console.log('Deploying AtlasIdentityRegistry (ERC-8004)...')
  const Identity = await ethers.getContractFactory('AtlasIdentityRegistry')
  const identity = await Identity.deploy()
  await identity.waitForDeployment()
  const identityAddress = await identity.getAddress()
  console.log('✓ AtlasIdentityRegistry:', identityAddress)

  // ── 2. Reputation Registry ────────────────────────────────────────────────
  console.log('Deploying AtlasReputationRegistry (ERC-8004)...')
  const Reputation = await ethers.getContractFactory('AtlasReputationRegistry')
  const reputation = await Reputation.deploy(identityAddress)
  await reputation.waitForDeployment()
  const reputationAddress = await reputation.getAddress()
  console.log('✓ AtlasReputationRegistry:', reputationAddress)

  // ── 3. Validation Registry ────────────────────────────────────────────────
  console.log('Deploying AtlasValidationRegistry (ERC-8004)...')
  const Validation = await ethers.getContractFactory('AtlasValidationRegistry')
  const validation = await Validation.deploy(identityAddress)
  await validation.waitForDeployment()
  const validationAddress = await validation.getAddress()
  console.log('✓ AtlasValidationRegistry:', validationAddress)

  // ── 4. Register Atlas Navigator as Agent #1 ───────────────────────────────
  console.log('\nRegistering Atlas Navigator agent...')
  const agentURI = 'https://atlas-web3.vercel.app/agent/navigator.json'
  const tx = await identity['register(string,(string,bytes)[])'](agentURI, [
    { metadataKey: 'name',        metadataValue: ethers.toUtf8Bytes('Atlas Navigator') },
    { metadataKey: 'type',        metadataValue: ethers.toUtf8Bytes('wealth_exploration_ai') },
    { metadataKey: 'version',     metadataValue: ethers.toUtf8Bytes('2.0.0') },
    { metadataKey: 'model',       metadataValue: ethers.toUtf8Bytes('claude-sonnet-4-6') },
    { metadataKey: 'network',     metadataValue: ethers.toUtf8Bytes('mantle-sepolia') },
    { metadataKey: 'standard',    metadataValue: ethers.toUtf8Bytes('ERC-8004') },
    { metadataKey: 'reputationRegistry', metadataValue: ethers.toUtf8Bytes(reputationAddress) },
    { metadataKey: 'validationRegistry', metadataValue: ethers.toUtf8Bytes(validationAddress) },
    { metadataKey: 'description', metadataValue: ethers.toUtf8Bytes('AI navigator for wealth exploration on Mantle. Every decision recorded on-chain for radical transparency.') },
  ])

  const receipt = await tx.wait()
  const logs: readonly Log[] = receipt?.logs ?? []
  const event = logs
    .map(log => { try { return identity.interface.parseLog(log) } catch { return null } })
    .find(e => e?.name === 'Registered')

  const agentId = event?.args?.agentId ?? 1n
  console.log('✓ Atlas Navigator registered — Agent ID:', agentId.toString())

  // ── 5. Genesis decision ───────────────────────────────────────────────────
  await identity.recordDecision(
    agentId,
    'genesis',
    JSON.stringify({
      event:        'Atlas Navigator ERC-8004 identity established on Mantle Sepolia',
      standard:     'ERC-8004',
      registries: {
        identity:   identityAddress,
        reputation: reputationAddress,
        validation: validationAddress,
      },
      timestamp:    new Date().toISOString(),
      capabilities: ['route_suggestion', 'opportunity_discovery', 'portfolio_analysis', 'allocation_execution'],
      platform:     'Atlas — The Wealth Exploration Layer for Web3',
    })
  )
  console.log('✓ Genesis decision recorded on-chain')

  // ── Output ────────────────────────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────────────────────')
  console.log('ERC-8004 deployment complete. Add to .env.local and Vercel:')
  console.log('──────────────────────────────────────────────────────────────')
  console.log(`NEXT_PUBLIC_ATLAS_REGISTRY_ADDRESS=${identityAddress}`)
  console.log(`NEXT_PUBLIC_ATLAS_AGENT_ID=${agentId.toString()}`)
  console.log(`NEXT_PUBLIC_ATLAS_REPUTATION_ADDRESS=${reputationAddress}`)
  console.log(`NEXT_PUBLIC_ATLAS_VALIDATION_ADDRESS=${validationAddress}`)
  console.log('──────────────────────────────────────────────────────────────')
  console.log('\nMantle Sepolia Explorer:')
  console.log(`Identity:   https://explorer.sepolia.mantle.xyz/address/${identityAddress}`)
  console.log(`Reputation: https://explorer.sepolia.mantle.xyz/address/${reputationAddress}`)
  console.log(`Validation: https://explorer.sepolia.mantle.xyz/address/${validationAddress}`)
}

main().catch(e => { console.error(e); process.exit(1) })
