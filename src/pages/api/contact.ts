import type { APIRoute } from "astro";

export const prerender = false;

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const json = (body: Record<string, unknown>, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});

export const POST: APIRoute = async (context) => {
	const formData = await context.request.formData();
	const name = String(formData.get("name") ?? "").trim();
	const email = String(formData.get("email") ?? "").trim();
	const message = String(formData.get("message") ?? "").trim();
	const website = String(formData.get("website") ?? "").trim();
	const token = String(formData.get("cf-turnstile-response") ?? "").trim();

	if (website) {
		return json({ ok: true, message: "Message received." });
	}

	if (!name || !email || !message) {
		return json({ ok: false, message: "Please complete all required fields." }, 400);
	}

	if (!token) {
		return json({ ok: false, message: "Turnstile validation is required." }, 400);
	}

	const runtimeEnv = (context.locals as any)?.runtime?.env ?? {};
	const secretKey =
		runtimeEnv.TURNSTILE_SECRET_KEY ??
		import.meta.env.TURNSTILE_SECRET_KEY ??
		process.env.TURNSTILE_SECRET_KEY;

	if (!secretKey) {
		return json(
			{
				ok: false,
				message: "Turnstile is not configured on the server. Add TURNSTILE_SECRET_KEY."
			},
			500
		);
	}

	const remoteip = context.request.headers.get("CF-Connecting-IP") ?? "";
	const verifyBody = new URLSearchParams({
		secret: secretKey,
		response: token,
		remoteip
	});

	const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
		method: "POST",
		body: verifyBody
	});

	if (!verifyResponse.ok) {
		return json({ ok: false, message: "Turnstile verification failed. Please retry." }, 502);
	}

	const verifyResult = (await verifyResponse.json()) as {
		success?: boolean;
		"error-codes"?: string[];
	};

	if (!verifyResult.success) {
		return json(
			{
				ok: false,
				message: "Turnstile check failed. Please try again.",
				errors: verifyResult["error-codes"] ?? []
			},
			400
		);
	}

	console.log("Contact message received", {
		name,
		email,
		messageLength: message.length,
		verified: true
	});

	return json({
		ok: true,
		message: "Message received (Turnstile verified). Email forwarding is the next step."
	});
};
