import type { LandingPage } from "./types";

export const COMMON_FAQS = [
  { q: "What does Darwin do?", a: "Darwin Corp creates brand identities, custom websites and digital creative work. A project can focus on one service or combine strategy, design, development and creative production." },
  { q: "Where are you based?", a: "Our studio is at 6th Floor, Al Meydan Road, Nad Al Sheba 1, Nad Al Sheba, Dubai, UAE. We work with clients internationally through remote discovery, shared design reviews and a documented delivery process." },
  { q: "How do you price a project?", a: "We quote against the agreed deliverables and complexity. Your proposal identifies the scope, review stages, payment milestones and third-party costs. Send a brief for a custom quotation." },
  { q: "How long will the project take?", a: "The schedule depends on scope, content readiness, integrations and feedback availability. We confirm a timeline after reviewing the brief and identifying dependencies." },
  { q: "What should we prepare before getting in touch?", a: "Share a short description of your business, the problem you want to solve, the deliverables you have in mind, an intended launch date and any budget range. An existing website and visual references are useful too." },
  { q: "Can you work with our existing brand?", a: "Yes. We can work within an established identity, refine specific elements or develop a broader rebrand. The appropriate scope depends on what needs to change." },
  { q: "Who supplies copy, photography and other content?", a: "We agree content responsibilities in the proposal. You can supply approved materials, or we can scope support for selected content and creative production. Licences and permissions should be clear before launch." },
  { q: "Can our team update the finished website?", a: "Yes, if an editable CMS is included. We agree the content types, fields and publishing workflow during planning and provide guidance for the agreed editing tasks." },
  { q: "Is support included after launch?", a: "Launch support, maintenance and ongoing improvements are defined in your proposal. Hosting, domain renewals, subscriptions and support responsibilities should be agreed explicitly." },
  { q: "Who owns the final assets and website?", a: "Your agreement defines ownership, handover and payment conditions. Any third-party fonts, imagery, software or platform licences are identified separately from original project work." },
];

