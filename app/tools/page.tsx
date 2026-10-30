import { ExploreIndex } from "@/components/ExplorePage";
import { TOOLS, UPCOMING_TOOLS } from "@/lib/tools";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/ExplorePage.module.css";

export const metadata = pageMetadata(
  "Free Tools for Websites and Brands",
  "Free tools from Darwin Corp for founders, marketers and growing businesses in Dubai: estimate a website budget and plan your next project.",
  "/tools",
);

export default function Page() {
  return <ExploreIndex title="Tools" heading="Useful tools. Better digital experiences." description="Free tools for founders, marketers, designers and growing businesses. Plan your next website with real numbers, then take the result straight into a proposal." path="/tools" links={TOOLS}>
    <p className={styles.lead} style={{ marginTop: 40 }}>Coming next: {UPCOMING_TOOLS.join(" and ")}.</p>
  </ExploreIndex>;
}
