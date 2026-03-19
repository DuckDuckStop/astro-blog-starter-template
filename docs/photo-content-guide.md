# Photo Content Guide

Use this guide when updating the detail text shown for portfolio photos.

## Where picture detail blocks live

Custom photo descriptions are stored in `src/lib/portfolioPhotos.ts` inside the `photoDescriptionOverrides` object.

Each key uses this format:

```txt
Folder Name/File Name
```

Example:

```txt
Landscaping & Structural/Valentines Heartbeat Effect.gif
```

The value for that key is the detail paragraph shown for that photo.

## How to update a photo description

1. Find the photo inside `public/media/photos`.
2. Copy its exact folder name and file name.
3. Open `src/lib/portfolioPhotos.ts`.
4. Find or add the matching entry inside `photoDescriptionOverrides`.
5. Replace the description string with the new copy.

## How to update section-level text

If you need to update the heading, label, or subheader for a whole subject area, use `subjectDisplayOverrides` in the same file.

Examples:

- `Decorative & Safety`
- `Landscaping & Structural`
- `Materials & Options`

## What happens if a photo is missing custom text

If a photo does not have an entry in `photoDescriptionOverrides`, the site uses the fallback text defined in `getPhotoDescription()`:

```txt
Feature highlight for {caption}. Replace this placeholder with your custom description for this photo.
```

That means new photos can appear automatically, but they should usually get a custom description before publishing.

## Fast repeat workflow

For future requests like "update the picture detail block":

1. Search for the photo name in `src/lib/portfolioPhotos.ts`.
2. Edit the matching `photoDescriptionOverrides` entry.
3. Verify the old wording is gone and the new wording appears once.
