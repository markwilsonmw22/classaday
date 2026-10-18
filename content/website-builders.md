---json
{
  "slug": "website-builders",
  "code": "WEB 120",
  "title": "Website Builders",
  "titleHtml": "Website Builders, <em>redesign with templates</em>",
  "aura": "web",
  "level": "Beginner",
  "lede": "A 7-day guide to the SchoolAura template pack. You'll make a template yours, publish it for free on your own domain, and learn to sell website redesigns to local businesses.",
  "metaDescription": "A 7-day guide to editing, publishing and selling websites with the SchoolAura template pack. Plain English, no prior coding needed.",
  "outcome": "Take a professional template, make it fully yours and put it live on your own domain.",
  "extraOverview": "<div class=\"block\" style=\"display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;background:var(--c-web-bg);border-radius:10px;padding:16px 18px;margin-bottom:26px\"><div><h2 style=\"margin:0;font-size:1.1rem\">Start with the template pack</h2><p class=\"muted\" style=\"margin-top:4px\">Six complete websites in one ZIP. You'll use them from Day 1.</p></div><div style=\"display:flex;gap:8px;flex-wrap:wrap\"><a class=\"btn light sm\" href=\"/templates/\">Browse templates</a><a class=\"btn sm\" href=\"/downloads/templates/schoolaura-template-pack.zip\" download>Download all</a></div></div>",
  "learn": [
    "Open, preview and edit a website template on any computer",
    "Change text, images, links and sections without breaking the layout",
    "Rebrand a whole site from one block of colour and font settings",
    "Make layouts work on phones, tablets and desktops",
    "Make contact forms send you real emails",
    "Add the SEO basics that help people find the site",
    "Publish for free and connect a custom domain with HTTPS",
    "Find, price and deliver website redesigns for local businesses"
  ],
  "forWho": [
    "Small business owners who want a professional site without paying an agency",
    "Freelancers who want to offer website redesigns",
    "Complete beginners. No coding experience needed"
  ],
  "need": [
    "A laptop or desktop computer (Windows, Mac or Linux)",
    "The free code editor VS Code",
    "A domain name if you want your own address (about $15 a year)",
    "The template pack (free download on this site)"
  ]
}
---
# M1 | Make it yours | Set up, edit content, rebrand and adjust the layout of a template.

## D1 | Set up and choose your template | 3 | Set up
@goal Download the pack, install a free editor, preview a template on your computer, and understand how its files fit together.
@lesson
Every template in the SchoolAura pack is a **complete website in one folder**. There's nothing to install and no monthly fee. If you can edit a document, you can edit these.

{{fig:web-anatomy|Each template is a folder with one page, its fonts and its images. The page is built from sections you can edit, move or delete.}}

### What's in the pack

| Template | Best for |
|---|---|
| Ember | Restaurants, cafés, bars, bakeries |
| Northline | Software, apps, online services, startups |
| Atelier | Designers, photographers, studios, creatives |
| Haven | Real estate agents, property managers |
| Pulse | Gyms, fitness studios, coaches |
| Keystone | Contractors, renovators, trades, cleaners |

You can use any template for a different industry. Keystone works well for any service business that wants quote requests; Atelier works for consultants.

### Install VS Code

1. Download **Visual Studio Code** (free) from code.visualstudio.com and install it.
2. Open it, go to **Extensions** (the squares icon on the left) and install **Live Server** (by Ritwick Dey). It shows your site in the browser and refreshes every time you save.

### Open a template

1. Unzip the pack somewhere easy, like `Documents/Websites`.
2. **Copy** the template folder you want and rename the copy (e.g. `my-cafe`). Keep the original untouched as a backup.
3. In VS Code: **File → Open Folder** and choose your copy.
4. Click `index.html`, then **Go Live** in the bottom-right corner. Your browser opens the site.

### How the page is organised

Inside `index.html` there are three parts:

1. **`<head>`**: the page title, description and the `<style>` block with all the design.
2. **`<body>`**: the content, divided into sections like `<header>`, `<section class="hero">`, `<section class="menu">`, `<footer>`.
3. **`<script>`** at the bottom: small bits of behaviour, like the year in the footer.

At the very top of the styles is a block marked **`EDIT ME: brand`**. That's where colours and fonts live. You'll use it on Day 3.

### HTML in two minutes

