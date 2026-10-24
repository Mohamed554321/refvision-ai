import random
from typing import List, Tuple, Dict, Any
from app.schemas.events import (
    Match, Team, Player, PlayerPosition, MatchEvent, EventType, MatchStatus, FieldCoordinates
)
from app.schemas.incidents import (
    Incident, IncidentType, IncidentReviewStatus, CameraEvidence, CameraType,
    CandidateInterpretation, StructuredExplanation
)

def create_teams() -> Tuple[Team, Team]:
    apex_players = [
        Player(player_id="APX_01", jersey_number=1, display_name="Lucas Mercer", display_name_ar="لوكاس ميرسر", team_id="APX", position=PlayerPosition.GK),
        Player(player_id="APX_02", jersey_number=2, display_name="Tariq Al-Mansoor", display_name_ar="طارق المنصور", team_id="APX", position=PlayerPosition.DEF),
        Player(player_id="APX_04", jersey_number=4, display_name="Kieran Vance", display_name_ar="كيران فانس", team_id="APX", position=PlayerPosition.DEF),
        Player(player_id="APX_05", jersey_number=5, display_name="Mateo Silva", display_name_ar="ماتيو سيلفا", team_id="APX", position=PlayerPosition.DEF),
        Player(player_id="APX_03", jersey_number=3, display_name="Jonas Dahl", display_name_ar="يوناس داهل", team_id="APX", position=PlayerPosition.DEF),
        Player(player_id="APX_06", jersey_number=6, display_name="Callum Brooks", display_name_ar="كالوم بروكس", team_id="APX", position=PlayerPosition.MID),
        Player(player_id="APX_08", jersey_number=8, display_name="Zayd Hamdan", display_name_ar="زيد حمدان", team_id="APX", position=PlayerPosition.MID),
        Player(player_id="APX_10", jersey_number=10, display_name="Adrian Ruiz", display_name_ar="أدريان رويز", team_id="APX", position=PlayerPosition.MID),
        Player(player_id="APX_07", jersey_number=7, display_name="Liam Gallagher", display_name_ar="ليام غالاغر", team_id="APX", position=PlayerPosition.FWD),
        Player(player_id="APX_09", jersey_number=9, display_name="Marcus Vance", display_name_ar="ماركوس فانس", team_id="APX", position=PlayerPosition.FWD),
        Player(player_id="APX_11", jersey_number=11, display_name="Hassan Noor", display_name_ar="حسن نور", team_id="APX", position=PlayerPosition.FWD),
    ]

    crown_players = [
        Player(player_id="CRN_01", jersey_number=1, display_name="Erik Lindqvist", display_name_ar="إريك ليندكفيست", team_id="CRN", position=PlayerPosition.GK),
        Player(player_id="CRN_02", jersey_number=2, display_name="Darius Boyd", display_name_ar="داريوس بويد", team_id="CRN", position=PlayerPosition.DEF),
        Player(player_id="CRN_05", jersey_number=5, display_name="Devon Cole", display_name_ar="ديفون كول", team_id="CRN", position=PlayerPosition.DEF),
        Player(player_id="CRN_04", jersey_number=4, display_name="Nasser Al-Hadi", display_name_ar="ناصر الهادي", team_id="CRN", position=PlayerPosition.DEF),
        Player(player_id="CRN_03", jersey_number=3, display_name="Stefan Ristic", display_name_ar="ستيفان ريستيتش", team_id="CRN", position=PlayerPosition.DEF),
        Player(player_id="CRN_06", jersey_number=6, display_name="Nico Barella", display_name_ar="نيكو باريلا", team_id="CRN", position=PlayerPosition.MID),
        Player(player_id="CRN_08", jersey_number=8, display_name="Sami Khedir", display_name_ar="سامي خضير", team_id="CRN", position=PlayerPosition.MID),
        Player(player_id="CRN_10", jersey_number=10, display_name="Julian Sterling", display_name_ar="جوليان ستيرلينغ", team_id="CRN", position=PlayerPosition.MID),
        Player(player_id="CRN_07", jersey_number=7, display_name="Rafael Costa", display_name_ar="رافاييل كوستا", team_id="CRN", position=PlayerPosition.FWD),
        Player(player_id="CRN_09", jersey_number=9, display_name="Dante Morata", display_name_ar="دانتي موراتا", team_id="CRN", position=PlayerPosition.FWD),
        Player(player_id="CRN_11", jersey_number=11, display_name="Farid Benali", display_name_ar="فريد بن علي", team_id="CRN", position=PlayerPosition.FWD),
    ]

    home_team = Team(
        team_id="APX",
        name="Apex Vanguard FC",
        name_ar="أبيكس فانغارد",
        short_code="APX",
        primary_color="#00FF87",
        secondary_color="#0B132B",
        players=apex_players
    )

    away_team = Team(
        team_id="CRN",
        name="Crown Meridian FC",
        name_ar="كراون ميريديان",
        short_code="CRN",
        primary_color="#3A86FF",
        secondary_color="#FFFFFF",
        players=crown_players
    )

    return home_team, away_team