export const RESOURCE_PAGES: LandingPage[] = [
  {
    slug: "process", title: "Our Process", heading: "Good work starts with a shared direction.", eyebrow: "The studio · Our process",
    description: "How Darwin approaches brand and website projects: discovery, design, development and a considered handover, with clear decisions at each stage.",
    image: "/assets/motion/botanical.webp", imageAlt: "Botanical artwork from Darwin’s motion library",
    intro: "A clear process gives creative work room to develop. We establish the problem, make the key decisions visible and keep the next step understandable.",
    sections: [{ title: "Discover and define", body: "We review your business, audience, existing assets and constraints. The outcome is a scope with deliverables, responsibilities and a sequence of review points.", items: ["Discovery conversation", "Content and asset review", "Scope and schedule"] }, { title: "Explore and design", body: "We develop the direction through concepts, wireframes or prototypes appropriate to the project. Consolidated feedback helps resolve the structure before refining details.", items: ["Creative direction", "Design development", "Agreed approval milestones"] }, { title: "Build and deliver", body: "Approved designs become production assets or a working website. We review the deliverables against the brief, prepare the handover and agree any continuing support.", items: ["Production or development", "Review and quality checks", "Launch and handover"] }],
    scope: { title: "What keeps a project moving.", body: "Timing is shaped by decisions as much as production. A named point of contact and organised feedback help maintain the agreed schedule.", items: ["One shared brief and deliverable list", "Named decision makers", "Content supplied at the agreed stages", "Consolidated feedback and documented approvals"] },
    faqs: [COMMON_FAQS[3], COMMON_FAQS[6], COMMON_FAQS[8]], related: [{ label: "Services", href: "/services" }, { label: "Pricing", href: "/pricing" }, { label: "Start a project", href: "/start-a-project" }],
  },
  {
    slug: "technologies", title: "Web Development Technologies", heading: "The right tools for the experience.", eyebrow: "Capabilities · Technology",
    description: "Darwin’s approach to custom frontend development, content management and web animation. We choose the technical setup around the website and the team maintaining it.",
    image: "/video/website.jpg", imageAlt: "Darwin web development visual study",
    intro: "Technology is a project decision. The useful question is what your site needs to do, who will update it and how it should evolve after launch.",
    sections: [{ title: "Custom frontend development", body: "React and Next.js support our custom website work, with reusable components and server-rendered content where appropriate. We plan the interactive layer around the actual page requirements." }, { title: "Content management", body: "A headless CMS or a visual platform such as Webflow can support different editing workflows. We define content types, roles and integrations before choosing the setup." }, { title: "Motion and creative coding", body: "CSS, JavaScript and Three.js can be used for transitions, interaction and 3D experiences. We choose the simplest implementation that supports the idea and plan usable alternatives for complex media." }],
    scope: { title: "Decisions that outlast the launch.", body: "A proposal should explain how content, hosting, integrations and maintenance fit together. Tool choice follows those requirements.", items: ["Content model and editor workflow", "Integrations and data ownership", "Accessibility and performance goals", "Hosting, documentation and maintenance responsibilities"] },
    faqs: [{ q: "Do all projects need a custom Next.js build?", a: "No. A custom build is appropriate when its flexibility serves the brief. Simpler editing requirements or an established platform may justify a different approach." }, { q: "Can you work with our existing stack?", a: "We can assess it once you share the framework, CMS, hosting and integration requirements. Any constraints or migration work will be reflected in the scope." }],
    related: [{ label: "Custom development", href: "/services/custom-web-development" }, { label: "Headless CMS explained", href: "/journal/headless-cms-explained" }, { label: "Next.js vs WordPress", href: "/journal/nextjs-vs-wordpress" }],
  },
  {
    slug: "faq", title: "Frequently Asked Questions", heading: "A few things you might be wondering.", eyebrow: "Working with Darwin · FAQs",
    description: "Answers about Darwin’s services, project pricing, timelines, content, website editing and working remotely with our Dubai creative studio.",
    image: "/video/brand-identity.png", imageAlt: "Darwin creative studio brand artwork",
    intro: "You do not need a perfect brief to start a conversation. A clear problem and an idea of where you want the business to go are useful starting points.",
    sections: [{ title: "Define the need", body: "Tell us what is changing: a new business, an outdated website, an unclear identity or a campaign that needs a visual direction." }, { title: "Make the scope concrete", body: "We identify the deliverables, inputs and dependencies before agreeing a fee and schedule. A proposal should be specific enough to review and compare." }, { title: "Know the next step", body: "Once the scope is agreed, we establish the first milestone, the people involved and the materials needed for discovery." }],
    scope: { title: "Bring the questions that matter to you.", body: "These answers describe our general approach. Your project proposal is the place to confirm specific deliverables, terms and responsibilities.", items: ["Business and project context", "Required deliverables", "Budget range and intended timing", "Any platform, content or approval constraints"] },
    faqs: COMMON_FAQS, related: [{ label: "Our process", href: "/process" }, { label: "Pricing", href: "/pricing" }, { label: "Start a project", href: "/start-a-project" }],
  },
  {
    slug: "about", title: "About Darwin Corp", heading: "Where technology meets creative instinct.", eyebrow: "Hasaka · Founder & Creative Director",
    description: "Founded by Hasaka, Darwin Corp connects more than eight years of brand identity experience with technology, digital experiences and original products.",
    image: "/assets/hasaka.webp", imageAlt: "Hasaka, Founder and Creative Director of Darwin Corp",
    intro: "Darwin began with Hasaka’s belief that technology and creativity belong in the same room. A brand should be more than a logo, and a digital product should be more than functional. The strongest ideas connect clear thinking, a memorable visual language and an experience people want to use.",
    sections: [
      {
        title: "The founder",
        body: "Hasaka is the Founder and Creative Director of Darwin Corp. Across more than eight years as a brand identity designer, he has developed identities and creative visual systems that help businesses express who they are with clarity, character and consistency.",
        items: ["Brand identity design", "Creative direction", "Visual systems", "Digital product thinking"],
      },
      {
        title: "Our mission",
        body: "To connect technology with creativity and turn ambitious ideas into brands, websites and products that feel clear, useful and distinct. Darwin brings strategy, design and development together so every part of an experience speaks the same language.",
      },
      {
        title: "Our vision",
        body: "To build a growing family of original products and creative platforms that move culture forward. Inspired by Steve Jobs’s belief in the meeting point between technology and the humanities, Hasaka sees design as the force that can make powerful technology understandable, human and worth caring about.",
      },
    ],
    scope: {
      title: "One studio. A growing creative ecosystem.",
      body: "Darwin Corp is both a creative partner and a home for ideas of its own. Alongside client work, Hasaka is building independent projects across publishing, cinema and digital culture, with more products envisioned for the future.",
      items: [
        "Darwin Corp — brand identity, digital experiences and creative technology",
        "Glitch Decoded — unpopular opinions, untold stories and editor-chosen long reads",
        "Born Cinema — a developing platform for cinema, visual storytelling and film culture",
        "Future products designed where creativity, culture and technology meet",
      ],
    },
    faqs: [
      { q: "Who founded Darwin Corp?", a: "Darwin Corp was founded by Hasaka, its Creative Director and a brand identity designer with more than eight years of experience creating identities, visual systems and digital brand experiences." },
      { q: "What is Darwin Corp’s mission?", a: "Darwin’s mission is to connect technology with creativity, bringing strategy, design and development together to create brands and products that are clear, useful and memorable." },
      COMMON_FAQS[1],
    ],
    related: [
      { label: "Glitch Decoded", href: "https://glitchdecoded.com", description: "An independent magazine for unpopular opinions, untold stories and editor-chosen long reads." },
      { label: "Born Cinema", href: "https://borncinema.com", description: "A developing creative platform for cinema, visual storytelling and film culture." },
      { label: "Selected work", href: "/work", description: "Explore identities and digital experiences created through Darwin Corp." },
    ],
    projects: ["nadz-home-healthcare", "nexera-robotics"],
  },
];