HTML is text wrapped in **tags** that say what the text is:

```html
<h1>This is the main heading</h1>
<p>This is a paragraph.</p>
<a href="https://example.com">This is a link</a>
<img src="images/hero.jpg" alt="Description of the photo">
```

Most tags have an opening `<p>` and a closing `</p>`. Edit the words between them freely. Be careful not to delete the `<` `>` parts.
@demo
**Choosing for a client: a local barbershop.**

There's no barbershop template, so compare: Ember (dark, warm, a menu with prices, hours) and Keystone (quote form, services). A barbershop needs a **price list, hours, location and booking**, which matches Ember's structure almost exactly. "Menu" becomes "Services", dishes become cuts with prices, and the reservation section becomes "Book a chair". Choosing by **structure**, not by industry, saves hours.
@tasks
- Download and unzip the template pack (10 min)
- Install VS Code and the Live Server extension (20 min)
- Open every template with Live Server and click through each one on desktop and on a narrow window (40 min)
- Choose one template for a real project (yours or a business you know) and write down why its structure fits (20 min)
- Copy and rename that template folder, open it in VS Code and find the head, body, sections and EDIT ME block (30 min)
- Change one heading, save and watch it update in the browser (10 min)
@deliverable
VS Code set up, all six templates previewed, and your chosen template open and ready to edit.
@tip
Turn on **File → Auto Save** in VS Code. Live Server will refresh as you type, which makes learning much faster.

## D2 | Edit text, images and links | 3 | Edit content
@goal Replace all sample content with real content: words, photos, links, phone numbers and page details.
@lesson
Today the template stops being a sample and starts being a real website. Work **top to bottom, one section at a time**, and save often.

### 1. Page title and description

In the `<head>`, edit:

```html
<title>Your Business · What you do, where</title>
<meta name="description" content="One or two sentences that would make someone click in Google.">
```

The title shows in browser tabs and Google results. Keep it under about 60 characters.

### 2. Text

Use **Ctrl+F** (Cmd+F on Mac) to find the sample business name and work through each match. Write as you'd speak to a customer: short sentences, what you do, where, and why choose you.

### 3. Images

- Each template's `images/` folder lists what's used (also in `README.txt`).
- The easiest method: **name your photo the same** as the placeholder (e.g. `hero.jpg`) and replace the file.
- Or change the path: `<img src="images/my-photo.jpg" alt="...">`.

**Prepare photos properly:**

| Use | Size (pixels, longest side) | Target file size |
|---|---|---|
| Hero / full width | 1600–2000 | under 300 KB |
| Cards, gallery | 1000–1200 | under 200 KB |
| Small thumbnails | 600 | under 80 KB |

Compress with a free tool like **Squoosh** (squoosh.app). Save as JPG or WebP. Big images are the number one reason small sites are slow.

**Alt text:** every `<img>` has `alt="..."`. Describe the photo in a few words ("Fresh sourdough loaves on the counter"). It helps blind visitors and search engines.

### 4. Links

```html
<a href="tel:+15195550123">Call (519) 555-0123</a>      <!-- phone -->
<a href="mailto:hello@yourbusiness.com">Email us</a>     <!-- email -->
<a href="https://maps.google.com/?q=Your+Address" target="_blank" rel="noopener">Directions</a>
<a href="#menu">Jump to the menu section</a>               <!-- same page -->
```

Phone links use the international format with no spaces: `+1` then the number. Replace all the sample `555` numbers.

### 5. Reviews

Templates include **sample reviews**. Replace them with real reviews from your Google or Facebook page (with the customer's first name, if they're happy for you to use it), or delete the section. Never publish invented reviews.

### 6. Check as you go

After each section: save, look at the browser, then shrink the window to phone width and check again.
@demo
**Editing Ember for "Saffron Room", a family Indian restaurant.**

