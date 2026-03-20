import { readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const photosDir = resolve(process.cwd(), 'public', 'media', 'photos');
const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const subjectDisplayOverrides: Record<
	string,
	{ label?: string; subheader?: string; section?: 'projects' | 'materials'; hidden?: boolean }
> = {
	'Decorative & Safety': {
		label: 'Decorative & Safety',
		subheader:
			'Lighting designed for decorative displays and visibility. Commonly used on bikes, vehicles, and other creative builds.',
		hidden: true
	},
	'Landscaping & Structural': {
		subheader:
			'With over 100 built-in programming options, this goes well beyond anything you will find in off-the-shelf kits. You are not limited to presets, you are working with a system designed for real customization. Build your own effects, refine them over time, or let us handle it. We offer ongoing programming based on your style and preferences. ATXPIXEL gives you control at every level.'
	},
	'Materials & Options': {
		label: 'Materials & Options',
		section: 'materials'
	},
	'Pucks': {
		label: 'Pucks',
		subheader:
			'Compact puck-style lighting focused on clean placement, comfortable spacing, and provides a refined architectural accent to your home.',
		section: 'materials'
	},
	'Pixels': {
		label: 'Pixels',
		subheader:
			'Pixel-based lighting choices built for animation, pattern control, and more expressive color movement across a layout.',
		section: 'materials'
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
	section: 'projects' | 'materials';
	hidden: boolean;
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

const photoCaptionOverrides: Record<string, string> = {
	'Pucks/Moderate Density Puck install shown.jpg': 'Standard Puck install shown',
	'Pucks/Puck_Rails_Example_Pack.jpg': 'Puck Rail Color Choices',
	'Pixels/High density Pixel install shown.jpg': 'High Density Pixel example shown',
	'Pixels/Pixel Track Options.jpg': 'Pixel Rail Color Choices'
};

const photoSlugOverrides: Record<string, string> = {
	'Pucks/Puck_Rails_Example_Pack.jpg': 'puck-rail-color-options',
	'Pixels/Pixel Track Options.jpg': 'pixel-track-options'
};

// Portfolio photo detail blocks are maintained here using the key format
// "Folder Name/File Name". See docs/photo-content-guide.md for the
// recurring update workflow and examples.
const photoDescriptionOverrides: Record<string, string> = {
	'Decorative & Safety/Sound Reactive LED Curtains.gif':
		'Real-time sound reactive lighting with clean, flowing patterns. Tailored to the space and installed like curtains of light, creating an atmosphere that feels somewhere between architecture and starlight.',
	'Decorative & Safety/Sound Reactive Safety LEDs for Bicycles.gif':
		'Custom-designed safety LED kits for anything with wheels. Built to run on battery banks or integrate with existing power systems. Flexible enough to adapt to nearly any platform and make every build unique. Sound reaction to make your ride a moving lightshow, synchronized with music for extra flare.',
	'Decorative & Safety/Sound Reactive Safety lights for Bicycles.gif':
		'Custom-designed safety LED kits for anything with wheels. Built to run on battery banks or integrate with existing power systems. Flexible enough to adapt to nearly any platform and make every build unique. Sound reaction to make your ride a moving lightshow, synchronized with music for extra flare.',
	'Landscaping & Structural/Christmas Theme.png':
		"Everyone's got their own take on Christmas lights. This setup leans on red, blue, green, and white, but you're not locked into that. Mix in gold, yellow, whatever fits your style. With full control over the colors, you can change things up whenever you want, daily, hourly, different looks, different moods, all season long.",
	'Landscaping & Structural/Valentine Theme.jpg':
		'A Valentine-themed scene built with classic purple and pink hues. This static display creates a warm, festive atmosphere while keeping the lighting simple and refined. Sometimes less is more when it comes from the heart.',
	'Landscaping & Structural/Valentines Heartbeat Effect.gif':
		'A rhythmic heartbeat animation pulses through red and pink tones across the yard, creating a synchronized wave of gentle motion and warmth. Colors can be customized to suit any occasion, anytime.',
	'Pucks/Moderate Density Puck install shown.jpg':
		'Standard puck design set within a modular aluminum track system. The configuration that drove early adoption and is straightforward, dependable, and still hard to beat.',
	'Pucks/Puck_Rails_Example_Pack.jpg':
		'Puck Tracks shown are standard configuration with 4" spacing.',
	'Pixels/High density Pixel install shown.jpg':
		'Higher density means brighter options and more vivid animations. Definitely decide if you want to boost curb appeal during the holidays!',
	'Pixels/Pixel Track Options.jpg':
		'Pixel Tracks shown are standard configuration. Higher and lower density options are available with a 30-day lead time per registered order.'
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
				const key = `${dirName}/${fileName}`;
				const caption = photoCaptionOverrides[key] ?? toCaption(fileName);
				const slugBase = photoSlugOverrides[key] ?? slugify(caption);
				return {
					fileName,
					slug: toUniqueSlug(slugBase, photoSlugSet),
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
				section: display?.section ?? 'projects',
				hidden: display?.hidden ?? false,
				photos
			};
		})
	);

	return subjects.filter((subject) => !subject.hidden);
};

export const getPortfolioPhotoUrl = (subjectDirName: string, photoFileName: string) =>
	`/media/photos/${subjectDirName}/${photoFileName}`;

export const isMaterialSelectionSubject = (subject: PortfolioPhotoSubject) => subject.section === 'materials';
