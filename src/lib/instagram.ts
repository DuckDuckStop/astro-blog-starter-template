export interface InstagramReel {
	id: string;
	caption: string;
	permalink: string;
	timestamp: string;
	embedUrl: string;
	thumbnailUrl?: string;
}

interface InstagramGraphMedia {
	id: string;
	caption?: string;
	media_type?: string;
	permalink?: string;
	timestamp?: string;
	product_type?: string;
	thumbnail_url?: string;
}

interface InstagramFeedResult {
	reels: InstagramReel[];
	error?: string;
}

interface InstagramFeedConfig {
	userId?: string;
	accessToken?: string;
	limit?: number;
}

export function toInstagramEmbedUrl(permalink: string): string {
	return permalink.endsWith('/') ? `${permalink}embed` : `${permalink}/embed`;
}

export async function getLatestInstagramReels({
	userId,
	accessToken,
	limit = 6,
}: InstagramFeedConfig): Promise<InstagramFeedResult> {
	if (!userId || !accessToken) {
		return {
			reels: [],
			error: 'Missing Instagram API configuration.',
		};
	}

	const fields = [
		'id',
		'caption',
		'media_type',
		'permalink',
		'timestamp',
		'product_type',
		'thumbnail_url',
	].join(',');

	const params = new URLSearchParams({
		fields,
		limit: String(limit),
		access_token: accessToken,
	});

	const endpoint = `https://graph.facebook.com/v23.0/${userId}/media?${params.toString()}`;

	try {
		const response = await fetch(endpoint, {
			headers: {
				Accept: 'application/json',
			},
		});

		if (!response.ok) {
			return {
				reels: [],
				error: `Instagram API request failed (${response.status}).`,
			};
		}

		const payload = (await response.json()) as { data?: InstagramGraphMedia[] };
		const reels = (payload.data ?? [])
			.filter((item) => item.media_type === 'VIDEO')
			.filter((item) => item.product_type === 'REELS' || item.permalink?.includes('/reel/'))
			.filter((item) => Boolean(item.permalink))
			.map((item) => {
				const permalink = item.permalink ?? '';
				return {
					id: item.id,
					caption: item.caption ?? 'Instagram reel',
					permalink,
					timestamp: item.timestamp ?? '',
					embedUrl: toInstagramEmbedUrl(permalink),
					thumbnailUrl: item.thumbnail_url,
				};
			});

		return { reels };
	} catch {
		return {
			reels: [],
			error: 'Unable to reach Instagram API.',
		};
	}
}
