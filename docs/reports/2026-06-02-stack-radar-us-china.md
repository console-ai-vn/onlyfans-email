# Stack Radar: US + China

Date: 2026-06-02  
Owner: MR.D  
Status: Stack update  
Scope: Agentic AI, coding, media generation, runtime, and MMO impact.

## 1. Executive Decision

The core stack remains valid:

```text
Cloudflare       = agent operating layer
Supabase         = business memory and source of truth
Google Workspace = human operating surface
Lark             = optional approval and team surface
Remotion         = deterministic branded video assembly
LLM router       = task-specific brains
```

The update:

```text
Do not hard-code one model provider.
Add a small evaluation lane for US and China models.
Keep only 4 production model slots.
```

Recommended production slots:

| Slot | Default | Purpose |
|---|---|---|
| Premium reasoning | GPT-5.5 or Claude Opus 4.8 | Hard research, architecture, review, high-value output |
| Daily agent | Claude Sonnet 4.6 or Gemini 3.5 Flash | Routine agent workflows |
| Cheap batch | DeepSeek V4 Flash or Qwen3.7 Plus | Extraction, draft, classification, bulk processing |
| Media ingredient | Wan2.7, Seedance 2.0, Seedream 5.0 | Generated clips and images before Remotion assembly |

## 2. Real Game Changers

| Update | Market | Impact | Decision |
|---|---|---:|---|
| MiniMax M3 | China | 5/5 | Benchmark immediately |
| Qwen3.7 Plus + Wan2.7 | China | 5/5 | Add to MMO media and cheap-batch evaluation |
| DeepSeek V4 Pro / Flash | China | 4/5 | Migrate legacy DeepSeek routes before July 24, 2026 |
| Claude Opus 4.8 + Dynamic Workflows | US | 4/5 | Use for hardest build and review work |
| Cloudflare Agent Cloud + Sandbox GA | US | 4/5 | Keep Cloudflare as runtime; add sandbox only when needed |
| GPT-5.5 + GPT-Realtime-2 | US | 4/5 | Premium brain; voice lead qualification experiment later |
| Gemini 3.5 Flash + Gemini Omni | US | 4/5 | Use Flash in eval lane; watch Omni API availability |
| Doubao Seed 2.0 + Seedance 2.0 + Seedream 5.0 | China | 4/5 | Benchmark media quality; watch access friction |

## 3. United States Radar

### OpenAI

Verified updates:

- GPT-5.5 launched on April 23, 2026 and became available in the API on April 24.
- OpenAI positions GPT-5.5 for agentic coding, computer use, research, data analysis, documents, and spreadsheets.
- Workspace agents launched on April 22 for repeatable team workflows.
- Codex desktop expanded on April 16 with computer use, plugins, automations, memory preview, image generation, browser iteration, and multi-agent workflows.
- GPT-Realtime-2 launched on May 7 with GPT-5-class reasoning for realtime voice.
- OpenAI models, Codex, and Amazon Bedrock Managed Agents entered limited preview on AWS on April 28.

Decision:

```text
GPT-5.5 = premium completion model
GPT-Realtime-2 = optional voice qualification pilot
Workspace agents = internal ops experiment, not core product dependency
```

### Anthropic

Verified updates:

- Claude Sonnet 4.6 launched on February 17 with a 1M context window in API beta and stronger computer use.
- Claude Opus 4.8 launched on May 28 at the same regular API price as Opus 4.7: $5 input and $25 output per million tokens.
- Opus 4.8 added dynamic workflows in Claude Code research preview: hundreds of parallel subagents in one session with output verification.
- The Messages API now accepts system entries inside the messages array, enabling permission, budget, and environment updates mid-task without breaking prompt cache.
- Anthropic acquired Stainless on May 18. Stainless generates SDKs, CLIs, and MCP servers.

Decision:

```text
Sonnet 4.6 = strong daily operator
Opus 4.8 = hardest architecture, migration, and review work
Dynamic workflows = useful for coding factory, not MMO runtime
```

### Google

Verified updates:

- At Google I/O on May 19, Google announced Gemini 3.5 Flash, Gemini Omni, Gemini Spark, information agents in Search, and Universal Cart.
- Gemini 3.5 Flash is generally available through Gemini API in Google AI Studio, Android Studio, and Gemini Enterprise platforms.
- Gemini Omni Flash is rolling out through the Gemini app and Google Flow.
- Gemini Spark is Google's proactive personal agent powered by Gemini 3.5 and the Antigravity harness.

Decision:

```text
Gemini 3.5 Flash = evaluate as fast daily and batch brain
Gemini Omni = watch for production API availability
Google agent distribution = strategically important for consumer discovery
```

Inference:

- Universal Cart and information agents suggest that product discovery and shopping traffic will increasingly pass through agent surfaces. MMO assets need structured product data and strong first-party trust, not only SEO pages.

### Cloudflare

Verified updates:

- Containers and Sandboxes became generally available on April 13.
- Sandbox SDK gives agents isolated Linux environments with shell, filesystem, background processes, and service exposure.
- Cloudflare announced Agent Cloud updates including Dynamic Workers, an isolate-based runtime for AI-generated code, and Think, a persistence framework within Agents SDK.