- Title: *Saffron Room · Kerala home cooking in London, Ontario*
- Hero eyebrow: *Family kitchen · Since 2021*
- Heading: *Cooked like home. Shared like family.*
- Menu: four starters and four mains with real prices, the `V` and `VG` tags kept for vegetarian and vegan dishes.
- Photos: the owner's phone photos, compressed with Squoosh from 4.2 MB to 240 KB each and named `hero.jpg`, `dish-1.jpg` and so on.
- Reviews: three real Google reviews copied word for word with first names.
- Phone: `tel:+15195550101` replaced with the real number.
@tasks
- Update the page title and description (15 min)
- Rewrite all text section by section with real content (50 min)
- Prepare, compress and replace all images, with alt text (45 min)
- Update every link: phone, email, map, social and section links (20 min)
- Replace or remove sample reviews (10 min)
- Check the whole page on desktop and phone width and fix anything broken (15 min)
@deliverable
A template with all real content: text, compressed photos, working links and honest reviews.
@tip
If the layout suddenly breaks, you probably deleted a closing tag. Press Ctrl+Z (undo) until it's fixed, then try your edit again more carefully.

## D3 | Rebrand: colours, fonts and spacing | 3 | Rebrand
@goal Change the whole look of a template from one place, choose a colour palette and fonts that fit the brand, and check readability.
@lesson
Every template is built with **CSS variables**: named settings that the whole design uses. Change a variable once and every button, heading and background that uses it updates.

### The EDIT ME block

At the top of the `<style>` you'll see something like:

```css
:root {
  --bg: #17110d;        /* page background */
  --ink: #f3e7d6;       /* main text */
  --muted: #bda78f;     /* secondary text */
  --accent: #e2643a;    /* buttons, highlights */
  --font-display: "Gloock", Georgia, serif;
  --font-body: "Figtree", Arial, sans-serif;
  --radius: 4px;
}
```

Colours are written as **hex codes** like `#e2643a`. You can get hex codes from a brand guide, a logo file or a colour picker.

### Choosing a palette

Keep it simple:

- **Background** and **text** with strong contrast (dark on light, or light on dark).
- **Muted text** a little softer than main text, for captions and secondary lines.
- **One accent** for buttons and highlights. Use it sparingly so it stands out.

Check contrast with a free contrast checker: normal text should reach a ratio of **at least 4.5:1** against its background (the WCAG AA standard).

### Changing fonts

Templates include their fonts in the `fonts/` folder, so they work without an internet connection or any third-party service. To use a different font:

**Option A, simplest:** use Google Fonts.

1. Pick a font at fonts.google.com, click **Get font → Get embed code**.
2. Paste the `<link>` lines into the `<head>`.
3. Change the variable: `--font-display: "Your Font", Georgia, serif;`

**Option B, self-host:** download the font's `.woff2` file, put it in `fonts/`, and copy the `@font-face` pattern at the top of the styles.

Good pairings use **one characterful font for headings** and **one very readable font for body text**. Two fonts are plenty.

### Corners and spacing

- `--radius` controls how round corners are. `0` looks sharp and architectural; `16px` looks friendly.
- To make sections roomier or tighter, search for `padding:` in section styles (like `.hero { padding: 72px 0 96px; }`) and adjust the numbers.

### Logo

Replace the text logo with an image if the business has one:

```html
<a href="#" class="logo"><img src="images/logo.svg" alt="Saffron Room" height="36"></a>
```

Use SVG or a PNG with a transparent background.

### Try it yourself

The template's default colours are filled in. Paste your client's brand colours to check them.

{{tool:contrast}}

@demo
**Rebranding Ember for Saffron Room in 15 minutes:**

```css
:root {
  --bg: #1b1410;
  --ink: #f6ead8;
  --muted: #c9b08f;
  --accent: #e5a32b;     /* saffron */
  --accent-ink: #1b1410;
  --font-display: "Gloock", Georgia, serif;
  --radius: 999px;       /* pill-shaped buttons */
}
```

Changing `--accent` from ember red to saffron gold changed 23 elements at once: buttons, menu prices, the "Visit" section background and highlighted words. The contrast checker shows 9.8:1 for body text. The owner says it "finally looks like us".
@tasks
- Collect the brand's colours (or create a palette) and write the hex codes down (25 min)
- Update every colour variable and check the whole page (30 min)
- Check text contrast for body text, muted text and button text (20 min)
- Choose and apply a heading and body font pair (35 min)
- Adjust corner radius and section spacing to suit the brand (20 min)
- Replace the text logo with an image logo if there is one (20 min)
@deliverable
A fully rebranded site with the right colours, fonts and logo, and readable contrast everywhere.
@tip
Take a screenshot before you start rebranding. Comparing before and after side by side helps you see whether a change is really an improvement.

