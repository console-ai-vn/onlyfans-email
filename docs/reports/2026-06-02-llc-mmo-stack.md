# LLC + MMO Stack 2026

Date: 2026-06-02  
Owner: MR.D  
Status: Decision memo  
Principle: SELL > BUILD > SYSTEM

## 1. Architecture

Split the model into two independent layers:

```text
MMO revenue engine
  -> traffic
  -> owned audience
  -> offer
  -> checkout or referral
  -> customer and outcome data

LLC operating shell
  -> contracts
  -> payment rails
  -> banking
  -> bookkeeping
  -> tax and compliance
```

Do not create the LLC before the revenue engine needs it.

## 2. LLC Operating Stack

### Decision

Use three stages:

| Stage | Trigger | Entity decision |
|---|---|---|
| Validate | Before recurring USD revenue | No U.S. LLC yet |
| Operate | 3 overseas recurring customers, over 30% USD revenue, or blocked payment rails | Stripe Atlas Delaware LLC |
| Raise | External equity fundraising, employee options, or institutional investors | Delaware C Corporation |

Recommended default after trigger:

```text
Stripe Atlas Delaware LLC
```

Reason:

- Stripe Atlas supports Delaware LLC formation, EIN retrieval, registered agent, banking partner access, and pre-EIN banking and payments.
- Atlas costs $500 for formation, including the first year of registered-agent service, then $100 yearly for the registered agent.
- Delaware LLCs owe a $300 yearly state tax, due on or before June 1. They do not file an annual franchise-tax report.
- A Wyoming LLC is cheaper: $100 filing fee and a minimum $60 annual license tax. Use Wyoming only if reducing recurring cost matters more than minimizing setup friction.

### Stack

| Layer | Default | Rule |
|---|---|---|
| Formation | Stripe Atlas Delaware LLC | Activate only after revenue trigger |
| Registered agent | Atlas registered agent | Required for Delaware entity |
| EIN | Atlas / IRS | International DIY applicants cannot use the IRS online flow; use phone, fax, or mail |
| Primary banking | Mercury | Application is subject to review; international founders are supported for eligible U.S. companies |
| FX and backup rail | Wise Business | Use if eligible for multi-currency receiving and conversion |
| Card and invoice payments | Stripe | Use for services, custom checkout, or direct SaaS billing |
| Digital-product checkout | Lemon Squeezy | Merchant of Record for early digital goods and subscriptions |
| Bookkeeping | QuickBooks Online | Keep monthly reconciliation clean for the CPA |
| Tax filing | U.S. CPA familiar with foreign-owned single-member LLCs | Mandatory before formation and at filing season |
| Contracts | Standard service agreement + e-sign tool | Use for B2B pilots and contractors |
| Business identity | Domain + Google Workspace | One legal inbox, one finance inbox |
| DNS and security | Cloudflare | Domain, DNS, Access, WAF where needed |
| Secrets | 1Password | Store EIN letter, formation docs, banking recovery, API credentials |
| Records | Google Drive | One folder for formation, tax, contracts, invoices, and payouts |

### Compliance Calendar

```text
Monthly
- reconcile Stripe, Lemon Squeezy, Mercury, Wise, and expenses
- export payout and invoice evidence

Quarterly
- review tax nexus, contractor records, and cash runway

Yearly
- Delaware LLC state tax: $300, due on or before June 1
- registered-agent renewal
- CPA review
- Form 5472 attached to pro-forma Form 1120 when required
```

Important:

- A foreign-owned U.S. disregarded entity can have Form 5472 and pro-forma Form 1120 obligations.
- The IRS lists a $25,000 penalty for failure to file Form 5472 correctly or on time.
- As of the FinCEN interim final rule published on March 26, 2025, U.S.-created entities are exempt from BOI reporting. Recheck this rule at formation because regulations can change.
- A U.S. LLC does not automatically remove tax obligations in the owner's country of tax residence.

## 3. LLC Alternatives

