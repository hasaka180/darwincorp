import type { LandingPage } from "./types";
import portfolio from "./portfolio.json";

type IndustryBrief = {
  slug: string; title: string; heading: string; description: string; intro: string;
  sections: LandingPage["sections"]; checklist: string[]; question: string; answer: string;
  services: [string, string][]; projects?: string[]; image?: string;
};
const briefs: IndustryBrief[] = [
  {
    slug: "interior-design", title: "Website Design for Interior Designers", heading: "Give your spaces a digital home.",
    description: "Websites and brand identities for interior designers. Project galleries, material stories and consultation journeys that give your work room to speak.",
    intro: "An interior design website should communicate more than a finished room. It should show your point of view, the way you work and the kind of project a client can bring to you.",
    sections: [{ title: "Let projects tell a story", body: "We organise portfolios by useful distinctions such as residential, commercial or hospitality. Each project can pair full-room photography with details, context and the decisions behind the space." }, { title: "Make materials tangible", body: "Image sequences, considered crops and editorial captions bring texture and craft into the experience. We balance large imagery with mobile loading and a clear reading order." }, { title: "Turn interest into a brief", body: "A consultation enquiry can ask about property type, location, project stage and intended scope. The aim is to help a prospective client explain what they need before the first conversation." }],
    checklist: ["Project photography and publication permissions", "Project types, services and service areas", "Studio story and approach", "Consultation questions and enquiry destination"],
    question: "Can we add projects ourselves?", answer: "Yes. We can create an editable project template with galleries, project details and credits. We agree the fields and image guidance so future projects fit the original design.",
    services: [["Custom website development", "custom-web-development"], ["Brand identity", "brand-identity"]], image: "/assets/motion/botanical.webp",
  },
  {
    slug: "real-estate", title: "Website Design for Real Estate Companies", heading: "Make every property easier to explore.",
    description: "Real estate website design and branding for agencies, developers and property technology businesses. Clear property presentation and considered enquiry journeys.",
    intro: "A property website has to help someone compare, understand and enquire. The right structure depends on whether you sell a single development, a changing inventory or a technology platform.",
    sections: [{ title: "Property information in context", body: "We design property pages around useful facts: location, layouts, imagery, amenities and availability. Information is structured so mobile visitors can make sense of a listing quickly." }, { title: "A clear enquiry path", body: "Calls to action can connect an enquiry with a specific property or project. We map form fields and routing to the way your sales team handles incoming interest." }, { title: "Integrations with a defined source", body: "Listing feeds, CRM connections and search tools are scoped against the actual provider. We establish where property data lives, how it updates and who is responsible for its accuracy." }],
    checklist: ["Property types and required listing fields", "Approved photography, floor plans and copy", "CRM or listing-feed documentation", "Sales team routing and enquiry requirements"],
    question: "Can you connect our property CRM?", answer: "We can assess the integration once you share the provider and its available API or feed. Data access, update frequency and licensing constraints affect feasibility and scope.",
    services: [["UI/UX design", "ui-ux-design"], ["Custom website development", "custom-web-development"]], projects: ["realpha"],
  },
  {
    slug: "personal-brands", title: "Personal Brand Website Design", heading: "A digital presence that feels like you.",
    description: "Personal brand websites for founders, consultants, creators and independent professionals. Bring your work, perspective and offers into one clear home.",
    intro: "A personal website should explain what you are known for and what someone can work with you on. The structure needs to serve your audience as well as your story.",
    sections: [{ title: "A focused introduction", body: "We help organise your biography, point of view and offer into a readable hierarchy. Visitors should understand your relevance before exploring the full story." }, { title: "Proof with context", body: "Selected work, speaking engagements, writing and approved testimonials provide different kinds of evidence. We choose the formats that support your actual services." }, { title: "One home for your next step", body: "Booking links, newsletters and collaboration enquiries can sit within a coherent experience. We keep the main action clear even when your work spans several platforms." }],
    checklist: ["Biography and positioning", "Portraits and selected work", "Services, talks or collaboration formats", "Booking and newsletter tools"],
    question: "Can my site include both a portfolio and services?", answer: "Yes. We can separate work, writing and services while keeping a consistent personal identity. The homepage should prioritise the audience and action most important to you.",
    services: [["Brand identity", "brand-identity"], ["Interactive web design", "interactive-web-design"]], image: "/assets/hasaka.webp",
  },
  {
    slug: "hospitality", title: "Website Design for Hospitality & Restaurants", heading: "Set the atmosphere before guests arrive.",
    description: "Hospitality and restaurant website design that connects atmosphere with practical details: menus, rooms, locations and a clear booking journey.",
    intro: "The experience can be expressive while the essentials remain simple to find. Guests need to know what to expect, where to go and how to reserve.",
    sections: [{ title: "An atmosphere with substance", body: "Photography, type and pacing convey the venue's character. Room or dining information adds the detail guests need to decide whether the experience fits their plans." }, { title: "Everyday information, easy to find", body: "Menus, opening hours, directions and contact details deserve clear mobile layouts. Editable content helps your team keep seasonal changes current." }, { title: "A considered booking handoff", body: "We map the journey into your reservation or booking provider. Embed options, external booking links and confirmation ownership are reviewed before implementation." }],
    checklist: ["Venue imagery and brand assets", "Menus, room information or experiences", "Booking provider details", "Opening hours, location and contact information"],
    question: "Will this replace our reservation system?", answer: "A website can connect to an existing booking system. Replacing the operational booking platform is a separate requirement that needs its own assessment.",
    services: [["Website development", "custom-web-development"], ["Brand identity", "brand-identity"]],
  },
  {
    slug: "healthcare", title: "Website Design for Healthcare & Wellness", heading: "Care begins with clarity.",
    description: "Healthcare and wellness websites with clear service information, approachable brand design and straightforward appointment enquiry paths.",
    intro: "People exploring care need to understand the service, the team and the next step. We design the experience around clear information and a calm, usable interface.",
    sections: [{ title: "Explain the care available", body: "Service pages can describe what is offered, who provides it and how an enquiry works. Clinical statements and credentials should come from your approved content owners." }, { title: "Build a reassuring experience", body: "Readable typography, accessible controls and deliberate imagery help visitors navigate without unnecessary distraction. Practitioner profiles provide context where appropriate." }, { title: "Keep enquiries proportionate", body: "A first-contact form should collect only what the team needs to respond. Medical records, patient portals and clinical booking systems require a separately assessed implementation." }],
    checklist: ["Approved service descriptions and practitioner profiles", "Care coverage and contact process", "Brand imagery and permissions", "Booking requirements and data-handling responsibilities"],
    question: "Can the website include online appointment booking?", answer: "We can assess a connection to your chosen booking provider. Its data requirements and operational workflow should be reviewed before deciding what belongs on the public website.",
    services: [["Brand identity", "brand-identity"], ["UI/UX design", "ui-ux-design"]], projects: ["nadz-home-healthcare"],
  },
  {
    slug: "architecture", title: "Website Design for Architecture Studios", heading: "A portfolio with an architectural point of view.",
    description: "Websites for architecture studios, designed around project narratives, drawings, photography and the thinking behind the built environment.",
    intro: "An architecture portfolio needs a hierarchy that works for a potential client and a careful reader. We give the project story a structure without flattening its visual character.",
    sections: [{ title: "More than an image archive", body: "A project can connect the brief, site conditions and design response. Drawings, models and completed photography form a coherent sequence instead of an unstructured gallery." }, { title: "Useful ways to explore", body: "Typology, location, completion status and scale can help visitors navigate a growing body of work. We define classifications around the studio's actual portfolio." }, { title: "Credit the collaboration", body: "Project pages can include consultants, photographers, collaborators and publication references. A structured template makes those details consistent and easier to maintain." }],
    checklist: ["Project descriptions and classifications", "Photography, drawings and reproduction permissions", "Project credits and studio profile", "New-business enquiry requirements"],
    question: "Can we include unbuilt and competition projects?", answer: "Yes. We can give each project a clear status and use appropriate visual formats, so visitors understand what has been built and what remains a proposal.",
    services: [["Custom development", "custom-web-development"], ["Interactive websites", "interactive-web-design"]], image: "/assets/motion/botanical.webp",
  },
  {
    slug: "startups", title: "Website Design for Startups & Technology", heading: "Make a complex idea easy to believe in.",
    description: "Brand identity, UI/UX and websites for startups and technology companies. Explain your product clearly and build a digital system that can grow with it.",
    intro: "An early-stage business may need to speak to customers, partners and investors at once. We clarify the primary journey while giving each audience the evidence it needs.",
    sections: [{ title: "Explain the product", body: "We organise the problem, product and use cases into a clear story. Screens, diagrams and short interaction studies can make unfamiliar technology easier to understand." }, { title: "Create a credible identity", body: "The brand system should match the substance of the product. We build visual consistency across the website, product touchpoints and agreed presentation materials." }, { title: "Leave room to evolve", body: "Reusable page types and editable content support new use cases, launches and updates. Integrations and account-based product features are scoped separately from a marketing website." }],
    checklist: ["Product description and priority audience", "Approved product screens and demonstrations", "Launch objectives and required integrations", "Current identity and presentation materials"],
    question: "Can you design the product as well as the marketing website?", answer: "Yes. Product UI/UX and the marketing site can be coordinated, with separate deliverables for product flows, interface components and public-facing pages.",
    services: [["UI/UX design", "ui-ux-design"], ["Brand identity", "brand-identity"]], projects: ["nexera-robotics", "realpha"],
  },
  {
    slug: "nonprofits", title: "Website Design for NGOs & Nonprofits", heading: "Make the mission clear. Make participation simple.",
    description: "Websites and brand design for NGOs and nonprofits, connecting programme information, transparent reporting and ways to get involved.",
    intro: "Supporters need to understand the mission and the organisation behind it. Programme content, evidence and participation paths should work together.",
    sections: [{ title: "A mission people can understand", body: "We organise programmes, audiences and geography so visitors can see what the organisation does. Plain language helps explain the work without assuming prior knowledge." }, { title: "Evidence in context", body: "Reports, programme updates and documented outcomes need clear dates and attribution. We design editable formats for publishing the evidence your team can substantiate." }, { title: "Useful ways to participate", body: "Volunteer applications, partnership enquiries and donation-provider links can each have a distinct journey. We scope any payment integration against the provider you already use or approve." }],
    checklist: ["Mission and programme descriptions", "Approved reporting and impact evidence", "Donation or volunteer platform details", "Content ownership and publication permissions"],
    question: "Can the site collect donations?", answer: "We can assess integration with your approved donation or payment provider. Provider setup, fees, fundraising permissions and financial administration remain separate from the website design scope.",
    services: [["Custom website development", "custom-web-development"], ["Brand identity", "brand-identity"]],
  },
  {
    slug: "education", title: "Website Design for Education & Training", heading: "Help learners find their next step.",
    description: "Education and training websites that make courses, learning formats and application journeys easier to understand, compare and navigate.",
    intro: "A prospective learner needs more than a course title. They need to understand the fit, the commitment and what happens after they express interest.",
    sections: [{ title: "Course information that answers questions", body: "Structured pages can show learning objectives, entry requirements, format and duration. We plan fields around your actual programmes and approval process." }, { title: "A clear path to application", body: "We map the steps from enquiry to enrolment and identify where visitors move into an existing admissions system. Each step should explain what information is needed." }, { title: "An editable programme catalogue", body: "A content model can support courses, instructors, dates and locations. Learning delivery and student accounts belong to a separately scoped platform or LMS connection." }],
    checklist: ["Course catalogue and approved learning outcomes", "Schedules, fees and entry requirements", "Application or LMS provider details", "Instructor profiles and content approval owners"],
    question: "Is an online learning platform included?", answer: "A public website and an LMS solve different needs. We can link to or assess integration with your learning platform; course delivery, progress tracking and student accounts need a separate scope.",
    services: [["UI/UX design", "ui-ux-design"], ["Custom development", "custom-web-development"]],
  },
];

export const INDUSTRY_PAGES: LandingPage[] = briefs.map(b => ({
  ...b, eyebrow: `Industries · ${b.slug.replaceAll("-", " ")}`,
  image: b.image || portfolio.find(p => p.slug === b.projects?.[0])?.cover || "/video/website.jpg",
  imageAlt: b.image?.includes("hasaka") ? "Portrait of Darwin founder Hasaka" : b.projects?.length ? `${portfolio.find(p => p.slug === b.projects?.[0])?.title} project by Darwin Corp` : "Darwin creative studio visual study",
  scope: { title: "A useful starting brief.", body: "These inputs help us shape a proposal around your actual content and workflow. We can identify content gaps together during discovery.", items: b.checklist },
  faqs: [{ q: b.question, a: b.answer }, { q: "Can branding and the website be developed together?", a: "Yes. A combined scope lets positioning, visual identity and the website share one direction. We agree the deliverables and review points for each stage before production." }],
  related: [...b.services.map(([label, slug]) => ({ label, href: `/services/${slug}` })), { label: "Website pricing", href: "/pricing/websites" }],
}));
