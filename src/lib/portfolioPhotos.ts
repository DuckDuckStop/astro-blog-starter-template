import { readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const photosDir = resolve(process.cwd(), 'public', 'media', 'photos');
const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const subjectDisplayOverrides: Record<string, { label?: string; subheader?: string }> = {
	'Decorative & Safety': { label: 'Decorative & Safety' },
	'Landscaping & Structural': {
		subheader:
			'Personalize your space with colors and lighting effects that can change with the seasons or celebrate the holidays. Expand the effects anytime to match special events or show your team spirit on game days. Or keep things simple with clean white lighting and subtle effects that improve visibility without being over the top. The choice is yours when you invest in ATXPIXEL solutions.'
	}
};

export type PortfolioPhoto = {
	fileName: string;
	slug: string;
	caption: string;
	description: string;
};

export type PortfolioPhotoSubject = {
	dirName: string;
	slug: string;
	label: string;
	subheader?: string;
	photos: PortfolioPhoto[];
};

const toTitleCase = (value: string) =>
	value.replace(/\b\w/g, (char) => char.toUpperCase());

const toLabel = (value: string) => toTitleCase(value.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim());

const toCaption = (filename: string) =>
	filename
		.replace(/\.[^/.]+$/, '')
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const photoDescriptionOverrides: Record<string, string> = {
	'Decorative & Safety/Sound Reactive LED Curtains.gif':
		'Real-time sound reactive lighting with clean, flowing patterns. Tailored to the space and installed like curtains of light, creating an atmosphere that feels somewhere between architecture and starlight.',
	'Decorative & Safety/Sound Reactive Safety LEDs for Bicycles.gif':
		'Custom-designed safety LED systems for anything with wheels. Built to run from safe battery packs or integrate with existing power setups. Every installation is adaptable and designed to make each project uniquely yours.',
	'Decorative & Safety/Sound Reactive Safety lights for Bicycles.gif':
		'Custom-designed safety LED systems for anything with wheels. Built to run from safe battery packs or integrate with existing power setups. Every installation is adaptable and designed to make each project uniquely yours.',
	'Landscaping & Structural/Christmas.png':
		'Everyone has their own idea of the perfect Christmas colors. This display features red, blue, green, and white, with every color fully customizable within each lighting effect, including yellow, orange, and gold hues. More Christmas animations are on the way, so check back soon for additional seasonal samples.',
	'Landscaping & Structural/Valentine Theme Static.jpg':
		'A Valentine-themed scene built with classic purple and pink hues. This static display creates a warm, festive atmosphere while keeping the lighting simple and refined. Sometimes less is more when it comes from the heart.',
	'Landscaping & Structural/Valentines Heartbeat Effect.gif':
		'A rhythmic heartbeat animation pulses through red and pink tones across the display, creating a synchronized wave of gentle motion and warmth. Colors can be customized to suit the occasion, with more animated examples including game day themes coming soon.'
};

const getPhotoDescription = (dirName: string, fileName: string, caption: string) => {
	const key = `${dirName}/${fileName}`;
	return (
		photoDescriptionOverrides[key] ??
		`Feature highlight for ${caption}. Replace this placeholder with your custom description for this photo.`
	);
};

const slugify = (value: string) => {
	const normalized = value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return normalized || 'item';
};

const toUniqueSlug = (base: string, used: Set<string>) => {
	let slug = base;
	let index = 2;
	while (used.has(slug)) {
		slug = `${base}-${index}`;
		index += 1;
	}
	used.add(slug);
	return slug;
};

export const readPortfolioPhotoSubjects = async (): Promise<PortfolioPhotoSubject[]> => {
	const subjectSlugSet = new Set<string>();
	const directories = (await readdir(photosDir, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

	const subjects = await Promise.all(
		directories.map(async (dirName) => {
			const photoSlugSet = new Set<string>();
			const fileNames = (await readdir(resolve(photosDir, dirName), { withFileTypes: true }))
				.filter((entry) => entry.isFile())
				.map((entry) => entry.name)
				.filter((name) => allowedExt.has(extname(name).toLowerCase()))
				.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

			const photos = fileNames.map((fileName) => {
				const caption = toCaption(fileName);
				return {
					fileName,
					slug: toUniqueSlug(slugify(caption), photoSlugSet),
					caption,
					description: getPhotoDescription(dirName, fileName, caption)
				};
			});

			const display = subjectDisplayOverrides[dirName];
			return {
				dirName,
				slug: toUniqueSlug(slugify(dirName), subjectSlugSet),
				label: display?.label ?? toLabel(dirName),
				subheader: display?.subheader,
				photos
			};
		})
	);

	return subjects.filter((subject) => subject.photos.length > 0);
};

export const getPortfolioPhotoUrl = (subjectDirName: string, photoFileName: string) =>
	`/media/photos/${subjectDirName}/${photoFileName}`;
