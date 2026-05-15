# Chapter & Verse — Website User Manual

This guide is for **visitors**, **content editors**, and **site owners** using the Chapter & Verse marketing website and editor.

---

## 1. Overview

The site has two parts:

| Part | Who uses it | Production URL |
|------|-------------|----------------|
| **Public website** | Visitors and customers | https://chaptnverse.com |
| **Admin / editor** | Staff who update homepage copy | https://admin.chaptnverse.org |

Homepage text is stored in **Google Cloud Firestore** (not in the website code). After you edit and **Publish**, visitors see the new copy when they open the public site.

---

## 2. Public website (visitors)

### 2.1 Pages

- **Home** — `https://chaptnverse.com/`  
  Long-form page with hero, philosophy, values, testimonial, and a call-to-action section. On desktop, the header links scroll to sections on the same page (Hero, Philosophy, Charters).

- **Contact** — `https://chaptnverse.com/contact`  
  Form to send a message (name, email, message). Submissions are sent via **EmailJS** to the inbox configured in your EmailJS account.

### 2.2 Navigation

- **Desktop:** Use **Home** and **Contact** in the top bar.
- **Mobile:** Tap the menu icon (☰) to open the slide-out menu, then choose a link. Tap outside the menu or the ✕ area to close it.

### 2.3 Footer

- **Contact Us** — opens the contact page.  
- **Admin** — on the public site, this link goes to the **admin sign-in** URL (`https://admin.chaptnverse.org/sign-in` in production).  
- **Terms & Policy** — placeholder link (`#`) until you add a real policy page.

### 2.4 Contact form

1. Enter **name**, **email**, and **message**.  
2. Submit the form.  
3. On success, you should see a confirmation message.  
4. If sending fails, check your connection and try again; persistent errors may mean EmailJS keys or template IDs need updating in the project configuration (technical support).

---

## 3. Signing in (editors)

### 3.1 Where to sign in

| Environment | Sign-in URL |
|-------------|-------------|
| **Production** | https://admin.chaptnverse.org/sign-in |
| **Local development** | http://localhost:4200/sign-in |

You can also use **Admin** in the footer on the public site (it redirects to the admin host in production).

### 3.2 Credentials

Use the **email and password** created for you in the **Firebase Authentication** project (`chapter-verse-ec0ea`). If you do not have an account, ask whoever manages Firebase to create one.

### 3.3 First sign-in — change password

If your account is set to require a password change on first login, you will be sent to **Set New Password** automatically. Enter and confirm a new password, then save. You will then reach the editor.

### 3.4 Sign-in problems

| Message / situation | What to do |
|---------------------|------------|
| Invalid email or password | Check spelling; reset password in Firebase if needed. |
| Too many attempts | Wait and try again later. |
| Network / configuration error | Check internet; confirm you are on the admin URL in production. |
| Permission denied when publishing | You must be signed in; Firestore rules must allow signed-in writes (see section 5). |

---

## 4. Editor’s Console (updating homepage copy)

After sign-in you land on the **Editor’s Console** (`/editor`).

### 4.1 Main actions (top right)

| Button | What it does |
|--------|----------------|
| **Sign out** | Ends your session and returns you to sign-in. |
| **Discard** | Reverts all fields to the **last published** version and clears the server draft. |
| **Publish Changes** | Saves your edits to Firestore as the **live** homepage. Disabled when nothing has changed since the last publish. |

### 4.2 Notifications (toasts)

Short messages appear at the **bottom-right** (success, error, or info). You can dismiss them with **×**. Examples:

- Draft restored from Firestore  
- Publishing… / Published. Reload the public site to see updates.  
- Permission denied or could not publish  
- Undone / Redone / Nothing to undo  

### 4.3 Drafts (automatic)

While you type, the editor **autosaves a draft** to Firestore (`site/homePageDraft`) after a short pause. If you return later while signed in, you may see **“Draft restored from Firestore.”** — that is your unpublished work, not what visitors see until you **Publish**.

### 4.4 Undo and redo

- **↺ Undo** — steps back through recent **text changes** (up to about 45 steps).  
- **↻ Redo** — steps forward again.  
- Buttons are disabled when there is nothing to undo or redo.  

Undo/redo affect **page copy**, not the formatting toolbar alone.

