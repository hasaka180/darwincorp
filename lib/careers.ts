/**
 * Open roles, rendered by /careers.
 *
 * Content lives here rather than in Appwrite: hiring changes a few times a
 * year, and keeping it in the repo means the job pages ship with the build
 * and stay indexable without a CMS round-trip.
 */

export type EngagementType = 'Full-time' | 'Freelance' | 'Project-based'
export type WorkMode = 'Onsite' | 'Remote' | 'Hybrid'

export type Role = {
  slug: string
  title: string
  team: string
  /** Engagements we'll genuinely consider for this role. */
  types: EngagementType[]
  modes: WorkMode[]
  location: string
  blurb: string
  about: string
  responsibilities: string[]
  requirements: string[]
  niceToHave?: string[]
  /** Publication date (ISO 8601). Google requires this on every JobPosting. */
  posted: string
  /** Listing expiry (ISO 8601). Google drops postings that never expire. */
  validThrough: string
  /**
   * Countries a remote applicant may be based in (ISO 3166-1 alpha-2).
   * Google requires this whenever a role is open to remote work; it is
   * ignored for onsite-only roles.
   */
  applicantCountries?: string[]
  /**
   * Gross monthly base salary in AED, published in the JobPosting schema.
   * Omitted on roles where the applicant quotes their own rate — publishing a
   * figure we are not actually offering would be worse than publishing none.
   */
  salaryAedPerMonth?: number
  /** Portfolio is a hard requirement, not an optional extra, on this role. */
  requiresPortfolio?: boolean
  /**
   * Ask the applicant for their rate. For freelance roles priced per project
   * or per day, that is the thing we actually need to know.
   */
  asksQuote?: boolean
  /** Scope badge shown beside the title, e.g. the deliverables a role covers. */
  titleLabel?: string
}

