import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?employer_id=eq.${id}&order=created_at.desc`, {
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}