Decision:

```text
Cloudflare remains the agent operating layer.
Use Sandbox for untrusted code execution or browser-heavy jobs.
Use Durable Objects, Workflows, Queues, and Supabase before adding complex multi-agent systems.
```

### xAI

Verified updates:

- Grok Build CLI entered early beta on May 25.
- Grok Voice Think Fast 1.0 API launched on April 23.
- Grok Imagine Quality Mode API launched for image generation and editing.
- xAI docs list Grok 4.3 for chat and coding, Grok Imagine for image and video, and Web Search / X Search tools for realtime data.

Decision:

```text
Grok = specialist brain for X and realtime social intelligence.
Do not make it the default brain.
```

## 4. China Radar

### MiniMax

Verified update:

- MiniMax M3 launched on June 1, 2026.
- M3 API is available now.
- MiniMax says M3 combines 1M context, native image and video understanding, desktop computer use, coding, and agentic work.
- MiniMax says M3 will publish its technical report and open-source weights within 10 days.
- MiniMax Code adds Agent Teams with producer-verifier loops and long-running autonomous work.

Vendor claim, not independently verified:

- MiniMax reports M3 surpasses GPT-5.5 and Gemini 3.1 Pro on SWE-Bench Pro and reaches frontier-level agent performance.

Decision:

```text
MiniMax M3 = highest-priority benchmark this week.
Do not route production work until internal eval passes.
Recheck weight release after June 11, 2026.
```

Why it matters:

- If vendor claims hold, premium-grade agentic coding and multimodal work becomes much cheaper and more open.
- This changes cost assumptions for a one-person agent company.

### Alibaba Cloud Model Studio

Verified updates:

- Qwen3.7 Plus launched on June 1.
- Qwen3.7 Plus supports native multimodal input, 1M context, and agentic coding. Listed pricing starts at $0.4 input and $1.6 output per million tokens.
- Qwen3.7 Max launched on May 21 for long-horizon reasoning and agent workflows.
- Wan2.7 Video launched in April. It supports audio, 1080P, multi-shot narratives, first/last frame control, continuation, and clips up to 15 seconds.
- Wan2.7 Image Pro supports 4K output, text rendering, brand-color control, character-consistent multi-image generation, and editing.
- HappyHorse 1.0 entered limited beta for cinematic and hyper-dynamic video.

Decision:

```text
Qwen3.7 Plus = evaluate for cheap multimodal batch work.
Wan2.7 = add to MMO media production benchmark.
Wan2.7 Image Pro = benchmark for branded asset batches.
HappyHorse = experiment only.
```

MMO implication:

```text
Data-backed script
  -> Wan2.7 / Seedance clip ingredients
  -> Wan2.7 Image Pro / Seedream brand images
  -> Remotion assembly
  -> human QA
  -> publish
```

### ByteDance Volcengine Ark

Verified updates:

- Ark model docs were updated on May 29.
- Ark lists Doubao Seed 2.0 as its flagship agent model for reasoning and long-chain execution.
- Ark lists Doubao Seedance 2.0 as its strongest video-generation model.
- Ark lists Doubao Seedream 5.0 as its strongest image-generation model.
- Ark provides Responses API patterns, remote MCP, context management, tool calling, model routing, and batch inference.

Decision:

```text
Seedance 2.0 + Seedream 5.0 = benchmark for China-quality media generation.
Ark = watch for regional account, billing, and compliance friction.
Do not make Ark the only media provider.
```

### DeepSeek

Verified updates:

- DeepSeek V4 Preview launched on April 24 and is open-sourced.
- DeepSeek V4 Pro and V4 Flash support 1M context, thinking and non-thinking modes, and both OpenAI and Anthropic-compatible APIs.
- Legacy names `deepseek-chat` and `deepseek-reasoner` retire on July 24, 2026.

Decision:

```text
DeepSeek V4 Flash = cheap batch and daily coding lane.
DeepSeek V4 Pro = benchmark for heavier backend work.
Migrate legacy model names before July 24, 2026.
```

### Z.AI, Kimi, and Tencent

Verified updates:

- Z.AI launched GLM-5.1 on April 7 for long-horizon agentic tasks up to 8 hours in a single run.
- GLM-5V-Turbo adds native image, video, text, and file understanding for visually grounded coding agents.
- Kimi K2.5 supports 256K context, native multimodal input, and agent-cluster collaboration.
- Tencent Cloud exposes Hunyuan video-generation APIs and expanded video workflow endpoints.

Decision:

```text
GLM-5.1 = backup coding and long-horizon benchmark.
Kimi K2.5 = watchlist.
Tencent Hunyuan = lower-priority media benchmark.
```

## 5. Revised Model Router

Keep the router small:

```text
task
  -> policy
  -> eval-approved model slot
  -> provider adapter
  -> cost and quality log
  -> human approval for high-risk actions
```

Production v1:

| Task | Primary | Secondary |
|---|---|---|
| Architecture and final review | Claude Opus 4.8 | GPT-5.5 |
| Research and high-value analysis | GPT-5.5 | Claude Opus 4.8 |
| Daily coding and agent work | Claude Sonnet 4.6 | Gemini 3.5 Flash |
| Cheap batch processing | DeepSeek V4 Flash | Qwen3.7 Plus |
| Branded image batches | Wan2.7 Image Pro | Seedream 5.0 |
| Generated video ingredients | Wan2.7 Video | Seedance 2.0 |
| Deterministic business video | Remotion | Remotion |
| Realtime X intelligence | Grok | GPT-5.5 web research |

Evaluation lane:

```text
MiniMax M3
DeepSeek V4 Pro
GLM-5.1
Qwen3.7 Max
Gemini 3.5 Flash
```

Do not add every provider to production. Promote only after a fixed internal eval wins on quality, latency, and cost.

## 6. US vs China Market Strategy

### Sell into the US

```text
US LLC when triggered
  -> Stripe / Lemon Squeezy
  -> English owned media
  -> Google, YouTube, email, X
  -> premium outcome offer
  -> use China APIs behind the scenes when quality and policy allow
```

### Use China technology

```text
China models
  -> lower cost
  -> stronger media experimentation
  -> open and compatible APIs
  -> model router
```

### Enter mainland China only later

Entering China is a separate business decision:

- Separate platform distribution: Douyin, WeChat, Xiaohongshu, and local ecosystems.
- Separate content style and operations.
- Separate account, payment, hosting, and compliance constraints.
- Likely needs a local operating partner.

Decision:

```text
Use China technology now.
Do not enter mainland-China distribution until the US/Vietnam wedge proves revenue.
```

## 7. Immediate Actions

### This week

- Migrate any DeepSeek legacy model routes to `deepseek-v4-flash` or `deepseek-v4-pro`.
- Run a 20-task internal eval against MiniMax M3, Qwen3.7 Plus, DeepSeek V4 Flash, Gemini 3.5 Flash, GPT-5.5, and Claude Sonnet 4.6.
- Run a 10-asset media benchmark: Wan2.7, Seedance 2.0, GPT Image, and existing Remotion flow.
- Keep human QA before publish.

### Do not do

- Do not rewrite the stack around MiniMax M3 based only on launch benchmarks.
- Do not add multi-agent orchestration before one paid workflow needs it.
- Do not use computer-use agents where a stable API exists.
- Do not enter China distribution as a second WIP.

## 8. Sources

### United States

- [OpenAI: Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)
- [OpenAI: Codex for almost everything](https://openai.com/index/codex-for-almost-everything/)
- [OpenAI: Workspace agents](https://openai.com/index/introducing-workspace-agents-in-chatgpt/)
- [OpenAI: Models, Codex, and Managed Agents on AWS](https://openai.com/index/openai-on-aws/)
- [OpenAI: GPT-Realtime-2](https://openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api/)
- [Anthropic: Claude Opus 4.8](https://www.anthropic.com/news/claude-opus-4-8)
- [Anthropic: Claude Sonnet 4.6](https://www.anthropic.com/news/claude-sonnet-4-6)
- [Anthropic: Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- [Anthropic acquires Stainless](https://www.anthropic.com/news/anthropic-acquires-stainless)
- [Google I/O 2026 announcements](https://blog.google/innovation-and-ai/technology/developers-tools/google-io-2026-collection/)
- [Google: Gemini Omni and Gemini 3.5 Flash](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni-3-5-videos/)
- [Cloudflare: Agent Cloud](https://www.cloudflare.com/en-gb/press/press-releases/2026/cloudflare-expands-its-agent-cloud-to-power-the-next-generation-of-agents/)
- [Cloudflare: Sandbox GA](https://blog.cloudflare.com/sandbox-ga/)
- [xAI: Grok Build CLI](https://x.ai/news/grok-build-cli)
- [xAI: Models](https://docs.x.ai/developers/models)

### China

- [MiniMax M3](https://www.minimax.io/blog/minimax-m3)
- [MiniMax API overview](https://platform.minimax.io/docs/api-reference/api-overview)
- [Alibaba Cloud Model Studio](https://modelstudio.alibabacloud.com/)
- [Alibaba Cloud: Wan2.7 video models](https://www.alibabacloud.com/help/en/model-studio/video-generate-edit-model)
- [Alibaba Cloud: Wan2.7 image models](https://www.alibabacloud.com/help/en/model-studio/image-model)
- [Volcengine Ark model list](https://www.volcengine.com/docs/82379/1554709)
- [DeepSeek V4 Preview](https://api-docs.deepseek.com/news/news260424)
- [DeepSeek API change log](https://api-docs.deepseek.com/updates/)
- [Z.AI GLM-5.1](https://docs.z.ai/guides/llm/glm-5.1)
- [Kimi K2.5](https://platform.moonshot.ai/docs/guide/kimi-k2-5-quickstart)
- [Tencent Hunyuan video API](https://cloud.tencent.com/document/product/1616/107795)
