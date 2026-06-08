# Master Business Checksheet 2026

Date: 2026-06-02  
Owner: MR.D  
North Star: `$10k MRR` từ một business line trong 12 tháng.  
Current WIP: `BDSMetro Vertical Intelligence Commerce`

## 0. Luật Điều Hành

- [ ] Một thời điểm chỉ có `1` revenue wedge active.
- [ ] `SELL > BUILD > SYSTEM`.
- [ ] Chưa có paid outcome thì không thêm tool.
- [ ] Sheets là operating surface; Supabase là source of truth.
- [ ] DAIN dùng nội bộ trước; không bán framework trước outcome.
- [ ] AI hỗ trợ sản xuất; human chịu trách nhiệm fact-check và publish.
- [ ] Ý tưởng mới đưa vào Parking Lot, không mở WIP mới trong sprint.

## 1. Bảng Điều Khiển Tuần

Week: `____ / ____ / 2026`  
Một outcome cần bán tuần này: `________________________________`  
ICP tuần này: `broker / agency / developer / buyer`  
Offer tuần này: `_______________________________________________`

| KPI | Target tuần | Actual | Pass? |
|---|---:|---:|---|
| Buyer interviews | 5 |  | [ ] |
| Partner interviews | 5 |  | [ ] |
| Outbound conversations | 20 |  | [ ] |
| Sales calls | 5 |  | [ ] |
| Paid pilots | 1 |  | [ ] |
| Qualified leads | 5 |  | [ ] |
| Appointments | 2 |  | [ ] |
| Data-backed posts | 3 |  | [ ] |
| Remotion short videos | 3 |  | [ ] |
| Revenue | `________ VND` |  | [ ] |

Cuối tuần:

- [ ] Viết 3 objections phổ biến nhất.
- [ ] Chỉ ra 1 bottleneck lặp lại đáng automate.
- [ ] Chốt 1 quyết định: `continue / change offer / change ICP / stop`.
- [ ] Không systemize nếu chưa có paid outcome.

## 2. Daily Check: 15 Phút

Ngày: `____ / ____ / 2026`

- [ ] Việc quan trọng nhất hôm nay tạo ra lead, appointment hoặc revenue.
- [ ] Follow up toàn bộ lead nóng trước khi build.
- [ ] Publish hoặc hoàn thành ít nhất 1 asset có original data.
- [ ] Ghi nguồn và fact-check trước publish.
- [ ] Ghi conversion mới vào Supabase hoặc Sheet tạm.
- [ ] Ghi 1 insight khách hàng hoặc objection mới.
- [ ] Tắt việc không phục vụ wedge hiện tại.

## 3. Gate 1: SELL - Ngày 1-14

Outcome mặc định:

```text
Qualified metro apartment appointment
```

- [ ] Chọn đúng `1` ICP.
- [ ] Viết offer một câu: `________________________________________`.
- [ ] Chọn lead magnet: `project scorecard / station battle / price tracker`.
- [ ] Thực hiện 10 buyer interviews.
- [ ] Thực hiện 10 partner interviews.
- [ ] Chào bán pilot thủ công.
- [ ] Close 1 paid pilot.
- [ ] Deliver thủ công bằng tools hiện có.
- [ ] Không build multi-tenant SaaS.
- [ ] Không mở LLC chỉ để setup cho đẹp.

Gate:

```text
Có 1 paid pilot?
YES -> sang Gate 2.
NO  -> đổi ICP hoặc offer; không build thêm software.
```

## 4. Gate 2: PROVE - Ngày 15-45

- [ ] Publish 10 bài original data-backed.
- [ ] Publish 10 Remotion short videos.
- [ ] Track: `traffic -> lead -> qualified -> appointment -> transaction`.
- [ ] Ghi rõ nguồn lead và campaign UTM.
- [ ] Ghi objections và bước delivery bị lặp.
- [ ] Close 3 paying partners hoặc chứng minh direct advisory revenue.
- [ ] Xác nhận workflow nào lặp lại ở ít nhất 3 khách.
- [ ] Chốt pricing thử nghiệm: setup, monthly, outcome fee.

