import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  const data = await res.json();
  if (!data.length) {
    return NextResponse.json({ 
      success: false, 
      message: "User not found" 
    }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: data[0] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  
  console.log("PATCH - Supabase URL:", SUPABASE_URL);
  console.log("PATCH - Has Key:", !!SUPABASE_KEY);
  console.log("PATCH request body:", body);
  console.log("PATCH user identifier:", id);
  
  // Allowed fields
  const allowedFields = ['name', 'phone', 'profile_completed_min', 'profile_image_url', 'role', 'company', 'experience', 'latitude', 'longitude', 'bio', 'availability', 'skills', 'resume_url', 'city', 'pincode'];
  const updateData: Record<string, unknown> = {};
  
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  console.log("Update data:", updateData);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ 
      success: false, 
      message: "No valid fields to update" 
    }, { status: 400 });
  }

  // Check if id looks like an email (contains @)
  let url: string;
  if (id.includes('@')) {
    // Use email filter
    url = `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(id)}`;
  } else {
    // Use ID filter (UUID)
    url = `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`;
  }
  console.log("PATCH URL:", url);
  
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(updateData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.log("PATCH error:", errorText);
    return NextResponse.json({ 
      success: false, 
      message: errorText || "Failed to update profile" 
    }, { status: 500 });
  }

  const data = await res.json();
  console.log("PATCH success:", data);
  return NextResponse.json({ success: true, data: data[0] });
}