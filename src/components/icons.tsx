interface P {
  size?: number
  strokeWidth?: number
}

function Svg({ size = 22, strokeWidth = 1.8, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconDrop = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.2c3.4 3.9 5.8 6.9 5.8 9.8a5.8 5.8 0 1 1-11.6 0c0-2.9 2.4-5.9 5.8-9.8z" />
  </Svg>
)

export const IconCalendar = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
    <path d="M8 3.2v3M16 3.2v3M3.5 10h17" />
    <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const IconSparkle = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5l1.9 5.4 5.4 1.9-5.4 1.9L12 18.1l-1.9-5.4-5.4-1.9 5.4-1.9L12 3.5z" />
    <path d="M19 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
  </Svg>
)

export const IconMore = (p: P) => (
  <Svg {...p}>
    <circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <rect x="3" y="4.5" width="18" height="15" rx="5" />
  </Svg>
)

export const IconBack = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 5.5L8 12l6.5 6.5" />
  </Svg>
)

export const IconChev = (p: P) => (
  <Svg {...p}>
    <path d="M9.5 5.5L16 12l-6.5 6.5" />
  </Svg>
)

export const IconClose = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
)

export const IconChat = (p: P) => (
  <Svg {...p}>
    <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20.5l1.1-5.3A8.5 8.5 0 1 1 21 12z" />
    <circle cx="8.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="12" r="1" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconDoc = (p: P) => (
  <Svg {...p}>
    <path d="M6 3.5h8l4 4v13H6z" />
    <path d="M14 3.5v4h4M9 12h6M9 15.5h6" />
  </Svg>
)

export const IconChart = (p: P) => (
  <Svg {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M7.5 15.5l3.5-4 3 2.5 4.5-6" />
  </Svg>
)

export const IconGear = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
  </Svg>
)

export const IconBell = (p: P) => (
  <Svg {...p}>
    <path d="M18 16H6c1.2-1.4 1.5-3.6 1.5-5.5a4.5 4.5 0 0 1 9 0c0 1.9.3 4.1 1.5 5.5z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Svg>
)

export const IconLock = (p: P) => (
  <Svg {...p}>
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="3" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Svg>
)

export const IconShare = (p: P) => (
  <Svg {...p}>
    <path d="M12 14.5V4M8.5 7L12 3.5 15.5 7" />
    <path d="M6.5 11.5H6a2.5 2.5 0 0 0-2.5 2.5v4A2.5 2.5 0 0 0 6 20.5h12a2.5 2.5 0 0 0 2.5-2.5v-4a2.5 2.5 0 0 0-2.5-2.5h-.5" />
  </Svg>
)

export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v10M8.5 11L12 14.5 15.5 11" />
    <path d="M4.5 16v2A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5v-2" />
  </Svg>
)

export const IconHeart = (p: P) => (
  <Svg {...p}>
    <path d="M12 20s-7.5-4.7-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.3-7.5 10-7.5 10z" />
  </Svg>
)

export const IconMoon = (p: P) => (
  <Svg {...p}>
    <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z" />
  </Svg>
)

export const IconFlame = (p: P) => (
  <Svg {...p}>
    <path d="M12 21c-3.9 0-6.5-2.5-6.5-6 0-3 2-5.4 3.5-7.5.6 1.3 1.3 2 2.3 2.6C11.6 8 12 5.6 13.8 3c.6 3 4.7 5.6 4.7 10 0 4.5-2.6 8-6.5 8z" />
  </Svg>
)

export const IconBaby = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="9" cy="11" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11" r="0.9" fill="currentColor" stroke="none" />
    <path d="M9.5 15a3.4 3.4 0 0 0 5 0M12 3.5c-1.4.6-1.6 2-1 3" />
  </Svg>
)

export const IconTimer = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9.5V13l2.5 2M9.5 2.5h5" />
  </Svg>
)

export const IconSun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" />
  </Svg>
)

export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
)

export const IconSend = (p: P) => (
  <Svg {...p}>
    <path d="M4 12l16-7-4.5 15L11 14z" />
    <path d="M11 14l9-9" />
  </Svg>
)
