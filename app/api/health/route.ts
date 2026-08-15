import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const has = (v?: string) => Boolean(v && v.trim());

export async function GET() {
  const aw = {
    endpoint: has(process.env.APPWRITE_ENDPOINT),
    project: has(process.env.APPWRITE_PROJECT_ID),
    apiKey: has(process.env.APPWRITE_API_KEY),
    database: has(process.env.APPWRITE_DATABASE_ID),
    collection: has(process.env.APPWRITE_COLLECTION_ID),
  };
  const r2 = {
    account: has(process.env.R2_ACCOUNT_ID),
    accessKey: has(process.env.R2_ACCESS_KEY_ID),
    secret: has(process.env.R2_SECRET_ACCESS_KEY),
    bucket: has(process.env.R2_BUCKET),
    publicUrl: has(process.env.R2_PUBLIC_BASE_URL),
  };
  // non-secret hints
  const hints = {
    endpointValue: process.env.APPWRITE_ENDPOINT ?? null,
    databaseIdLen: (process.env.APPWRITE_DATABASE_ID ?? "").length,
    collectionIdLen: (process.env.APPWRITE_COLLECTION_ID ?? "").length,
  };

  let appwriteConnect: string = "skipped (missing vars)";
  if (Object.values(aw).every(Boolean)) {
    try {
      const { Client, TablesDB, Query } = await import("node-appwrite");
      const t = new TablesDB(
        new Client()
          .setEndpoint(process.env.APPWRITE_ENDPOINT!)
          .setProject(process.env.APPWRITE_PROJECT_ID!)
          .setKey(process.env.APPWRITE_API_KEY!)
      );
      const res = await t.listRows({
        databaseId: process.env.APPWRITE_DATABASE_ID!,
        tableId: process.env.APPWRITE_COLLECTION_ID!,
        queries: [Query.limit(1)],
      });
      appwriteConnect = `ok (rows: ${res.total ?? res.rows?.length ?? 0})`;
    } catch (e) {
      appwriteConnect = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({ appwrite: aw, appwriteConnect, hints, r2 });
}
