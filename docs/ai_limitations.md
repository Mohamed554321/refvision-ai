# RefVision AI — AI Limitations & Responsible Officiating Principles

## 1. Non-Authoritative AI Disclosure

RefVision AI is an assistive decision-support platform.
- **AI is NOT an official referee:** The system never issues official rulings, overturns decisions on its own, or acts with legal authority in a football match.
- **Human Authority is Supreme:** Under IFAB Law 5, the referee on the field of play has the final authority on all facts connected with play. RefVision AI surfaces evidence and interpretations solely to aid human deliberation.

---

## 2. Technical Limitations & Data Gaps

Every sports analytics and computer vision model operates with physical and data limitations. RefVision AI explicitly presents these limitations to users rather than hiding them behind inflated certainty numbers:

1. **Frame Shutter Latency (60fps Limit):**
   - Standard stadium cameras capture at 60 frames per second (16.6ms per frame).
   - In rapid physical collisions, the precise microsecond of boot-on-shin impact may occur between frames.
   - RefVision AI quantifies this physical constraint as a +/- 3cm tolerance interval.

2. **Absence of In-Ball Pressure Telemetry:**
   - In synthetic simulations where ball micro-sensor tracking (inertial measurement units - IMUs) is offline, handball proximity is derived from optical tracking rather than direct pressure waveforms.
   - When telemetry is missing, the system emits an explicit status:
     > *"In-ball micro-sensor telemetry unavailable for this match. Contact timing estimated from optical tracking."*

3. **Occlusion & Parallax Distortion:**
   - Single-angle broadcast cameras from high stadium tiers distort linear distance due to perspective foreshortening (parallax).
   - RefVision AI actively identifies foreshortening risks and steers officials away from parallax-distorted cameras.

4. **Hallucination Prevention:**
   - The platform separates deterministic calculations (rolling possession, goal tallies, spatial coordinates) from language model generation.
   - Agent 7 (Supervisor & Quality Gate) verifies that all claims reference valid event identifiers (`EVT_XXXX`) before displaying them.