## D4 | Change the layout and make it work on every screen | 3 | Layout & mobile
@goal Add, remove and rearrange sections, understand the two layout tools CSS uses, and make sure everything works on phones.
@lesson
Templates are built from independent **sections**. You can delete, duplicate and reorder them like blocks.

### Delete, duplicate, move

1. Find the section in the HTML: it starts with `<section ...>` and ends with `</section>`. VS Code highlights matching tags when you click one.
2. **Delete:** select from `<section` to its `</section>` and delete. Also remove its link in the menu.
3. **Duplicate:** copy the whole section and paste it below, then change its content. Give it a new `id` if the menu links to it.
4. **Move:** cut and paste the whole section elsewhere in the `<body>`.

Tip: **right-click → Format Document** in VS Code tidies the indentation so sections are easier to see.

### The two layout tools

Almost every layout uses one of these:

**Flexbox: a row or column of items**

```css
.row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
```

**Grid: rows and columns**

```css
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
```

`repeat(3, 1fr)` means three equal columns. Change 3 to 2 or 4 to change the layout.

### Making it work on phones

Templates already include **media queries**: rules that apply only on smaller screens:

```css
@media (max-width: 900px) {
  .cards { grid-template-columns: 1fr; }   /* one column on phones */
}
```

When you add something new, check it at phone width. If it's too wide, add a rule inside the existing media query to stack it.

### Testing

- In Chrome, press **F12** then the **phone icon** to preview phone sizes.
- Check on your real phone too: Live Server shows a network address you can open on your phone when both are on the same Wi-Fi.
- Look for: text too small, buttons too close together, things wider than the screen, images cut off badly.

### Using AI to edit layouts

AI assistants are excellent at small HTML and CSS changes. Paste the section and ask precisely:

> Here's a section from my website. Change the cards from 3 columns to 2 on desktop, keep 1 column on phones, and add a small price label under each title using the same style as the existing labels. Give me the full updated section and any CSS to add.

Paste the result, save and check. If something breaks, undo and ask again with the error described.
@demo
**Turning Keystone into a cleaning company site.**

- Deleted the "Before & after" section (no before/after for cleaning) and its menu link.
- Duplicated the services grid and turned the copy into "Packages": Standard clean, Deep clean, Move-out clean, each with a price.
- Kept three columns for the new packages, and changed the six-service grid to `repeat(2, 1fr)` so the two grids don't look repetitive.
- Moved the reviews above the service areas so trust comes earlier.
- Tested on an iPhone and an old Android: the packages stack to one column, the sticky "Call" button works.
@tasks
- Decide which sections your site needs and which it doesn't. Delete the unnecessary ones and update the menu (30 min)
- Duplicate one section and turn it into something new for your business (40 min)
- Change one grid's columns and check the result on desktop and phone (20 min)
- Use an AI assistant to make one layout change for you, following the prompt pattern above (35 min)
- Test on your real phone and fix every issue you find (30 min)
@deliverable
A site with exactly the sections you need, a new section of your own, and a layout that works on phones.
@tip
Make one change at a time and check it. Five changes at once means five possible causes when something goes wrong.

# M2 | Publish & sell | Forms, SEO, going live on your own domain, and turning this into paid work.

## D5 | Forms, SEO and speed | 3 | Forms & SEO
@goal Make forms send real emails, add the SEO basics that help people find you, and make the site load fast.
@lesson
A site that looks great but doesn't send enquiries, can't be found on Google, or loads slowly isn't finished. Today you fix all three.

### Making forms work

Templates include demo forms that only show a thank-you message. To receive submissions by email, use a form service. Two easy options:

**Formspree (works with any host)**

1. Create a free account at formspree.io and create a form. You get an endpoint like `https://formspree.io/f/abcdwxyz`.
2. Change the form tag and give every field a `name`:

```html
<form action="https://formspree.io/f/abcdwxyz" method="POST">
  <input name="name" required placeholder="Your name">
  <input name="email" type="email" required placeholder="Email">
  <textarea name="message" placeholder="Message"></textarea>
  <button type="submit">Send</button>
</form>
```

3. Remove the `onsubmit="..."` demo code from the form.
4. Submit once to confirm your email.

**Netlify Forms (if you publish on Netlify)**

Add `name="contact"` and `data-netlify="true"` to the `<form>` tag and `name` attributes to every field. Submissions appear in your Netlify dashboard and can be emailed to you.