Gate:

```text
Có 3 khách trả tiền và 1 workflow lặp lại?
YES -> sang Gate 3.
NO  -> tiếp tục manual hoặc stop productization.
```

## 5. Gate 3: SYSTEMIZE - Ngày 46-90

- [ ] Automate đúng bottleneck đã lặp lại.
- [ ] Dùng Cloudflare Workers, Workflows hoặc Queues khi cần durable execution.
- [ ] Dùng n8n cho back-office glue và low-risk workflow.
- [ ] Giữ Supabase Postgres là source of truth.
- [ ] Thêm audit trail cho action quan trọng.
- [ ] Thêm human approval trước publish, outreach hoặc conversion-critical action.
- [ ] Tạo weekly outcome report cho từng partner.
- [ ] Đo cost trên mỗi lead, appointment và revenue.
- [ ] Chỉ cân nhắc micro-SaaS khi 3-5 khách trả tiền cho cùng workflow.

Gate:

```text
Trajectory có thể đạt $10k MRR trong 12 tháng?
YES -> tăng distribution và productize.
NO  -> narrow offer; không thêm platform complexity.
```

## 6. MMO Revenue Stack

Funnel mặc định:

```text
Original niche data
  -> content + short video
  -> email list
  -> lead / digital product / affiliate
  -> outcome data
  -> intelligence tốt hơn
```

- [ ] Một domain mạnh trước khi nhân domain.
- [ ] Một vertical trước: BDSMetro.
- [ ] Cloudflare cho domain, CDN, Workers và R2.
- [ ] Astro hoặc site hiện tại cho SEO content.
- [ ] Supabase cho structured data và outcome.
- [ ] Sheets + Drive cho editorial queue.
- [ ] Search Console cho search demand.
- [ ] PostHog + UTM cho funnel.
- [ ] Kit cho opt-in newsletter.
- [ ] Lemon Squeezy cho digital product checkout ban đầu.
- [ ] Remotion cho branded deterministic video.
- [ ] AI-generated media chỉ là ingredient; human QA trước publish.

Monetization ladder:

- [ ] `1.` Qualified lead hoặc appointment.
- [ ] `2.` Advisory hoặc productized service.
- [ ] `3.` Digital report, template hoặc toolkit.
- [ ] `4.` Affiliate phù hợp audience intent.
- [ ] `5.` Micro-SaaS sau repeated paid demand.

Policy check trước publish:

- [ ] Không scaled AI SEO pages ít giá trị.
- [ ] Không scraped content rewrite sơ sài.
- [ ] Không thin affiliate pages.
- [ ] Không repetitive mass-produced video.
- [ ] Cold email có sender chính xác, địa chỉ hợp lệ và opt-out.

## 7. LLC Operating Stack

Hiện tại:

```text
No U.S. LLC
-> validate bằng Lemon Squeezy hoặc payment rail hiện có
```

LLC trigger:

- [ ] Có ít nhất 3 overseas recurring customers.
- [ ] Hoặc hơn 30% revenue là USD.
- [ ] Hoặc Stripe, contract hay vendor onboarding bị chặn thực tế.

Nếu chưa tick được ít nhất một trigger:

- [ ] Không mở LLC.
- [ ] Chỉ chuẩn bị CPA shortlist và formation checklist.

Khi đủ trigger:

- [ ] Tham vấn U.S. CPA biết foreign-owned single-member LLC.
- [ ] Tham vấn nghĩa vụ thuế tại nơi cư trú thuế.
- [ ] Form `Stripe Atlas Delaware LLC`.
- [ ] Setup Atlas registered agent.
- [ ] Lấy EIN.
- [ ] Apply Mercury.
- [ ] Setup Wise Business backup nếu eligible.
- [ ] Setup Stripe cho invoice, services hoặc SaaS.
- [ ] Setup QuickBooks Online.
- [ ] Tạo Google Drive folders: formation, tax, contracts, invoices, payouts.
- [ ] Lưu secrets và recovery trong 1Password.
- [ ] Lập calendar: monthly reconciliation, yearly state tax, registered agent renewal.
- [ ] Confirm nghĩa vụ `Form 5472 + pro-forma Form 1120`.
- [ ] Recheck BOI rule tại thời điểm formation.

