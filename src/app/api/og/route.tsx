import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#030712',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(52,209,134,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(52,209,134,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          display: 'flex',
        }} />

        {/* Radial glow — centre */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px', height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,209,134,0.12) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Top-left corner coords */}
        <div style={{
          position: 'absolute', top: '36px', left: '52px',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'rgba(52,209,134,0.5)' }}>22.3086° N</span>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'rgba(52,209,134,0.5)' }}>114.1694° E</span>
        </div>

        {/* Top-right label */}
        <div style={{
          position: 'absolute', top: '36px', right: '52px',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px',
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>MANTLE NETWORK</span>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(52,209,134,0.4)', letterSpacing: '0.1em' }}>CHAIN ID 5000</span>
        </div>

        {/* District indicators — scattered dots */}
        {[
          { x: 320, y: 180, c: '#34D186', label: 'Income',   apy: '5.1%' },
          { x: 700, y: 260, c: '#3B82F6', label: 'Staking',  apy: '3.8%' },
          { x: 500, y: 380, c: '#A855F7', label: 'Growth',   apy: '14%'  },
          { x: 860, y: 420, c: '#F59E0B', label: 'Treasury', apy: '7.2%' },
          { x: 240, y: 420, c: '#F97316', label: 'Emerging', apy: '22%'  },
        ].map(d => (
          <div key={d.label} style={{
            position: 'absolute', left: `${d.x}px`, top: `${d.y}px`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          }}>
            {/* APY pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(5,13,26,0.85)',
              border: `1px solid ${d.c}40`,
              borderRadius: '20px', padding: '3px 10px',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: d.c }} />
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: d.c }}>{d.apy} APY</span>
            </div>
            {/* Beacon dot */}
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.c, boxShadow: `0 0 12px ${d.c}` }} />
            {/* District name */}
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: `${d.c}80`, letterSpacing: '0.12em' }}>
              {d.label.toUpperCase()}
            </span>
          </div>
        ))}

        {/* Center content */}
        <div style={{
          position: 'absolute',
          bottom: '72px', left: '52px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          {/* Atlas logo wordmark — text fallback */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Icon mark (simplified) */}
            <div style={{
              width: '40px', height: '40px',
              border: '1.5px solid rgba(52,209,134,0.7)',
              borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(52,209,134,0.08)',
            }}>
              <div style={{
                width: '18px', height: '18px',
                border: '1.5px solid #34D186',
                borderRadius: '3px',
                transform: 'rotate(45deg)',
                display: 'flex',
              }} />
            </div>
            <span style={{
              fontSize: '42px', fontWeight: '700', color: 'white', letterSpacing: '-0.02em',
            }}>ATLAS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.85)', fontWeight: '400', lineHeight: 1.3 }}>
              The Wealth Exploration Layer for Web3.
            </span>
            <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              A 3D navigable world of DeFi opportunities on Mantle.
            </span>
          </div>
        </div>

        {/* Bottom-right CTA hint */}
        <div style={{
          position: 'absolute', bottom: '72px', right: '52px',
          display: 'flex', alignItems: 'center', gap: '10px',
          border: '1px solid rgba(52,209,134,0.3)',
          borderRadius: '30px', padding: '10px 22px',
          background: 'rgba(52,209,134,0.06)',
        }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34D186' }} />
          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#34D186', letterSpacing: '0.12em' }}>
            ENTER ATLAS
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
