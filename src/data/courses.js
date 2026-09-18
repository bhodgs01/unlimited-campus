/**
 * The three courses Alan shared on 2026-09-18, each one a badge inside its castle.
 *
 * Module titles and goals are lifted from his own curriculum documents. `quest` names the prop a
 * student actually uses in the study pod; `guide` is the Awesomenaut who runs the hall (the four
 * named guides are part of the UA brand system, so the concierge is one of theirs, not ours).
 *
 * `media` is filled at runtime from /media/manifest.json, written by the mirror script when the
 * videos, podcasts, PDFs and infographics are copied off his Drive.
 */

export const COURSES = [
  {
    id: 'gratitude',
    name: 'Gratitude',
    castle: 'perseverance',
    tagline: 'Maintain an attitude of gratitude',
    blurb:
      "Happiness isn't something we find, it's something we choose, create and practise every day. Learn the science of gratitude, build a daily habit, and watch it ripple out to everyone around you.",
    guide: 'luna',
    quest: 'gratitudeglobe',
    accent: '#E501FF',
    modules: [
      { n: 1, title: 'Understanding Gratitude', goal: 'The science, the benefits, and how the world says thank you.', quest: 'Pin ten ways gratitude is expressed around the world onto the globe.' },
      { n: 2, title: 'Daily Gratitude Practice', goal: 'Start the 3x30 challenge and keep a journal that sticks.', quest: 'Write your first three entries in the journal.' },
      { n: 3, title: 'Expressing Gratitude to Others', goal: 'Say it out loud: letters, visits, and the words that land.', quest: 'Write a thank-you letter to someone who will not expect it.' },
      { n: 4, title: 'The Ripple Effect', goal: 'One thank you moves further than you think.', quest: 'Start a gratitude chain and log where it went.' },
    ],
    final: { title: 'Gratitude Reflection Project', goal: 'Show what 30 days of gratitude changed.' },
  },
  {
    id: 'entrepreneurship',
    name: 'Entrepreneurship',
    castle: 'economic',
    tagline: 'Entrepreneurship IS the job of the future',
    blurb:
      'Entrepreneurship is more than starting a business: it is solving problems, creating value and learning from experience. Find a problem worth solving, plan it, launch something small, then look hard at what happened.',
    guide: 'orion',
    quest: 'ideaworkbench',
    accent: '#FFC400',
    modules: [
      { n: 1, title: 'What is Entrepreneurship?', goal: 'Dreamers and doers: risk, value and the mindset.', quest: 'Name three problems you personally would pay to have solved.' },
      { n: 2, title: 'Identifying Opportunities & Customers', goal: 'Find the person with the problem before you build the thing.', quest: 'Build a customer card for the person you are helping.' },
      { n: 3, title: 'Business Planning Basics', goal: 'A plan that fits on one bench: offer, price, cost, promise.', quest: 'Lay out your plan on the workbench, piece by piece.' },
      { n: 4, title: 'Launching a Mini Venture', goal: 'Get something real in front of a real person this week.', quest: 'Set your shopfront and make your first sale.' },
      { n: 5, title: 'Entrepreneurial Finance Basics', goal: 'Money in, money out, and what is left over.', quest: 'Balance the coins: what did it cost, what did it earn?' },
      { n: 6, title: 'Reflection & Iteration', goal: 'The lesson is in what went wrong.', quest: 'Write the next version of your plan.' },
    ],
    final: { title: 'Venture Report', goal: 'What you built, what you learned, what is next.' },
  },
  {
    id: 'aimaster',
    name: 'AI Master',
    castle: 'creative',
    tagline: 'AI + You = Awesome!',
    blurb:
      'One of the most useful skills of your life: how to think, create and work alongside AI. Not a course about AI, a course where you use it to write, make art, solve real problems and build your own tools.',
    guide: 'atlas',
    quest: 'promptconsole',
    accent: '#AFFF00',
    modules: [
      { n: 1, title: 'What Is AI? And Where Did It Come From?', goal: 'What it really is, and where it came from.', quest: 'Ask the console three questions and judge the answers.' },
      { n: 2, title: 'Learn Anything with AI', goal: 'Turn it into the tutor that never gets tired.', quest: 'Teach yourself something new in ten minutes.' },
      { n: 3, title: 'Write Anything with AI', goal: 'Drafting, editing, and keeping your own voice.', quest: 'Write a story opening, then make it better.' },
      { n: 4, title: 'Make Art, Posters & Designs with AI', goal: 'Prompting for pictures that look like you meant it.', quest: 'Design a poster for your castle.' },
      { n: 5, title: 'Speak & Communicate Better with AI', goal: 'Practise the conversation before you have it.', quest: 'Rehearse a pitch and take the notes.' },
      { n: 6, title: 'Solve Real Problems with AI', goal: 'Take a problem you actually have and break it down.', quest: 'Solve one real problem end to end.' },
      { n: 7, title: 'Code Using AI', goal: 'Build a small working tool without being a programmer first.', quest: 'Ship a tool that does one useful thing.' },
      { n: 8, title: 'Ethics, Bias & The Future of AI', goal: 'Where it goes wrong, and what you owe the people it affects.', quest: 'Find a bias, then write the rule you would set.' },
      { n: 9, title: 'Capstone: AI for Good', goal: 'Use everything on something that helps someone.', quest: 'Build your capstone and present it.' },
    ],
    final: { title: 'AI for Good Capstone', goal: 'One project that helps someone, start to finish.' },
  },
]

export const courseById = (id) => COURSES.find((c) => c.id === id) || null
export const courseForCastle = (castle) => COURSES.find((c) => c.castle === castle) || null

/** The Awesomenauts who run the halls: UA's own named guides. */
export const GUIDES = {
  luna: { name: 'Luna', role: 'The Empath', blurb: 'Kind, wise, thoughtful. She leads the reflection moments.' },
  orion: { name: 'Orion', role: 'The Leader', blurb: 'Confident, determined, inspiring. He sets the challenge and sends you off.' },
  atlas: { name: 'Atlas', role: 'The Builder', blurb: 'Logical, inventive, strategic. He explains how the machine actually works.' },
  nova: { name: 'Nova', role: 'The Explorer', blurb: 'Curious, adventurous, fearless. She opens the question.' },
}