def generate_synthetic_events(seed: str = "MATCH_PL_2026_01") -> List[MatchEvent]:
    rng = random.Random(seed)
    events: List[MatchEvent] = []

    # 00:00 Kickoff
    events.append(MatchEvent(
        event_id="EVT_0001",
        match_id=seed,
        timestamp_seconds=0.0,
        minute=0,
        second=0,
        event_type=EventType.KICKOFF,
        team_id="APX",
        player_id="APX_09",
        coordinates=FieldCoordinates(x=50.0, y=50.0),
        event_attributes={"action": "First half kickoff", "action_ar": "ضربة البداية للشوط الأول"}
    ))

    # Construct narrative timeline with deterministic football events
    scripted_anchors = [
        # (minute, second, type, team, player, related_player, x, y, attrs, noteworthy)
        (3, 15, EventType.PASS, "APX", "APX_08", "APX_10", 45.0, 52.0, {"length_m": 16.5, "speed_ms": 14.2}, False),
        (5, 40, EventType.TACKLE, "CRN", "CRN_06", "APX_10", 58.0, 48.0, {"success": True, "duel_type": "ground"}, False),
        (8, 22, EventType.PASS, "CRN", "CRN_10", "CRN_09", 64.0, 32.0, {"pass_type": "through_ball"}, False),
        (12, 5, EventType.SHOT, "APX", "APX_09", "CRN_01", 82.0, 54.0, {"shot_type": "right_foot_curl", "xg": 0.28, "saved": True}, True),
        (15, 30, EventType.INTERCEPTION, "APX", "APX_04", "CRN_07", 35.0, 70.0, {"recovery": True}, False),
        (19, 12, EventType.FOUL, "CRN", "CRN_05", "APX_09", 62.0, 45.0, {"foul_type": "tripping", "foul_type_ar": "عرقلة"}, False),
        (23, 44, EventType.PASS, "APX", "APX_06", "APX_11", 70.0, 20.0, {"cross": True}, False),
        (28, 14, EventType.GOAL, "APX", "APX_09", "APX_11", 94.0, 50.0, {"scorer": "Marcus Vance", "assist": "Hassan Noor", "xg": 0.72}, True),
        (33, 50, EventType.SHOT, "CRN", "CRN_09", "APX_01", 16.0, 48.0, {"shot_type": "header", "xg": 0.19, "on_target": False}, False),
        (38, 20, EventType.YELLOW_CARD, "APX", "APX_02", "CRN_11", 30.0, 15.0, {"reason": "Tactical pull", "reason_ar": "شد تكتيكي"}, True),
        (42, 10, EventType.CORNER, "CRN", "CRN_08", None, 100.0, 100.0, {"in_swinger": True}, False),
        (45, 0, EventType.POSSESSION_CHANGE, "CRN", "CRN_10", None, 50.0, 50.0, {"turnover": True}, False),
        # Second half
        (48, 30, EventType.PASS, "CRN", "CRN_04", "CRN_08", 40.0, 45.0, {"length_m": 22.0}, False),
        (52, 18, EventType.TACKLE, "APX", "APX_08", "CRN_10", 52.0, 51.0, {"success": True}, False),
        (56, 42, EventType.GOAL, "CRN", "CRN_10", "CRN_07", 92.0, 48.0, {"scorer": "Julian Sterling", "assist": "Rafael Costa", "xg": 0.65}, True),
        (61, 15, EventType.FOUL, "APX", "APX_06", "CRN_06", 48.0, 53.0, {"foul_type": "pushing", "foul_type_ar": "دفع"}, False),
        (65, 30, EventType.SHOT_BLOCKED, "APX", "APX_07", "CRN_05", 81.0, 42.0, {"blocker": "Devon Cole"}, False),
        # CONTROVERSIAL INCIDENT 1: 67:45 - The Anchor Demo Incident
        (67, 45, EventType.TACKLE, "CRN", "CRN_05", "APX_09", 83.6, 49.2, {
            "is_incident_trigger": True,
            "incident_type": "PENALTY_AREA_CONTACT",
            "contact_point_x": 83.6,  # Just 0.1m outside the 83.5m penalty box boundary!
            "contact_point_y": 49.2,
            "speed_at_impact_ms": 6.8,
            "referee_initial_signal": "PLAY_ON",
            "var_recommendation": "ON_FIELD_REVIEW_RECOMMENDED"
        }, True),
        (68, 10, EventType.VAR_REVIEW, "CRN", "CRN_05", "APX_09", 83.6, 49.2, {
            "review_type": "PENALTY_OR_FREE_KICK_CHECK",
            "var_duration_seconds": 65.0
        }, True),
        (72, 0, EventType.SUBSTITUTION, "CRN", "CRN_07", None, 50.0, 0.0, {"player_off": "CRN_07", "player_on": "CRN_14"}, False),
        # INCIDENT 2: 76:15 - Potential Handball Check
        (76, 15, EventType.HANDBALL_CHECK, "APX", "APX_04", "CRN_09", 12.5, 46.0, {
            "is_incident_trigger": True,
            "incident_type": "POTENTIAL_HANDBALL",
            "distance_struck_m": 1.4,
            "arm_silhouette": "NATURAL_COMPACT",
            "referee_ruling": "NO_PENALTY"
        }, True),
        (80, 20, EventType.SHOT, "APX", "APX_10", "CRN_01", 79.0, 52.0, {"shot_type": "long_range", "saved": True}, False),
        # INCIDENT 3: 84:10 - Potential Offside Check
        (84, 10, EventType.OFFSIDE, "CRN", "CRN_09", "APX_04", 88.5, 47.0, {
            "is_incident_trigger": True,
            "incident_type": "POTENTIAL_OFFSIDE_GOAL",
            "margin_cm": 4.2,
            "tracking_status": "PARTIAL_CALIBRATION",
            "referee_ruling": "OFFSIDE_CONFIRMED"
        }, True),
        (88, 45, EventType.FOUL, "CRN", "CRN_02", "APX_11", 75.0, 18.0, {"foul_type": "cynical_trip"}, False),
        (90, 0, EventType.YELLOW_CARD, "CRN", "CRN_02", None, 75.0, 18.0, {"reason": "Persistent infringement"}, True),
    ]

    event_counter = 2
    for m in range(0, 93):
        # Add background rhythm passes, duels, touches to reach 180+ realistic match events
        if m % 2 == 0 and not any(a[0] == m for a in scripted_anchors):
            team_id = "APX" if (m % 4 == 0) else "CRN"
            events.append(MatchEvent(
                event_id=f"EVT_{event_counter:04d}",
                match_id=seed,
                timestamp_seconds=float(m * 60 + rng.randint(5, 55)),
                minute=m,
                second=rng.randint(0, 59),
                event_type=EventType.PASS,
                team_id=team_id,
                player_id=f"{team_id}_{rng.choice(['06','08','10','07','11'])}",
                coordinates=FieldCoordinates(x=float(rng.randint(20, 80)), y=float(rng.randint(15, 85))),
                event_attributes={"flow": "open_play"}
            ))
            event_counter += 1

        # Check if an anchor exists for this minute
        for anchor in scripted_anchors:
            if anchor[0] == m:
                events.append(MatchEvent(
                    event_id=f"EVT_{event_counter:04d}",
                    match_id=seed,
                    timestamp_seconds=float(anchor[0] * 60 + anchor[1]),
                    minute=anchor[0],
                    second=anchor[1],
                    event_type=anchor[2],
                    team_id=anchor[3],
                    player_id=anchor[4],
                    related_player_id=anchor[5],
                    coordinates=FieldCoordinates(x=anchor[6], y=anchor[7]),
                    event_attributes=anchor[8],
                    is_noteworthy=anchor[9]
                ))
                event_counter += 1

    # Ensure strictly sorted by timestamp_seconds
    events.sort(key=lambda e: e.timestamp_seconds)
    return events

