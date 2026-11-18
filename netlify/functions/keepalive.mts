// Daily ping so Appwrite's free tier doesn't pause the content database for
// inactivity. Replaces the Vercel cron in vercel.json. URL is set by Netlify.
export default async () => {
  const res = await fetch(`${process.env.URL}/api/health`, {
    headers: process.env.CRON_SECRET ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : {},
  });
  console.log("keepalive", res.status, await res.text());
};

export const config = { schedule: "0 4 * * *" };
