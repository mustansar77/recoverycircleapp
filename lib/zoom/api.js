const ZOOM_API = "https://api.zoom.us/v2";

async function getAccessToken() {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom API credentials not configured (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)");
  }

  const creds = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  const res   = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    { method: "POST", headers: { Authorization: `Basic ${creds}` } }
  );
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.reason ?? data.message ?? "Failed to get Zoom access token");
  }
  return data.access_token;
}

/**
 * Create a Zoom meeting and return { id, password }
 * @param {{ topic: string, duration: number, startTime: string }} options
 */
export async function createZoomMeeting({ topic, duration, startTime }) {
  const token = await getAccessToken();

  const res = await fetch(`${ZOOM_API}/users/me/meetings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      type: 2, // Scheduled meeting
      start_time: new Date(startTime).toISOString(),
      duration: duration ?? 60,
      settings: {
        host_video:        true,
        participant_video: true,
        join_before_host:  true,
        mute_upon_entry:   false,
        approval_type:     2,   // No registration required
        audio:             "both",
        auto_recording:    "none",
      },
    }),
  });

  const data = await res.json();
  if (data.code) throw new Error(data.message ?? "Failed to create Zoom meeting");
  return { id: data.id, password: data.password ?? "" };
}

/**
 * Delete a Zoom meeting (called when app meeting is deleted)
 */
export async function deleteZoomMeeting(meetingId) {
  if (!meetingId) return;
  try {
    const token = await getAccessToken();
    await fetch(`${ZOOM_API}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Non-fatal — Zoom meeting may already be gone
  }
}
