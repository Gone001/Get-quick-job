import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ============ LIST APPLICATIONS ============
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const job_id = searchParams.get("job_id");
  const worker_id = searchParams.get("worker_id");
  
  const params = new URLSearchParams();
  if (job_id) params.set("job_id", `eq.${job_id}`);
  if (worker_id) params.set("worker_id", `eq.${worker_id}`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?${params}`, {
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}

// ============ CREATE APPLICATION ============
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { job_id, worker_id } = body;
  
  // Validation
  if (!job_id || !worker_id) {
    return NextResponse.json({ 
      success: false, 
      message: "job_id and worker_id required" 
    }, { status: 400 });
  }

  // Check if worker profile is complete
  const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${worker_id}&select=profile_completed_min,name`, {
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  const users = await userRes.json();
  
  if (!users.length) {
    return NextResponse.json({ 
      success: false, 
      message: "Worker profile not found" 
    }, { status: 404 });
  }
  
  if (!users[0].profile_completed_min) {
    return NextResponse.json({ 
      success: false, 
      message: "Complete your profile first" 
    }, { status: 400 });
  }

  // Check if already applied
  const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/applications?job_id=eq.${job_id}&worker_id=eq.${worker_id}`, {
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  const existing = await existingRes.json();
  if (existing.length) {
    return NextResponse.json({ 
      success: false, 
      message: "Already applied for this job" 
    }, { status: 400 });
  }

  // Check if job is still open
  const jobRes = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${job_id}&select=status`, {
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  const jobs = await jobRes.json();
  if (!jobs.length || jobs[0].status !== 'open') {
    return NextResponse.json({ 
      success: false, 
      message: "This job is no longer accepting applications" 
    }, { status: 400 });
  }

  // Create application
  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      job_id,
      worker_id,
      status: "applied",
      message: body.message,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ 
      success: false, 
      message: "Failed to apply" 
    }, { status: 500 });
  }

  const data = await res.json();
  const application = data[0];
  
  // Get job details to find recruiter
  const jobDetailsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?id=eq.${job_id}&select=id,title,employer_id`,
    {
      headers: {
        "apikey": SUPABASE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const jobDetails = await jobDetailsRes.json();
  
  if (jobDetails.length > 0) {
    const job = jobDetails[0];
    
    // Notify recruiter about new application
    await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: job.employer_id,
        type: 'new_application',
        title: 'New Applicant!',
        message: `${users[0].name || 'Someone'} applied for your job: ${job.title}`,
        job_id: job.id,
        is_read: false,
      }),
    });
  }
  
  return NextResponse.json({ success: true, data: application });
}