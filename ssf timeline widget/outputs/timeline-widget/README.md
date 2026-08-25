# SSF Timeline Widget

A mobile-friendly horizontal timeline for embedding on Squarespace. Timeline entries are read from the published Google Sheet when the widget loads. Vercel caches successful sheet responses for five minutes, so routine sheet edits normally appear within about five minutes.

## Data source

Keep these header names in the published sheet:

- `Year` — required
- `Content` — required
- `Image` — optional; use a publicly accessible `https://` image URL

Rows are displayed by ascending year. Rows with the same year stay in their sheet order.

## Deploy with GitHub and Vercel

1. Create a new GitHub repository and add the contents of this folder at its root.
2. In Vercel, choose **Add New → Project**, import the GitHub repository, and accept the detected settings.
3. Deploy, then copy the assigned `https://…vercel.app` URL.

No environment variables or build command are required.

## Squarespace embed

Add a Squarespace **Code** block and paste this, replacing `YOUR-PROJECT.vercel.app` with the deployed domain:

```html
<iframe
  src="https://YOUR-PROJECT.vercel.app/"
  title="Slifer Smith &amp; Frampton company timeline"
  loading="lazy"
  style="display:block;width:100%;height:430px;border:0;overflow:hidden"
></iframe>
```

The iframe fully isolates the widget's CSS and JavaScript from Squarespace styles.

## Local development

With Node.js 20 or newer installed:

```sh
npx vercel dev
```

Open the local URL shown by Vercel. Run the data-parser tests with `npm test`.

## Behavior

- The timeline waits three seconds after first becoming at least 35% visible, then moves slowly toward newer entries.
- It stops at the final entry and does not loop.
- Arrow buttons move one event at a time.
- Touch dragging, trackpads, mouse wheels, and keyboard arrow keys are supported.
- Manual interaction pauses automatic movement for three seconds.
- Automatic motion is disabled when the visitor has requested reduced motion in their device settings.
