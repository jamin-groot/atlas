import { NextResponse } from 'next/server'

export interface NewsArticle {
  id: string
  title: string
  summary: string
  source: string
  url: string
  category: 'rwa' | 'defi' | 'mantle' | 'macro' | 'regulation'
  district?: string
  timestamp: string
  actionable: boolean
}

const CURATED_NEWS: NewsArticle[] = [
  {
    id: 'ondo-mantle-usdy',
    title: 'Ondo Finance Expands USDY to Mantle Network',
    summary: 'Ondo Finance has deployed USDY, its tokenized US Treasury product, on Mantle. Users can now access T-bill yields directly on-chain with instant settlement.',
    source: 'Ondo Finance',
    url: 'https://ondo.finance',
    category: 'rwa',
    district: 'income',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionable: true,
  },
  {
    id: 'clearpool-institutional',
    title: 'Clearpool Launches Institutional Lending Vaults on Mantle',
    summary: 'Clearpool brings permissioned institutional lending to Mantle with credit-assessed borrowers. USDT vaults offering 12%+ APY from real lending demand.',
    source: 'Clearpool',
    url: 'https://clearpool.finance',
    category: 'defi',
    district: 'growth',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    actionable: true,
  },
  {
    id: 'mantle-meth-upgrade',
    title: 'Mantle LSP Upgrades mETH with Auto-Compounding',
    summary: 'Mantle\'s liquid staking protocol now auto-compounds validator rewards into mETH. Stakers earn ~3.8% APY with zero manual claiming.',
    source: 'Mantle Network',
    url: 'https://mantle.xyz',
    category: 'mantle',
    district: 'staking',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    actionable: true,
  },
  {
    id: 'fed-rate-hold',
    title: 'Fed Holds Rates Steady — Treasury Yields Remain Attractive',
    summary: 'The Federal Reserve maintained current rates, keeping short-term Treasury yields above 5%. Tokenized T-bill products like USDY continue to offer competitive on-chain returns.',
    source: 'Reuters',
    url: 'https://reuters.com',
    category: 'macro',
    district: 'income',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    actionable: true,
  },
  {
    id: 'blackrock-tokenization',
    title: 'BlackRock: Tokenized Assets Will Be a $10T Market by 2030',
    summary: 'BlackRock CEO Larry Fink reaffirms commitment to tokenization, stating every asset class will eventually move on-chain. BUIDL fund surpasses $1B AUM.',
    source: 'Bloomberg',
    url: 'https://bloomberg.com',
    category: 'rwa',
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    actionable: false,
  },
  {
    id: 'init-capital-launch',
    title: 'INIT Capital Goes Live on Mantle with Liquidity Hooks',
    summary: 'INIT Capital launches composable lending positions on Mantle. Early depositors earning 18%+ APY through protocol incentives and lending demand.',
    source: 'INIT Capital',
    url: 'https://init.capital',
    category: 'defi',
    district: 'emerging',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actionable: true,
  },
  {
    id: 'eu-mica-rwa',
    title: 'EU MiCA Framework Clears Path for Tokenized Securities',
    summary: 'The EU\'s Markets in Crypto-Assets regulation provides legal clarity for tokenized real-world assets, opening the door for institutional RWA adoption in Europe.',
    source: 'CoinDesk',
    url: 'https://coindesk.com',
    category: 'regulation',
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    actionable: false,
  },
  {
    id: 'agni-mnt-rewards',
    title: 'Agni Finance Boosts MNT/USDT LP Rewards to 14% APY',
    summary: 'Agni Finance increases incentives for MNT/USDT liquidity providers. The Growth District opportunity now offers the highest sustainable yield on Mantle DEXes.',
    source: 'Agni Finance',
    url: 'https://agni.finance',
    category: 'defi',
    district: 'growth',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    actionable: true,
  },
  {
    id: 'spacex-tokenization',
    title: 'Tokenized SpaceX Shares See Record Demand on Secondary Markets',
    summary: 'Pre-IPO SpaceX equity tokens are trading at premium on tokenization platforms. Retail investors gaining exposure to private markets through fractional tokenized shares.',
    source: 'The Block',
    url: 'https://theblock.co',
    category: 'rwa',
    timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    actionable: false,
  },
  {
    id: 'mantle-gas-savings',
    title: 'Mantle Network Processes $2B in Volume with 95% Gas Savings vs Ethereum',
    summary: 'Mantle\'s modular L2 architecture delivers sub-cent transaction costs. Average allocation on Atlas costs $0.003 vs $0.45 on Ethereum mainnet.',
    source: 'Mantle Network',
    url: 'https://mantle.xyz',
    category: 'mantle',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    actionable: false,
  },
]

let _cache: { data: NewsArticle[]; fetchedAt: number } | null = null
const CACHE_TTL = 10 * 60 * 1000

export async function GET() {
  if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ articles: _cache.data, cached: true })
  }

  // In production, this would fetch from CryptoPanic, CoinGecko news, or an RSS aggregator
  // For now, serve curated articles with refreshed timestamps
  const articles = CURATED_NEWS.map(a => ({
    ...a,
    timestamp: a.timestamp,
  }))

  _cache = { data: articles, fetchedAt: Date.now() }
  return NextResponse.json({ articles, cached: false })
}
