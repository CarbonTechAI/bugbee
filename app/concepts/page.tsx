'use client';

import { useState } from 'react';
import Link from 'next/link';

const originals = [
  {
    id: 'aquarium',
    number: '01',
    name: 'The Aquarium',
    tagline: 'Tasks float in the deep',
    description: 'A stacked card deck where your most urgent item sits front-and-center. Urgency is communicated through edge glows, not labels. Bioluminescent orbs drift slowly like deep-sea creatures.',
    accent: 'hsla(195, 100%, 50%, 0.3)',
  },
  {
    id: 'constellation',
    number: '02',
    name: 'Constellation',
    tagline: 'Your work, connected',
    description: 'A centered single-column timeline with organic zigzag rhythm. Hover reveals connection lines between related items. Orbs create a vignette effect — warmth at edges, depth at center.',
    accent: 'hsla(210, 80%, 50%, 0.3)',
  },
  {
    id: 'darkroom',
    number: '03',
    name: 'The Darkroom',
    tagline: 'Illuminate what matters',
    description: 'A masonry grid where cards are nearly invisible until your cursor illuminates them with a radial light. Items outside the light dim to 40%. Your focus literally lights up your work.',
    accent: 'hsla(200, 90%, 55%, 0.3)',
  },
  {
    id: 'strata',
    number: '04',
    name: 'Strata',
    tagline: 'Depth through layers',
    description: 'Three geological layers — Surface (urgent), In Flight (active), and Backlog (future) — each at different glass depths with subtle parallax. Promoting items makes them visibly rise.',
    accent: 'hsla(180, 70%, 45%, 0.3)',
  },
  {
    id: 'breath',
    number: '05',
    name: 'Breath',
    tagline: 'Calm, focused, alive',
    description: 'Radical minimalism. A single column of elegant rows with luxurious spacing. One orb breathes at the center. The interface slows its rhythm when you type. Apple-level restraint.',
    accent: 'hsla(220, 60%, 55%, 0.3)',
  },
];

const hybrids = [
  {
    id: 'drift',
    number: '06',
    name: 'Drift',
    tagline: 'Aquarium cards, Constellation flow',
    description: 'Aquarium-style glass cards with edge glow urgency strips in a vertical scroll with temporal grouping. Hiding sidebar, 3 drifting orbs, side pullout detail with background blur + shift.',
    accent: 'hsla(195, 100%, 55%, 0.3)',
  },
  {
    id: 'current',
    number: '07',
    name: 'Current',
    tagline: 'Compact flow, urgency-weighted',
    description: 'Compact card rows with zigzag stagger, sorted by urgency with whitespace gaps between tiers. 2 large traveling orbs on long paths. No section headers — just visual rhythm.',
    accent: 'hsla(200, 90%, 50%, 0.3)',
  },
  {
    id: 'geode',
    number: '08',
    name: 'Geode',
    tagline: 'True glass, lit from within',
    description: 'Strata\'s three depth layers with ultra-transparent glass cards. Hover lights cards from behind with a radial glow. Side pullout detail with Constellation-style background blur. Promote/demote between layers.',
    accent: 'hsla(180, 80%, 55%, 0.3)',
  },
  {
    id: 'prism',
    number: '09',
    name: 'Prism',
    tagline: 'Faceted layers, warm to cool',
    description: 'Strata layers in a 2-column card grid. Surface cards have warm glass tint, backlog is cooler. Hover glow rises from below. Shimmer-dissolve animation on promote/demote.',
    accent: 'hsla(190, 85%, 50%, 0.3)',
  },
];

const iterations = [
  {
    id: 'drift-v2',
    number: '10',
    name: 'Drift V2',
    tagline: 'Wide Prism cards, even light',
    description: 'Drift temporal flow with Prism-style wide cards. Even hover illumination (no concave hotspot). Permanently exposed glass sidebar with deeply etched buttons pressed into the surface.',
    accent: 'hsla(195, 100%, 55%, 0.3)',
  },
  {
    id: 'geode-v2',
    number: '11',
    name: 'Geode V2',
    tagline: 'Ambient glass, edge-lit',
    description: 'Geode layers with slow-moving ambient light behind cards (visible through glass). Edge-highlight hover creates convex/raised feel. Glass pull-down filter panel with chip selectors.',
    accent: 'hsla(180, 80%, 55%, 0.3)',
  },
];

