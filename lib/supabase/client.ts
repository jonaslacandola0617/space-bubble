import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let spaceSessionPromise: Promise<SpaceSession> | null = null;

export type BubbleRow = {
  id: string;
  space_id: string;
  author_id: string;
  body: string;
  status: string;
  need: string;
  pos_x: number | string;
  pos_y: number | string;
  size: string;
  tone: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  popped_at: string | null;
};

export type CheckinRow = {
  id: string;
  space_id: string;
  user_id: string;
  energy: number;
  readiness: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type SpaceSession = {
  userId: string;
  spaceId: string;
  displayName: string;
  inviteCode: string | null;
};

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  browserClient ??= createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

function requireClient() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.");
  }
  return supabase;
}

async function createSpaceSession(): Promise<SpaceSession> {
  const supabase = requireClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const user = sessionData.session?.user ?? null;
  if (!user || user.is_anonymous) {
    throw new Error("Sign in with your Space Bubble username and password first.");
  }

  const metadataUsername = user.user_metadata?.username;
  const username = typeof metadataUsername === "string" && metadataUsername
    ? metadataUsername
    : user.email?.split("@")[0] ?? "You";

  const { data: membership, error: membershipError } = await supabase
    .from("space_members")
    .select("space_id, display_name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;

  let spaceId = membership?.space_id as string | undefined;
  let displayName = (membership?.display_name as string | undefined) ?? username;

  if (!spaceId) {
    const { data, error } = await supabase.rpc("create_shared_space", {
      space_name: "Our Space",
      member_name: username,
    });
    if (error) throw error;
    if (!data) throw new Error("Could not create your shared space.");
    spaceId = data as string;
    displayName = username;
  }

  const { data: space, error: spaceError } = await supabase
    .from("shared_spaces")
    .select("invite_code")
    .eq("id", spaceId)
    .single();

  if (spaceError) throw spaceError;

  return {
    userId: user.id,
    spaceId,
    displayName,
    inviteCode: (space?.invite_code as string | null | undefined) ?? null,
  };
}

export function ensureSpaceSession(): Promise<SpaceSession> {
  if (!spaceSessionPromise) {
    spaceSessionPromise = createSpaceSession().catch((error) => {
      spaceSessionPromise = null;
      throw error;
    });
  }

  return spaceSessionPromise;
}

export async function loadSpaceState(spaceId: string) {
  const supabase = requireClient();
  const [bubbleResult, checkinResult] = await Promise.all([
    supabase
      .from("bubbles")
      .select("*")
      .eq("space_id", spaceId)
      .is("popped_at", null)
      .order("created_at", { ascending: true }),
    supabase.from("checkins").select("*").eq("space_id", spaceId).order("updated_at", { ascending: false }),
  ]);

  if (bubbleResult.error) throw bubbleResult.error;
  if (checkinResult.error) throw checkinResult.error;

  return {
    bubbles: (bubbleResult.data ?? []) as BubbleRow[],
    checkins: (checkinResult.data ?? []) as CheckinRow[],
  };
}

export async function insertBubble(input: {
  spaceId: string;
  userId: string;
  body: string;
  need: string;
  posX: number;
  posY: number;
  size: string;
  tone: string;
}) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("bubbles")
    .insert({
      space_id: input.spaceId,
      author_id: input.userId,
      body: input.body,
      status: "shared",
      need: input.need,
      pos_x: input.posX,
      pos_y: input.posY,
      size: input.size,
      tone: input.tone,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as BubbleRow;
}

export async function updateBubbleStatus(spaceId: string, bubbleId: string, status: string) {
  const supabase = requireClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("bubbles")
    .update({
      status,
      updated_at: now,
      resolved_at: status === "settled" ? now : null,
    })
    .eq("space_id", spaceId)
    .eq("id", bubbleId)
    .select("*")
    .single();

  if (error) throw error;
  return data as BubbleRow;
}

export async function popBubble(spaceId: string, bubbleId: string) {
  const supabase = requireClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("bubbles")
    .update({ popped_at: now, resolved_at: now, updated_at: now })
    .eq("space_id", spaceId)
    .eq("id", bubbleId);

  if (error) throw error;
}

export async function upsertCheckin(input: {
  spaceId: string;
  userId: string;
  energy: number;
  readiness: string;
}) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("checkins")
    .upsert(
      {
        space_id: input.spaceId,
        user_id: input.userId,
        energy: input.energy,
        readiness: input.readiness,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "space_id,user_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as CheckinRow;
}

export function subscribeToSpace(spaceId: string, onChange: () => void) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`space-updates-${spaceId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "bubbles", filter: "space_id=eq." + spaceId }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "checkins", filter: "space_id=eq." + spaceId }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
