'use client'

import { useRef, useCallback, useEffect, useState } from 'react'

export function useAmbientAudio() {
  const [enabled, setEnabled] = useState(false)
  const ctxRef    = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const nodesRef  = useRef<AudioNode[]>([])
  const pingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const teardown = useCallback(() => {
    if (pingTimerRef.current) clearTimeout(pingTimerRef.current)
    nodesRef.current.forEach(n => { try { (n as OscillatorNode).stop?.() } catch { /* already stopped */ } })
    nodesRef.current = []
  }, [])

  const buildGraph = useCallback((ctx: AudioContext, master: GainNode) => {
    const nodes: AudioNode[] = []

    // ── Deep drone — two detuned oscillators for beating effect ──────────────
    const makeOsc = (freq: number, detune: number, gainVal: number) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      const filt = ctx.createBiquadFilter()
      osc.type      = 'sine'
      osc.frequency.value = freq
      osc.detune.value    = detune
      filt.type     = 'lowpass'
      filt.frequency.value = 180
      gain.gain.value = gainVal
      osc.connect(filt); filt.connect(gain); gain.connect(master)
      osc.start()
      nodes.push(osc, gain, filt)
    }
    makeOsc(55,   0,   0.30)   // A1 root
    makeOsc(55,  +8,   0.18)   // slight beating
    makeOsc(110,  0,   0.10)   // A2 octave harmonic
    makeOsc(82.5, 0,   0.08)   // E2 fifth

    // ── Slow LFO on master gain — breathing effect ────────────────────────────
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.07   // ~14 second cycle
    lfoGain.gain.value  = 0.12
    lfo.connect(lfoGain)
    lfoGain.connect(master.gain)
    lfo.start()
    nodes.push(lfo, lfoGain)

    // ── Shimmer — filtered noise via AudioWorklet fallback: use buffer source ─
    const bufLen   = ctx.sampleRate * 3
    const buffer   = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data     = buffer.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1)

    const noise     = ctx.createBufferSource()
    const noiseFilt = ctx.createBiquadFilter()
    const noiseGain = ctx.createGain()
    noise.buffer = buffer
    noise.loop   = true
    noiseFilt.type            = 'bandpass'
    noiseFilt.frequency.value = 2800
    noiseFilt.Q.value         = 0.5
    noiseGain.gain.value      = 0.018
    noise.connect(noiseFilt); noiseFilt.connect(noiseGain); noiseGain.connect(master)
    noise.start()
    nodes.push(noise, noiseFilt, noiseGain)

    // ── Periodic sonar pings ──────────────────────────────────────────────────
    const schedulePing = () => {
      const delay = 4000 + Math.random() * 8000
      pingTimerRef.current = setTimeout(() => {
        if (!ctxRef.current || ctxRef.current.state === 'closed') return
        const osc  = ctxRef.current.createOscillator()
        const gain = ctxRef.current.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880 + Math.random() * 440, ctxRef.current.currentTime)
        osc.frequency.exponentialRampToValueAtTime(220, ctxRef.current.currentTime + 1.8)
        gain.gain.setValueAtTime(0.0001, ctxRef.current.currentTime)
        gain.gain.linearRampToValueAtTime(0.07, ctxRef.current.currentTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctxRef.current.currentTime + 1.8)
        osc.connect(gain); gain.connect(master)
        osc.start()
        osc.stop(ctxRef.current.currentTime + 1.9)
        schedulePing()
      }, delay)
    }
    schedulePing()

    nodesRef.current = nodes
  }, [])

  const enable = useCallback(() => {
    if (ctxRef.current) return   // already running
    const ctx    = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0.0001
    master.connect(ctx.destination)
    ctxRef.current    = ctx
    masterRef.current = master

    buildGraph(ctx, master)

    // Fade in
    master.gain.setValueAtTime(0.0001, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3.5)
    setEnabled(true)
  }, [buildGraph])

  const disable = useCallback(() => {
    if (!ctxRef.current || !masterRef.current) return
    const ctx    = ctxRef.current
    const master = masterRef.current
    // Fade out then close
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.5)
    setTimeout(() => {
      teardown()
      ctx.close()
      ctxRef.current    = null
      masterRef.current = null
    }, 1600)
    setEnabled(false)
  }, [teardown])

  const toggle = useCallback(() => {
    if (enabled) disable(); else enable()
  }, [enabled, enable, disable])

  // Clean up on unmount
  useEffect(() => () => {
    teardown()
    ctxRef.current?.close()
  }, [teardown])

  return { enabled, toggle }
}
