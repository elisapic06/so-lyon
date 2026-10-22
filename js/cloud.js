/* ============================================================
   So Lyon — couche cloud (Supabase)
   Mode autonome :
   - Sans clés configurées → l'app marche 100% en local (localStorage/IndexedDB)
   - Avec tes clés Supabase dans SUPABASE_CONFIG ci-dessous → comptes réels,
     posts partagés, followers.
   Pour activer :
   1. Crée un projet sur https://supabase.com (gratuit)
   2. SQL Editor → colle le contenu de supabase/schema.sql → Run
   3. Settings > API → copie URL et anon key ci-dessous
   ============================================================ */

const SUPABASE_CONFIG = {
  url: "",        // ex: "https://xxxx.supabase.co"
  anonKey: "",    // ex: "eyJhbGciOi..."
};

const CLOUD = {
  enabled: false,
  supabase: null,
  user: null,
  profile: null,
};

async function initCloud() {
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) return; // mode local
  try {
    // Chargement du SDK supabase-js (CDN)
    await new Promise((res, rej) => {
      if (window.supabase) return res();
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    CLOUD.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    const { data: { user } } = await CLOUD.supabase.auth.getUser();
    if (user) await loadCloudProfile(user);
    CLOUD.enabled = true;
  } catch (e) {
    console.warn("Cloud désactivé:", e);
  }
}

async function loadCloudProfile(user) {
  CLOUD.user = user;
  const { data } = await CLOUD.supabase.from("profiles").select("*").eq("id", user.id).single();
  CLOUD.profile = data;
}

/* ---------- inscription / connexion / déconnexion ---------- */

async function signUp(email, password, handle, displayName, accountType, claimedPlaceId) {
  const { data, error } = await CLOUD.supabase.auth.signUp({
    email, password,
    options: {
      data: {
        handle,
        display_name: displayName,
        account_type: accountType || "particulier",
        claimed_place_id: claimedPlaceId || "",
      },
    },
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await CLOUD.supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await loadCloudProfile(data.user);
  return data;
}

async function signOutUser() {
  await CLOUD.supabase.auth.signOut();
  CLOUD.user = null;
  CLOUD.profile = null;
}

/* ---------- posts cloud ---------- */

async function uploadPostPhoto(postId, blob) {
  const ext = blob.type.split("/")[1] || "jpg";
  const path = `${CLOUD.user.id}/${postId}.${ext}`;
  const { error } = await CLOUD.supabase.storage
    .from("photos").upload(path, blob, { upsert: true });
  if (error) throw error;
  return CLOUD.supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}

async function publishPostCloud(place, text, photoBlob) {
  const postId = crypto.randomUUID();
  let photoUrl = null;
  if (photoBlob) photoUrl = await uploadPostPhoto(postId, photoBlob);
  const { error } = await CLOUD.supabase.from("posts").insert({
    id: postId,
    author: CLOUD.user.id,
    place_id: place ? place.id : null,
    place_name: place ? place.name : null,
    text,
    photo_url: photoUrl,
  });
  if (error) throw error;
  return postId;
}

async function fetchCloudPosts(limit = 50) {
  const { data, error } = await CLOUD.supabase
    .from("posts")
    .select(`
      id, text, place_id, place_name, photo_url, likes, created_at,
      author, profiles!posts_author_fkey (handle, display_name, avatar_emoji, account_type, claimed_place_id)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    user: p.profiles?.display_name || "?",
    emoji: p.profiles?.avatar_emoji || "🦁",
    handle: p.profiles?.handle,
    meta: timeAgo(p.created_at),
    text: p.text,
    place: p.place_name || "",
    photoURL: p.photo_url,
    likes: p.likes || 0,
    comments: 0,
    mine: CLOUD.user && p.author === CLOUD.user.id,
    authorId: p.author,
    authorType: p.profiles?.account_type || "particulier",
    authorPlace: p.profiles?.claimed_place_id || "",
    cloud: true,
  }));
}

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

/* ---------- likes ---------- */

async function toggleLikeCloud(postId, liked) {
  if (liked) {
    await CLOUD.supabase.from("post_likes").insert({ post_id: postId, user_id: CLOUD.user.id });
    await CLOUD.supabase.rpc("increment_like", { p: postId }); // voir schema (optionnel)
  } else {
    await CLOUD.supabase.from("post_likes").delete()
      .eq("post_id", postId).eq("user_id", CLOUD.user.id);
    await CLOUD.supabase.rpc("decrement_like", { p: postId });
  }
}

/* ---------- followers ---------- */

async function followUser(userId) {
  const { error } = await CLOUD.supabase.from("follows")
    .insert({ follower: CLOUD.user.id, followed: userId });
  if (error && error.code !== "23505") throw error;
}

async function unfollowUser(userId) {
  await CLOUD.supabase.from("follows").delete()
    .eq("follower", CLOUD.user.id).eq("followed", userId);
}

async function countFollowers(userId) {
  const { count } = await CLOUD.supabase.from("follows")
    .select("*", { count: "exact", head: true }).eq("followed", userId);
  return count || 0;
}

/* ---------- to-dos cloud ---------- */

async function addTodoCloud(txt, pub) {
  const { error } = await CLOUD.supabase.from("todos")
    .insert({ author: CLOUD.user.id, txt, pub });
  if (error) throw error;
}

async function fetchCloudTodos() {
  // les miennes (publiques + privées) + celles publiques des gens suivis (via la vue publique)
  const { data, error } = await CLOUD.supabase
    .from("todos")
    .select("id, txt, done, pub, author")
    .or(`author.eq.${CLOUD.user.id},and(pub.eq.true)`);
  if (error) throw error;
  return data;
}

/* ---------- commentaires ---------- */

async function fetchComments(postId) {
  const { data, error } = await CLOUD.supabase
    .from("comments")
    .select("id, txt, created_at, user_id, profiles!comments_user_id_fkey (handle, display_name, avatar_emoji)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data || []).map((c) => ({
    id: c.id,
    txt: c.txt,
    when: timeAgo(c.created_at),
    author: c.profiles?.display_name || "?",
    initial: (c.profiles?.display_name || "?")[0],
    authorId: c.user_id,
  }));
}

async function addComment(postId, txt) {
  const { error } = await CLOUD.supabase
    .from("comments").insert({ post_id: postId, user_id: CLOUD.user.id, txt });
  if (error) throw error;
}

async function countComments(postIds) {
  if (!postIds.length) return {};
  const { data } = await CLOUD.supabase
    .from("comments").select("post_id")
    .in("post_id", postIds);
  const out = {};
  (data || []).forEach((c) => { out[c.post_id] = (out[c.post_id] || 0) + 1; });
  return out;
}

/* ---------- abonnements ---------- */

async function fetchFollowingIds() {
  const { data } = await CLOUD.supabase
    .from("follows").select("followed").eq("follower", CLOUD.user.id);
  return (data || []).map((f) => f.followed);
}

/* ---------- photos des users pour une fiche lieu ---------- */

async function fetchPlacePosts(placeId, limit = 6) {
  const { data, error } = await CLOUD.supabase
    .from("posts")
    .select("id, photo_url, created_at, author, profiles!posts_author_fkey (handle, display_name)")
    .eq("place_id", placeId)
    .not("photo_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/* ---------- édition du profil ---------- */

async function updateProfile(fields) {
  const { error } = await CLOUD.supabase
    .from("profiles").update(fields).eq("id", CLOUD.user.id);
  if (error) throw error;
  Object.assign(CLOUD.profile, fields);
}

/* ---------- messagerie privée ---------- */

async function myConversations() {
  const { data, error } = await CLOUD.supabase.rpc("my_conversations");
  if (error) throw error;
  return data || [];
}

async function fetchMessages(otherId) {
  const { data, error } = await CLOUD.supabase
    .from("messages")
    .select("id, sender, txt, created_at, read, shared_post, posts!messages_shared_post_fkey (id, text, place_name, photo_url)")
    .or(`and(sender.eq.${CLOUD.user.id},receiver.eq.${otherId}),and(sender.eq.${otherId},receiver.eq.${CLOUD.user.id})`)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data || []).map((m) => ({
    id: m.id,
    mine: m.sender === CLOUD.user.id,
    txt: m.txt,
    when: timeAgo(m.created_at),
    sharedPost: m.shared_post ? {
      id: m.posts?.id,
      text: m.posts?.text,
      place: m.posts?.place_name,
      photo: m.posts?.photo_url,
    } : null,
  }));
}

async function sendMessage(otherId, txt, sharedPostId) {
  const payload = { sender: CLOUD.user.id, receiver: otherId, txt: txt || " " };
  if (sharedPostId) payload.shared_post = sharedPostId;
  const { error } = await CLOUD.supabase
    .from("messages").insert(payload);
  if (error) throw error;
}

async function markRead(otherId) {
  await CLOUD.supabase.from("messages")
    .update({ read: true })
    .eq("receiver", CLOUD.user.id).eq("sender", otherId).eq("read", false);
}

/* ---------- notes des lieux ---------- */

async function ratePlace(placeId, stars) {
  const { error } = await CLOUD.supabase
    .from("ratings").upsert({ place_id: placeId, user_id: CLOUD.user.id, stars });
  if (error) throw error;
}

async function getPlaceRating(placeId) {
  const { data, error } = await CLOUD.supabase.rpc("place_rating", { p: placeId });
  if (error) throw error;
  const r = (data && data[0]) || { avg: 0, count: 0 };
  return { avg: +r.avg, count: r.count };
}

async function getMyRating(placeId) {
  const { data } = await CLOUD.supabase.from("ratings")
    .select("stars").eq("place_id", placeId).eq("user_id", CLOUD.user.id).maybeSingle();
  return data ? data.stars : null;
}

/* ---------- temps réel ---------- */

let chatChannel = null;
function subscribeChat(otherId, cb) {
  if (chatChannel) CLOUD.supabase.removeChannel(chatChannel);
  chatChannel = CLOUD.supabase
    .channel("chat-" + otherId)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "messages",
        filter: "receiver=eq." + CLOUD.user.id },
      (payload) => { if (payload.new.sender === otherId) cb(); })
    .subscribe();
}

function unsubscribeChat() {
  if (chatChannel) { CLOUD.supabase.removeChannel(chatChannel); chatChannel = null; }
}

async function unreadMessagesCount() {
  const { count } = await CLOUD.supabase.from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver", CLOUD.user.id).eq("read", false);
  return count || 0;
}

/* ---------- modération ---------- */

async function reportContent(targetType, targetId, reason) {
  const { error } = await CLOUD.supabase
    .from("reports").insert({ reporter: CLOUD.user.id, target_type: targetType, target_id: targetId, reason });
  if (error) throw error;
}

async function deleteMyPost(postId) {
  const { error } = await CLOUD.supabase
    .from("posts").delete().eq("id", postId).eq("author", CLOUD.user.id);
  if (error) throw error;
}