## 8. Stack Radar: US + China

Nguyên tắc:

- [ ] Không hard-code một model provider.
- [ ] Chỉ giữ 4 production slots.
- [ ] Provider mới phải thắng internal eval mới được promote.
- [ ] Không rewrite stack chỉ vì vendor benchmark.

Production slots:

| Slot | Primary | Backup |
|---|---|---|
| Premium reasoning | GPT-5.5 | Claude Opus 4.8 |
| Daily agent | Claude Sonnet 4.6 | Gemini 3.5 Flash |
| Cheap batch | DeepSeek V4 Flash | Qwen3.7 Plus |
| Media ingredient | Wan2.7 | Seedance 2.0 / Seedream 5.0 |

Eval sprint:

- [ ] Migrate DeepSeek legacy routes trước `24/07/2026`.
- [ ] Benchmark 20 tasks: MiniMax M3.
- [ ] Benchmark 20 tasks: Qwen3.7 Plus.
- [ ] Benchmark 20 tasks: DeepSeek V4 Flash.
- [ ] Benchmark 20 tasks: Gemini 3.5 Flash.
- [ ] Benchmark 20 tasks: GPT-5.5.
- [ ] Benchmark 20 tasks: Claude Sonnet 4.6.
- [ ] Benchmark 10 media assets: Wan2.7.
- [ ] Benchmark 10 media assets: Seedance 2.0.
- [ ] Benchmark 10 media assets: GPT Image.
- [ ] Benchmark against existing Remotion workflow.
- [ ] Log: quality, latency, cost, access friction.
- [ ] Recheck MiniMax M3 weight release sau `11/06/2026`.

## 9. Investment Check: Mỗi Tháng

Đây là khung ra quyết định, không phải tư vấn tài chính cá nhân.

- [ ] Runway cá nhân và business đủ 12 tháng.
- [ ] Không dùng runway cho speculative assets.
- [ ] Majority liquid portfolio nằm ở diversified core assets phù hợp risk profile.
- [ ] AI thematic exposure có position cap rõ ràng.
- [ ] Không mua chỉ vì product ecosystem mạnh.
- [ ] Với public equities: check valuation, margins, cashflow và execution risk.
- [ ] Review watchlist: compute, networking, memory, power, grid, cooling.
- [ ] Review owned-data investment: BDSMetro data quality, audience và deal flow.
- [ ] Ưu tiên capital nơi có information advantage thực tế.

## 10. Kill List

- [ ] Không build generic chatbot SaaS.
- [ ] Không bán “AGI platform”.
- [ ] Không start với multi-agent complexity.
- [ ] Không coi offshore LLC là business model.
- [ ] Không chạy faceless farm làm core business.
- [ ] Không chạy scaled AI SEO.
- [ ] Không mở China distribution như WIP thứ hai.
- [ ] Không chạy BDSMetro, CFP và DAIN như 3 WIP ngang nhau.

## 11. Parking Lot

| Idea | Vì sao chưa làm | Trigger để mở lại |
|---|---|---|
| CFP × AI Advisory | Không chia focus 90 ngày | BDSMetro gate fail hoặc có buyer trả tiền rõ ràng |
| DAIN framework product | Chưa có outcome proof | 3-5 khách trả tiền cho cùng workflow |
| Mainland China distribution | WIP riêng, compliance riêng | US/Vietnam wedge chứng minh revenue |
| Multi-agent runtime | Chưa cần | Một paid workflow cần orchestration thực tế |
| Micro-SaaS | Build-before-sell risk | 3-5 khách trả tiền cho cùng workflow |

## 12. Tài Liệu Nguồn

- [Business + Investment Thesis](../reports/2026-06-02-business-investment-thesis.md)
- [LLC + MMO Stack](../reports/2026-06-02-llc-mmo-stack.md)
- [Stack Radar: US + China](../reports/2026-06-02-stack-radar-us-china.md)

