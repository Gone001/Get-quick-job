import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ 
      success: false, 
      message: "user_id is required" 
    }, { status: 400 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=20`,
    {
      headers: {
        "apikey": SUPABASE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, type, title, message, job_id } = body;
  
  if (!user_id || !type || !title) {
    return NextResponse.json({ 
      success: false, 
      message: "user_id, type, and title are required" 
    }, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      user_id,
      type,
      title,
      message,
      job_id,
      is_read: false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json({ 
      success: false, 
      message: errorText 
    }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, data: data[0] });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { notification_id, is_read } = body;
  
  if (!notification_id) {
    return NextResponse.json({ 
      success: false, 
      message: "notification_id is required" 
    }, { status: 400 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/notifications?id=eq.${encodeURIComponent(notification_id)}`,
    {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ is_read }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json({ 
      success: false, 
      message: errorText 
    }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, data: data[0] });
}