### 4.5 Formatting toolbar (B, I, U, font, size, alignment)

These controls change how text **looks in the editor preview only**. They are **not saved** to the live website. Only the **words in each field** are stored and published.

To change what visitors read, edit the **text in the input boxes and text areas**, then **Publish Changes**.

### 4.6 Content sections you can edit

| Section in editor | What appears on the public home page |
|-------------------|--------------------------------------|
| **Main Headline** | Hero eyebrow, title lines, body, primary/secondary button labels |
| **Our Story** | Philosophy heading and intro |
| **Philosophy details** | Quote, quote label, paragraphs |
| **Testimonial** | Quote, name, subtitle |
| **Values & Ethos** | Four value cards (title + body each) |
| **Our Promise** | Pull quote callout (attribution line is fixed in the template) |
| **Charters CTA** | Headline, body, button label, **button link** |

**Button link** accepts:

- A path on your site, e.g. `/contact` or `#hero`  
- A full URL, e.g. `https://example.com`  
- A host without protocol, e.g. `www.example.com` (the site adds `https://`)

### 4.7 Recommended workflow

1. Sign in at the admin URL.  
2. Edit the fields you need.  
3. Use **Undo** if you make a mistake.  
4. Click **Publish Changes** and wait for the green success toast.  
5. Open **https://chaptnverse.com** in a new tab (or hard-refresh) to confirm the live copy.  

Until you publish, visitors still see the **previous published** version.

---

## 5. What visitors see vs. what editors see

```
Editor edits form  →  Draft autosaved (optional recovery)
                  →  Publish  →  Firestore `site/homePage`
Public home page  →  Reads `site/homePage`  →  Shows published copy
```

- **Discard** = throw away unpublished edits and match the last publish.  
- **Publish** = make your current form the live homepage.

---

## 6. Search engines (reference for owners)

Do **not** submit `robots.txt` in Google Search Console’s **Sitemaps** tool. Submit only XML sitemap URLs:

| Property | Submit this sitemap URL |
|----------|-------------------------|
| `https://chaptnverse.com` | `https://chaptnverse.com/sitemap.xml` |
| `https://www.chaptnverse.com` | `https://www.chaptnverse.com/sitemap-www.xml` |

Remove mistaken entries (e.g. `sitemap.xm` or `robots.txt` in the sitemaps list).

`robots.txt` is discovered automatically at:

- https://chaptnverse.com/robots.txt  
- https://www.chaptnverse.com/robots.txt  

---

## 7. Troubleshooting

### Published changes do not appear on the public site

1. Confirm you clicked **Publish Changes** and saw a **success** toast.  
2. Open the **public** URL (`chaptnverse.com`), not the admin URL.  
3. Hard-refresh the page (Ctrl+F5 on Windows, Cmd+Shift+R on Mac) or use a private window.  
4. Disable ad blockers for `firestore.googleapis.com` if the editor cannot save.

### Publish fails with permission denied

- Stay signed in on the admin site.  
- Ensure Firestore security rules are deployed (signed-in users may write `site/homePage` and `site/homePageDraft`).  
- Ask your developer to redeploy rules if needed.

### Contact form does not send

- Check all fields are filled.  
- EmailJS service must be active and template IDs must match the project environment settings.

### Editor shows old draft on load

- That is expected if you left unpublished work. **Publish** to go live, or **Discard** to revert to the last published version.

---

## 8. Quick reference — URLs

| Purpose | URL |
|---------|-----|
| Public home | https://chaptnverse.com/ |
| Public contact | https://chaptnverse.com/contact |
| Admin sign-in | https://admin.chaptnverse.org/sign-in |
| Editor (after login) | https://admin.chaptnverse.org/editor |
| Sitemap (apex) | https://chaptnverse.com/sitemap.xml |
| Sitemap (www) | https://www.chaptnverse.com/sitemap-www.xml |

---

## 9. Support contacts

- **Website / editor access:** Firebase project owner or your web developer.  
- **Contact form delivery:** EmailJS dashboard (service and template linked in the app).  
- **Domain / hosting:** Firebase Hosting and your DNS provider for `chaptnverse.com` and `admin.chaptnverse.org`.

---

*Last updated: May 2026 — matches the Chapter & Verse Angular + Firebase site.*