## 13. Offer Scorecard

Chỉ active một offer có điểm cao nhất.

| Tiêu chí | Câu hỏi | Điểm 0-5 |
|---|---|---:|
| Pain | Vấn đề có gây mất tiền, mất thời gian hoặc mất deal không? |  |
| Urgency | Khách có cần xử lý trong 30 ngày không? |  |
| Budget | Người nói chuyện có quyền và ngân sách mua không? |  |
| Measurable outcome | Có đo được lead, appointment hoặc transaction không? |  |
| Manual delivery | Solo có thể deliver thủ công trong 7 ngày không? |  |
| Data moat | Mỗi lần deliver có làm data BDSMetro tốt hơn không? |  |
| Distribution fit | Content hiện tại có kéo đúng ICP không? |  |
| Repeatability | Có khả năng 3-5 khách dùng gần cùng workflow không? |  |

Offer active:

```text
ICP:
Pain:
Outcome:
Deliverables:
Setup fee:
Monthly fee:
Outcome fee:
Delivery time:
Proof:
```

Gate:

- [ ] Tổng điểm ít nhất `28/40`.
- [ ] Outcome đo được trong tối đa 30 ngày.
- [ ] Deliver thủ công trước khi automate.

## 14. Customer Discovery Log

Mỗi interview phải tạo evidence, không chỉ tạo cảm giác đã research.

### Buyer Interview

| Field | Ghi chú |
|---|---|
| Tên / ngày |  |
| Budget |  |
| Khu vực / tuyến metro quan tâm |  |
| Quyết định cần đưa ra |  |
| Nỗi đau lớn nhất |  |
| Hiện đang tìm thông tin ở đâu |  |
| Điều gì khiến họ không tin môi giới hoặc content |  |
| Rủi ro họ sợ nhất |  |
| Có trả tiền cho advisory không |  |
| Next action |  |

### Partner Interview

| Field | Ghi chú |
|---|---|
| Tên công ty / ngày |  |
| Loại partner | `broker / agency / developer` |
| Inventory active |  |
| Lead source hiện tại |  |
| Cost per lead hiện tại |  |
| Tỷ lệ qualified lead |  |
| Tỷ lệ appointment |  |
| Tỷ lệ close |  |
| Bottleneck lớn nhất |  |
| Có trả tiền cho pilot không |  |
| Next action |  |

Evidence gate:

- [ ] Có verbatim pain quote.
- [ ] Có con số hoặc range.
- [ ] Có next action cụ thể.
- [ ] Có lý do mua hoặc không mua.

## 15. Lead Funnel Tracker

Track từng lead trước khi làm dashboard.

| Date | Lead | Source | UTM | Intent | Qualified? | Appointment? | Transaction? | Revenue | Next action |
|---|---|---|---|---|---|---|---|---:|---|
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |

Review mỗi tuần:

- [ ] Top 3 source tạo qualified lead.
- [ ] Content nào tạo appointment.
- [ ] ICP nào close nhanh nhất.
- [ ] Lead rơi nhiều nhất tại bước nào.
- [ ] Một thử nghiệm funnel cho tuần tới.

## 16. Content Production Queue

### Asset Tracker

| ID | Topic | Format | Data source | CTA | Human QA | Published | Leads | Revenue |
|---|---|---|---|---|---|---|---:|---:|
|  |  | `post / short / report` |  |  | [ ] | [ ] |  |  |
|  |  | `post / short / report` |  |  | [ ] | [ ] |  |  |
|  |  | `post / short / report` |  |  | [ ] | [ ] |  |  |

### QA Trước Publish

- [ ] Có câu hỏi khách hàng cụ thể.
- [ ] Có original metro data hoặc first-hand analysis.
- [ ] Data source được ghi lại.
- [ ] Kiểm tra giá, khoảng cách, pháp lý và mốc thời gian liên quan.
- [ ] Không đưa claim không verify.
- [ ] Có CTA rõ: scorecard, call, appointment hoặc email opt-in.
- [ ] Không lặp template với giá trị thay đổi quá ít.
- [ ] Visual và narration có brand consistency.
- [ ] Có UTM hoặc source tracking.