### SEO basics

1. **Title and description** (Day 2), unique and specific.
2. **One `<h1>`** per page with the main topic.
3. **Real text** with words people search for: what you do + where ("renovation contractor in London, Ontario").
4. **Alt text** on images.
5. **Social sharing image:** add to the `<head>`:

```html
<meta property="og:title" content="Saffron Room · Kerala home cooking in London">
<meta property="og:description" content="Family recipes, cooked fresh daily.">
<meta property="og:image" content="https://saffronroom.ca/images/share.jpg">
```

Make `share.jpg` 1200×630 pixels.

6. **Favicon:** the small icon in the browser tab: `<link rel="icon" href="images/favicon.png">`.
7. **Google Business Profile:** for local businesses, this matters as much as the website. Link the two.

After you publish (Day 6), add the site to **Google Search Console** so Google finds it faster.

### Speed

Run Chrome's **Lighthouse** (F12 → Lighthouse → Analyze). Aim for 90+ on Performance and Accessibility. Common fixes:

- Compress images (Day 2)
- Add `loading="lazy"` to images below the first screen
- Remove sections or scripts you don't use
@demo
**Saffron Room's results:**

- Catering enquiry form connected to Formspree; the owner gets an email within seconds of each submission.
- Title: *Saffron Room · Kerala home cooking in London, Ontario*; one `<h1>`; alt text on all 9 images; a share image of the dining room.
- Lighthouse before: Performance 71 (one 3.8 MB photo). After compressing and adding `loading="lazy"`: Performance 97, Accessibility 100.
@tasks
- Connect your main form to Formspree (or Netlify Forms) and test it (40 min)
- Check and improve title, description, headings and alt text (30 min)
- Create a share image and favicon and add the tags (35 min)
- Run Lighthouse and fix the top three issues (45 min)
@deliverable
Working forms, SEO basics in place and a Lighthouse score above 90.
@tip
Send yourself a test form submission from your phone, not just your laptop. It catches problems with mobile keyboards and autofill.

## D6 | Publish and connect your domain | 3 | Publish
@goal Put your site online for free, connect a custom domain with HTTPS, and set up a simple way to update it.
@lesson
Your site is a folder of files, which makes hosting simple and usually free. Here are two good routes.

### Route A: Netlify Drop (fastest, no account setup beyond sign-in)

1. Go to **app.netlify.com/drop**.
2. Drag your whole site folder onto the page.
3. In seconds you get a live address like `random-name.netlify.app`.
4. Sign in to keep the site, then rename it in **Site configuration**.
5. To update: open the site's **Deploys** page and drag the updated folder again.

### Route B: GitHub + Vercel (best for ongoing updates)

1. Create a free GitHub account and a new repository.
2. Upload your site files (drag and drop works on github.com: **Add file → Upload files**).
3. At vercel.com, sign in with GitHub, **Add New → Project**, import the repository and click **Deploy**. No settings needed for a plain HTML site.
4. Every time you change a file on GitHub, Vercel updates the live site automatically.

### Connect a custom domain

{{fig:web-dns|Your domain points to your host using DNS records. Your host tells you exactly which values to use.}}

1. **Buy a domain** from a registrar (Cloudflare, Namecheap, GoDaddy, or directly in Netlify/Vercel). `.com` or your country's domain, like `.ca`.
2. In your host (Netlify or Vercel), open **Domains** and **add your domain**.
3. The host shows you DNS records to add, usually:
   - an **A record** for `@` (the root, `yourbusiness.com`) pointing to an IP address, and
   - a **CNAME** for `www` pointing to a host address.
4. In your registrar's DNS settings, add exactly those records. Remove old conflicting A or CNAME records for the same names.
5. Wait. DNS usually updates within minutes, sometimes up to 48 hours.
6. The host issues a free **HTTPS certificate** automatically once the domain points to it.

Alternatively, many hosts let you switch your domain's **nameservers** to them, which handles all records for you.

### After launch

- Visit the site on your phone using the real domain.
- Test every link, the form and the phone button.
- Add the site to Google Search Console and your Google Business Profile.
- Keep a copy of the final folder somewhere safe.
@demo
**Saffron Room goes live on Vercel.**

