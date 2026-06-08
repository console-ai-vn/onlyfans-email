# Business + Investment Thesis 2026

Date: 2026-06-02  
Owner: MR.D  
Status: Decision memo  
North Star: Reach $10k MRR from one business line within 12 months.

## 1. Executive Decision

Do not build a generic AI platform. Do not treat offshore LLC as the business model.

Build one closed-loop vertical outcome engine:

```text
Metro data
  -> original content and short video
  -> lead capture
  -> qualification
  -> broker/advisor handoff
  -> appointment or transaction
  -> outcome data
  -> better intelligence
```

Recommended wedge:

```text
BDSMetro Vertical Intelligence Commerce
```

Use the engine internally first. Sell the same workflow as a productized service to brokers, agencies, or developers only after it creates measurable outcomes for BDSMetro.

Business sequence:

```text
Owned media
  -> qualified leads
  -> advisory and referral revenue
  -> productized B2B workflow
  -> proprietary outcome data
  -> Vertical System of Intelligence
```

## 2. What The Market Is Saying

### Evidence

- The U.S. Census Bureau estimated AI use across firms at roughly 18%, or 32% when weighted by employment. Firms expected adoption to rise further within six months. Sales and marketing was the most common use case at 52%.
- Upwork reported AI-related work GSV grew 40% year over year in Q1 2026. AI Integration and Automation was its largest AI-related subcategory and grew more than 50%.
- Upwork's 2026 skills report showed strong 2025 growth in AI video generation and editing (+329%), AI integration (+178%), AI annotation and labeling (+154%), AI image generation and editing (+95%), and AI chatbot development (+71%).
- Malt's 2026 tech trends report showed demand for AI Agent skills up roughly 60x, n8n demand up roughly 14x, and RAG demand up roughly 3x.
- Fiverr's H2 2025 search data showed AI automation searches up 136% and AI video creator searches up 66%. Faceless YouTube creator searches rose 488%, but this is demand evidence, not a durable moat.
- Cloudflare reported Q1 2026 revenue up 34% year over year. Its ecosystem is strategically relevant, but its results also show why infrastructure exposure must be evaluated with valuation and execution discipline: GAAP operating loss remained and gross margin declined.
- The IEA expects data-centre electricity demand to more than double to around 945 TWh by 2030. AI infrastructure is also a power, grid, and cooling story.

### Inference

Task execution is becoming cheaper. Value is moving upward:

```text
task execution
  -> integration and orchestration
  -> domain workflow
  -> permissions, audit, and human approval
  -> distribution and trust
  -> outcome ownership
```

The opportunity is not "AI content". The opportunity is a closed loop that turns distribution into measurable business outcomes and proprietary data.

## 3. Three Business Approaches

| Approach | Time to revenue | Moat | Complexity | Decision |
|---|---:|---:|---:|---|
| Generic AI automation agency | Fast | Low | Medium | Use only as temporary cashflow if needed |
| BDSMetro media and lead-gen asset | Medium | High | Medium | Good core asset |
| BDSMetro vertical outcome engine | Medium | Very high | Medium-high | Recommended |

Why the third option wins:

- Reuses existing BDSMetro domain knowledge, metro data, content capability, and video skills.
- Can monetize before SaaS through advisory, referral, lead qualification, and B2B setup fees.
- Builds proprietary outcome data that generic agents and generic SaaS do not have.
- Creates a path from service to software without building software before demand.

## 4. Productized Offer

### Initial B2C outcome

```text
Help apartment buyers understand:
- which metro projects fit their budget
- how pricing compares
- actual distance and access to stations
- liquidity, legal, delay, and developer risk
- next best action
```

Revenue options:

- Qualified lead referral.
- Advisory fee for high-intent buyers or investors.
- Transaction success fee where legally and operationally appropriate.

### Initial B2B offer

```text
AI Revenue Engine for metro real estate

- data-backed content and short video
- lead intake
- qualification
- CRM sync
- follow-up
- appointment handoff
- daily outcome report
```

Pricing hypothesis:

- Pilot setup: 10-30m VND.
- Monthly operations: 8-25m VND.
- Optional outcome fee: qualified appointment or transaction.

Do not build a multi-tenant SaaS until 3-5 customers pay for substantially the same workflow.

## 5. Stack Decision

```text
Cloudflare       = agent operating layer
Supabase         = business memory and source of truth
Google Workspace = internal identity and human operating surface
Lark             = team chat, approval, and bot surface if needed
OpenAI / Claude / Gemini / China models
                 = routed brains by task, quality, and cost
Vercel AI SDK    = optional model abstraction or chat UI
```

Rules:

- Keep one source of truth: Supabase Postgres.
- Use Sheets as an operating surface, not the database.
- Use DAIN internally first. Do not sell the framework before selling an outcome.
- Use Cloudflare where it removes operating burden. Do not force every concern into one vendor.

## 6. Offshore LLC Decision

Offshore LLC is a payment and legal wrapper, not an advantage by itself.

Create it only when one trigger is true:

- 3 recurring overseas customers.
- More than 30% of revenue is USD.
- Stripe, contracts, or vendor onboarding is materially blocked without it.

Risk:

- A foreign-owned U.S. disregarded entity can have Form 5472 and pro-forma Form 1120 filing obligations.
- Failure to file Form 5472 can trigger a $25,000 penalty.

Action:

- Get U.S. CPA advice and home-country tax advice before formation.

## 7. Capital Allocation

### Business capital: next 90 days