## 17. Paid Pilot Delivery

Pilot: `________________________________`  
Customer: `_____________________________`  
Outcome: `______________________________`  
Start: `____________`  
End: `____________`

### Before Start

- [ ] Outcome và metric được ghi trong proposal.
- [ ] Scope đủ nhỏ để deliver trong 14 ngày.
- [ ] Payment term rõ.
- [ ] Customer cung cấp inventory, contact hoặc data cần thiết.
- [ ] Human owner phía customer được chỉ định.

### During Delivery

- [ ] Lead intake hoạt động.
- [ ] Qualification criteria được thống nhất.
- [ ] Follow-up thủ công chạy trước automation.
- [ ] Appointment handoff có owner.
- [ ] Mỗi exception được ghi lại.
- [ ] Mỗi bước lặp lại được đánh dấu.

### After Delivery

- [ ] Báo cáo traffic, lead, qualified lead, appointment và revenue.
- [ ] Ghi cost, thời gian và lỗi vận hành.
- [ ] Xin testimonial hoặc permission dùng case study.
- [ ] Đề xuất monthly operations hoặc stop.
- [ ] Không productize nếu workflow không lặp lại.

## 18. Automation Build Gate

Chỉ build khi tick đủ:

- [ ] Workflow đã chạy thủ công ít nhất 3 lần.
- [ ] Bottleneck làm mất ít nhất 2 giờ mỗi tuần hoặc làm mất lead.
- [ ] Input và output rõ ràng.
- [ ] Có owner chịu trách nhiệm khi agent fail.
- [ ] Có fallback thủ công.
- [ ] Có audit trail.
- [ ] Có human approval nếu publish, outreach, payment hoặc transaction-critical.
- [ ] API ổn định được ưu tiên trước computer use.
- [ ] Dùng n8n nếu low-risk glue là đủ.
- [ ] Dùng Cloudflare Workflows hoặc Queues nếu cần durability, retry hoặc state.
- [ ] Dùng Sandbox chỉ khi thật sự cần chạy code không tin cậy hoặc browser-heavy job.

Automation candidate:

| Workflow | Runs thủ công | Giờ mất / tuần | Revenue impact | Risk | Build? |
|---|---:|---:|---:|---|---|
|  |  |  |  |  | [ ] |
|  |  |  |  |  | [ ] |

## 19. LLC Formation Checklist

### Trigger Evidence

| Trigger | Evidence | Pass? |
|---|---|---|
| 3 overseas recurring customers |  | [ ] |
| Hơn 30% revenue là USD |  | [ ] |
| Payment, contract hoặc onboarding bị chặn |  | [ ] |

### CPA Questions

- [ ] Nghĩa vụ `Form 5472 + pro-forma Form 1120` cụ thể là gì?
- [ ] Owner transfer và related-party transaction cần ghi thế nào?
- [ ] Nghĩa vụ thuế tại Việt Nam hoặc nơi cư trú thuế là gì?
- [ ] Có sales-tax nexus nào ngoài Merchant of Record không?
- [ ] Contractor payments cần hồ sơ gì?
- [ ] Calendar filing và penalty là gì?
- [ ] BOI rule hiện tại có thay đổi không?

### Document Vault

- [ ] Certificate of Formation.
- [ ] Operating Agreement.
- [ ] EIN letter.
- [ ] Registered-agent agreement.
- [ ] Mercury approval và recovery.
- [ ] Wise Business approval và recovery nếu dùng.
- [ ] Stripe account recovery.
- [ ] Lemon Squeezy payout records.
- [ ] CPA contact và filing confirmation.
- [ ] Contracts, invoices, receipts và payout exports.

## 20. Model Eval Scorecard

Không promote model mới nếu chưa có log.

### Text / Agent Eval

