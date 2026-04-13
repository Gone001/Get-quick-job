import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ============ JOBS ============

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";
  
  const params = new URLSearchParams();
  params.set("limit", limit);
  params.set("offset", offset);
  params.set("order", "created_at.desc");
  
  if (status) params.set("status", `eq.${status}`);
  if (category) params.set("category", `eq.${category}`);
  if (search) params.set("title", `ilike.*${search}*`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?${params}`, {
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}

// ============ CREATE JOB ============
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validation
  if (!body.title || !body.employer_id) {
    return NextResponse.json({ 
      success: false, 
      message: "Title and employer_id required" 
    }, { status: 400 });
  }

  const jobData = {
    id: crypto.randomUUID(),
    title: body.title,
    category: body.category,
    description: body.description,
    pay: body.pay,
    employer_id: body.employer_id,
    status: 'open',
    urgent: body.urgent || false,
    address: body.address,
    city: body.city,
    pincode: body.pincode,
    latitude: body.latitude,
    longitude: body.longitude,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(jobData),
  });

  if (!res.ok) {
    return NextResponse.json({ 
      success: false, 
      message: "Failed to create job" 
    }, { status: 500 });
  }

  const createdJob = await res.json();
  
  // Notify workers with matching skills (if category provided)
  if (body.category) {
    const workersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?role=eq.worker&availability=eq.true&select=id,skills`,
      {
        headers: {
          "apikey": SUPABASE_KEY || "",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    
    const workers = await workersRes.json();
    
    // Filter workers who have matching skills
    const matchingWorkers = workers.filter((w: any) => 
      w.skills && w.skills.includes(body.category)
    );
    
    // Create notifications for matching workers
    for (const worker of matchingWorkers) {
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY || "",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: worker.id,
          type: 'new_job',
          title: 'New Job Matching Your Skills!',
          message: `A new ${body.category} job is available: ${body.title}`,
          job_id: jobData.id,
          is_read: false,
        }),
      });
    }
  }
  
  // Also notify all available workers (for now, general notification)
  const allWorkersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?role=eq.worker&availability=eq.true&select=id`,
    {
      headers: {
        "apikey": SUPABASE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  
  const allWorkers = await allWorkersRes.json();
  
  for (const worker of allWorkers.slice(0, 10)) { // Limit to 10 for now
    const existingNotification = await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${worker.id}&job_id=eq.${jobData.id}&type=eq.new_job`,
      {
        headers: {
          "apikey": SUPABASE_KEY || "",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const existing = await existingNotification.json();
    
    if (existing.length === 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY || "",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: worker.id,
          type: 'new_job',
          title: 'New Job Posted!',
          message: `A new job is available: ${body.title}`,
          job_id: jobData.id,
          is_read: false,
        }),
      });
    }
  }

  return NextResponse.json({ success: true, data: createdJob[0] });
}