1. Created a GitHub repo `saffron-room-site` and uploaded the folder.
2. Imported it into Vercel and deployed: live at `saffron-room-site.vercel.app` in 40 seconds.
3. Added `saffronroom.ca` in Vercel's Domains. Vercel showed an A record for `@` and a CNAME for `www`.
4. Added both in the registrar's DNS panel and deleted the registrar's default "parking" A record.
5. Twenty minutes later the domain worked with HTTPS. The owner now edits the menu prices directly on GitHub and the site updates on its own.
@tasks
- Publish your site with Netlify Drop or GitHub + Vercel (40 min)
- Buy a domain or use one you own (20 min)
- Connect the domain with the DNS records your host gives you (40 min)
- Confirm HTTPS works on both the root and www addresses (15 min)
- Run the after-launch checklist on your phone (25 min)
@deliverable
Your site live on your own domain with HTTPS, and a simple way to publish updates.
@tip
Before changing DNS for an existing business, screenshot every current record. Email (MX records) often lives there too, and you don't want to break the owner's email.

## D7 | Sell website redesigns to local businesses | 3 | Sell redesigns
@goal Turn your new skill into paid work: find businesses that need a better site, make a strong offer, price it and deliver it smoothly.
@lesson
Many local businesses have websites that are slow, outdated or hard to use on phones. With this pack and what you've learned, you can redesign one in a few days.

### Find businesses that need help

Search Google Maps for a category in your area ("bakery London Ontario") and check their websites on your phone. Signs a business needs a redesign:

- Doesn't work well on a phone
- No clear phone number or booking button
- Outdated information (old hours, old menu)
- Slow (Lighthouse Performance under 50)
- No website at all, only a social page

Keep a simple spreadsheet: business, website, problems spotted, contact, status.

### Show, don't tell

The strongest pitch is a **free mock-up of their homepage**. Using a template, their logo, their real menu or services and photos from their public pages, build just the top section and one key section in about two hours. Send a screenshot or a private preview link.

Your message:

> Hi Anita, I'm a web designer here in London. I love Saffron Room's food, and I noticed your website is hard to use on a phone: the menu is a PDF and the phone number isn't clickable. I made a quick preview of what a new homepage could look like (attached). If you'd like, I can build the full site in about a week. Happy to chat?

### Pricing

Price by **value and scope**, not hours:

| Package | Includes | Typical range for small local businesses |
|---|---|---|
| Starter | One-page site from a template, their content, domain connection | $500–$1,000 |
| Standard | Up to 5 sections or pages, forms, SEO basics, Google Business link | $1,000–$2,500 |
| Care plan | Monthly updates, hosting checks, small changes | $50–$150 / month |

Prices vary by city and experience; adjust to your market. Always quote a **fixed price with a clear list of what's included**.

### A simple agreement

Even for small jobs, write down: what you'll deliver, the price, the deposit (commonly 50% upfront), the number of revision rounds, what the client must provide (text, photos, logins), the timeline, and who owns the domain and accounts (the client should).

### Delivering smoothly

1. **Kickoff:** collect content and logins with a checklist.
2. **First version** within the agreed time.
3. **Revisions:** gather all feedback in one message per round.
4. **Launch:** connect the domain together, then test.
5. **Handoff:** a short video or document showing how to edit prices or hours, and all account access in the client's name.
6. **Ask for a review and referrals** when they're happy.
@demo
**A first month of redesigns:**

- Week 1: 40 businesses checked on Google Maps, 12 with clear problems.
- Week 2: 6 homepage mock-ups made with Ember, Keystone and Haven; 6 messages sent.
- Week 3: 3 replies, 2 calls, 1 yes: a bakery, Standard package at $1,200 with a $75/month care plan.
- Week 4: the bakery site live; the owner refers a friend who runs a café.

Template pack licence check: client projects are allowed, so each site is delivered as the client's own website, not resold as a template.
@tasks
- Find 20 local businesses in one category and note their website problems in a spreadsheet (45 min)
- Build one homepage mock-up for the best prospect using a template (50 min)
- Write your outreach message and your three packages with prices (30 min)
- Write a one-page agreement template you can reuse (25 min)
@deliverable
A prospect list, one mock-up ready to send, your packages and prices, and a reusable agreement.
@tip
Specialise in one kind of business at first. After three bakery websites, you'll know exactly what bakeries need and you'll work twice as fast.