| Model | Task set | Quality 0-5 | Latency | Cost | Tool use | Access friction | Promote? |
|---|---|---:|---:|---:|---:|---:|---|
| GPT-5.5 | 20 tasks |  |  |  |  |  | [ ] |
| Claude Sonnet 4.6 | 20 tasks |  |  |  |  |  | [ ] |
| Gemini 3.5 Flash | 20 tasks |  |  |  |  |  | [ ] |
| MiniMax M3 | 20 tasks |  |  |  |  |  | [ ] |
| Qwen3.7 Plus | 20 tasks |  |  |  |  |  | [ ] |
| DeepSeek V4 Flash | 20 tasks |  |  |  |  |  | [ ] |

### Media Eval

| Model | Asset set | Quality 0-5 | Brand control | Latency | Cost | Access friction | Promote? |
|---|---|---:|---:|---:|---:|---:|---|
| Wan2.7 | 10 assets |  |  |  |  |  | [ ] |
| Seedance 2.0 | 10 assets |  |  |  |  |  | [ ] |
| Seedream 5.0 | 10 assets |  |  |  |  |  | [ ] |
| GPT Image | 10 assets |  |  |  |  |  | [ ] |
| Remotion baseline | 10 assets |  |  |  |  |  | [ ] |

Promote gate:

- [ ] Chất lượng thắng baseline hoặc giảm cost đáng kể.
- [ ] Access và billing dùng ổn định.
- [ ] Không tạo thêm operational burden lớn hơn giá trị.
- [ ] Có fallback provider.

## 21. Investment Journal

Review vào ngày: `____ / ____ / 2026`

### Runway

| Metric | Value |
|---|---:|
| Personal monthly burn |  |
| Business monthly burn |  |
| Cash runway months |  |
| Revenue MRR |  |
| Revenue concentration lớn nhất |  |

### Thesis Review

| Theme | Thesis còn đúng? | Evidence mới | Risk mới | Action |
|---|---|---|---|---|
| AI compute, networking, memory |  |  |  |  |
| Data centre, power, grid, cooling |  |  |  |  |
| Edge runtime, security, observability |  |  |  |  |
| Vertical proprietary datasets |  |  |  |  |
| Metro real-estate intelligence |  |  |  |  |

Trước mỗi investment decision:

- [ ] Viết thesis một câu.
- [ ] Viết điều gì khiến thesis sai.
- [ ] Viết position cap.
- [ ] Viết time horizon.
- [ ] Không dùng runway.
- [ ] Chờ 72 giờ nếu quyết định đến từ hype hoặc FOMO.

## 22. Weekly Review + ADHD Guard

Review vào: `________________`

- [ ] Revenue tuần này là bao nhiêu?
- [ ] Paid outcome nào đã xảy ra?
- [ ] Khách hàng cụ thể nào đang gần mua nhất?
- [ ] Một việc nào tạo revenue tốt nhất?
- [ ] Một việc nào đang tạo dopamine nhưng không tạo evidence?
- [ ] WIP hiện tại có quá 2 không?
- [ ] Có mở tool, stack hoặc business line mới không?
- [ ] Có quyết định lớn nào cần review sau 72 giờ không?
- [ ] Tuần tới chỉ giữ một mục tiêu nào?

Decision log:

| Date | Decision | Evidence | Recheck date | Keep / reverse |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |

## 23. Monthly Reset

- [ ] Tổng hợp revenue theo line.
- [ ] Kill line không có evidence.
- [ ] Review funnel conversion.
- [ ] Review content tạo lead và content không tạo lead.
- [ ] Review data quality BDSMetro.
- [ ] Review model router cost và quality.
- [ ] Review LLC trigger.
- [ ] Review compliance calendar.
- [ ] Review investment runway.
- [ ] Chọn đúng một wedge cho 30 ngày tiếp theo.

## 24. Change Log

| Date | Update | Reason |
|---|---|---|
| 2026-06-02 | Tạo master checksheet | Gom business, MMO, LLC, stack radar và invest thành một control panel |
| 2026-06-02 | Thêm operating appendices | Giữ bản chi tiết và thêm tracker điền trực tiếp |
