import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ============ GET JOB BY ID ============
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${id}`, {
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  const data = await res.json();
  if (!data.length) {
    return NextResponse.json({ 
      success: false, 
      message: "Job not found" 
    }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: data[0] });
}

// ============ UPDATE JOB ============
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  
  console.log("Updating job:", id, "with:", body);
  
  // Allowed fields for update
  const allowedFields = ['title', 'category', 'description', 'pay', 'status', 'urgent', 'address', 'city', 'pincode'];
  const updateData: Record<string, unknown> = {};
  
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ 
      success: false, 
      message: "No valid fields to update" 
    }, { status: 400 });
  }

  // Use filter for uuid
  const url = `${SUPABASE_URL}/rest/v1/jobs`;
  const filterParams = new URLSearchParams();
  filterParams.set("id", `eq.${id}`);
  
  const res = await fetch(`${url}?${filterParams.toString()}`, {
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
    return NextResponse.json({ 
      success: false, 
      message: errorText || "Failed to update job" 
    }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, data: data[0] || { id } });
}

// ============ DELETE JOB ============
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // First delete all applications for this job
  await fetch(`${SUPABASE_URL}/rest/v1/applications?job_id=eq.${id}`, {
    method: "DELETE",
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  // Then delete the job
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ 
      success: false, 
      message: "Failed to delete job" 
    }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: null });
}