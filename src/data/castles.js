/**
 * The Six Castles of Human Flourishing and their badges.
 *
 * Badge grouping is INFERRED from the order the badges appear on unlimitedawesome.com
 * (52 badges; the deck says 56). Confirm with Alan and fix here; nothing else in the app
 * knows the mapping.
 *
 * `accent` is each district's own colour, used for the badge kiosk discs, the chips and the
 * cards. The castle pieces themselves stay in the brand purple / lime.
 */
export const BRAND = { purple: '#E501FF', lime: '#AFFF00', ink: '#202020', cyan: '#00D2FF' }

export const CASTLES = [
  {
    id: 'perseverance',
    name: 'Perseverance',
    short: 'Perseverance',
    piece: 'castleperseverance',
    blurb: 'The fortress of grit and determination. Overcoming obstacles is the key to unlocking this castle.',
    accent: '#E501FF',
    roof: 'slate',
    badges: ['Gratitude', 'Happiness', 'Grit', 'Meditation', 'Harmony', 'Health & Wellness', 'Purpose', 'Theta Flow'],
  },
  {
    id: 'creative',
    name: 'Creative Problem Solving & Critical Thinking',
    short: 'Creative',
    piece: 'castlecreative',
    blurb: 'Where logic meets creativity. Navigate complex labyrinths of thought to find elegant solutions.',
    accent: '#AFFF00',
    roof: 'slate',
    badges: ['Writing', 'Visionary', 'Innovator', 'Entrepreneurship', 'AI Master', 'Technology', 'Podcaster', 'Product Creator', 'Content Creator', 'Presenter', 'Art & Music Lover'],
  },
  {
    id: 'teamwork',
    name: 'Teamwork & Mentorship',
    short: 'Teamwork',
    piece: 'castleteamwork',
    blurb: 'United we stand. Collaborative efforts and guiding others are the foundations of this stronghold.',
    accent: '#00D2FF',
    roof: 'terracotta',
    badges: ['Teamwork', 'Trailblazer', 'Leadership', 'Community Builder', 'Community Impact', 'Volunteer', 'Integrity & Ethics'],
  },
  {
    id: 'economic',
    name: 'Economic Responsibility',
    short: 'Economic',
    piece: 'castleeconomic',
    blurb: 'Mastering the flow of value. Understand finance, resources, and sustainable growth.',
    accent: '#FFC400',
    roof: 'slate',
    badges: ['Finance', 'Blockchain', 'Investor', 'Prosperity', 'Dharma', 'Deal Maker', 'Tax Master', 'Market Maven'],
  },
  {
    id: 'social',
    name: 'Social Impact',
    short: 'Social',
    piece: 'castlesocial',
    blurb: 'Making a difference. Actions that ripple out to improve communities and lives.',
    accent: '#FF5C8A',
    roof: 'terracotta',
    badges: ['Critical Thinking', 'Changemaker', 'Love', 'Empathy', 'Influencer', 'Great People', 'Humanitarian', 'Listener', 'Honour', 'Reformer', 'Cultures', 'World Religions'],
  },
  {
    id: 'environmental',
    name: 'Environmental Sustainability',
    short: 'Environment',
    piece: 'castleenvironmental',
    blurb: 'Guardians of the planet. Protecting and restoring our natural world for future generations.',
    accent: '#3DDC84',
    roof: 'slate',
    badges: ['Earth Guardian', 'Recycler', 'Nature Guide', 'Space', 'Wave Rider', 'Planet Protector'],
  },
]

export const castleById = (id) => CASTLES.find((c) => c.id === id) || null

/** A handful of real mentor names from the deck, the rest are numbered until Alan sends the roster. */
/** Mentor roles from the UA intro deck (Sept 2026). Only Jim Keyes is named in the deck. */
export const MENTOR_ROLES = [
  { name: 'Jim Keyes', role: 'Former CEO of Blockbuster & 7-Eleven' },
  { role: "World's First Chief AI Officer @ IBM" },
  { role: 'Founder of Atari & Chuck E Cheese' },
  { role: 'Former Head of Innovation @ Nike' },
  { role: 'Former Global CTO @ Lenovo' },
  { role: 'Professor @ Harvard Medical School' },
  { role: 'Inventor of VOIP & Siri, former Partner @ Kleiner Perkins' },
  { role: 'Grandfather of Virtual Reality' },
  { role: 'Former GM of Epic Games' },
  { role: 'CEO of Unanimous AI' },
  { role: 'Former Head of Sales @ Facebook (now Meta)' },
  { role: '#1 Futurist in the world' },
]
export const MENTORS = [
  'Jim Keyes', 'Nolan Bushnell', 'Jeremy Bailenson', 'Julie Smithson', 'Alan Smithson', 'Dan Blair', 'Kelly Lovell', 'Mark Hewitt',
]