const finals = [
  {
    id: 'hive',
    number: '12',
    name: 'Hive',
    tagline: 'The unified command center',
    description: 'Geode V2 strata depth meets Drift V2 card clarity. Three integrated views (Focus, All Work, Kanban) with glass morphism, ambient light, keyboard-first navigation, and Quick Add via Cmd+K.',
    accent: 'hsla(45, 90%, 55%, 0.3)',
  },
];

const concepts = [...originals, ...hybrids, ...iterations, ...finals];

export default function ConceptsGallery() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full overflow-auto">
      {/* Background */}
      <div className="fixed inset-0" style={{
        background: 'linear-gradient(135deg, hsl(220,25%,7%) 0%, hsl(225,30%,10%) 50%, hsl(215,25%,8%) 100%)',
      }} />

      {/* Single slow orb */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '40%',
          width: '60vw',
          height: '60vw',
          maxWidth: 700,
          maxHeight: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsla(210,80%,50%,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'gallery-orb 50s ease-in-out infinite',
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-full flex flex-col">
        {/* Header */}
        <header className="px-12 pt-16 pb-8">
          <Link
            href="/"
            className="text-xs tracking-[0.2em] uppercase mb-6 block"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            BugBee
          </Link>
          <h1 className="text-5xl font-light tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Glass Design
          </h1>
          <p className="mt-3 text-lg font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Twelve directions for elevating BugBee
          </p>
        </header>

        {/* Concept Cards */}
        <div className="flex-1 px-12 pb-16">
          <div className="grid grid-cols-1 gap-4 max-w-5xl">
            {/* Section label: Originals */}
            <div className="flex items-center gap-4 pt-2 pb-1">
              <span className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>Original Concepts</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
            {originals.map((concept) => (
              <Link
                key={concept.id}
                href={`/concepts/${concept.id}`}
                className="group relative block rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: hoveredId === concept.id
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: '1px solid',
                  borderColor: hoveredId === concept.id
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  transform: hoveredId === concept.id ? 'translateY(-2px)' : 'none',
                }}
                onMouseEnter={() => setHoveredId(concept.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {hoveredId === concept.id && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `radial-gradient(ellipse at 0% 50%, ${concept.accent}, transparent 50%)`,
                    opacity: 0.5,
                  }} />
                )}
                <div className="relative z-10 flex items-center gap-10 px-10 py-8">
                  <span className="text-4xl font-extralight tabular-nums" style={{
                    color: hoveredId === concept.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                    transition: 'color 300ms', minWidth: 56,
                  }}>{concept.number}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-xl font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{concept.name}</h2>
                      <span className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.3)' }}>{concept.tagline}</span>
                    </div>
                    <p className="mt-2 text-sm font-light leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.45)' }}>{concept.description}</p>
                  </div>
                  <span className="text-lg transition-all duration-300" style={{
                    color: hoveredId === concept.id ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                    transform: hoveredId === concept.id ? 'translateX(4px)' : 'none',
                  }}>&rarr;</span>
                </div>
              </Link>
            ))}

            {/* Section label: Hybrids */}
            <div className="flex items-center gap-4 pt-6 pb-1">
              <span className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: 'rgba(56,189,248,0.4)' }}>Hybrid Concepts</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(56,189,248,0.15), rgba(255,255,255,0.06))' }} />
            </div>
            {hybrids.map((concept) => (
              <Link
                key={concept.id}
                href={`/concepts/${concept.id}`}
                className="group relative block rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: hoveredId === concept.id
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: '1px solid',
                  borderColor: hoveredId === concept.id
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  transform: hoveredId === concept.id ? 'translateY(-2px)' : 'none',
                }}
                onMouseEnter={() => setHoveredId(concept.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Accent glow on hover */}
                {hoveredId === concept.id && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `radial-gradient(ellipse at 0% 50%, ${concept.accent}, transparent 50%)`,
                    opacity: 0.5,
                  }} />
                )}

                <div className="relative z-10 flex items-center gap-10 px-10 py-8">
                  {/* Number */}
                  <span className="text-4xl font-extralight tabular-nums" style={{
                    color: hoveredId === concept.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                    transition: 'color 300ms',
                    minWidth: 56,
                  }}>
                    {concept.number}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-xl font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {concept.name}
                      </h2>
                      <span className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {concept.tagline}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-light leading-relaxed max-w-2xl" style={{
                      color: 'rgba(255,255,255,0.45)'
                    }}>
                      {concept.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <span className="text-lg transition-all duration-300" style={{
                    color: hoveredId === concept.id ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                    transform: hoveredId === concept.id ? 'translateX(4px)' : 'none',
                  }}>
                    &rarr;
                  </span>
                </div>
              </Link>
            ))}

            {/* Section label: V2 Iterations */}
            <div className="flex items-center gap-4 pt-6 pb-1">
              <span className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: 'rgba(16,185,129,0.5)' }}>V2 Iterations</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.2), rgba(255,255,255,0.06))' }} />
            </div>
            {iterations.map((concept) => (
              <Link
                key={concept.id}
                href={`/concepts/${concept.id}`}
                className="group relative block rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: hoveredId === concept.id
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: '1px solid',
                  borderColor: hoveredId === concept.id
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  transform: hoveredId === concept.id ? 'translateY(-2px)' : 'none',
                }}
                onMouseEnter={() => setHoveredId(concept.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {hoveredId === concept.id && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `radial-gradient(ellipse at 0% 50%, ${concept.accent}, transparent 50%)`,
                    opacity: 0.5,
                  }} />
                )}
                <div className="relative z-10 flex items-center gap-10 px-10 py-8">
                  <span className="text-4xl font-extralight tabular-nums" style={{
                    color: hoveredId === concept.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                    transition: 'color 300ms', minWidth: 56,
                  }}>{concept.number}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-xl font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{concept.name}</h2>
                      <span className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.3)' }}>{concept.tagline}</span>
                    </div>
                    <p className="mt-2 text-sm font-light leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.45)' }}>{concept.description}</p>
                  </div>
                  <span className="text-lg transition-all duration-300" style={{
                    color: hoveredId === concept.id ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                    transform: hoveredId === concept.id ? 'translateX(4px)' : 'none',
                  }}>&rarr;</span>
                </div>
              </Link>
            ))}

            {/* Section label: Final Concepts */}
            <div className="flex items-center gap-4 pt-6 pb-1">
              <span className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: 'rgba(245,158,11,0.5)' }}>Final Concept</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.2), rgba(255,255,255,0.06))' }} />
            </div>
            {finals.map((concept) => (
              <Link
                key={concept.id}
                href={`/concepts/${concept.id}`}
                className="group relative block rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: hoveredId === concept.id
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: '1px solid',
                  borderColor: hoveredId === concept.id
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  transform: hoveredId === concept.id ? 'translateY(-2px)' : 'none',
                }}
                onMouseEnter={() => setHoveredId(concept.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {hoveredId === concept.id && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `radial-gradient(ellipse at 0% 50%, ${concept.accent}, transparent 50%)`,
                    opacity: 0.5,
                  }} />
                )}
                <div className="relative z-10 flex items-center gap-10 px-10 py-8">
                  <span className="text-4xl font-extralight tabular-nums" style={{
                    color: hoveredId === concept.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                    transition: 'color 300ms', minWidth: 56,
                  }}>{concept.number}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-xl font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{concept.name}</h2>
                      <span className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.3)' }}>{concept.tagline}</span>
                    </div>
                    <p className="mt-2 text-sm font-light leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.45)' }}>{concept.description}</p>
                  </div>
                  <span className="text-lg transition-all duration-300" style={{
                    color: hoveredId === concept.id ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                    transform: hoveredId === concept.id ? 'translateX(4px)' : 'none',
                  }}>&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gallery-orb {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(-10vw, 5vh) scale(1.05); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