| Bucket | Allocation | Purpose |
|---|---:|---|
| Distribution and sales | 40% | Original metro content, outreach, partnerships, sales calls |
| Data asset | 25% | Project, station, price, legal, and outcome data quality |
| Manual delivery | 20% | Concierge research, qualification, follow-up, learning |
| Automation | 10% | Automate only repeated bottlenecks |
| Legal and experiments | 5% | Contracts, compliance, small tests |

### Personal investment framework

This is a default framework, not personalized financial advice.

1. Protect 12 months of personal and business runway first.
2. Keep the majority of liquid investment capital in diversified core assets appropriate to risk profile and jurisdiction.
3. Cap thematic AI exposure. Prefer baskets and position limits over concentrated conviction bets.
4. Treat speculative assets as experiments, not runway.
5. Invest the highest-risk capital where there is information advantage: owned data, distribution, and deal flow around metro real estate.

### Investment watchlist themes

| Theme | Why it matters | Main risk |
|---|---|---|
| AI compute, networking, and memory | Model demand increases infrastructure load | Cyclicality, valuation, geopolitics |
| Data centres, power, grid, cooling | AI demand becomes physical infrastructure demand | Capex, regulation, long cycles |
| Edge runtime, security, observability | Agents need execution, permissions, and monitoring | Platform competition, pricing |
| Vertical proprietary datasets | Scarce data compounds with usage | Slow data collection, execution |
| Metro real-estate intelligence | Direct domain and distribution advantage | Legal status, delays, liquidity |

Cloudflare is a research candidate, not an automatic buy. A strong product ecosystem does not override valuation, margins, and execution risk.

## 8. Risk Register

| Risk | Level | Mitigation |
|---|---|---|
| Building platform before revenue | High | Manual delivery first; automate repeated work only |
| AI content farm dependency | High | Original data, expert judgment, branded distribution |
| SaaS wrapper with no moat | High | Own workflow and outcome data |
| LLC setup distraction | Medium | Activate only after revenue trigger |
| Cold email compliance and reputation | Medium | Targeted outreach, opt-out, honor CAN-SPAM rules |
| Google or YouTube policy risk | Medium | Avoid scaled low-value pages and repetitive mass content |
| Too many business lines | High | One 90-day wedge: BDSMetro outcome engine |

## 9. 90-Day Action Plan

### Days 1-14: Sell

- Define one paid outcome: qualified metro apartment appointments.
- Choose one ICP: brokers, agencies, or developers with active inventory near metro lines.
- Conduct 10 buyer interviews and 10 partner interviews.
- Sell one paid pilot before building new platform features.
- Manually deliver the full workflow using existing tools.

Gate:

```text
1 paid pilot
or change ICP / offer
Do not build more software.
```

### Days 15-45: Prove

- Publish original metro data content and short videos.
- Track traffic -> lead -> qualified lead -> appointment -> transaction.
- Record objections and repeated delivery steps.
- Close 3 paying partners or prove direct advisory revenue.

Gate:

```text
3 paying customers
and one repeated workflow
or stop productization.
```

### Days 46-90: Systemize

- Automate the repeated bottlenecks with Cloudflare, Supabase, and routed models.
- Add permissions, audit trail, and human approval at conversion-critical steps.
- Produce a weekly outcome report for each partner.
- Decide whether USD demand justifies offshore LLC setup.

Gate:

```text
Revenue trajectory supports $10k MRR within 12 months
or narrow the offer again.
```

## 10. Kill List

- Do not sell "AGI platform".
- Do not build generic chatbot SaaS.
- Do not start with multi-agent complexity.
- Do not run scaled AI SEO or faceless content farms as the core business.
- Do not open offshore LLC before a revenue or payment trigger.
- Do not run BDSMetro, CFP, and DAIN as three equal WIPs.

## 11. Sources

- [U.S. Census Bureau: Tracking Firm Use of AI in Real Time](https://www.census.gov/library/working-papers/2026/adrm/CES-WP-26-25.html)
- [Upwork Q1 2026 shareholder letter](https://investors.upwork.com/node/12971/pdf)
- [Upwork: In-Demand Skills 2026](https://investors.upwork.com/news-releases/news-release-details/upworks-demand-skills-2026-demand-top-ai-skills-more-doubles-ai)
- [Malt Tech Trends 2026](https://www.malt.com/resources/trends/malt-tech-trends/)
- [Malt Tech Trends 2026 mini report](https://pages.malt.com/hubfs/Malt-Tech-Trends-2026/Malt-Tech-Trends-2026-Mini-Report-EN.pdf)
- [Fiverr Fall 2025 Business Trends Index](https://www.fiverr.com/news/2025-fall-business-trends-index)
- [Cloudflare Q1 2026 results](https://www.cloudflare.net/news/news-details/2026/Cloudflare-Announces-First-Quarter-2026-Financial-Results/default.aspx)
- [IEA: Energy and AI](https://www.iea.org/reports/energy-and-ai)
- [a16z: From System of Record to System of Intelligence](https://a16z.com/from-system-of-record-to-system-of-intelligence/)
- [a16z: Is Software Losing Its Head?](https://a16z.com/is-software-losing-its-head/)
- [Stripe and Metronome: The future of billing](https://stripe.com/blog/metronome-stripe-building-the-future-of-billing)
- [IRS: Instructions for Form 5472](https://www.irs.gov/instructions/i5472)
- [FTC: CAN-SPAM compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [YouTube monetization policies](https://support.google.com/youtube/answer/1311392)
