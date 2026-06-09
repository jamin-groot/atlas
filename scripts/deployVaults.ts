import { network } from 'hardhat'

const VAULTS = [
  { name: 'Atlas USDY Vault',  symbol: 'aUSDY', asset: 'USDY', protocol: 'Ondo Finance',  apyBps: 510  },
  { name: 'Atlas mUSD Vault',  symbol: 'amUSD', asset: 'mUSD', protocol: 'Mantle',         apyBps: 480  },
  { name: 'Atlas mETH Vault',  symbol: 'amETH', asset: 'mETH', protocol: 'Mantle LSP',     apyBps: 380  },
]

async function main() {
  const { ethers } = await network.create()
  const [deployer] = await ethers.getSigners()
  console.log('Deploying vaults with:', deployer.address)
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'MNT\n')

  const Vault = await ethers.getContractFactory('AtlasYieldVault')
  const deployed: Record<string, string> = {}

  for (const v of VAULTS) {
    const vault = await Vault.deploy(v.name, v.symbol, v.asset, v.protocol, v.apyBps)
    await vault.waitForDeployment()
    const addr = await vault.getAddress()

    // Seed with 1 MNT liquidity so withdrawals work
    await deployer.sendTransaction({ to: addr, value: ethers.parseEther('1') })

    console.log(`✓ ${v.asset} Vault deployed: ${addr} (${v.apyBps / 100}% APY)`)
    deployed[v.asset] = addr
  }

  console.log('\n─────────────────────────────────────────────')
  console.log('Add to .env.local:')
  for (const [asset, addr] of Object.entries(deployed)) {
    console.log(`NEXT_PUBLIC_VAULT_${asset.toUpperCase()}=${addr}`)
  }
  console.log('─────────────────────────────────────────────')
}

main().catch(e => { console.error(e); process.exit(1) })
