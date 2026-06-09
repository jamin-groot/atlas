import type { Metadata } from 'next'

interface RouteData {
  from: string
  to: string
  monthlyGain: number
  healthDelta: number
  district: string
  color: string
}

// In production this would come from Supabase — for now decode from the URL param
function decodeRoute(id: string): RouteData | null {
  try {
    return JSON.parse(Buffer.from(id, 'base64url').toString())
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const route = decodeRoute(id)
  if (!route) return { title: 'Atlas — Wealth Exploration' }

  return {
    title: `+$${route.monthlyGain}/month → ${route.to} | Atlas`,
    description: `Atlas Navigator found a route from ${route.from} to ${route.to}. Monthly income +$${route.monthlyGain}. Health +${route.healthDelta}. Explore where your capital can go.`,
    openGraph: {
      title: `+$${route.monthlyGain}/month on Mantle`,
      description: `Atlas Navigator: ${route.from} → ${route.to}`,
      images: [`/api/share-image?id=${id}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `+$${route.monthlyGain}/month on Mantle`,
      description: `Atlas Navigator found this route. Explore where your capital can go.`,
      images: [`/api/share-image?id=${id}`],
    },
  }
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const route = decodeRoute(id)

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#34D186] shadow-[0_0_10px_#34D186]" />
          <span className="font-mono text-sm tracking-[0.2em] text-white/60 uppercase">Atlas</span>
        </div>

        {route ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-8 space-y-4">
              <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Atlas Navigator Found a Route</p>
              <div className="flex items-center justify-center gap-3 text-white/60 text-sm">
                <span>{route.from}</span>
                <span className="text-[#34D186]">→</span>
                <span className="text-white">{route.to}</span>
              </div>
              <p className="text-5xl font-light text-[#34D186]">+${route.monthlyGain}<span className="text-2xl text-white/40">/mo</span></p>
              <p className="text-white/40 text-sm">Portfolio health +{route.healthDelta} points</p>
            </div>

            <a
              href="/"
              className="inline-block px-8 py-3 rounded-full border border-[#34D186]/40 text-[#34D186] text-sm font-mono tracking-widest uppercase hover:bg-[#34D186]/10 transition-all"
            >
              Explore Atlas →
            </a>
          </>
        ) : (
          <div className="text-white/40 text-sm">Route not found.</div>
        )}
      </div>
    </div>
  )
}
