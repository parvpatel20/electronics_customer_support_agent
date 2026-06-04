# TechCart AI — Electronics Customer Support Agent

An AI-powered customer support assistant built for electronics stores. Customers can log in, ask questions about their orders, get help with billing, request returns, and get technical product support — all through a clean chat interface.

**Live Demo:** [electronics-customer-support-agent.vercel.app](https://electronics-customer-support-agent.vercel.app/)

**GitHub:** [github.com/parvpatel20/electronics_customer_support_agent](https://github.com/parvpatel20/electronics_customer_support_agent)

---

## What It Does

- **Order Tracking** — Check order status, delivery updates, and invoice details in real time
- **Billing Support** — Resolve payment disputes and get invoice clarifications instantly
- **Returns & Refunds** — Initiate returns, check refund eligibility, and track RMA status
- **Technical Help** — Get product specs, compatibility info, and warranty status using AI-powered product knowledge
- **Smart Routing** — The system automatically figures out what type of support you need and routes you to the right specialist agent
- **Safe Refund Approvals** — Refunds go through a human approval step before processing, so nothing slips through automatically

---

## Why TechCart AI?

Most support chatbots give you scripted answers that don't actually solve your problem. TechCart AI is different:

- **It knows your data.** Connected to real order history, invoices, and return records — not just generic FAQs
- **It routes intelligently.** A triage agent reads your message and decides whether billing, technical, or returns handles it — no endless menus
- **It understands your products.** Product manuals and past support tickets are indexed so it can answer specific technical questions accurately
- **It's safe by design.** Sensitive actions like refunds require human approval before going through
- **It remembers context.** Conversation history is maintained so you don't have to repeat yourself

Whether you're a customer checking on a delayed shipment or asking why your GPU isn't compatible with your motherboard — TechCart AI handles it in one place.

---

## Deployment & Keep-Alive

The frontend is deployed on Vercel and talks to a FastAPI backend (default: Railway). Some hosts spin services down after a period of inactivity, which would make the live demo fail with `fetch failed` until the next request re-wakes the container.

Two layers of keep-alive are configured so this doesn't happen:

1. **GitHub Actions cron** — `.github/workflows/keep-alive.yml` pings the backend `/health` every 10 minutes. This is the primary defense and works even when nobody is browsing the site.
2. **In-app health ping** — `frontend/src/useKeepAlive.js` makes a `no-cors` `GET /health` every 5 minutes while the frontend is open in a browser tab. Defense in depth.

**One-time setup for the GitHub Actions cron:**

1. Make sure the backend is deployed and reachable at `<your-backend-url>/health`.
2. In this GitHub repo, go to **Settings → Secrets and variables → Actions**.
3. Add a repository secret:
   - **Name:** `BACKEND_HEALTH_URL`
   - **Value:** `https://electronics-customer-support-agent.onrender.com/health`
4. The workflow will start running on its next 10-minute window. You can also trigger it manually from the **Actions** tab → **Keep backend alive** → **Run workflow**.

To change the ping frequency, edit the `cron` expression in `.github/workflows/keep-alive.yml` (e.g. `*/5 * * * *` for every 5 minutes).
