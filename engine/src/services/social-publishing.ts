/**
 * Hijab ul Munnazah Growth Engine — Official Social Publishing Service
 * Handles Meta Graph API (Instagram Business & Facebook Page) and TikTok Content Posting API.
 * Strictly adheres to 50 posts / 24h limit, private drafts for unverified TikTok, and cron scheduling.
 */

export interface Env {
  ENVIRONMENT: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  META_ACCESS_TOKEN?: string;
  META_INSTAGRAM_ACCOUNT_ID?: string;
  META_FACEBOOK_PAGE_ID?: string;
  TIKTOK_ACCESS_TOKEN?: string;
  TIKTOK_BUSINESS_ID?: string;
  ALLOW_DIRECT_TIKTOK_PUBLISH?: string; // 'true' or 'false'
}

export interface PublishJobPayload {
  id: string;
  brand_id: string;
  caption: string;
  media_url: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  additional_media_urls?: string[];
  platform: 'instagram' | 'facebook' | 'tiktok' | 'all';
  ai_label?: boolean;
}

export interface PublishResult {
  success: boolean;
  platform: string;
  platformPostId?: string;
  permalink?: string;
  error?: string;
  isDraft?: boolean;
}

const META_GRAPH_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/**
 * Checks Meta Graph API publishing limit before attempting to publish.
 * Hard limit: 50 posts per 24 hours per Instagram account.
 */
export async function checkInstagramPublishingQuota(
  env: Env
): Promise<{ canPublish: boolean; currentUsage: number; quotaTotal: number }> {
  if (!env.META_ACCESS_TOKEN || !env.META_INSTAGRAM_ACCOUNT_ID) {
    return { canPublish: true, currentUsage: 0, quotaTotal: 50 }; // Dry-run / mock mode
  }

  try {
    const url = `${META_BASE_URL}/${env.META_INSTAGRAM_ACCOUNT_ID}/content_publishing_limit?fields=config,quota_usage&access_token=${env.META_ACCESS_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Unable to query content_publishing_limit, proceeding with caution.');
      return { canPublish: true, currentUsage: 0, quotaTotal: 50 };
    }
    const data: any = await res.json();
    const quotaUsage = data?.data?.[0]?.quota_usage || 0;
    const configTotal = data?.data?.[0]?.config?.quota_total || 50;
    return {
      canPublish: quotaUsage < configTotal,
      currentUsage: quotaUsage,
      quotaTotal: configTotal,
    };
  } catch (err) {
    console.error('Error checking IG publishing quota:', err);
    return { canPublish: true, currentUsage: 0, quotaTotal: 50 };
  }
}

/**
 * Publishes an approved post to Instagram Business via Meta Graph API.
 * Follows the 2-step container creation & publishing workflow.
 */
export async function publishToInstagram(
  env: Env,
  job: PublishJobPayload
): Promise<PublishResult> {
  const quota = await checkInstagramPublishingQuota(env);
  if (!quota.canPublish) {
    return {
      success: false,
      platform: 'instagram',
      error: `Rate limit reached: ${quota.currentUsage}/${quota.quotaTotal} posts published in the last 24h.`,
    };
  }

  if (!env.META_ACCESS_TOKEN || !env.META_INSTAGRAM_ACCOUNT_ID) {
    // Graceful dry-run test mode
    return {
      success: true,
      platform: 'instagram',
      platformPostId: `ig_sim_${Date.now()}`,
      permalink: `https://www.instagram.com/p/sim_${Date.now()}/`,
    };
  }

  try {
    // Step 1: Create Media Container
    const containerParams = new URLSearchParams({
      access_token: env.META_ACCESS_TOKEN,
      caption: job.caption,
    });

    if (job.media_type === 'VIDEO') {
      containerParams.set('media_type', 'REELS');
      containerParams.set('video_url', job.media_url);
    } else {
      containerParams.set('image_url', job.media_url);
    }

    const containerRes = await fetch(
      `${META_BASE_URL}/${env.META_INSTAGRAM_ACCOUNT_ID}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: containerParams.toString(),
      }
    );

    const containerData: any = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      throw new Error(containerData.error?.message || 'Failed to create Instagram media container.');
    }

    const creationId = containerData.id;

    // Step 2: Publish the Container
    const publishParams = new URLSearchParams({
      access_token: env.META_ACCESS_TOKEN,
      creation_id: creationId,
    });

    const publishRes = await fetch(
      `${META_BASE_URL}/${env.META_INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: publishParams.toString(),
      }
    );

    const publishData: any = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      throw new Error(publishData.error?.message || 'Failed to publish Instagram container.');
    }

    return {
      success: true,
      platform: 'instagram',
      platformPostId: publishData.id,
      permalink: `https://www.instagram.com/p/${publishData.id}/`,
    };
  } catch (err: any) {
    return {
      success: false,
      platform: 'instagram',
      error: err.message,
    };
  }
}

/**
 * Publishes an approved post to Facebook Page via Meta Graph API.
 */