| Approach | Strength | Weakness | Use |
|---|---|---|---|
| No LLC + Lemon Squeezy | Fastest validation, lower admin | Limited for some B2B contracts and banking | Use now |
| Stripe Atlas Delaware LLC | Lowest operating friction | Higher recurring state cost than Wyoming | Recommended after trigger |
| Wyoming LLC DIY | Lower recurring state cost | More manual setup and provider selection | Optional optimization |
| Delaware C Corporation | Best for VC and equity issuance | More overhead | Not now |

## 4. MMO Revenue Stack

### Decision

Use compliant owned-media MMO:

```text
Original niche data
  -> search and short-form content
  -> email list
  -> affiliate, digital product, or qualified lead
  -> outcome data
  -> better content and offers
```

Do not use faceless mass-production or scaled AI SEO as the core business.

### Stack

| Layer | Default | Rule |
|---|---|---|
| Niche | One vertical with data advantage | Start with BDSMetro |
| Domain and CDN | Cloudflare | One strong domain before a domain portfolio |
| Content site | Astro on Cloudflare Workers/Pages | Fast pages, clean SEO, low maintenance |
| Structured data | Supabase Postgres | One source of truth |
| Media storage | Cloudflare R2 | Store images, video assets, and exports |
| Editorial operating surface | Google Sheets + Drive | Human review before publish |
| Internal approval | Lark | Optional when a team exists |
| SEO measurement | Google Search Console | Measure real search demand |
| Funnel measurement | PostHog + UTMs | Track content -> lead -> offer -> revenue |
| Newsletter and nurture | Kit | Use opt-in sequences; do not mix with cold outbound |
| Digital-product checkout | Lemon Squeezy | Merchant of Record; bank payouts support Vietnam |
| SaaS billing later | Lemon Squeezy first, Stripe or Paddle when justified | Switch only after recurring product revenue |
| Affiliate revenue | Direct partner programs first | Add networks only where the offer fits the audience |
| Fast automation | n8n | Back-office glue and low-risk workflows |
| Durable automation | Cloudflare Workers + Workflows + Queues | Customer-facing and stateful workflows |
| Agent memory | Supabase | Store content, sources, prompts, leads, offers, and outcomes |
| AI gateway | Cloudflare AI Gateway | Route models and observe cost |

### AI Media Routing

| Work | Default | Rule |
|---|---|---|
| Research and factual draft | Gemini / OpenAI / Claude routed by task | Human verify claims |
| High-value editorial | Claude or OpenAI | Human approval required |
| Brand image and editing | GPT Image 1.5 | Use for controlled edits and brand assets |
| Batch image generation | Imagen 4 Fast | Use when cost and volume matter |
| Deterministic short video | Remotion | Core production system for branded data video |
| Generative video ingredients | Veo 3.1 | Use clips as ingredients, not as the whole product |
| Generative video experiment | Sora 2 API | Optional benchmark, not a hard dependency |

For BDSMetro:

```text
Supabase metro data
  -> Sheets editorial queue
  -> AI research draft
  -> human fact check
  -> Remotion branded video
  -> publish
  -> lead capture
  -> Supabase outcome tracking
```

## 5. Monetization Ladder

Use one audience and add monetization in this order:

| Order | Revenue type | Why |
|---:|---|---|
| 1 | Qualified lead or appointment | Fastest path to revenue |
| 2 | Advisory or productized service | Learn real customer workflow |
| 3 | Digital report, template, or toolkit | Low-cost productization |
| 4 | Relevant affiliate offers | Monetize existing intent without distracting the brand |
| 5 | Micro-SaaS | Build only after repeated paid demand |

Do not start with AdSense. Treat it as incidental revenue.

## 6. Checkout Routing

```text
Affiliate link
  -> partner checkout

Digital product or simple subscription
  -> Lemon Squeezy

B2B service
  -> contract + Stripe invoice or bank transfer

Custom SaaS with validated scale
  -> Stripe Billing or Paddle
```

Why Lemon Squeezy first:

- It acts as Merchant of Record.
- It handles sales tax, VAT, compliance, and fraud concerns for platform sales.
- It supports Vietnam bank payouts.
- It supports digital products, subscriptions, lead magnets, affiliates, and webhooks.

Use Gumroad only for a very fast test if needed. Its direct-sale fee is currently 10% + $0.50, excluding card-processing and PayPal fees.

## 7. Policy Boundaries

### Google Search

Allowed:

- Original data.
- First-hand review.
- Useful comparison tools.
- Human-reviewed AI assistance.

Avoid:

- Thousands of low-value AI pages.
- Scraped pages with minor rewriting.
- Thin affiliate pages.
- Multiple near-identical sites or doorway pages.

### YouTube

Allowed:

- A repeated visual format where the substance differs.
- Original analysis, narration, data, and story.

Avoid:

- Repetitive mass-produced videos.
- Template videos with minimal variation.
- Reused clips without substantial added value.

YouTube clarified its inauthentic-content policy on July 15, 2025 to explicitly include repetitive or mass-produced content.

### Email

- Opt-in newsletter: Kit.
- Transactional email from checkout: Lemon Squeezy initially.
- Custom SaaS transactional email: add Resend only when needed.
- Cold B2B outreach: targeted and compliant; include accurate sender information, a valid postal address, and opt-out handling.

Cloudflare covers routing and infrastructure. It does not replace a marketing-email platform.

## 8. 30-Day Action

### LLC

- Do not form the LLC yet unless one trigger is already true.
- Prepare a formation checklist and CPA shortlist.
- Reserve the business domain and standardize legal, finance, and support inboxes.

### MMO

- Pick one BDSMetro lead magnet: metro project scorecard, station battle report, or price tracker.
- Publish 10 original data-backed posts and 10 Remotion short videos.
- Capture email and buyer intent.
- Sell one paid outcome: qualified appointment, advisory call, or partner pilot.
- Track every conversion in Supabase or a temporary Sheet before automating.

Gate:

```text
No paid outcome after 30 days
  -> change offer or ICP
  -> do not add more tools
```

## 9. Sources

- [Stripe Atlas documentation](https://docs.stripe.com/atlas)
- [Delaware LLC yearly tax instructions](https://corp.delaware.gov/alt-entitytaxinstructions/)
- [Wyoming LLC filing form](https://sos.wyo.gov/Forms/Business/LLC/LLC-ArticlesOrganization.pdf)
- [Wyoming annual license-tax FAQ](https://sos.wyo.gov/faqs.aspx?root=BUS)
- [IRS: Instructions for Form 5472](https://www.irs.gov/instructions/i5472)
- [IRS: Instructions for Form SS-4](https://www.irs.gov/instructions/iss4)
- [FinCEN: Beneficial Ownership Information Reporting](https://www.fincen.gov/beneficial-ownership-information-reporting)
- [Mercury eligibility requirements](https://support.mercury.com/hc/en-us/articles/28770467511060-Eligibility)
- [Wise Business receive payments](https://wise.com/us/business/receive-money)
- [Lemon Squeezy: Payments and Merchant of Record](https://docs.lemonsqueezy.com/help/payments)
- [Lemon Squeezy: Sales tax and VAT](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat)
- [Lemon Squeezy: Supported countries](https://docs.lemonsqueezy.com/help/getting-started/supported-countries)
- [Paddle for digital products](https://developer.paddle.com/get-started/how-paddle-works/digital-products)
- [Gumroad fees](https://gumroad.com/help/article/66-gumroads-fees.html)
- [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [YouTube channel monetization policies](https://support.google.com/youtube/answer/1311392)
- [FTC CAN-SPAM compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [OpenAI image generation API](https://platform.openai.com/docs/guides/image-generation)
- [OpenAI Sora video generation API](https://platform.openai.com/docs/guides/video-generation)
- [Google Cloud Veo 3.1](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate)
- [Google Cloud Imagen 4](https://cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate-preview-06-06)