def create_initial_incidents(events: List[MatchEvent]) -> List[Incident]:
    """Generates the structured officiating incidents tied directly to the match events."""
    incidents: List[Incident] = []

    # Incident 1: 67:45 Penalty Area Boundary Contact (The Main Anchor Incident)
    inc_1 = Incident(
        incident_id="INC_68_PEN_CHECK",
        match_id="MATCH_PL_2026_01",
        minute=67,
        second=45,
        timestamp_seconds=67 * 60 + 45.0,
        incident_type=IncidentType.PENALTY_AREA_CONTACT,
        involved_player_ids=["APX_09", "CRN_05"],  # Marcus Vance & Devon Cole
        involved_team_id="CRN",
        source_event_ids=["EVT_0018", "EVT_0019"],
        coordinates={"x": 83.6, "y": 49.2, "boundary_threshold_x": 83.5},
        initial_flag_reason="High-speed sliding challenge on attacking forward right on the perimeter of the 18-yard penalty area.",
        initial_flag_reason_ar="تدخل انزلاقي عالي السرعة على المهاجم عند الحد الخارجي مباشرة لمنطقة الجزاء (18 ياردة).",
        preliminary_assessment="Initial contact initiated at field coordinate X=83.6, exactly 0.10 meters outside the 18-yard penalty box white line (X=83.50). While attacker momentum carried him into the box, IFAB Law 12 dictates foul location is determined where physical contact begins.",
        preliminary_assessment_ar="بدأ الالتحام المبدئي عند الإحداثي س=83.6، أي على بُعد 10 سنتيمترات خارج خط منطقة الجزاء تماماً (س=83.50). ومع استمرار حركة المهاجم للداخل، ينص القانون 12 لمجلس الإيفاب على أن مكان المخالفة يُحدد بنقطة بدء الالتحام الفعلي.",
        confidence_rating=88.5,
        confidence_rationale="High confidence on outside-box initial contact point via 18-Yard Left Angle (synchronized at 60fps). Some uncertainty remains regarding whether foot contact preceded hip collision.",
        confidence_rationale_ar="درجة موثوقية عالية بأن نقطة بدء الالتحام خارج المنطقة عبر زاوية الـ 18 ياردة اليسرى المتزامنة. يبقى هناك عدم يقين طفيف حول ما إذا كان تلامس القدمين سبق اصطدام الورك.",
        review_status=IncidentReviewStatus.FLAGGED,
        evidence_items=[
            CameraEvidence(
                evidence_id="EVD_CAM_01",
                incident_id="INC_68_PEN_CHECK",
                camera_id="CAM_18YD_LEFT",
                camera_name="18-Yard Box Left Line Camera",
                camera_name_ar="كاميرا خط الـ 18 ياردة الأيسر",
                camera_type=CameraType.EIGHTEEN_YARD_BOX_LEFT,
                timestamp_start_seconds=4060.0,
                timestamp_end_seconds=4072.0,
                sync_offset_ms=0.0,
                field_coverage="Down-the-line collinear view of the 18-yard boundary",
                field_coverage_ar="رؤية مستقيمة ومحاذية تماماً لخط منطقة الـ 18 ياردة",
                occlusion_level="Low",
                visibility_score=94.2,
                is_recommended=True,
                recommendation_reason="Collinear with the penalty box demarcation line; zero occlusion of boot-to-shin point of impact.",
                recommendation_reason_ar="متعامدة ومحاذية لخط منطقة الجزاء؛ خالية من أي حجب لنقطة التقاء الحذاء بالساق.",
                simulated_perspective_url="/evidence/sim_18yd_left.png",
                key_observation="Devon Cole's trailing right boot clips Marcus Vance's left heel at X=83.6, turf mark visible outside white boundary.",
                key_observation_ar="حذاء ديفون كول الأيمن يلامس كعب ماركوس فانس الأيسر عند س=83.6، وعلامة النجيل ظاهرة بوضوح خارج الخط الأبيض.",
                limitations="Standard 60fps tracking introduces a 16.6ms shutter window; micro-flexion of the boot could range +/- 3cm.",
                limitations_ar="سرعة التصوير 60 إطار/ثانية تنتج نافذة تعريض 16.6 مللي ثانية؛ قد يكون هناك هامش انحناء مقداره +/- 3 سم."
            ),
            CameraEvidence(
                evidence_id="EVD_CAM_02",
                incident_id="INC_68_PEN_CHECK",
                camera_id="CAM_MAIN_BROADCAST",
                camera_name="Main Stadium Broadcast",
                camera_name_ar="البث الرئيسي للملعب",
                camera_type=CameraType.MAIN_BROADCAST,
                timestamp_start_seconds=4058.0,
                timestamp_end_seconds=4074.0,
                sync_offset_ms=0.0,
                field_coverage="Wide pitch perspective from West Upper Stand",
                field_coverage_ar="منظور عريض للملعب من المدرج الغربي العلوي",
                occlusion_level="Moderate",
                visibility_score=72.0,
                is_recommended=False,
                recommendation_reason="Offers full match context and player approach speed, but perspective angle foreshortens line distance.",
                recommendation_reason_ar="يوفر السياق العام للعب وسرعة انطلاق اللاعبين، لكن زاوية المنظور تشوه المسافة الدقيقة للخط.",
                simulated_perspective_url="/evidence/sim_main_broadcast.png",
                key_observation="High pace challenge; defender lunges from side-rear as forward cuts inside.",
                key_observation_ar="تدخل سريع للغاية؛ المدافع يندفع من الجانب الخلفي أثناء توغل المهاجم للداخل.",
                limitations="Parallax angle makes it appear inside the area from elevated camera position.",
                limitations_ar="اختلاف زاوية الرؤية (البارالاكس) يُظهر التدخل كأنه داخل المنطقة بسبب ارتفاع الكاميرا."
            ),
            CameraEvidence(
                evidence_id="EVD_CAM_03",
                incident_id="INC_68_PEN_CHECK",
                camera_id="CAM_REF_BODY",
                camera_name="Referee Body-Worn Camera (Ref-Cam)",
                camera_name_ar="كاميرا جسم الحكم (ريف كام)",
                camera_type=CameraType.REFEREE_BODY_CAM,
                timestamp_start_seconds=4062.0,
                timestamp_end_seconds=4070.0,
                sync_offset_ms=4.0,
                field_coverage="Referee eye-level direct point-of-view (14m away)",
                field_coverage_ar="رؤية مباشرة من زاوية عين الحكم (على بُعد 14 متراً)",
                occlusion_level="Low",
                visibility_score=81.5,
                is_recommended=False,
                recommendation_reason="Demonstrates what human referee Marcus Sterling saw in real time with line of sight.",
                recommendation_reason_ar="توضح بدقة ما شاهده الحكم ماركوس ستيرلينغ في الوقت الفعلي مع خط رؤية مباشر.",
                simulated_perspective_url="/evidence/sim_ref_cam.png",
                key_observation="Ref view confirms clear tripping contact with no play on the ball.",
                key_observation_ar="رؤية الحكم تؤكد وجود تلامس عرقلة واضح بدون لمس الكرة.",
                limitations="Dynamic body motion introduces minor motion blur at instantaneous contact millisecond.",
                limitations_ar="حركة الجري الديناميكية تُحدث ضبابية طفيفة في جزء الألف من الثانية أثناء التلامس."
            )
        ],
        candidate_interpretations=[
            CandidateInterpretation(
                interpretation_id="INT_01",
                title="Direct Free Kick Outside Box + Yellow Card",
                title_ar="ركلة حرة مباشرة خارج المنطقة + بطاقة صفراء",
                likelihood="Supported by Evidence",
                supporting_arguments=[
                    "Point of initial physical contact is at X=83.6, which is 10cm outside the 18-yard box line (X=83.50).",
                    "Challenge is reckless and does not make genuine contact with the ball.",
                    "Attacking teammate was tracking in support, meaning DOGSO criteria for red card is mitigated to SPA (Stopping a Promising Attack)."
                ],
                supporting_arguments_ar=[
                    "نقطة التلامس البدني الأولى تقع عند س=83.6، أي 10 سم خارج خط منطقة الجزاء (س=83.50).",
                    "التدخل يتسم بالتهور ولم يلمس الكرة إطلاقاً.",
                    "وجود زميل مدافع آخر يقلل تصنيف حرمان فرصة محققة (DOGSO) إلى إيقاف هجمة واعدة (SPA)، مما يوجب إنذاراً فقط."
                ],
                counter_arguments=[
                    "Attacker fell into the penalty area, which frequently leads to subjective pressure from crowd/broadcasters."
                ],
                counter_arguments_ar=[
                    "سقوط المهاجم داخل منطقة الجزاء يثير ضغطاً جماهيرياً وإعلامياً لاحتساب ركلة جزاء."
                ],
                applicable_law="IFAB Law 12 (Fouls & Misconduct) and Law 14 (Penalty Kick demarcation)",
                applicable_law_ar="القانون 12 للإيفاب (الأخطاء وسوء السلوك) والقانون 14 (تحديد مكان ركلة الجزاء)"
            ),
            CandidateInterpretation(
                interpretation_id="INT_02",
                title="Penalty Kick (Continuous Foul into Box)",
                title_ar="ركلة جزاء (مخالفة مستمرة داخل المنطقة)",
                likelihood="Less Likely",
                supporting_arguments=[
                    "If holding/contact is judged to continue inside the penalty box, IFAB guidelines permit a penalty kick."
                ],
                supporting_arguments_ar=[
                    "إذا تم تقدير أن المسك أو التلامس استمر وتواصل داخل منطقة الجزاء، تجيز توجيهات الإيفاب احتساب ركلة جزاء."
                ],
                counter_arguments=[
                    "Camera 18-Yard Left confirms a single trip impact rather than sustained holding; secondary contact in box was merely momentum fall."
                ],
                counter_arguments_ar=[
                    "تؤكد كاميرا الـ 18 ياردة أن التدخل كان عرقلة واحدة محددة وليس مسكاً مستمراً؛ التلامس اللاحق كان مجرد سقوط بحكم الاندفاع."
                ],
                applicable_law="IFAB Law 12 Section 1 (Continuing contact across boundary)",
                applicable_law_ar="القانون 12 للإيفاب، البند 1 (استمرار الالتحام عبر خط المنطقة)"
            )
        ],
        created_at_iso="2026-10-24T23:00:00Z",
        updated_at_iso="2026-10-24T23:00:00Z"
    )

    # Incident 2: 76:15 Potential Handball Check
    inc_2 = Incident(
        incident_id="INC_76_HANDBALL_CHECK",
        match_id="MATCH_PL_2026_01",
        minute=76,
        second=15,
        timestamp_seconds=76 * 60 + 15.0,
        incident_type=IncidentType.POTENTIAL_HANDBALL,
        involved_player_ids=["APX_04", "CRN_09"],
        involved_team_id="APX",
        source_event_ids=["EVT_0023"],
        coordinates={"x": 12.5, "y": 46.0},
        initial_flag_reason="Appeals for handball after close-range blast from Dante Morata strikes Kieran Vance's right arm.",
        initial_flag_reason_ar="مطالبات بلمسة يد بعد تسديدة قريبة المدى من دانتي موراتا تصطدم بذراع كيران فانس اليمنى.",
        preliminary_assessment="Ball struck arm from only 1.4 meters distance while defender's arm was tucked close to torso (silhouette not unnaturally enlarged). No deliberate movement towards ball.",
        preliminary_assessment_ar="اصطدمت الكرة بالذراع من مسافة 1.4 متر فقط والذراع مضمومة للجسد دون تضخيم غير طبيعي للجسد، مع انعدام أي حركة متعمدة نحو الكرة.",
        confidence_rating=91.0,
        confidence_rationale="High proximity (1.4m) and compact posture verify no infraction under IFAB Law 12 handball definitions.",
        confidence_rationale_ar="المسافة القريبة جداً والوضعية الطبيعية للذراع تؤكدان عدم وجود مخالفة حسب تعريفات لمسة اليد بالقانون 12.",
        review_status=IncidentReviewStatus.FLAGGED,
        evidence_items=[],
        candidate_interpretations=[],
        created_at_iso="2026-10-24T23:00:00Z",
        updated_at_iso="2026-10-24T23:00:00Z"
    )

    # Incident 3: 84:10 Potential Offside Goal
    inc_3 = Incident(
        incident_id="INC_84_OFFSIDE_CHECK",
        match_id="MATCH_PL_2026_01",
        minute=84,
        second=10,
        timestamp_seconds=84 * 60 + 10.0,
        incident_type=IncidentType.POTENTIAL_OFFSIDE_GOAL,
        involved_player_ids=["CRN_09", "APX_04"],
        involved_team_id="CRN",
        source_event_ids=["EVT_0025"],
        coordinates={"x": 88.5, "y": 47.0},
        initial_flag_reason="Assistant referee raised flag on Dante Morata header into net.",
        initial_flag_reason_ar="مساعد الحكم يرفع الراية بداعي تسلل دانتي موراتا إثر ضربة رأسية سكنت الشباك.",
        preliminary_assessment="Attacker Dante Morata shoulder line is 4.2cm ahead of second-last defender Kieran Vance boot line at moment of pass delivery.",
        preliminary_assessment_ar="خط كتف المهاجم دانتي موراتا متقدم بمقدار 4.2 سم عن حذاء المدافع قبل الأخير كيران فانس لحظة لعب الكرة.",
        confidence_rating=82.0,
        confidence_rationale="Optical frame synchronization aligns with ball release point, confirmed offside position.",
        confidence_rationale_ar="المزامنة البصرية للإطارات تتطابق مع لحظة خروج الكرة وتؤكد صحة قرار التسلل.",
        review_status=IncidentReviewStatus.FLAGGED,
        evidence_items=[],
        candidate_interpretations=[],
        created_at_iso="2026-10-24T23:00:00Z",
        updated_at_iso="2026-10-24T23:00:00Z"
    )

    incidents.extend([inc_1, inc_2, inc_3])
    return incidents
