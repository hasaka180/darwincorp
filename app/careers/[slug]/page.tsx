import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactFooter from "@/components/ContactFooter";
import RoleDetail from "@/components/RoleDetail";
import { ROLES, getRole, jobPostingSchema } from "@/lib/careers";
import { STUDIO_ADDRESS } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thedarwin.co";

/**
 * One page per opening.
 *
 * A job shared to LinkedIn or WhatsApp needs a URL of its own — pointed at
 * the listing, every role previews as the same generic careers page. This is
 * also what Google asks for: one JobPosting per page, which is why the
 * listing no longer emits the schema itself.
 */
export function generateStaticParams() {
  return ROLES.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) return { title: "Role not found" };

  const title = `${role.title} - Careers`;
  const description = `${role.blurb} ${role.types.join(" / ")} in ${role.location}.`;
  return {
    title,
    description,
    alternates: { canonical: `/careers/${role.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}/careers/${role.slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jobPostingSchema(role, SITE_URL, STUDIO_ADDRESS)),
        }}
      />
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <Link href="/careers" className="subpage__eyebrow">
            ← All roles
          </Link>
        </header>
        <RoleDetail role={role} shareUrl={`${SITE_URL}/careers/${role.slug}`} />
      </section>
      <ContactFooter />
    </main>
  );
}
