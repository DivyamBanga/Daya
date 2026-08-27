const SEV_FILL = ['var(--bg-soft)', 'var(--rose-soft)', 'var(--rose)', 'var(--rose-deep)']
const SEV_TEXT = ['var(--ink-3)', 'var(--rose-deep)', '#fff', '#fff']

/**
 * Tappable lower-body pain map (endometriosis-style diary).
 * Each region cycles none → mild → moderate → severe.
 */
export function BodyMap({
  pain,
  onTap,
}: {
  pain: Record<string, number>
  onTap: (region: string) => void
}) {
  const zone = (id: string, x: number, y: number, w: number, h: number, label: string) => {
    const lvl = pain[id] ?? 0
    return (
      <g key={id} onClick={() => onTap(id)} style={{ cursor: 'pointer' }} role="button" aria-label={`${label}: ${lvl ? `level ${lvl}` : 'none'}`}>
        <rect x={x} y={y} width={w} height={h} rx={13} fill={SEV_FILL[lvl]} stroke={lvl ? 'transparent' : 'var(--line-strong)'} strokeWidth="1.4" strokeDasharray={lvl ? undefined : '4 3'} style={{ transition: 'fill 0.15s' }} />
        <text x={x + w / 2} y={y + h / 2 - (lvl ? 6 : 0)} textAnchor="middle" dominantBaseline="central" fontSize="10.5" fontWeight="700" fill={SEV_TEXT[lvl]}>
          {label}
        </text>
        {lvl > 0 && (
          <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" fontSize="9" fontWeight="600" fill={SEV_TEXT[lvl]} opacity="0.85">
            {'●'.repeat(lvl)}
          </text>
        )}
      </g>
    )
  }

  return (
    <div>
      <svg viewBox="0 0 320 218" width="100%" role="img" aria-label="Pain map">
        {/* torso silhouette */}
        <path
          d="M96 8 Q160 24 224 8 L218 78 Q214 132 196 168 Q178 204 160 210 Q142 204 124 168 Q106 132 102 78 Z"
          fill="var(--card)"
          stroke="var(--line)"
          strokeWidth="1.5"
        />
        {zone('pelvis-l', 104, 84, 54, 42, 'Left')}
        {zone('pelvis-r', 162, 84, 54, 42, 'Right')}
        {zone('pelvis-c', 118, 130, 84, 38, 'Uterus')}
        {zone('bladder', 131, 172, 58, 32, 'Bladder')}
        {zone('bowel', 236, 84, 74, 38, 'Bowel')}
        {zone('back', 236, 126, 74, 38, 'Back')}
        {zone('thighs', 236, 168, 74, 36, 'Thighs')}
        <text x="12" y="18" fontSize="10" fontWeight="700" fill="var(--ink-3)">
          Tap a zone:
        </text>
        <text x="12" y="34" fontSize="10" fontWeight="600" fill="var(--ink-3)">
          mild → mod → severe
        </text>
      </svg>
    </div>
  )
}
