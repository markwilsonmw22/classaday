---json
{
  "slug": "ai-mastery",
  "code": "AI 210",
  "title": "AI Mastery",
  "titleHtml": "AI Mastery, <em>from first prompt to your own apps</em>",
  "aura": "ai",
  "level": "Beginner to intermediate",
  "lede": "Twenty-one days with Claude, ChatGPT, Higgsfield, ElevenLabs and the rest of the toolkit. You'll learn to prompt well, make AI images, voice and video, build and deploy a full-stack app, and connect tools with MCP.",
  "metaDescription": "A 21-day AI course in plain English: prompting, Claude, ChatGPT, AI images, ElevenLabs voice, Higgsfield and AI video, full-stack apps with AI, MCP and automation.",
  "outcome": "Use AI like a skilled professional: for writing, research, media and building real software.",
  "learn": [
    "Explain how AI models work, and where they go wrong, in plain words",
    "Write prompts with the six-part structure and improve them in rounds",
    "Use Claude and ChatGPT properly: projects, files, research and memory",
    "Create on-brand images with a repeatable prompt formula",
    "Produce natural voiceovers with ElevenLabs, with the right permissions",
    "Make a 30-second AI video from script to final edit",
    "Understand how web apps work: frontend, backend, database and hosting",
    "Build and deploy a full-stack app with Claude Code, Supabase and Vercel",
    "Build your own MCP server and connect it to Claude",
    "Automate repetitive work and turn AI skills into paid services"
  ],
  "forWho": [
    "Complete beginners who feel left behind by AI and want a calm, ordered path",
    "Business owners and freelancers who want AI to save real hours every week",
    "Creators who want to make images, voice and video with AI",
    "Anyone who wants to build apps without a computer science degree"
  ],
  "need": [
    "A laptop (Windows, Mac or Linux). A phone is enough for Days 1–11",
    "Free accounts on Claude and ChatGPT. Paid plans are optional; the course says when they help",
    "Around **$0–$60** for optional paid credits on image, voice or video tools",
    "Free GitHub, Supabase and Vercel accounts for Module 5"
  ]
}
---
# M1 | Foundations | What AI is, what it isn't, the tools available, and how to use them safely.

## D1 | What AI actually is, in plain English | 3 | How AI works
@goal Understand how AI chat tools produce answers, what they're good at, and why they sometimes get things wrong.
@lesson
When people say "AI" today, they usually mean **large language models** (LLMs): the technology behind Claude, ChatGPT and Gemini. You don't need maths to use them well, but you do need a correct picture of what's happening. That picture will save you from most mistakes.

### Prediction, not lookup

An LLM is trained on a huge amount of text. From that, it learns patterns: how words, ideas and facts tend to follow each other. When you send a message, it doesn't search a database for the answer. It **predicts the next small piece of text**, then the next, then the next, until the answer is complete.

Those small pieces are called **tokens**. A token is roughly three quarters of a word. "Dropshipping" might be two or three tokens. Prices for AI tools and the limits on how much they can read are measured in tokens.

{{fig:ai-llm|Everything the model "knows" in the moment is inside the context window. Each new token is predicted from everything before it.}}

### The context window

The **context window** is everything the model can see at once: its instructions, any files you uploaded, the conversation so far and your new message. Modern models have very large windows, enough to read whole books. But:

- What's outside the window doesn't exist for the model.
- In very long chats, early details can get less attention. Starting a fresh chat for a new task often gives better results.

### Training cutoff

The model learned from data up to a certain date: its **training cutoff**. It doesn't automatically know what happened after. Tools with **web search** can look things up, which is why you should turn search on for anything current: prices, news, who holds a job, the latest version of software.

### Why AI makes things up

Because it predicts likely text, a model can produce something that **sounds right but isn't**: a fake statistic, a book that doesn't exist, a wrong date. This is called a **hallucination**. It happens more when:

- You ask about very specific facts it hasn't seen often
- You ask for sources without search turned on
- The question assumes something false ("Why did Canada ban X?" when it didn't)

The fix isn't to avoid AI. It's to **check facts that matter**, ask for sources with search on, and give the model the documents it should use.

### What AI is great at

| Great at | Be careful with |
|---|---|
| Drafting and rewriting text | Exact facts, numbers and quotes without sources |
| Summarising long documents you provide | Legal, medical and financial decisions |
| Explaining ideas at any level | Very recent events without search |
| Brainstorming and outlining | Maths with many steps (ask it to show work or use code) |
| Writing and fixing code | Anything where a mistake is expensive and unchecked |
| Turning messy notes into structure | Private data you shouldn't share |

### The right mindset

Treat AI like a **very fast, very well-read assistant on their first day**. Brilliant, eager and quick, but it doesn't know your business, your taste or your standards until you tell it. Most of this course is about how to tell it.
@demo
**Seeing a hallucination and fixing it.**

Ask a chat assistant with web search **off**: *"List three studies about the effect of morning sunlight on sleep, with authors and years."* It may give plausible-looking studies. Some might be real; some might have the wrong year or author.

Now turn web search **on** and ask: *"Find three published studies about morning light exposure and sleep. Give a link for each and one sentence on what it found. If you can't find a link, say so."*

The second answer gives you links you can open and check. That's the habit this course builds: **give the model a way to be right, and a permission to say "I don't know".**
@tasks
- Create free accounts on Claude (claude.ai) and ChatGPT (chatgpt.com) (20 min)
- Ask both the same question about your job or hobby and compare the answers side by side (25 min)
- Run the hallucination test from the worked example, with search off and then on (25 min)
- Ask each assistant to explain "tokens" and "context window" to a 12-year-old, then to an engineer. Notice how they adjust (20 min)
- Start a document called **AI notebook** and write five tasks in your life or work you'd like AI to help with (30 min)
@deliverable
Accounts on two assistants, a hallucination test you've seen with your own eyes, and a list of five tasks you want AI to help with.
@tip
When an answer matters, ask: "How confident are you in this, and what should I double-check?" Good models will point out the weak spots themselves.

## D2 | The AI tool landscape, and how to choose | 3 | The tool landscape
@goal Get a clear map of the main kinds of AI tools and know which one to reach for, for each kind of job.
@lesson
There are thousands of AI tools, but they fall into a few categories. Once you know the categories, new tools stop being confusing: you just ask "which box does this go in, and is it better than what I use?"

{{fig:ai-landscape|The main categories. Most people need one chat assistant, one creative tool per medium and, if they build, a coding tool.}}

### Chat assistants

**Claude** (Anthropic), **ChatGPT** (OpenAI), **Gemini** (Google) and **Microsoft Copilot**. All can write, summarise, analyse files, answer questions and help with code. They differ in style, strengths and extra features. Many people use two: one main, one for second opinions.

### Research tools

**Perplexity** and the research modes inside Claude, ChatGPT and Gemini search the web, read many pages and give answers with sources. Use them when you need current information and citations.

### Image generation

**Midjourney**, the image tools inside ChatGPT and Gemini, **Ideogram** (good with text inside images) and **Adobe Firefly** (trained on licensed content, popular with businesses). Day 10 covers how to prompt them.

### Video generation

**Higgsfield** (a studio that brings together many video models with camera controls and presets), **Runway**, **Kling**, **Google Veo**, **OpenAI's Sora** and others. Days 12–14.

### Voice and audio

**ElevenLabs** for voiceovers, cloning your own voice, dubbing, sound effects and music. **Suno** for songs. Day 11.

### Avatars

**HeyGen** and **Synthesia** create presenter videos from a script, using stock or custom avatars. Day 14.

### Building software

**Claude Code** and **Cursor** for coding with AI in real projects; **Lovable**, **Bolt**, **v0** and **Replit** for building apps from a description in the browser. Days 15–19.

### Automation

**Zapier**, **Make** and **n8n** connect apps and add AI steps. **MCP** connects AI assistants directly to your tools. Days 19–20.

### How to choose

1. **Start with the job, not the tool.** "I need product photos" → image category.
2. **Try the free tier** of two options with the same task.
3. **Check the licence** for commercial use. Many free plans don't allow it.
4. **Check privacy settings**: can you opt out of your data being used for training? Business plans usually have stronger guarantees.
5. **Pay for one thing at a time**, only when the free version is holding you back.

### Free vs paid

Free plans are great for learning but have usage limits and sometimes older models. A paid plan on **one** main chat assistant is usually the best-value AI spend for most people. Creative tools mostly use **credits**: you pay for what you generate.

### Things change fast

Model names, prices and features change every few months. The skills in this course (clear prompting, checking work, combining tools) don't. When a tool updates, search for its latest release notes rather than relying on old tutorials.
@demo
**Matching jobs to tools.** A café owner's list from her AI notebook:

| Job | Category | First tool to try |
|---|---|---|
| Write the weekly Instagram captions | Chat assistant | Claude or ChatGPT |
| Find this year's food safety rule changes | Research | Perplexity or a research mode, with sources |
| Photos for the new seasonal menu | Image | Real photos first; AI for backgrounds and mock-ups |
| A 20-second reel for the new drink | Video | Higgsfield or Kling |
| Voiceover for the reel | Voice | ElevenLabs |
| Auto-reply to catering enquiries | Automation | Zapier or n8n with an AI step |

She decides to pay for one chat assistant and buy small credit packs for video and voice only when she needs them.
@tasks
- Copy the category list into your AI notebook and add one tool you've heard of to each (20 min)
- Map your five tasks from Day 1 to a category and a first tool to try (25 min)
- Give the same writing task to Claude, ChatGPT and Gemini (or Copilot). Score each answer out of 10 and note why (45 min)
- Look up the privacy and training settings in your main assistant and choose what you're comfortable with (20 min)
- Check the commercial-use terms for one image and one voice tool you plan to use (25 min)
@deliverable
A personal map of AI tools for your own jobs, and a chosen main assistant.
@tip
Don't collect tools. Get very good at one assistant first. Most of the "magic" people show online is good prompting in an ordinary tool.

## D3 | Using AI safely, privately and honestly | 2.5 | Safety & ethics
@goal Know what not to share, how to check AI work, and how to use AI-generated media honestly and legally.
@lesson
AI is powerful, which means mistakes with it can be powerful too. A few habits keep you, your clients and your reputation safe.

### 1. Protect private information

Before pasting anything into an AI tool, ask: would I be comfortable if this appeared somewhere I didn't expect?

**Don't paste:**

- Passwords, API keys, bank or card numbers, government ID numbers
- Other people's personal information without a good reason and their permission
- Confidential client documents, unless your plan and agreement allow it
- Health or legal details about other people

**Safer habits:**

- Replace names and numbers with placeholders: "Client A", "$X".
- Use business or team plans for company data; they usually offer stronger privacy terms.
- Learn your tool's settings for memory, chat history and training on your data.

### 2. Check before you trust

Use the **"cost of being wrong"** test. The more expensive a mistake, the more you check:

- **Low cost** (a social post draft): skim and edit.
- **Medium cost** (a client email with numbers): check every fact and figure.
- **High cost** (legal wording, health advice, money decisions, code going live): verify with a qualified person or official source.

### 3. Images, voice and video: consent and copyright

- **Never clone someone's voice or face without written permission.** In many places it's illegal, and every major voice and video platform forbids it in its terms.
- **Don't create content that imitates a real person** saying things they didn't say.
- **Avoid copying living artists' styles by name** for commercial work, and don't recreate trademarked characters or logos.
- **Check commercial licences.** Free plans often don't allow commercial use.

### 4. Be honest about AI use

- Platforms like TikTok, YouTube and Meta have rules about labelling realistic AI-generated content. Turn on their AI labels when they apply.
- Don't present AI-generated reviews, testimonials or "customer" photos as real.
- For client work, agree up front whether and how AI will be used.

### 5. Stay in charge

AI can draft your words, but **you're responsible for what you publish**. Read everything before it goes out under your name.
@demo
**Anonymising a real task.** A bookkeeper wants help writing a polite payment reminder. Instead of pasting the real invoice, she writes:

> I'm a bookkeeper. Write a polite but firm reminder to a client ("Client A") whose invoice for $X is 30 days overdue. Mention our 2% late fee from 45 days. Keep it under 120 words, warm but clear.

She gets a useful draft, then adds the real name and amount herself in her email app. No client data ever went into the AI tool.
@tasks
- Review the privacy, memory and data-training settings in your main assistant and adjust them (25 min)
- Write your personal "never paste" list in your AI notebook (15 min)
- Rewrite one real task from your work with placeholders, then run it through an assistant (25 min)
- Read the AI-content labelling rules for one platform you post on (20 min)
- Write a one-paragraph AI policy for yourself or your business: what you use AI for, what you check, what you never do (25 min)
@deliverable
Privacy settings you've chosen, a "never paste" list and a short personal AI policy.
@tip
If you wouldn't put it in an email to a stranger, don't put it in a prompt. Placeholders take ten seconds and protect you every time.

# M2 | Prompting | The six parts of a strong prompt, advanced techniques, and your own prompt library.

## D4 | The anatomy of a great prompt | 3.5 | Prompt anatomy
@goal Learn the six-part prompt structure and use it to turn vague requests into precise, useful results.
@lesson
Most bad AI output comes from vague input. "Write a post about my bakery" gives the model almost nothing to work with, so it fills gaps with generic guesses. A good prompt is like a good brief to a freelancer: it says who, what, why, how and what good looks like.

{{fig:ai-prompt|Six parts of a strong prompt. You won't always need all six, but checking the list improves almost every prompt.}}

### 1. Role

Tell the model what expertise to use. *"You are an experienced e-commerce copywriter"* or *"Act as a patient maths tutor for a 14-year-old."* This shifts vocabulary, depth and focus.

### 2. Context

What does it need to know that it can't guess? Your business, audience, goal, what you've tried, constraints of the situation. **Context is the part people skip most, and it matters most.**

### 3. Task

The specific action, with a verb: write, summarise, compare, list, rewrite, critique, plan. One main task per prompt works best. If you have several, number them.

### 4. Format

How the answer should look: a table, bullet points, 3 options, under 150 words, an email with a subject line, JSON. If you don't say, you'll get the model's default, which is often longer than you want.

### 5. Constraints

What to avoid or respect: tone, reading level, words to avoid, things not to invent, legal limits. *"Don't make health claims. Use Canadian spelling. If you don't know, say so."*

### 6. Examples

Show what good looks like: a sample of your writing, a format you like, a previous post that worked. One good example often beats a paragraph of description.

### Before and after

**Weak:** *Write an Instagram caption for my bakery.*

**Strong:**

> **Role:** You're a social media copywriter for small food businesses.
> **Context:** I run a family bakery in London, Ontario. Our customers are local families and office workers. This week we're launching a pumpkin-spice cinnamon roll, $4.50, only on weekends in October.
> **Task:** Write 3 Instagram captions for the launch post.
> **Format:** Each under 60 words, with 3–5 hashtags at the end.
> **Constraints:** Warm and a bit playful, no exclamation marks overload (max one), mention weekends only.
> **Example of our voice:** "Saturday mornings smell better here. Fresh sourdough at 8, gone by 11."

The second prompt takes one minute longer to write and saves ten minutes of editing.

### Talk naturally

You don't need special syntax or magic words. Write the way you'd brief a smart colleague. Clear and specific beats clever.
@demo
**Upgrading a work prompt, live.**

A real estate agent's first try: *"Write a listing description for a house."* The result is generic: "Welcome to this stunning home..."

Upgraded:

> You're a real estate copywriter who writes honest, specific listings, never clichés like "stunning" or "must-see".
> Context: 3-bed semi-detached in Old South, London ON. Built 1925, updated kitchen 2023, original hardwood, walk to Wortley Village, small back garden, street parking only. Target buyers: young families and first-time buyers. Price $649,900.
> Task: Write the listing description.
> Format: 120–150 words, then a 10-word headline, then 5 bullet-point highlights.
> Constraints: Don't exaggerate. Mention street parking honestly but positively.

The new result mentions Wortley Village, the 1925 character and the 2023 kitchen. It's a listing that sounds like this house, not any house.
@tasks
- Copy the six parts into your AI notebook as a reusable checklist (10 min)
- Take three vague prompts you've used before and rewrite each with all six parts (45 min)
- Run both versions of each and compare. Note what changed (40 min)
- Write a context paragraph about yourself or your business that you can reuse in future prompts (30 min)
- Collect two examples of writing you like (yours or a style you admire) for future "example" sections (25 min)
- Ask the assistant: "What else would you need to know to do this really well?" on one of your prompts, and add its answers (25 min)
@deliverable
Three before-and-after prompt pairs and a reusable context paragraph about you or your business.
@tip
End important prompts with: "Before you start, ask me any questions you need answered to do this well." The model will often spot missing context you didn't think of.

## D5 | Advanced prompting: examples, reasoning and iteration | 3.5 | Advanced prompting
@goal Use advanced techniques that professionals rely on: few-shot examples, step-by-step reasoning, structured inputs and the ask-review-refine loop.
@lesson
The six-part structure gets you good results. These techniques get you consistently great ones.

### 1. Iterate instead of starting over

The first answer is a draft. The real skill is the **second and third message**.

{{fig:ai-loop|Ask, review, refine. Two or three rounds beat one "perfect" prompt.}}

Good follow-ups are specific:

- *"Make the second paragraph half as long."*
- *"Option 2 is closest. Keep its structure but use the tone of option 1."*
- *"This sounds too salesy. Rewrite it as if you're a friend recommending it."*
- *"You said X. Is that accurate? Check and correct if needed."*

Vague follow-ups like "make it better" give random results.

### 2. Few-shot examples

Show two or three examples of input and output, and the model copies the pattern:

> Turn customer messages into a one-line summary and a category.
>
> Message: "Hi, my order #2201 hasn't arrived and it's been 2 weeks" → Summary: Late delivery, order 2201. Category: Shipping
> Message: "Can I change the size before it ships?" → Summary: Wants to change size before dispatch. Category: Order change
> Message: "The zip broke after one use, really disappointed" → ?

### 3. Ask for thinking before answers

For problems with several steps (planning, maths, decisions), ask the model to reason first:

> *"Think through the options step by step, list pros and cons, then give your recommendation."*

Many models also have a built-in extended thinking or reasoning mode. Turn it on for complex tasks; leave it off for quick ones.

### 4. Separate instructions from material

When you paste a document, mark clearly where it starts and ends. Tags work well:

```
Summarise the contract below for a non-lawyer in 5 bullet points.
Highlight anything about cancellation or fees.

<contract>
...paste here...
</contract>
```

This stops the model confusing your instructions with the text.

### 5. Give it permission to say "I don't know"

> *"If the document doesn't say, write 'Not stated' instead of guessing."*

This one line cuts made-up answers dramatically.

### 6. Ask for options, then choose

*"Give me 5 different approaches, very different from each other."* Then pick one and develop it. Variety first, quality second.

### 7. Have it critique its own work

> *"Now review your answer as a strict editor. List the three weakest points, then rewrite to fix them."*

### 8. Templates with blanks

For tasks you repeat, write a prompt once with blanks: `[PRODUCT]`, `[AUDIENCE]`, `[TONE]`. Fill and reuse. That's what you'll build tomorrow.
@demo
**A three-round iteration for a cover letter.**

**Round 1:** Six-part prompt with the job ad and CV pasted in `<job>` and `<cv>` tags. Result: solid but generic opening.

**Round 2:** *"The opening is generic. Start with the specific project in my CV where I cut delivery times by 20%, and connect it to their need for 'faster fulfilment'. Keep everything else."*

**Round 3:** *"Review as a hiring manager who reads 200 letters a day. What would make you stop reading? Fix those things and cut to 250 words."*

The final letter is specific, short and sounds like a real person, after three focused messages.
@tasks
- Take one piece of real work and improve it through three rounds of specific follow-ups (45 min)
- Write a few-shot prompt with three examples for a task you repeat (sorting emails, writing titles, summarising notes) and test it on five new inputs (40 min)
- Paste a long document using tags and ask for a summary with "Not stated" rules (30 min)
- Try a complex decision with and without "think step by step" (or the reasoning mode) and compare (30 min)
- Ask for 5 very different options on a creative task, choose one and refine it twice (35 min)
@deliverable
An iterated piece of real work, a working few-shot prompt and notes on which techniques helped most.
@tip
When a chat goes off track after many messages, don't keep correcting. Start a new chat with a better first prompt that includes what you learned. It's faster.

## D6 | Build your personal prompt library | 3 | Prompt library
@goal Create a library of at least 15 tested prompt templates for the tasks you do most, so great results become one copy-paste away.
@lesson
Professionals don't write prompts from scratch every time. They keep a **library**: tested templates with blanks, organised by task. Today you build yours.

### Where to keep it

Anywhere you can search and copy quickly: a notes app, a Google Doc, Notion, or the **project instructions** feature in Claude or ChatGPT (Day 7–8). Start with a doc; you can move it later.

### Template format

For each prompt, save:

- **Name:** e.g. "Product description, short"
- **When to use it**
- **The prompt** with `[BLANKS]` in capitals
- **A note** on what worked or what to watch for

### Starter templates

Here are six to adapt. Fill your library to 15+ with your own.

**1. Email reply**
```
You're my assistant. Draft a reply to the email below.
My goal: [WHAT I WANT TO HAPPEN]
Tone: [friendly / firm / formal]. Under [N] words. Sign as [NAME].
<email>
[PASTE]
</email>
```

**2. Meeting notes to actions**
```
Turn these rough meeting notes into:
1) a 3-sentence summary, 2) a table of actions with owner and due date,
3) open questions. If an owner or date isn't stated, write "TBD".
<notes>[PASTE]</notes>
```

**3. Explain like a teacher**
```
Explain [TOPIC] to someone who [THEIR LEVEL]. Use one everyday analogy,
then a simple example, then 3 common mistakes. Under 300 words.
```

**4. Social post set**
```
Context: [BUSINESS + AUDIENCE]. Write [N] posts for [PLATFORM] about [TOPIC].
Each: a hook line, 2–3 short lines, a call to action. Voice: [3 WORDS].
Avoid: [WORDS/CLAIMS TO AVOID].
```

**5. Decision helper**
```
I'm deciding between [OPTIONS]. My priorities: [LIST, in order].
Constraints: [BUDGET/TIME]. Compare in a table, then recommend one and
say what would change your recommendation.
```

**6. Editor**
```
Edit the text below for clarity and flow. Keep my voice and meaning.
Show the edited version, then list the 5 most important changes and why.
<text>[PASTE]</text>
```

### Test before saving

A template is only "in the library" after you've used it on **two real tasks** and it worked without heavy editing.
@demo
**A freelancer's library after one afternoon (categories):**

- **Clients (5):** enquiry reply, proposal outline, scope-of-work clarifier, polite chaser, project wrap-up
- **Content (4):** LinkedIn post, newsletter intro, blog outline, repurpose blog into 5 posts
- **Admin (3):** meeting notes to actions, invoice email, weekly plan from to-do list
- **Thinking (3):** decision helper, devil's advocate, explain like a teacher

Each one has a "what worked" note, like: *"Add 'no buzzwords' or LinkedIn posts get corporate."*
@tasks
- Create your library document with the four fields for each template (15 min)
- Adapt the six starter templates to your own work (40 min)
- Write at least nine more templates for your own repeated tasks (50 min)
- Test each new template on a real task and refine it (45 min)
@deliverable
A tested library of 15+ prompt templates, organised by category.
@tip
Add a "last updated" line to templates you use for work. Every few months, run them on your favourite model's latest version. Shorter prompts often work just as well as models improve.

# M3 | AI assistants in depth | Get the most out of Claude and ChatGPT, then use them for research, writing and data.

## D7 | Claude in depth | 3.5 | Claude in depth
@goal Learn Claude's main features (projects, files, artifacts, research, memory and connectors) and set it up for your own work.
@lesson
**Claude** is made by Anthropic. People often choose it for writing that sounds natural, careful analysis of long documents, and coding. You can use it on the web at claude.ai, in desktop apps and in mobile apps.

### Models

Claude comes in a family of models. Larger ones (like **Opus**) are the most capable and best for complex work; mid-size ones (like **Sonnet**) balance speed and quality; small ones (like **Haiku**) are fastest. You can switch models from the model picker. For everyday work, the default is usually right. For hard analysis, long documents or difficult code, choose the most capable model available on your plan.

### The features that matter

**Projects.** A project is a workspace with its own **instructions** and **knowledge files**. Every chat inside it starts with that context. Create one per client, business or big topic. Put your context paragraph from Day 4, your brand voice and key documents inside.

**Files.** Upload PDFs, spreadsheets, Word documents, images and more. Ask questions, compare documents, extract tables, summarise reports.

**Artifacts and files Claude makes.** Claude can create documents, spreadsheets, presentations, web pages, diagrams and small interactive tools that appear in their own panel. You can edit them, ask for changes and share or download them.

**Web search and research.** Turn on search for current information with sources. Research modes go deeper: Claude plans searches, reads many sources and returns a report with citations.

**Memory and past chats.** Claude can remember useful context across conversations and search past chats, when you turn those settings on. You can see and manage what it remembers in settings.

**Styles.** Choose or create a writing style (for example, concise or formal), or teach Claude your style from samples.

**Connectors.** Connect apps like Google Drive, Gmail, calendars, GitHub and many others so Claude can read and act in them. Connectors are built on **MCP**, which you'll learn properly on Day 19.

**Claude Code.** Anthropic's coding agent for building software, which you'll use on Day 17.

### Plans

There's a free plan, and paid plans for individuals and teams that give more usage, access to the most capable models and more features. Check Claude's pricing page for current details.

### Habits for great results with Claude

- Use **projects** for anything you'll come back to.
- Put long documents in files, not pasted into the chat.
- Ask it to **create a file or page** when you want something you'll keep, edit or share.
- Use tags like `<document>` to separate material from instructions.
- Ask for what you want directly; Claude follows clear instructions closely.
@demo
**Setting up a "Business HQ" project.**

1. Create a project called *Business HQ*.
2. **Instructions:** *"I run [business] in [city]. Customers: [who]. Voice: warm, practical, no hype. Use Canadian spelling. When unsure about facts, say so. Prefer short answers with clear next steps."*
3. **Knowledge:** upload the price list, the About page text, last year's best-performing emails and the FAQ.
4. First chat: *"Using our FAQ and price list, draft answers to these five customer questions."* The answers use real prices and the right tone without re-explaining anything.
5. Second chat: *"Make a one-page price sheet as a document I can edit and share."* Claude creates it as a file you can open, change and export.
@tasks
- Explore Claude's settings: model picker, search, memory and connectors. Note what each does (25 min)
- Create a project for your main work area with instructions and at least three knowledge files (45 min)
- Run three real tasks inside the project and compare with the same tasks in a plain chat (45 min)
- Ask Claude to create a document, a table and a small interactive page you'll actually use (40 min)
- Connect one app you use (for example Google Drive or your calendar) and try one task with it (25 min)
@deliverable
A working Claude project with your context and files, plus three things Claude made that you'll keep.
@tip
Your project instructions are a living document. Every time you correct Claude twice about the same thing, add a line to the instructions.

## D8 | ChatGPT in depth, plus Gemini and Perplexity | 3.5 | ChatGPT in depth
@goal Use ChatGPT's main features and know when Gemini or Perplexity is the better tool.
@lesson
**ChatGPT** from OpenAI is the most widely used AI assistant. Its strengths include a broad set of built-in tools: image generation, voice conversation, data analysis and custom assistants.

### Key features

**Models and reasoning.** ChatGPT offers fast models for everyday questions and reasoning models for harder problems. The model picker and automatic routing change often, so check what's current. Use the reasoning options for maths, planning and complex analysis.

**Projects.** Like Claude's projects: folders with instructions and files shared across chats.

**Custom GPTs.** Build a mini-assistant with fixed instructions, knowledge files and optional tools, then reuse it or share it. Good for repeated jobs like "Product Description Writer" or "Recipe Converter".

**Memory and custom instructions.** ChatGPT can remember details across chats. **Custom instructions** let you set how you want it to respond everywhere. Review memory regularly and delete what you don't want stored.

**Image generation.** Create and edit images in the chat by describing them. Strong at following detailed instructions and placing text in images.

**Voice mode.** Talk to ChatGPT out loud. Great for practising a language, a pitch or an interview.

**Data analysis.** Upload a spreadsheet and ask questions. ChatGPT writes and runs code behind the scenes to calculate and chart.

**Search and deep research.** Search answers current questions with sources; deep research produces long, cited reports.

**Canvas.** A side-by-side editor for writing and code where you can edit together.

### Gemini

Google's assistant connects well with Gmail, Docs, Drive and other Google apps. Useful if your work lives in Google Workspace. It also has strong image and video models.

### Perplexity

A search-first AI. Every answer comes with sources, which makes it good for quick research and fact-checking. Use it to verify claims from other assistants.

### Using two assistants together

A simple workflow many professionals use:

1. Draft in your main assistant.
2. Ask a second assistant to critique it: *"What's weak, unclear or possibly wrong here?"*
3. Fact-check specific claims with a search-first tool.
4. Make the final edit yourself.
@demo
**Building a custom GPT: "Menu Describer".**

- **Instructions:** *"You write menu descriptions for a family restaurant. Each description is 15–25 words, mentions 2–3 key ingredients and the cooking method, uses no clichés like 'mouth-watering' and ends without punctuation. If the dish name is unclear, ask what's in it."*
- **Knowledge:** the current menu and the brand voice guide.
- **Conversation starters:** "Describe this new dish", "Rewrite this description shorter".

Typing *"Malabar fish curry: kingfish, coconut, kokum, curry leaves, slow simmered"* returns: *"Kingfish slow simmered in coconut milk with sour kokum and curry leaves, a coastal Kerala classic"*, ready for the menu with a quick check.
@tasks
- Explore ChatGPT's settings: custom instructions, memory and data controls. Set them up (25 min)
- Create a ChatGPT project for one area of your work with instructions and files (30 min)
- Build one custom GPT for a task you repeat and test it five times (50 min)
- Upload a spreadsheet (your own or a sample) and ask for three insights and one chart (30 min)
- Use the two-assistant workflow on one piece of real writing (40 min)
@deliverable
ChatGPT set up with your instructions, one working custom GPT and a tested two-assistant workflow.
@tip
Pick your main assistant by how its writing feels to you and where your files live, not by benchmark charts. The best assistant is the one you'll use well every day.

## D9 | Research, writing and data workflows | 3 | Research & writing
@goal Combine what you've learned into reliable workflows for researching a topic, writing in your own voice and analysing data.
@lesson
Today you put tools and techniques together into three workflows you'll use for years.

### Workflow 1: Research you can trust

1. **Frame the question.** *"I want to understand [topic] well enough to [decision]."*
2. **Use a research mode** (deep research in Claude, ChatGPT or Gemini, or Perplexity) with search on.
3. **Ask for sources for every key claim** and a section on where sources disagree.
4. **Open and check** the three most important sources yourself.
5. **Summarise for action:** *"Based on this, give me the five things that matter for my decision, and what's still uncertain."*

### Workflow 2: Writing in your voice

AI writing sounds generic when it doesn't know your voice. Fix that:

1. Collect 3–5 samples of your best writing.
2. Ask: *"Analyse my writing style in these samples: sentence length, tone, words I use often, how I open and close. Write a style guide I can reuse."*
3. Save the style guide in your project instructions or library.
4. When drafting: give the style guide, your **rough notes or bullet points**, and the goal.
5. Edit the draft yourself. Change at least a few lines, especially the opening.

Starting from your own notes, not a blank request, is what keeps the result yours.

### Workflow 3: Data analysis

1. Clean the file: one header row, no merged cells, one table per sheet.
2. Upload and ask: *"Describe this data: columns, rows, date range, anything odd."*
3. Ask specific questions: *"Which product had the highest profit margin last quarter?"*
4. Ask for **charts** and **the method used**, so you can check the logic.
5. Spot-check one or two numbers by hand.

### Summarising long documents

- For reports: *"Summarise in 5 bullet points, then list decisions required and deadlines."*
- For contracts: *"List obligations, fees, cancellation terms and anything unusual. Quote the exact clause for each."*
- For meetings: use your Day 6 template.

### When not to use AI for writing

Personal messages where your own words matter (condolences, apologies, love letters), anything where authenticity is the point, and anything you're not willing to read and stand behind.
@demo
**A shop owner researches "Should I start selling on TikTok Shop in Canada?"**

1. Deep research prompt: *"Is TikTok Shop available to sellers in Canada as of today? What are the requirements, fees and categories? Cite official sources first. Note anything uncertain or recently changed."*
2. The report gives official links and notes recent changes.
3. She opens the official seller pages to confirm the key details.
4. Final prompt: *"Given I sell handmade candles ($25–$40) and have 2,000 Instagram followers, what are the top 5 things that matter for my decision?"*

Total time: 40 minutes, with sources she verified herself.
@tasks
- Run Workflow 1 on a real question in your life or work and check three sources yourself (50 min)
- Create your personal style guide from 3–5 writing samples and save it (35 min)
- Write one real piece (email, post, article) from your own bullet points using the style guide (35 min)
- Run Workflow 3 on a spreadsheet you have, or a public dataset, and spot-check two numbers (35 min)
@deliverable
A researched answer with checked sources, your personal style guide and one piece of writing that sounds like you.
@tip
Ask the model to quote the exact sentence from a source for important claims. If it can't find the quote, the claim may not be in the source.

# M4 | Images, voice & video | Create AI images, natural voiceovers and short videos, from first prompt to finished edit.

## D10 | AI images that look intentional | 3.5 | AI images
@goal Learn a repeatable image prompt formula and produce a consistent set of images for a real project.
@lesson
AI image tools turn a text description into a picture. The difference between amateur and professional results is mostly in the prompt and in **choosing and editing** the best outputs.

### The image prompt formula

**Subject** + **setting** + **style/medium** + **lighting** + **camera/composition** + **mood** + **aspect ratio**

| Part | Example |
|---|---|
| Subject | a ceramic coffee cup with latte art |
| Setting | on a worn oak table by a rainy window |
| Style/medium | editorial food photography |
| Lighting | soft natural side light, gentle shadows |
| Camera/composition | 50mm, shallow depth of field, cup on the left third |
| Mood | calm, cosy, early morning |
| Aspect ratio | 4:5 for Instagram |

Combined: *"Editorial food photography of a ceramic coffee cup with latte art on a worn oak table by a rainy window, soft natural side light, 50mm lens, shallow depth of field, cup on the left third, calm cosy early-morning mood, 4:5."*

### Tools and their strengths

- **Midjourney:** strong artistic style and photographic look. Has parameters for aspect ratio and style.
- **ChatGPT and Gemini images:** follow detailed instructions well, good for editing an existing image conversationally and adding text.
- **Ideogram:** good at text in images (posters, logos drafts).
- **Adobe Firefly:** integrated with Photoshop; designed to be commercially safe.

### Consistency across a set

For a brand, you want images that look like they belong together:

- Fix the **style, lighting and colour words** and reuse them in every prompt.
- Use **reference images** (most tools let you upload one) for style or character.
- Use the same aspect ratio throughout.
- Write your fixed "style suffix" once and save it in your prompt library.

### Editing

- **Inpainting:** select an area and describe what should change (remove a cup, change the sky).
- **Outpainting/expand:** extend the image beyond its edges.
- **Upscaling:** increase resolution for print.
- Final touch-ups in Canva, Photoshop or a phone editor: crop, colour, text.

### Where AI images fit best

Great for backgrounds, concepts, mood boards, illustrations, social graphics and ad mock-ups. For **real products and food you sell**, use real photos for the main images; customers should see what they'll actually get.

### Rules

No real people without consent, no trademarked characters or logos, and no images designed to mislead.
@demo
**A consistent set for a candle shop's autumn campaign.**

Style suffix saved in her library: *", editorial still life, warm amber side light from the left, muted earthy palette, linen and dried flowers, 35mm, soft shadows, 4:5"*

Prompts:
1. *"A lit amber glass candle on a stack of old books"* + suffix
2. *"Hands holding a mug next to a lit candle on a windowsill, rain outside"* + suffix
3. *"Dried orange slices and cinnamon sticks scattered around a candle lid"* + suffix

She generates four versions of each, picks the best, removes a stray object with inpainting, and adds the shop name in Canva. The three images look like one photoshoot.
@tasks
- Write the formula into your library and create your own style suffix for a brand or project (25 min)
- Generate 10 images using the formula, changing one part at a time to see its effect (50 min)
- Create a consistent set of 4 images for one real use: posts, a website section or a presentation (50 min)
- Try inpainting or editing on at least one image (25 min)
- Check the licence for commercial use on the tool you used and note it (10 min)
@deliverable
A saved style suffix and a consistent set of four images ready to use.
@tip
Change one thing at a time. If you change the subject, lighting and style all at once, you won't learn what made the difference.

## D11 | Voice with ElevenLabs | 3 | Voice & audio
@goal Create natural, well-paced voiceovers with ElevenLabs, and understand cloning, dubbing and audio generation responsibly.
@lesson
**ElevenLabs** is the leading AI voice platform. It turns text into speech that sounds human, and it can clone voices (with permission), dub video into other languages, generate sound effects and music, and transcribe audio.

### What's inside

- **Text to speech:** type or paste a script, choose a voice, generate audio. Several models trade off quality, emotion and speed. The most expressive models handle emotion and delivery best; faster models suit real-time uses.
- **Voice library:** thousands of voices across many languages and accents, filterable by age, tone and use.
- **Voice design:** describe a voice ("warm, mid-30s, Canadian accent, calm") and generate it.
- **Voice cloning:** *instant* cloning from a short clean recording, and *professional* cloning from more audio for higher quality. **Only clone your own voice, or a voice you have written permission to use.**
- **Dubbing:** translate a video into other languages, keeping the speaker's voice style.
- **Sound effects and music:** generate effects ("door creaks open, wind outside") and music from a prompt.
- **Speech to text:** transcribe audio with speaker labels.
- **Studio:** a long-form editor for audiobooks, podcasts and narration.

### Plans and licensing

There's a free plan with a monthly credit allowance for learning, but it requires attribution and doesn't include commercial use. Paid plans start low and include a commercial licence. Check the current pricing page before using audio in paid work or ads.

### Writing scripts for the ear

Text that reads well doesn't always sound good. For voice:

- Short sentences. One idea each.
- Write numbers how they're said: "twenty-nine ninety-nine", not "$29.99", if the model stumbles.
- Use punctuation to control pace: commas for small pauses, full stops for bigger ones, ellipses for hesitation.
- Read it aloud yourself first. If you trip, the AI may too.

### Getting natural delivery

- **Pick the voice for the job:** an ad needs energy; a meditation needs calm.
- **Adjust settings:** lower stability gives more expressive, varied delivery; higher stability is more consistent. Similarity controls how close output stays to the original voice.
- **Use the expressive model's emotional cues** where available, or describe the delivery in the script direction.
- **Generate several takes** of important lines and pick the best.
- **Fix pronunciation** of names and brands with spelling tricks ("Malabari" → "Mala-baa-ree") or pronunciation tools.

### Cloning your own voice

1. Record in a quiet room, phone close to your mouth, no music.
2. Read naturally for the length the tool asks for.
3. Use the clone for consistent narration across many videos without re-recording.
@demo
**A 30-second ad voiceover.**

Script written for the ear:

> Shedding season again?
> Your sofa says yes.
> This brush lifts loose fur in minutes... and one click pushes it straight off.
> No picking. No mess.
> Try it for thirty days. If your dog doesn't love it, we'll make it right.

Settings: a warm, friendly mid-range voice; stability around the middle for natural variation. She generates three takes, picks the best for each line, trims the gaps in an editor and exports as MP3. Total: 20 minutes.
@tasks
- Create an ElevenLabs account and explore the voice library. Shortlist three voices for your brand or project (25 min)
- Write a 30–45 second script for the ear, using the rules above (30 min)
- Generate the voiceover in two voices with different settings and compare (35 min)
- Generate one sound effect and one short music bed for the same project (25 min)
- Optional: record a clean sample and create an instant clone of your own voice (25 min)
- Write the licence terms of your plan in your AI notebook (10 min)
@deliverable
A finished 30–45 second voiceover, with a sound effect and music bed ready for Day 13.
@tip
Most "robotic" AI voice is a script problem, not a voice problem. Shorten sentences and add natural pauses before changing voices.

## D12 | AI video: the landscape and image-to-video | 3.5 | AI video basics
@goal Understand how AI video tools work, compare the main options, and create your first image-to-video clips with camera movement.
@lesson
AI video has moved quickly from glitchy experiments to clips good enough for ads, social media and short films. The tools change constantly, but the method stays the same.

### Two ways to generate video

- **Text to video:** describe the scene and the model creates it. Fast, but less control over exactly how it looks.
- **Image to video:** start from an image (made with Day 10's methods, or a real photo) and describe the motion. **More control and consistency**, so it's the method most professionals use.

### The main tools

- **Higgsfield:** a creative studio that brings together many leading video and image models in one place, with cinematic camera controls, shot planning, presets and visual effects, character consistency features (Soul ID) and apps for lipsync, product placement and more. Useful because you can try several models from one account.
- **Kling, Google Veo, OpenAI Sora, Runway, Seedance, Hailuo, Luma:** individual video models and apps. Each has strengths in realism, motion, physics, sound or style. Several can be accessed inside aggregators like Higgsfield.
- Some newer models generate **sound and dialogue** along with video.

Model rankings change monthly. Learn the method, then test the newest models on your own shots.

### Writing a video prompt

**Subject + action + setting + camera movement + style + duration/ratio**

> *"A golden retriever shakes off water on a dock at sunset, droplets catching the light, slow motion, camera slowly pushes in, cinematic 35mm look, 5 seconds, 9:16."*

### Camera movement vocabulary

| Move | What it does | Feels |
|---|---|---|
| Push in / dolly in | Camera moves toward the subject | Focus, tension |
| Pull out | Moves away, revealing more | Reveal, ending |
| Pan | Rotates left/right | Following, scanning |
| Tilt | Rotates up/down | Scale, reveal height |
| Orbit | Circles the subject | Product hero shot |
| Tracking | Moves alongside a moving subject | Energy, travel |
| Handheld | Slight natural shake | Real, UGC feel |
| Static | No movement | Calm, clear |

Use **one camera move per shot**. Combining several often produces warped results.

### Getting good results

- Start with a **strong, clean image** in the right aspect ratio.
- Keep motion simple: one main action per clip.
- Generate **3–4 versions** and pick the best. Expect some failures; that's normal.
- Short clips (3–8 seconds) look better than long ones. Build longer videos by editing many short clips together.
- Watch for common errors: extra fingers, melting objects, text that turns to gibberish, faces changing between shots.
@demo
**Three test shots for a café.**

1. Image: a latte on a wooden counter by a window (from Day 10). Prompt: *"Steam rises gently from the latte, rain runs down the window behind, slow push in, cosy morning light, 5 seconds, 9:16."*
2. Image: a croissant on a plate. Prompt: *"Hands tear the croissant in half revealing flaky layers, crumbs fall, static camera, close-up, 4 seconds."*
3. Text to video: *"Wide shot of a small café exterior on a quiet autumn street, leaves blowing past, a person enters, slow pan right, golden hour."*

She tries shot 1 on two different models in Higgsfield and keeps the one with more natural steam. Shot 2's hands look odd in two of four versions; she keeps the best and trims it to 3 seconds.
@tasks
- Create an account on Higgsfield or another video tool with free credits (20 min)
- Generate three image-to-video clips from your Day 10 images, each with a different camera move (60 min)
- Try one text-to-video prompt and compare the control you get (25 min)
- Run the same image and prompt through two different models and note the differences (35 min)
- Keep a **Video log**: prompt, model, settings, result rating (20 min)
@deliverable
At least four short AI video clips and notes on which models and camera moves worked best.
@tip
If a clip almost works, regenerate rather than editing your prompt. Small random differences between runs often fix hands, faces and physics.

## D13 | Make a complete 30-second AI video | 4.5 | Full AI video
@goal Produce a finished 30-second video from script to final edit, combining Claude or ChatGPT, image and video models, ElevenLabs and an editor.
@lesson
Today you put every creative skill together. This is the real workflow behind most AI video you see online.

{{fig:ai-video|Eight steps. The model you animate with matters less than the planning in steps 1–3.}}

### Step 1: Script (assistant)

Use your assistant with a clear brief: *"Write a 30-second video script for [goal] aimed at [audience]. Include a 2-second hook, 4–6 short scenes, and voiceover lines of 70–80 words total. Output as a table: time, visual, voiceover."*

### Step 2: Shot list

Turn the script into 6–8 shots of 3–5 seconds each. For every shot write: what we see, camera move, and the image prompt. Ask the assistant to write consistent image prompts using your style suffix.

### Step 3: Keyframes (image model)

Generate the first frame of each shot. **Consistency is everything:** same style suffix, same character reference, same colours. Pick the best for each shot.

### Step 4: Animate (video model)

Image-to-video for each keyframe with one camera move each. Generate 2–4 versions per shot and keep the best.

### Step 5: Voice (ElevenLabs)

Generate the voiceover from your script. Time it: 30 seconds is roughly 70–80 spoken words.

### Step 6: Music and sound effects

A music bed under the voice, plus a few sound effects (whoosh on transitions, ambient sound). Keep music low, around 15–20% of the voice volume.

### Step 7: Edit (CapCut or similar)

1. Lay down the voiceover first.
2. Place clips to match each line.
3. Trim clips to the beat; cut on movement.
4. Add captions (auto, then correct).
5. Colour match clips if needed.
6. Add the music and effects underneath.
7. Add a closing card with the call to action.

### Step 8: Publish

Export 1080×1920 for Reels, TikTok and Shorts. Write a caption, add relevant hashtags and turn on the platform's AI-generated content label where required.

### Common problems and fixes

| Problem | Fix |
|---|---|
| Character looks different in each shot | Use a reference image or character feature; keep the same description |
| Video feels slow | Shorter clips (2–3s), cut on action |
| Voice and visuals don't match | Edit visuals to the voice, not the other way round |
| Looks "AI" | Add real footage or photos for one or two shots, use subtle motion, add grain or texture |
@demo
**"Rainy Saturday" ad for a café (full production in 4 hours).**

| Time | Visual | Voiceover |
|---|---|---|
| 0–3s | Rain on the café window, slow push in | "Rainy Saturday?" |
| 3–7s | Steam rising from a latte | "Good." |
| 7–12s | Croissant torn in half, flaky layers | "Fresh croissants from eight..." |
| 12–17s | Friends laughing at a corner table | "...a warm corner seat..." |
| 17–23s | Barista pouring latte art, close-up | "...and coffee made slowly, the way it should be." |
| 23–30s | Exterior at golden hour, logo and address | "Corner Café. Open till four. See you soon." |

Keyframes made with one style suffix; shots animated on two models in Higgsfield; voice from ElevenLabs; a soft acoustic bed and rain ambience; edited in CapCut with captions. She uses one real photo of the café sign in the final shot so the location is genuine.
@tasks
- Write your 30-second script and shot list using an assistant (35 min)
- Generate keyframes for 6–8 shots with consistent style (55 min)
- Animate every shot, 2–4 versions each, and pick the best (70 min)
- Generate or reuse your voiceover, music and sound effects (20 min)
- Edit the full video with captions and a closing card, then export (50 min)
@deliverable
A finished 30-second AI video with voiceover, music and captions, ready to post.
@tip
Lock the voiceover before you generate videos. When you know each shot needs exactly 3.5 seconds, you waste far fewer credits.

## D14 | Avatars, AI UGC and the rules | 3 | Avatars & AI UGC
@goal Understand AI presenter avatars and AI-made UGC ads, when they're appropriate, and the rules that keep you and your accounts safe.
@lesson
AI avatars let you produce presenter-style videos from a script: training videos, explainers, product walkthroughs and multilingual content, without filming each time.

### Avatar tools

- **HeyGen** and **Synthesia:** choose a stock avatar or create one of **yourself** from a recording, type a script, pick a language, and get a talking-presenter video.
- **Lipsync tools** (including apps inside Higgsfield): make a character or video match a new audio track.
- **Translation and dubbing:** turn one video into many languages, keeping your voice style.

### Good uses

- Internal training and onboarding videos
- Product walkthroughs and FAQs
- Course and explainer content in several languages
- Personalised video messages at scale (with your own avatar)

### Risky or bad uses

- Fake "customer testimonial" videos presented as real people. Many advertising standards and consumer protection rules treat this as deceptive.
- Any avatar of a real person without their written consent.
- Medical, financial or legal advice delivered by a fake "expert".
- Political content impersonating real people.

### AI UGC ads

"AI UGC" means ads that look like a real person filmed them on a phone, but were made with AI. They can be cheap to test. If you use them:

- Don't claim the avatar is a real customer or present invented experiences as real reviews.
- Follow each ad platform's rules on AI-generated and altered content, and use its disclosure labels.
- Test against real human UGC. Real creators often still win on trust.

### Making your own avatar well

1. Record in good light with a plain background, looking at the camera.
2. Speak naturally with some hand movement; follow the tool's recording guide.
3. Write scripts in your speaking style (short sentences).
4. Use your avatar for repeatable content; film yourself for content where personality matters most.
@demo
**A tutoring business uses its founder's avatar.**

The founder records a 2-minute training video of herself for HeyGen with consent forms complete (it's her own face and voice). She then:

- Turns her written FAQ into twelve 60-second explainer videos in one afternoon
- Dubs the three most popular into French and Hindi for families in her area
- Labels them on YouTube as AI-assisted, and keeps her personal welcome video as real footage

Parents get answers faster, and she saves about six hours of filming.
@tasks
- Try a free avatar tool and make a 30-second explainer with a stock avatar (45 min)
- Write down three good uses and three bad uses of avatars for your own business or work (20 min)
- Read one ad platform's policy on AI-generated content and summarise the key rules (25 min)
- Optional: record a sample and create an avatar of yourself, following the tool's consent steps (40 min)
@deliverable
A short avatar video and a clear, written set of rules for how you'll use avatars and AI UGC.
@tip
Use AI avatars to scale content you'd happily say on camera yourself. If you wouldn't stand behind it as a real video, don't make it as an AI one.

# M5 | Build software with AI | Learn how apps work, build one with AI builders and Claude Code, deploy it, and connect tools with MCP.

## D15 | How web apps work (no code yet) | 3 | How apps work
@goal Understand the parts of a modern web app well enough to direct AI tools to build one, and to fix things when they break.
@lesson
You don't need to become a programmer to build software with AI. You do need to understand **the parts of an app** and how they talk to each other. That knowledge is the difference between "the AI built something weird" and "I told the AI exactly what to build".

{{fig:ai-stack|The parts of a typical modern web app. You'll build exactly this stack in Days 17–18.}}

### The frontend

What users see and click: pages, buttons, forms. Built with **HTML** (structure), **CSS** (looks) and **JavaScript** (behaviour). Most modern apps use a framework like **React**, often through **Next.js**, which also handles pages and routing.

### The backend

Code that runs on a server, not in the user's browser. It handles things you can't trust the browser with: checking passwords, saving data, taking payments, talking to other services using secret keys.

### The database

Where data lives: users, orders, posts, bookings. Most apps use a **relational database** like **PostgreSQL**: tables with rows and columns, like very powerful spreadsheets connected to each other.

### Authentication (auth)

Signing up, logging in, and making sure each user only sees their own data. Never build this from scratch; use a service like **Supabase Auth**.

### APIs

How programs talk to each other. Your frontend asks your backend for data through an API; your backend asks Stripe to take a payment through Stripe's API.

### Hosting and deployment

Code needs to live on servers to be online. **Vercel** and **Netlify** host websites and Next.js apps. **Deployment** means putting a new version online. The modern way: your code lives in a **GitHub** repository, and every time you push a change, Vercel builds and publishes it automatically.

### Environment variables

Settings and secrets (like API keys) that live **outside your code**, in your hosting settings. They keep secrets out of GitHub.

### Supabase in one paragraph

Supabase gives you a Postgres database, authentication, file storage and more, with a dashboard and a free tier. Paired with Next.js on Vercel, it's one of the fastest ways for a small team (or one person with AI) to build real apps.

### Words you'll hear

| Word | Meaning |
|---|---|
| Repository (repo) | A project folder tracked by Git, usually on GitHub |
| Commit | A saved snapshot of changes |
| Branch | A separate line of work you can merge later |
| Build | Turning source code into the files that run |
| Migration | A saved change to the database structure |
| RLS (row level security) | Database rules for who can see which rows |
| Production / preview | The live site / a test version |
@demo
**Tracing one click in a booking app.**

A customer taps "Book 2pm Friday":

1. **Frontend** (Next.js page) sends the request to the backend.
2. **Backend** checks the customer is logged in (**Supabase Auth**).
3. Backend checks the slot is free and saves a booking row in the **database**.
4. Backend asks **Stripe's API** to take the deposit.
5. Backend sends a confirmation email through an email **API**.
6. Frontend shows "You're booked".

All of it is hosted on **Vercel**, deployed from a **GitHub** repo, with secret keys stored as **environment variables**. When something breaks, you can now ask: which of these six steps failed?
@tasks
- Draw the app diagram from memory, labelling each part (20 min)
- Pick an app you use daily and trace one action through frontend, backend, database and APIs, like the demo (35 min)
- Ask an assistant to explain any word from the table you're unsure of, with an analogy (25 min)
- Create free GitHub, Supabase and Vercel accounts (30 min)
- Write a one-page idea for an app you'd like to build: who it's for, the main 3 things it does, and what data it stores (40 min)
@deliverable
A labelled app diagram, three accounts ready and a one-page app idea.
@tip
When an AI coding tool shows you an error, paste the whole error message back and say which step you were doing. Errors are clues, not failures.

## D16 | Building apps with AI app builders | 4 | AI app builders
@goal Build a working app prototype in the browser with an AI app builder, and learn to prompt for software using a short product spec.
@lesson
**AI app builders** like **Lovable**, **Bolt**, **v0** and **Replit** let you describe an app and get a working version in the browser, often with a database and hosting included. They're perfect for prototypes, internal tools and simple products.

### When to use which approach

| Approach | Best for |
|---|---|
| AI app builder (Lovable, Bolt, v0, Replit) | Fast prototypes, landing pages, simple tools, testing an idea |
| AI coding agent (Claude Code, Cursor) | Real products you'll maintain, complex logic, existing codebases |

Many people start in a builder, then move the code to GitHub and continue with Claude Code when the app grows.

### Write a mini spec first

The biggest mistake is a one-line prompt like "build me a booking app". Write a **mini product spec** (a PRD) first, with an assistant's help:

1. **Purpose:** one sentence on what the app does and for whom.
2. **Users and roles:** who uses it (customer, admin).
3. **Core features:** 3–5, in priority order.
4. **Screens:** list each page and what's on it.
5. **Data:** what's stored (tables and fields).
6. **Look and feel:** style words, colours, a reference site.
7. **Not now:** features you're deliberately leaving out.

### Build in steps

1. Paste the spec and ask for **just the first screen and the data structure**.
2. Check it works. Then add one feature per prompt.
3. After each step, **test it yourself** like a user would.
4. When something's wrong, describe **what you did, what you expected and what happened**.

### Prompting tips for builders

- Be specific about layout: *"a two-column layout on desktop that stacks on mobile"*.
- Name things consistently ("bookings", not sometimes "appointments").
- Ask for **empty states** and **error messages**, not just the happy path.
- When it gets stuck in a loop of errors, revert to the last working version and try a smaller step.

### Know the limits

Builders can produce code that looks fine but has security gaps. Before real users enter real data: check logins work, that users can't see each other's data, and that secret keys aren't exposed in the browser.
@demo
**Mini spec for "Shift Swap", a staff shift-swapping app for a restaurant:**

- **Purpose:** Let restaurant staff post shifts they can't work and let coworkers claim them, with manager approval.
- **Roles:** Staff, Manager.
- **Features:** 1) Post a shift (date, time, role). 2) Browse open shifts and claim one. 3) Manager approves or rejects swaps. 4) Email notification on approval.
- **Screens:** Login, Open shifts list, Post a shift form, My shifts, Manager approvals.
- **Data:** users (name, role), shifts (date, start, end, role, posted_by, claimed_by, status).
- **Look:** clean, mobile first, large buttons, dark green accent.
- **Not now:** payroll, scheduling the whole rota, chat.

Step 1 prompt: *"Using this spec, build only the login and the Open shifts list with sample data."* Five prompts later, the core flow works.
@tasks
- Write a mini spec for your Day 15 app idea with all seven parts, using an assistant to sharpen it (45 min)
- Build the first screen and data structure in an AI app builder (45 min)
- Add your core features one prompt at a time, testing after each (80 min)
- Test the app as a new user would, list five problems and fix at least three (40 min)
@deliverable
A written mini spec and a working prototype of your app in an AI builder.
@tip
Save your spec in a file. Every time the app drifts from what you wanted, paste the relevant part of the spec back in. It keeps the AI on track.

## D17 | Claude Code and AI coding agents | 4 | Claude Code
@goal Install Claude Code, learn the core workflow, and make your first real changes to a project with version control on GitHub.
@lesson
**Claude Code** is Anthropic's AI coding agent. Instead of only suggesting code in a chat, it works inside a real project: it reads your files, makes changes across many files, runs commands and tests, and explains what it did. It runs in your terminal, in code editors like VS Code, in a desktop app and on the web.

**Cursor** is a popular alternative: a code editor with AI built in. The ideas below work in both.

### Installing Claude Code

Claude Code needs a Claude subscription or an API account. Install it from the official instructions (docs.claude.com → Claude Code), which give a one-line installer for macOS, Linux and Windows. Then, in your project folder, run:

```
claude
```

Sign in when asked, and you're ready. If you're not comfortable with the terminal, you can use Claude Code from the desktop app or on the web connected to a GitHub repository.

### The core workflow

1. **Explore:** ask Claude Code to read the project and explain it. *"Give me an overview of this codebase."*
2. **Plan:** for anything non-trivial, ask for a plan before changes. *"Plan how to add a contact form. Don't write code yet."* Review the plan.
3. **Build:** approve the plan and let it implement.
4. **Test:** ask it to run the app and tests, then try it yourself.
5. **Commit:** save the work with a clear message, and push to GitHub.

### CLAUDE.md: your project's memory

Create a file called `CLAUDE.md` in the project root. Claude Code reads it at the start of every session. Put in:

- What the project is
- The tech stack (e.g. Next.js, Supabase, Tailwind)
- Commands to run, test and build
- Rules ("use TypeScript", "mobile first", "never commit .env files")

### Git and GitHub basics

- **Git** tracks changes; **GitHub** stores your repository online.
- A **commit** is a save point. Commit after each working change.
- If something breaks, you can go back to the last commit.
- Claude Code can run git commands for you: *"Commit these changes with a clear message and push."*

### Staying safe

- Keep secrets in `.env.local` and make sure it's listed in `.gitignore`.
- Read what Claude Code wants to run before approving commands you don't understand; ask it to explain.
- Work on a branch for bigger changes, so `main` stays working.

### Prompting a coding agent

- Point to specifics: file names, error messages, what you see on screen.
- One feature at a time.
- Ask "why" when you don't understand a change. It's the fastest way to learn real development.
@demo
**First session with Claude Code on a small website.**

```
> Give me an overview of this project and how to run it locally.
> Plan how to add a "Book a table" form that emails the owner. Don't code yet.
> The plan looks good. Use a server action and keep the API key in .env.local.
> Run the dev server and tell me the URL.
> The form submits but there's no success message. Add one and an error state.
> Commit with a clear message and push to GitHub.
```

She also asks: *"Create a CLAUDE.md describing this project, the stack and the commands."* Every later session starts already knowing the project.
@tasks
- Install Claude Code (or set up Claude Code on the web with GitHub) and sign in (30 min)
- Create a new GitHub repository and connect it (or import your Day 16 prototype's code) (30 min)
- Ask Claude Code for an overview, then plan and build one small feature (60 min)
- Create a CLAUDE.md for the project (20 min)
- Commit and push your changes, then view them on GitHub (20 min)
- Practise asking "why" about three changes it made and write down what you learned (25 min)
@deliverable
Claude Code installed, a project on GitHub with a CLAUDE.md, and your first AI-built feature committed.
@tip
Ask for a plan first on anything bigger than a small fix. Reading a five-line plan takes one minute and saves an hour of undoing changes you didn't want.

## D18 | Project: build and deploy a full-stack app | 4.5 | Full-stack project
@goal Build a real habit-tracker app with login and a database using Next.js and Supabase, and deploy it live on Vercel.
@lesson
Today you build a complete app: users sign up, add habits, tick them off each day, and only ever see their own data. It's small, but it uses every part of a real product.

### 1. Create the Next.js project

In Claude Code (or your terminal), ask:

> Create a new Next.js app with TypeScript, Tailwind and the App Router called habit-tracker. Add @supabase/supabase-js and @supabase/ssr. Create a CLAUDE.md describing the stack.

### 2. Create the database in Supabase

In your Supabase project's SQL editor, run:

```sql
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null default current_date,
  unique (habit_id, day)
);

alter table habits enable row level security;
alter table checkins enable row level security;

create policy "Users manage their own habits" on habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own checkins" on checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**Row level security** is the most important part: it makes the database itself refuse to show one user's rows to another, even if the frontend has a bug.

### 3. Connect the app

Copy your Supabase **project URL** and **publishable (anon) key** from the project's API settings into `.env.local`. The publishable key is designed to be used in the browser because RLS protects the data. **Never put the service role (secret) key in frontend code.**

### 4. Build the features with Claude Code

Prompt one at a time:

1. *"Add email sign-up and login with Supabase Auth using the SSR helpers. Protect the dashboard route."*
2. *"On the dashboard, list the user's habits with a form to add a new one."*
3. *"Show the last 7 days as columns. Clicking a day toggles a checkin row."*
4. *"Show a streak count for each habit."*
5. *"Add empty states, loading states and error messages. Make it look good on mobile."*

Test after each step. Create two test accounts to confirm users can't see each other's habits.

### 5. Deploy on Vercel

1. Push the project to GitHub.
2. In Vercel, **Add New Project** → import the repository.
3. Add the same environment variables in Vercel's project settings.
4. Deploy. In about a minute you get a live URL.
5. In Supabase **Authentication → URL configuration**, add your Vercel URL as the site URL so login emails link correctly.

Every push to GitHub now redeploys automatically.
@demo
**What the finished app looks like:**

- `/login`: email and password form, link to sign up.
- `/dashboard`: "Your habits", an input to add one ("Read 20 pages"), and a grid: each habit is a row, the last 7 days are columns, ticked days fill with colour, and a streak badge shows "🔥 5".
- Signed in as a second test user, the dashboard is empty: RLS working.

Total: about 4 hours, including two errors Claude Code fixed when she pasted the messages back (a missing environment variable on Vercel, and a redirect URL not added in Supabase).
@tasks
- Create the Next.js project with Claude Code and push it to GitHub (30 min)
- Create the Supabase project, run the SQL and add environment variables (35 min)
- Build auth, habits, daily checkins and streaks one step at a time, testing each (110 min)
- Test with two accounts to confirm data is private (15 min)
- Deploy to Vercel, add environment variables and the Supabase redirect URL (40 min)
@deliverable
A live full-stack habit tracker with sign-up, a private database and automatic deployments.
@tip
When deployment fails, open the build logs in Vercel and paste the first red error into Claude Code. Nine times out of ten it's a missing environment variable.

## D19 | MCP: connect AI to your tools, and build your own server | 4 | MCP
@goal Understand the Model Context Protocol, connect existing MCP servers to Claude, and build and connect a small MCP server of your own.
@lesson
**MCP (Model Context Protocol)** is an open standard, introduced by Anthropic in 2024, for connecting AI applications to tools and data. Think of it like **USB-C for AI**: one standard plug that lets any compatible AI app use any compatible tool.

{{fig:ai-mcp|A host app runs MCP clients; each client talks to one MCP server; each server wraps a real system.}}

### The parts

- **Host:** the AI app you use, such as Claude (web, desktop or mobile), Claude Code, Cursor and other apps that support MCP.
- **MCP client:** the connector inside the host that talks to one server.
- **MCP server:** a small program that exposes a system (GitHub, Google Drive, a database, your own app) in a standard way.

A server can offer:

- **Tools:** actions the AI can take (`create_issue`, `send_message`, `get_orders`).
- **Resources:** data the AI can read (files, records).
- **Prompts:** ready-made instructions for common tasks.

### Why it matters

Before MCP, every AI app needed a custom integration for every tool. Now a tool builds **one** MCP server and it works in many AI apps. For you, that means Claude can work directly with your files, calendar, code, databases and business apps.

### Using existing servers

- **In Claude:** add connectors from the connectors directory in settings; many popular apps are there. You can also add a **custom connector** with a remote MCP server URL.
- **In Claude Desktop:** you can also run **local** servers on your computer, configured in the app's developer settings.
- **In Claude Code:** add servers with the `claude mcp add` command.

Only connect servers you trust. A server can read and act on whatever you give it access to.

### Build your own server (Python)

You'll make a tiny "shop helper" with two tools. Install `uv` (a Python project manager), then:

```bash
uv init shop-helper
cd shop-helper
uv add "mcp[cli]"
```

Create `server.py`:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("shop-helper")

ORDERS = {
    "1001": "Shipped. Arriving Thursday.",
    "1002": "Processing. Ships tomorrow.",
}

@mcp.tool()
def order_status(order_id: str) -> str:
    """Look up the status of a customer order by its number."""
    return ORDERS.get(order_id, "No order found with that number.")

@mcp.tool()
def shipping_estimate(weight_kg: float, country: str) -> str:
    """Estimate the shipping cost for a parcel to a country."""
    base = 9.0 if country.lower() in ("canada", "us", "usa", "united states") else 15.0
    return f"Estimated shipping: ${base + weight_kg * 4:.2f}"

if __name__ == "__main__":
    mcp.run()
```

The **docstrings matter**: they're how the AI knows when to use each tool.

### Test it

```bash
uv run mcp dev server.py
```

This opens the **MCP Inspector** in your browser, where you can call each tool by hand.

### Connect it

**Claude Code:**

```bash
claude mcp add shop-helper -- uv --directory /full/path/to/shop-helper run server.py
```

**Claude Desktop:** in the developer settings, edit the config file and add:

```json
{
  "mcpServers": {
    "shop-helper": {
      "command": "uv",
      "args": ["--directory", "/full/path/to/shop-helper", "run", "server.py"]
    }
  }
}
```

Restart the app. Then ask: *"What's the status of order 1002, and what would it cost to ship a 1.5 kg parcel to Canada?"* Claude calls both of your tools and answers.

### Where to go next

Replace the fake `ORDERS` dictionary with a real data source: a Supabase table, a Google Sheet, your store's API. That's how businesses give AI safe, specific access to their own systems.
@demo
**A restaurant owner's real use.**

She connects Claude to her Google Drive and calendar through connectors, and builds a small MCP server that reads today's reservations from her booking database (read-only).

Morning prompt: *"Check today's reservations and the prep list in Drive. Tell me the busiest hour, any large groups and anything on the prep list that doesn't match the bookings."*

Claude calls her reservation tool, reads the prep sheet from Drive and gives a five-line briefing. She made the server read-only on purpose, so the AI can't change bookings.
@tasks
- Add one connector to Claude from the directory and use it for a real task (30 min)
- Install uv and create the shop-helper server (35 min)
- Test both tools in the MCP Inspector (25 min)
- Connect the server to Claude Code or Claude Desktop and use it in a conversation (40 min)
- Add a third tool of your own (for example, a product price lookup) and test it (50 min)
@deliverable
A working MCP server you built, connected to Claude and answering real questions.
@tip
Start every custom server read-only. Add tools that change data only after you're confident, and make them ask for confirmation in their descriptions.

# M6 | Automation & earning | Automate repetitive work and turn your new skills into income.

## D20 | Automations and AI agents | 3.5 | Automations
@goal Build automations that connect your apps and use AI steps, and understand what AI agents are and how to use them safely.
@lesson
Automation tools connect apps so that when something happens in one, something happens in another, without you lifting a finger. Add an AI step in the middle, and the automation can read, write and decide.

### The three main tools

- **Zapier:** easiest to start, huge app library, built-in AI steps.
- **Make:** visual builder, more control over complex flows, good value.
- **n8n:** powerful and flexible, can be self-hosted, popular with technical users and for AI agent workflows.

### How an automation is built

Every automation has:

1. **Trigger:** what starts it (new email, new form submission, new order, a schedule).
2. **Actions:** what happens next (create a row, send a message, call an AI model).
3. **Filters and paths:** conditions (only if the order is over $100, or if the AI classifies the email as urgent).

### Five automations worth building

1. **Enquiry triage:** new email → AI classifies (sales / support / spam) and drafts a reply → saves draft and notifies you.
2. **Lead capture:** website form → add to a sheet or CRM → AI writes a personalised first reply → send after your approval.
3. **Content repurposing:** new blog post or video transcript → AI writes 5 social posts → saves them to a content calendar.
4. **Review responses:** new Google review → AI drafts a reply in your voice → you approve and post.
5. **Weekly report:** every Monday → collect numbers from your sales and ads tools → AI writes a summary → email to you.

### Agents

An **AI agent** is an AI that can plan and take several steps with tools to reach a goal, instead of answering once. Claude Code is an agent for software. Research modes are agents for research. Automation tools let you build simple agents for business tasks.

Rules for agents:

- Give them **clear goals and limits**.
- Start with **read-only** or **draft-only** permissions.
- Keep a **human approval step** before anything is sent, paid, deleted or published.
- Log what they do, so you can check.

### Prompts inside automations

The AI step needs a prompt like any other, but it runs unattended, so be extra clear:

- Define the exact output format (e.g. one word: SALES, SUPPORT or SPAM).
- Give examples.
- Tell it what to do when unsure ("If unclear, output REVIEW").
@demo
**Enquiry triage in Zapier (45 minutes to build).**

- **Trigger:** new email in the business inbox.
- **AI step:** *"Classify this email as BOOKING, CATERING, COMPLAINT, SUPPLIER or OTHER. Output only the label. If unsure, output OTHER."*
- **Paths:** CATERING → AI drafts a reply using the catering price list and creates a Gmail draft; COMPLAINT → sends an alert to her phone; SUPPLIER → labels the email; others → no action.

In the first week it sorted 140 emails. She corrected 6 classifications and added two examples to the prompt.
@tasks
- Create a free account on Zapier, Make or n8n (15 min)
- Build automation #1 (enquiry triage) or the one most useful to you, with an AI step (75 min)
- Test it with five real or sample inputs and fix the prompt (40 min)
- Add a human approval step before anything is sent (30 min)
- List three more automations you'll build in the next month (20 min)
@deliverable
One working automation with an AI step and a human approval point, plus a list of the next three.
@tip
Automate tasks you've already done by hand at least ten times. You'll know the edge cases, and you'll write a much better prompt.

## D21 | Turn AI skills into income | 3 | AI skills into income
@goal Choose an AI-powered service you can sell, price it, build a small portfolio and write your 30-day plan.
@lesson
Most businesses know they should use AI but don't have the time to learn it. You now do. That gap is an opportunity.

### Services you can offer with what you've learned

| Service | What you deliver | Typical buyers |
|---|---|---|
| AI content packages | Monthly social posts, images, short videos | Cafés, salons, trades, shops |
| AI video ads | 3–5 short ads per month | E-commerce brands, local businesses |
| Voiceover and dubbing | Narration, translated versions | Course creators, YouTubers, trainers |
| Automation setup | 3–5 automations like Day 20 | Small offices, agencies, clinics |
| AI setup and training | Projects, prompt libraries, team training | Small teams |
| Simple web apps and tools | Booking tools, internal dashboards | Local businesses |
| MCP and AI integrations | Connecting AI to their data | Tech-forward businesses |

### Pick one to start

Choose a service that uses your strongest skill from this course and serves people you already know. "AI video ads for local restaurants" is better than "AI services for everyone".

### Pricing

- **Per project** for one-off work (automation setup, an app).
- **Monthly retainer** for ongoing work (content, ads). Easier to plan your income.
- Price on **value and time saved**, not on how fast AI made it. If you save a business 10 hours a month, your fee should reflect that value.
- Start with a **pilot** at a reduced price for your first 2–3 clients in exchange for permission to show the work.

### Portfolio

Use the work from this course: your prompt library, the 30-second video, the habit tracker, your MCP server. Make 2–3 **sample projects** for your chosen niche (for example, a spec ad for a local café, with their permission or clearly labelled as a concept).

### Finding clients

1. Your existing network: tell 20 people what you now offer.
2. Local businesses: a short, specific message with a sample made for them.
3. Content: post what you make and how you made it.
4. Freelance platforms for early experience.

### Be honest with clients

Tell clients you use AI tools, explain how you check quality, and agree on ownership and licences of generated content.
@demo
**A graduate's offer after the course:**

> **AI Video Ads for Restaurants**
> 4 short ads a month (15–30 seconds) for Reels and TikTok, made with your real photos plus AI shots, voiceover and captions. One planning call, two rounds of changes.
> Pilot price for the first 3 restaurants: $350/month for 3 months. Standard: $600/month.

She makes a concept ad for her favourite local pizzeria (clearly labelled as a concept), sends it with a short message, and gets two pilot clients in three weeks.
@tasks
- Choose your service and niche and write a one-paragraph offer (30 min)
- Set your pilot and standard prices with a short reason for each (20 min)
- Create two sample projects for your niche (75 min)
- Write a 30-day plan: who you'll contact, what you'll post and your target number of pilot clients (30 min)
@deliverable
A clear offer, prices, two portfolio samples and a 30-day plan to win your first clients.
@tip
Lead with one finished example made for a specific business. A sample made for them beats any description of what you could do.