export const ROLES: Role[] = [
  {
    slug: 'project-manager',
    salaryAedPerMonth: 5000,
    title: 'Project Manager',
    team: 'Operations',
    types: ['Full-time', 'Freelance'],
    modes: ['Onsite', 'Hybrid'],
    location: 'Dubai, UAE',
    blurb:
      'Keep brand, web and content projects moving - scope, schedule and the hundred small decisions in between.',
    about:
      'You are the spine of the studio. You turn a signed proposal into a plan, keep designers and developers unblocked, and make sure the client always knows where things stand. You care about the work, not just the Gantt chart.',
    responsibilities: [
      'Own project scope, timelines and budgets from kickoff to handover.',
      'Run the weekly rhythm: standups, client check-ins, delivery reviews.',
      'Translate creative feedback into clear, actionable tasks for the team.',
      'Spot risk early - scope creep, slipping dependencies, quiet blockers.',
      'Keep documentation, assets and approvals in order for every project.',
    ],
    requirements: [
      '3+ years managing creative, digital or marketing projects.',
      'Fluent with a project tool (Notion, ClickUp, Asana, Linear or similar).',
      'Strong written English and calm, direct client communication.',
      'Enough design and web literacy to push back on a bad estimate.',
    ],
    niceToHave: [
      'Agency or studio background.',
      'Experience with UAE-based clients.',
    ],
    posted: '2026-09-22',
    validThrough: '2027-03-31',
  },
  {
    slug: 'motion-designer',
    salaryAedPerMonth: 8000,
    title: 'Motion Designer',
    team: 'Design',
    types: ['Full-time', 'Freelance', 'Project-based'],
    modes: ['Onsite', 'Remote', 'Hybrid'],
    location: 'Dubai, UAE or remote',
    blurb:
      'Bring identities and campaigns into motion - brand idents, social cutdowns, product film and everything with a timeline.',
    about:
      'You think in beats and easing curves. You can take a static identity and find the movement already implied in it, and you know when a cut does more than an animation ever could.',
    responsibilities: [
      'Design and animate brand idents, titles and campaign assets.',
      'Cut and grade short-form content for social and paid placements.',
      'Build reusable motion systems and templates from brand guidelines.',
      'Work with designers and strategists from storyboard to final export.',
    ],
    requirements: [
      'A reel that shows range - brand motion, type in motion, editing.',
      'Strong After Effects; confident in Premiere or DaVinci Resolve.',
      'A real sense of timing, rhythm and sound.',
      'Comfortable delivering to spec across formats and aspect ratios.',
    ],
    niceToHave: [
      'Cinema 4D, Blender or another 3D package.',
      'AI-assisted production tooling in your workflow.',
    ],
    posted: '2026-09-22',
    validThrough: '2027-03-31',
    applicantCountries: ['AE'],
  },
  {
    slug: 'junior-graphic-designer',
    salaryAedPerMonth: 3000,
    title: 'Junior Graphic Designer',
    team: 'Design',
    types: ['Full-time'],
    modes: ['Onsite'],
    location: 'Dubai, UAE',
    blurb:
      'Early in your career, serious about craft. Learn brand systems from the inside and ship real work from week one.',
    about:
      'We hire juniors to grow them. You will sit beside senior designers, get your work critiqued honestly, and be trusted with real client deliverables sooner than you expect. Bring taste and appetite; we will help with the rest.',
    responsibilities: [
      'Produce social, print and digital collateral from existing brand systems.',
      'Support senior designers on identity and campaign projects.',
      'Prepare artwork and files for print and production.',
      'Keep brand libraries and design assets tidy and current.',
    ],
    requirements: [
      'A portfolio showing genuine typographic and layout sensibility.',
      'Working knowledge of Figma and the Adobe suite.',
      'Attention to detail - spacing, alignment, file hygiene.',
      'Open to feedback and fast at acting on it.',
    ],
    niceToHave: [
      'Internship or freelance experience.',
      'Basic motion or 3D skills.',
    ],
    posted: '2026-09-22',
    validThrough: '2027-03-31',
  },
  {
    slug: 'freelance-videographer',
    title: 'Freelance Videographer',
    team: 'Production',
    types: ['Freelance', 'Project-based'],
    modes: ['Onsite', 'Hybrid'],
    location: 'Dubai, UAE',
    requiresPortfolio: true,
    asksQuote: true,
    titleLabel: 'Shooting + Editing',
    blurb:
      'Shoot brand films, campaign content and social cutdowns across Dubai - project by project, kit in hand.',
    about:
      'We bring in videographers per project, not per month. Some shoots are a single interview setup in a boardroom; others are a two-day brand film with talent, locations and a crew around you. We want people we can call again, so we care more about how you handle a changing brief on the day than about the logo on your camera.',
    responsibilities: [
      'Shoot brand films, interviews, product and event content on location across the UAE.',
      'Plan the shoot with us: shot list, locations, lighting and sound requirements.',
      'Own your kit - camera, lenses, lighting and audio - and arrive ready to work.',
      'Edit the footage into the final cut, to brief and to length.',
      'Deliver organised, clearly labelled footage and project files.',
      'Work alongside our designers and motion team through to final delivery.',
    ],
    requirements: [
      'A showreel or portfolio of work you personally shot. This is mandatory - applications without one are not reviewed.',
      'Your own professional camera, lens and audio kit.',
      'Confident with lighting and location sound, not just the camera body.',
      'Based in or around Dubai and able to travel to shoots across the UAE.',
      'Editing - this role covers the cut, not just the shoot. Quote for both.',
      'A rate you can stand behind.',
    ],
    niceToHave: [
      'Colour grading and finishing to broadcast standard.',
      'Gimbal, drone or FPV work (with the relevant UAE permits).',
      'Experience directing non-professional talent on camera.',
    ],
    posted: '2026-10-19',
    validThrough: '2027-06-30',
  },
  {
    slug: 'vibe-coder',
    salaryAedPerMonth: 8000,
    title: 'Vibe Coder',
    team: 'Technology',
    types: ['Full-time', 'Freelance', 'Project-based'],
    modes: ['Onsite', 'Remote', 'Hybrid'],
    location: 'Dubai, UAE or remote',
    blurb:
      'Build fast with AI tooling, but know what the code actually does. Prototypes on Monday, production by Friday.',
    about:
      'You use AI to move quickly, and you read every line it gives you. You can take a design and a vague brief and have something clickable the same day, then harden it into something we are happy to put a client name on. This is not a prompt-only role: core development knowledge is the requirement, and the AI is the accelerant.',
    responsibilities: [
      'Turn designs and briefs into working web builds, fast.',
      'Prototype interactions and micro-sites for pitches and campaigns.',
      'Harden prototypes into maintainable, accessible, performant production code.',
      'Review and correct AI-generated output before it reaches a client.',
      'Integrate CMS, forms, analytics and third-party APIs.',
    ],
    requirements: [
      'Solid JavaScript and TypeScript fundamentals, not just framework recall.',
      'Real experience with React and a modern framework such as Next.js.',
      'Confident CSS: layout, responsive behaviour, animation.',
      'Daily use of AI coding tools, with the judgement to know when they are wrong.',
      'Git, deployment and a habit of shipping.',
    ],
    niceToHave: [
      'WebGL, Three.js or shader work.',
      'Backend and database experience.',
      'An eye for design, not just implementation.',
    ],
    posted: '2026-09-22',
    validThrough: '2027-03-31',
    applicantCountries: ['AE'],
  },
]

export const getRole = (slug: string) => ROLES.find((r) => r.slug === slug)
