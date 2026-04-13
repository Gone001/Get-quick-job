import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const role = searchParams.get("role");
  const id = searchParams.get("id");
  
  const params = new URLSearchParams();
  params.set("limit", "20");
  
  if (role) params.set("role", `eq.${role}`);
  if (id) params.set("id", `eq.${id}`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?${params}`, {
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}