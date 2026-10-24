# RefVision AI — Officiating Incident Methodology

## 1. Incident Detection & Prioritization

RefVision AI's incident engine monitors structured events for high-impact match triggers:
- Any challenge with physical contact registered within 3 meters of the 18-yard box demarcation line (X=83.5m).
- Ball contact with player upper limb inside the penalty area.
- Attacking goals where attacking forward and second-to-last defender are within a 50cm margin.
- Serious foul play challenges with excessive speed or high stud exposure.

---

## 2. Spatial Demarcation & Boundary Geometry

In football, under IFAB Law 12 and Law 14:
- The white line demarcating the penalty box belongs to the penalty area.
- An infraction begins where physical contact is first initiated.
- If contact begins outside the boundary line, the restart must be a direct free kick outside the area, regardless of whether player momentum carries them into the box.

### The Anchor Incident (Minute 68 Review)

In our anchor demonstration:
- Attacker Marcus Vance (APX #9) cuts across the right flank at X=83.60m, Y=49.20m.
- Defender Devon Cole (CRN #5) initiates a sliding challenge.
- The 18-yard penalty area demarcation line sits at X=83.50m.
- The initial point of physical impact is registered at X=83.60m.
- **Delta:** Exactly **10.0 cm outside the penalty box line**.
- **Correct Football Ruling:** Direct Free Kick outside the box + Yellow Card for Stopping a Promising Attack (SPA).

---

## 3. Multi-Camera Angle Ranking Algorithm

RefVision AI ranks available stadium camera angles using four weighted criteria:

1. **Collinearity (Weight 40%):** Viewpoint parallel to the boundary line in question.
   - For an 18-yard line dispute, `CAM_18YD_LEFT` has collinearity of 1.0, eliminating perspective parallax distortion.
2. **Proximity & Field of View (Weight 25%):** Distance from camera lens to the point of impact.
3. **Occlusion Index (Weight 20%):** Absence of shielding players between the lens and contact point.
4. **Shutter Speed & Resolution (Weight 15%):** Quality of optical tracking calibration.

### Camera Ranking Output for Minute 68:

| Rank | Camera Name | Score | Recommendation Reason |
| :--- | :--- | :--- | :--- |
| **#1** | **18-Yard Box Left Line Camera** | **94.2%** | **Collinear with penalty boundary line; zero line foreshortening.** |
| #2 | Referee Body-Cam (Ref-Cam) | 81.5% | Direct eye-level line of sight (14m away); demonstrates referee viewpoint. |
| #3 | Main Stadium Broadcast | 72.0% | Broad match context; however, high elevation creates parallax line distortion. |
| #4 | High Behind South Goal | 68.0% | Deep longitudinal angle; partially shielded by attacker torso. |

---

## 4. Uncertainty & Error Margins

RefVision AI explicitly calculates and states tolerances:
- At standard 60fps broadcast capture, each frame represents a 16.67 millisecond window.
- For players moving at 6.8 m/s, movement between consecutive frames is approximately 11.3 cm.
- With sub-frame interpolation and turf mark tracking, the spatial tolerance margin is **+/- 3.2 cm**.
- Because the measured contact point is +10.0 cm outside the box, the confidence that contact occurred outside the penalty area exceeds **88.5%**.
- However, the system presents this as an advisory assessment; human referee Marcus Sterling retains official authority over the final ruling.
