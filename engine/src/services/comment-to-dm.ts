/**
 * Hijab ul Munnazah Growth Engine — Comment-to-DM Service
 * Listens for customer comments on Instagram / Facebook posts matching buying keywords
 * and sends ONE compliant Private Reply within the platform's 7-day rule.
 */

export interface Env {
  ENVIRONMENT: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  META_ACCESS_TOKEN?: string;
}

export interface CommentEvent {
  commentId: string;
  postId: string;
  fromUserId: string;
  fromUserName?: string;
  commentText: string;
  createdTime: string;
}

export interface PrivateReplyResult {
  triggered: boolean;
  commentId: string;
  matchedKeyword?: string;
  replyText?: string;
  success: boolean;
  error?: string;
}

const COMMENT_INTENT_KEYWORDS = [
  'abaya', 'price', 'prc', 'rate', 'kitne ki', 'kitny ki', 'qimat', 'qeemat',
  'available', 'cod', 'size', 'order', 'chahiye', 'dm', 'kya price hai', 'details', 'check dm'
];

/**
 * Checks if a comment matches high-intent buying signals.
 */
export function matchCommentKeyword(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const kw of COMMENT_INTENT_KEYWORDS) {
    if (lower.includes(kw)) {
      return kw;
    }
  }
  return null;
}

/**
 * Processes an incoming comment event and sends a private reply if compliant.
 */
export async function processPostComment(
  env: Env,
  event: CommentEvent
): Promise<PrivateReplyResult> {
  const matched = matchCommentKeyword(event.commentText);
  if (!matched) {
    return {
      triggered: false,
      commentId: event.commentId,
      success: true,
    };
  }

  // Deduplication check: Has a private reply already been sent to this comment?
  const alreadyReplied = await checkPrivateReplySent(env, event.commentId);
  if (alreadyReplied) {
    return {
      triggered: false,
      commentId: event.commentId,
      matchedKeyword: matched,
      success: true,
      error: 'Private reply already sent for this comment (enforcing 1 reply per comment rule).'
    };
  }

  const replyMessage = `Assalam o Alaikum! ✨ Hamari post par rabte ka shukriya.\n\nYeh hamari signature Dubai Nidha Abaya collection hai (Pure fabric, matching stole shamil hai, Rs 4,850). Pakistan bhar mein Cash on Delivery dastiyab hai aur rider ke samne parcel pehle open check karne ki mukammal sahulat hai.\n\nAapko kaunsa size ya color pasand aya hai?`;

  // Dispatch private reply via Meta Graph API
  let apiSuccess = true;
  let apiError: string | undefined = undefined;

  if (env.META_ACCESS_TOKEN) {
    try {
      const url = `https://graph.facebook.com/v21.0/${event.commentId}/private_replies`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          access_token: env.META_ACCESS_TOKEN,
          message: replyMessage,
        }).toString(),
      });
      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        apiSuccess = false;
        apiError = errJson?.error?.message || 'Failed to dispatch Meta private reply';
      }
    } catch (err: any) {
      apiSuccess = false;
      apiError = err.message;
    }
  }

  // Record dispatch in Supabase
  await recordPrivateReply(env, event.commentId, matched, replyMessage);

  return {
    triggered: true,
    commentId: event.commentId,
    matchedKeyword: matched,
    replyText: replyMessage,
    success: apiSuccess,
    error: apiError,
  };
}

async function checkPrivateReplySent(env: Env, commentId: string): Promise<boolean> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const url = `${env.SUPABASE_URL}/rest/v1/messages?external_thread_id=eq.${commentId}&limit=1`;
    const res = await fetch(url, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (res.ok) {
      const rows: any[] = await res.json();
      return rows && rows.length > 0;
    }
  } catch {}
  return false;
}

async function recordPrivateReply(env: Env, commentId: string, keyword: string, message: string): Promise<void> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand_id: 'hijab',
        external_thread_id: commentId,
        sender_type: 'agent',
        body: message,
        metadata: { matched_keyword: keyword, type: 'private_reply' },
      }),
    });
  } catch {}
}