export const PRICING_PAGES: LandingPage[] = [
  {
    slug: "websites", title: "Website Pricing", heading: "A clear scope. A considered investment.", eyebrow: "Pricing · Websites",
    description: "Understand what goes into a custom website quotation: design, development, content, CMS, integrations and ongoing costs. Request a scoped proposal from Darwin.",
    image: "/video/website.jpg", imageAlt: "Darwin website design artwork",
    intro: "The right website budget follows the job it needs to do. We price the work around page types, content, functionality and the level of creative development required.",
    sections: [{ title: "Focused website", body: "For a clear offer and a compact set of pages. A useful starting scope covers the core story, services or product, essential proof and an enquiry journey.", items: ["Custom quote", "Agreed core page templates", "Responsive design and development", "Enquiry form and launch checks"] }, { title: "Content-led website", body: "For a business with a growing portfolio, resources or service catalogue. The extra work is in content modelling, reusable templates and a practical editing workflow.", items: ["Custom quote", "CMS setup and content types", "Multiple reusable page templates", "Editor guidance and agreed migration"] }, { title: "Interactive experience", body: "For a brief where a distinctive interaction is central to the story. Creative development, asset production and testing are estimated around the actual concept.", items: ["Custom quote", "Interaction prototype", "Custom animation or 3D scope", "Media optimisation and fallbacks"] }],
    scope: { title: "What changes the estimate?", body: "These are starting scopes, not fixed packages. Your proposal will identify inclusions, review rounds and optional work. Numerical pricing and a timeline are provided after reviewing the brief.", items: ["Page types and content preparation", "CMS, integrations and migration", "Animation and original asset production", "Hosting, domain, licences and maintenance"] },
    faqs: [{ q: "Why are there no fixed prices?", a: "We quote against a defined scope rather than applying one fee to different websites. Share the page requirements, content status and essential features to receive an estimate." }, { q: "Are hosting and maintenance included?", a: "They are identified separately in the proposal. Recurring services may include hosting, domains, CMS plans and support; responsibility for each should be clear before launch." }, { q: "Can we build in phases?", a: "Yes. We can identify the essential launch scope and plan additional features or content for a later phase. The first phase still needs a complete, usable visitor journey." }],
    related: [{ label: "Website cost in Dubai", href: "/journal/website-design-cost-dubai" }, { label: "Custom website development", href: "/services/custom-web-development" }, { label: "Website redesign", href: "/services/website-redesign" }],
  },
  {
    slug: "branding", title: "Branding Pricing", heading: "Invest in a brand you can build on.", eyebrow: "Pricing · Branding",
    description: "Explore the scope behind logo, visual identity and full branding projects. Darwin provides custom quotations based on strategy, applications and delivery requirements.",
    image: "/video/brand-identity.png", imageAlt: "Darwin visual identity artwork",
    intro: "Branding is not a single deliverable. The scope depends on whether you need a practical visual foundation, a new strategic direction or a wider rollout across the business.",
    sections: [{ title: "Visual foundation", body: "For a business with clear positioning that needs a coherent visual identity. The focus is on the mark and the system around it.", items: ["Custom quote", "Logo and agreed variations", "Typography and colour", "Essential usage guidance"] }, { title: "Complete brand identity", body: "For a new business or a meaningful repositioning. Strategy and messaging inform the visual language and the first set of applications.", items: ["Custom quote", "Discovery and positioning", "Visual identity system", "Messaging and guidelines as scoped"] }, { title: "Brand rollout", body: "For a team taking the identity across multiple formats. Application count, production requirements and coordination determine the delivery scope.", items: ["Custom quote", "Digital and print applications", "Packaging or campaign assets", "Templates and team handover"] }],
    scope: { title: "Price the system you actually need.", body: "We define the strategy work, design concepts, revisions, applications and file delivery in the proposal. Production and third-party licences are identified separately.", items: ["Strategy, naming and messaging requirements", "Identity concepts and review stages", "Application count and format complexity", "Guidelines, licensing and production costs"] },
    faqs: [{ q: "Can we start with a logo and expand later?", a: "Yes. A focused visual scope can be designed with future applications in mind. Broader strategy or messaging work can be added when the business needs it." }, { q: "Are printing and packaging manufacture included?", a: "Design and physical production are separate costs unless explicitly included. We can prepare agreed artwork specifications and discuss coordination with your production partner." }, { q: "How much does a full identity cost?", a: "A quotation depends on the strategic work, number of applications and level of guidance required. Share your current brand and the changes you need so we can define the scope." }],
    related: [{ label: "Brand identity service", href: "/services/brand-identity" }, { label: "Logo and visual identity", href: "/services/logo-visual-identity" }, { label: "Brand identity cost guide", href: "/journal/brand-identity-cost-dubai" }],
  },
];