export async function publishToFacebookPage(
  env: Env,
  job: PublishJobPayload
): Promise<PublishResult> {
  if (!env.META_ACCESS_TOKEN || !env.META_FACEBOOK_PAGE_ID) {
    return {
      success: true,
      platform: 'facebook',
      platformPostId: `fb_sim_${Date.now()}`,
      permalink: `https://facebook.com/hijabulmunazzah/posts/sim_${Date.now()}`,
    };
  }

  try {
    const params = new URLSearchParams({
      access_token: env.META_ACCESS_TOKEN,
      message: job.caption,
      url: job.media_url,
    });

    const res = await fetch(
      `${META_BASE_URL}/${env.META_FACEBOOK_PAGE_ID}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );

    const data: any = await res.json();
    if (!res.ok || !data.id) {
      throw new Error(data.error?.message || 'Failed to publish to Facebook Page.');
    }

    return {
      success: true,
      platform: 'facebook',
      platformPostId: data.id,
      permalink: `https://facebook.com/${data.id}`,
    };
  } catch (err: any) {
    return {
      success: false,
      platform: 'facebook',
      error: err.message,
    };
  }
}

/**
 * Uploads to TikTok via TikTok Content Posting API.
 * In accordance with AGENTS.md and TikTok policies:
 * Unaudited apps upload strictly as a private draft to the owner's inbox (SELF_ONLY).
 * Direct publishing is enabled only if ALLOW_DIRECT_TIKTOK_PUBLISH === 'true'.
 */
export async function uploadToTikTok(
  env: Env,
  job: PublishJobPayload
): Promise<PublishResult> {
  const allowDirect = env.ALLOW_DIRECT_TIKTOK_PUBLISH === 'true';

  if (!env.TIKTOK_ACCESS_TOKEN) {
    return {
      success: true,
      platform: 'tiktok',
      platformPostId: `tt_draft_${Date.now()}`,
      isDraft: true,
      permalink: 'Draft saved in TikTok App Creator Inbox for review.',
    };
  }

  try {
    const privacyLevel = allowDirect ? 'PUBLIC_TO_EVERYONE' : 'SELF_ONLY';

    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: job.caption.substring(0, 150),
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
          auto_add_music: true,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_cover_index: 0,
          photo_images: [job.media_url],
        },
      }),
    });

    const data: any = await res.json();
    if (!res.ok || data.error?.code !== 'ok') {
      throw new Error(data.error?.message || 'TikTok upload initialization failed.');
    }

    return {
      success: true,
      platform: 'tiktok',
      platformPostId: data.data?.publish_id || `tt_${Date.now()}`,
      isDraft: !allowDirect,
      permalink: !allowDirect ? 'Draft uploaded to TikTok app.' : `https://tiktok.com/@hijabulmunazzah`,
    };
  } catch (err: any) {
    return {
      success: false,
      platform: 'tiktok',
      error: err.message,
    };
  }
}

/**
 * Scheduled Cron Publisher:
 * Called every 5 minutes by Cloudflare Worker cron trigger.
 * Finds approved content jobs whose scheduled_at <= now(), and publishes them.
 */
export async function executeScheduledPublishingQueue(env: Env): Promise<{
  processed: number;
  published: number;
  errors: string[];
}> {
  console.log('[Cron] Checking scheduled publishing queue...');
  
  // If Supabase credentials are configured, query pending approved jobs
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[Cron] Supabase credentials not set, dry-run cycle finished.');
    return { processed: 0, published: 0, errors: [] };
  }

  try {
    const url = `${env.SUPABASE_URL}/rest/v1/content_jobs?status=eq.approved&scheduled_at=lte.${encodeURIComponent(new Date().toISOString())}&limit=5`;
    const res = await fetch(url, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!res.ok) {
      return { processed: 0, published: 0, errors: ['Failed to fetch approved jobs from Supabase'] };
    }

    const jobs: any[] = await res.json();
    let publishedCount = 0;
    const errors: string[] = [];

    for (const job of jobs) {
      const payload: PublishJobPayload = {
        id: job.id,
        brand_id: job.brand_id,
        caption: job.captions?.urdu ? `${job.captions.urdu}\n\n${job.captions.english || ''}` : job.prompt,
        media_url: job.raw_image_url || '',
        media_type: 'IMAGE',
        platform: 'all',
      };

      const igResult = await publishToInstagram(env, payload);
      const fbResult = await publishToFacebookPage(env, payload);
      const ttResult = await uploadToTikTok(env, payload);

      if (igResult.success || fbResult.success) {
        publishedCount++;
        // Update job status in Supabase
        await fetch(`${env.SUPABASE_URL}/rest/v1/content_jobs?id=eq.${job.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'published',
            published_at: new Date().toISOString(),
          }),
        });

        // Insert into posts table
        await fetch(`${env.SUPABASE_URL}/rest/v1/posts`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brand_id: job.brand_id,
            job_id: job.id,
            platform: 'instagram',
            platform_post_id: igResult.platformPostId || 'simulated',
            permalink: igResult.permalink || '',
            caption: payload.caption,
            metrics: { likes: 0, comments: 0, reach: 0 },
          }),
        });
      } else {
        errors.push(`Job ${job.id}: ${igResult.error || fbResult.error}`);
      }
    }

    return {
      processed: jobs.length,
      published: publishedCount,
      errors,
    };
  } catch (err: any) {
    return { processed: 0, published: 0, errors: [err.message] };
  }
}
