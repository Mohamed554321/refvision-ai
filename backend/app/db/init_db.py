import json
from datetime import datetime
from app.db.session import engine, SessionLocal, Base
from app.db.models import (
    DataSource, DatasetImport, Competition, Season, Team, Player, Match,
    MatchLineup, MatchEvent, Incident, EvidenceItem, RuleReference,
    KnowledgeDocument, FanGame, UserProfile, AuditEvent
)


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Data Sources
        if not db.query(DataSource).filter_by(id="SRC_STATSBOMB").first():
            src_sb = DataSource(
                id="SRC_STATSBOMB",
                source_name="StatsBomb Open Data",
                source_url="https://github.com/statsbomb/open-data",
                license="CC BY 4.0",
                attribution="StatsBomb Open Data repository (https://statsbomb.com). Free for non-commercial research & education with attribution.",
                is_active=True
            )
            src_ifab = DataSource(
                id="SRC_IFAB",
                source_name="IFAB Laws of the Game 2025/26",
                source_url="https://www.theifab.com/laws/2025-26/",
                license="Official Football Rules (Public Reference)",
                attribution="The International Football Association Board (IFAB). Official Laws of the Game & VAR Protocol.",
                is_active=True
            )
            src_syn = DataSource(
                id="SRC_SYNTHETIC_PL",
                source_name="RefVision Synthetic PL Simulator",
                source_url="https://github.com/microsoft/insidethegamehackathon",
                license="Hackathon Research License",
                attribution="Synthetic realistic match event generator tailored for officiating decision support and VAR testing.",
                is_active=True
            )
            db.add_all([src_sb, src_ifab, src_syn])

        # 2. Knowledge Documents (IFAB Laws & VAR Protocol)
        if not db.query(RuleReference).filter_by(id="LAW_12_DFK").first():
            rules = [
                RuleReference(
                    id="LAW_12_DFK",
                    law_number="Law 12",
                    section="Fouls and Misconduct - Direct Free Kick & Penalty Area Boundary",
                    title_en="Direct Free Kick & Boundary Clause",
                    title_ar="الركلة الحرة المباشرة وبند حدود منطقة الجزاء",
                    summary_en="A direct free kick is awarded if a player commits a tackle or challenge in a careless, reckless, or excessive force manner. The penalty area boundary line is considered part of the penalty area. If contact begins outside the boundary line, the restart must be a direct free kick outside the area, regardless of where momentum carries the player.",
                    summary_ar="تُمنح ركلة حرة مباشرة عند ارتكاب عرقلة أو التحام بإهمال أو تهور أو إفراط في القوة. تُعتبر خطوط منطقة الجزاء جزءاً من المنطقة. إذا بدأ الالتحام خارج خط الحدود، فإن الاستئناف يكون بركلة حرة مباشرة خارج المنطقة بصرف النظر عن مكان سقوط اللاعب بعد ذلك.",
                    full_text_en="IFAB Law 12.1: A direct free kick is awarded if a player commits any of the following offences against an opponent in a manner considered by the referee to be careless, reckless or using excessive force: charges, jumps at, kicks, pushes, strikes, tackles or challenges, trips. Penalty area boundary clause: The lines demarcating the penalty area belong to the penalty area. If contact occurs on the line, it is inside; if initial contact occurs outside the line, play restarts with a direct free kick outside the area.",
                    full_text_ar="قانون إيفاب 12.1: تُمنح ركلة حرة مباشرة إذا ارتكب لاعب أياً من المخالفات الآتية: الشحن، الركل، الدفع، العرقلة بإهمال أو تهور. بند حدود منطقة الجزاء: الخطوط المحددة لمنطقة الجزاء جزء منها، وإذا بدأ الالتحام خارج الخط يُستأنف اللعب بركلة حرة مباشرة خارج المنطقة.",
                    official_source_url="https://www.theifab.com/laws/2025-26/fouls-and-misconduct/",
                    relevance_keywords="tackle, penalty, boundary, direct free kick, line, box, contact",
                    edition="2025/2026"
                ),
                RuleReference(
                    id="LAW_12_HANDBALL",
                    law_number="Law 12",
                    section="Handling the Ball",
                    title_en="Handling the Ball - Body Silhouette & Proximity",
                    title_ar="لمس الكرة باليد - محيط الجسد والمسافة",
                    summary_en="It is an offence if a player touches the ball with hand/arm when it has made their body unnaturally bigger. A player whose arm is in a natural position resulting from their body movement for that specific action is not penalised.",
                    summary_ar="تُعتبر لمسة يد إذا لمس اللاعب الكرة بيد أو ذراع جعلت جسده أكبر بشكل غير طبيعي. لا يُعاقب اللاعب إذا كانت الذراع في وضع طبيعي تبرره حركة الجسد في تلك الحالة.",
                    full_text_en="IFAB Law 12.1: It is an offence if a player touches the ball with their hand/arm when it has made their body unnaturally bigger. A player is considered to have made their body unnaturally bigger when the position of their hand/arm is not a consequence of, or justifiable by, the player's body movement for that specific situation.",
                    full_text_ar="قانون إيفاب 12.1: يعد لمس الكرة باليد مخالفة إذا جعل اللاعب جسده أكبر بشكل غير طبيعي ولم تكن الذراع في موضع يبرره مسار حركة الجسد.",
                    official_source_url="https://www.theifab.com/laws/2025-26/fouls-and-misconduct/",
                    relevance_keywords="handball, arm, silhouette, unnatural, deflection, proximity",
                    edition="2025/2026"
                ),
                RuleReference(
                    id="LAW_11_OFFSIDE",
                    law_number="Law 11",
                    section="Offside Position & Active Involvement",
                    title_en="Offside - Interfering with Play & Opponent",
                    title_ar="التسلل - التداخل في اللعب والمنافس",
                    summary_en="A player is in an offside position if any part of the head, body or feet is nearer to the opponents' goal line than both the ball and second-last opponent. Hands and arms are not considered. Penalised only if actively involved.",
                    summary_ar="يكون اللاعب في موقف تسلل إذا كان أي جزء من رأسه أو جسده أو قدميه أقرب لخط مرمى المنافس من الكرة واللاعب قبل الأخير. لا تُحتسب الأيدي والأذرع، ويُعاقب فقط إذا شارك فعلياً في اللعب.",
                    full_text_en="IFAB Law 11: A player in an offside position at the moment the ball is played or touched by a team-mate is only penalised on becoming involved in active play by: interfering with play, interfering with an opponent, or gaining an advantage.",
                    full_text_ar="قانون إيفاب 11: يُعاقب اللاعب المتسلل لحظة لمس زميله للكرة فقط عند تداخله في اللعب أو مع المنافس أو الاستفادة من الموقف.",
                    official_source_url="https://www.theifab.com/laws/2025-26/offside/",
                    relevance_keywords="offside, line, interfering, advantage, second-last opponent",
                    edition="2025/2026"
                ),
                RuleReference(
                    id="VAR_PROTOCOL",
                    law_number="VAR Protocol",
                    section="Clear and Obvious Error Standard & Review Categories",
                    title_en="VAR Protocol - Clear and Obvious Error",
                    title_ar="بروتوكول الـ VAR - معيار الخطأ الواضح والجلي",
                    summary_en="VAR may assist the referee only in the event of a 'clear and obvious error' or 'serious missed incident' relating to: Goal/no goal, Penalty/no penalty, Direct red card, Mistaken identity. The referee always makes the final decision.",
                    summary_ar="يساعد حكم الفيديو الحكم الرئيسي فقط في حالات الخطأ الواضح والجلي أو الحالات الخطيرة غير المشاهدة المتعلقة بـ: هدف/لا هدف، ركلة جزاء/لا ركلة جزاء، بطاقة حمراء مباشرة، والخطأ في تحديد هوية اللاعب. الحكم دائماً هو صاحب القرار النهائي.",
                    full_text_en="IFAB VAR Protocol: The categories of decision/incident which may be reviewed in the event of a potential 'clear and obvious error' or 'serious missed incident' are: Goal/no goal, Penalty/no penalty, Direct red card, Mistaken identity. The original decision given by the referee will not be changed unless the video review clearly shows that the decision was a clear and obvious error.",
                    full_text_ar="بروتوكول الـ VAR: فئات المراجعة للخطأ الواضح والجلي: الهدف، ركلة الجزاء، البطاقة الحمراء المباشرة، وتحديد الهوية. لا يُلغى قرار الحكم إلا عند وجود دليل مرئي قاطع يثبت الخطأ الواضح.",
                    official_source_url="https://www.theifab.com/laws/2025-26/video-assistant-referee-var-protocol/",
                    relevance_keywords="var, protocol, clear and obvious, review, monitor, on-field review, ofr",
                    edition="2025/2026"
                )
            ]
            db.add_all(rules)

            # Knowledge documents for full-text search
            kdocs = [
                KnowledgeDocument(
                    id="DOC_IFAB_LAW_12",
                    document_type="IFAB_LAWS",
                    title="IFAB Law 12: Fouls & Misconduct",
                    title_ar="قانون إيفاب 12: الأخطاء وسوء السلوك",
                    edition="2025/2026",
                    source_url="https://www.theifab.com/laws/2025-26/fouls-and-misconduct/",
                    section="Law 12 - Disciplinary & Restart Rules",
                    content_en="Law 12 defines fouls penalised by direct free kicks (tripping, tackling, charging carelessly or recklessly). If committed inside the penalty area by a defender, a penalty kick is awarded. Crucially, the lines bounding the penalty box are part of the box. Initial point of contact determines penalty vs direct free kick.",
                    content_ar="يحدد القانون 12 مخالفات الركلة الحرة المباشرة وركلة الجزاء وبند حدود المنطقة."
                ),
                KnowledgeDocument(
                    id="DOC_IFAB_VAR_PROTOCOL",
                    document_type="VAR_PROTOCOL",
                    title="IFAB VAR Protocol & Principles",
                    title_ar="بروتوكول ومبادئ حكم الفيديو المساعد (VAR)",
                    edition="2025/2026",
                    source_url="https://www.theifab.com/laws/2025-26/video-assistant-referee-var-protocol/",
                    section="VAR Protocol 2025/26",
                    content_en="The VAR protocol sets the standard of 'clear and obvious error'. The VAR does not re-referee the game. An On-Field Review (OFR) is conducted for subjective decisions (penalty contact, red card force). Human officials retain full authority.",
                    content_ar="بروتوكول تقنية الفيديو ومعيار الخطأ الواضح والجلي وحصرية القرار النهائي للحكم البشري."
                )
            ]
            db.add_all(kdocs)

        # 3. Synthetic Matchday Seed (Apex Vanguard vs Crown Meridian - Anchor Minute 68 Demo)
        if not db.query(Team).filter_by(id="APX").first():
            t_apx = Team(
                id="APX",
                name="Apex Vanguard FC",
                name_ar="أبيكس فانغارد",
                short_code="APX",
                country="England",
                primary_color="#00FF87",
                secondary_color="#0B132B",
                is_synthetic=True
            )
            t_crn = Team(
                id="CRN",
                name="Crown Meridian FC",
                name_ar="كراون ميريديان",
                short_code="CRN",
                country="England",
                primary_color="#3A86FF",
                secondary_color="#FFFFFF",
                is_synthetic=True
            )
            db.add_all([t_apx, t_crn])
            db.commit()

            # Players for APX
            apx_players = [
                Player(id="PLY_APX_01", team_id="APX", name="Julian Vance", name_ar="جوليان فانس", jersey_number=1, position="Goalkeeper", position_ar="حارس مرمى", is_starter=True),
                Player(id="PLY_APX_04", team_id="APX", name="Kieran Vance", name_ar="كيران فانس", jersey_number=4, position="Defender", position_ar="مدافع", is_starter=True),
                Player(id="PLY_APX_08", team_id="APX", name="Mateo Silva", name_ar="ماتيو سيلفا", jersey_number=8, position="Midfielder", position_ar="لاعب وسط", is_starter=True),
                Player(id="PLY_APX_09", team_id="APX", name="Marcus Vance", name_ar="ماركوس فانس", jersey_number=9, position="Forward", position_ar="مهاجم", is_starter=True),
                Player(id="PLY_APX_10", team_id="APX", name="Darius Cole", name_ar="داريوس كول", jersey_number=10, position="Attacking Midfielder", position_ar="صانع ألعاب", is_starter=True),
            ]
            # Players for CRN
            crn_players = [
                Player(id="PLY_CRN_01", team_id="CRN", name="Oliver Sterling", name_ar="أوليفر ستيرلينغ", jersey_number=1, position="Goalkeeper", position_ar="حارس مرمى", is_starter=True),
                Player(id="PLY_CRN_05", team_id="CRN", name="Devon Cole", name_ar="ديفون كول", jersey_number=5, position="Defender", position_ar="مدافع", is_starter=True),
                Player(id="PLY_CRN_07", team_id="CRN", name="Lucas Moreno", name_ar="لوكاس مورينو", jersey_number=7, position="Winger", position_ar="جناح", is_starter=True),
                Player(id="PLY_CRN_09", team_id="CRN", name="Gabriel Santos", name_ar="غابرييل سانتوس", jersey_number=9, position="Forward", position_ar="مهاجم", is_starter=True),
                Player(id="PLY_CRN_11", team_id="CRN", name="Alexander Drake", name_ar="ألكسندر دريك", jersey_number=11, position="Midfielder", position_ar="لاعب وسط", is_starter=True),
            ]
            db.add_all(apx_players + crn_players)
            db.commit()

        # 4. Match Entity
        if not db.query(Match).filter_by(id="MATCH_PL_2026_01").first():
            m_syn = Match(
                id="MATCH_PL_2026_01",
                home_team_id="APX",
                away_team_id="CRN",
                match_date="2026-10-24",
                home_score=1,
                away_score=1,
                current_minute=68,
                current_second=0,
                status="LIVE",
                stadium_name="Apex Arena",
                referee_name="Marcus Sterling",
                var_official_name="David Alpert",
                is_synthetic=True,
                provenance_source="RefVision Realistic Synthetic Match Engine",
                provenance_url="https://github.com/microsoft/insidethegamehackathon"
            )
            db.add(m_syn)
            db.commit()

            # Add Incident INC_68_PEN_CHECK
            inc = Incident(
                id="INC_68_PEN_CHECK",
                match_id="MATCH_PL_2026_01",
                minute=67,
                second=45,
                incident_type="PENALTY_CHECK",
                review_category="Penalty / No Penalty",
                description="Tackle on Marcus Vance right on the 18-yard box boundary. Potential foul and penalty check.",
                description_ar="عرقلة للمهاجم ماركوس فانس على حدود منطقة الـ 18 ياردة. فحص ركلة جزاء محتملة.",
                x=83.6,
                y=38.4,
                review_status="AWAITING_REVIEW",
                initial_decision="Play On (Wave Off)",
                is_synthetic=True,
                uncertainty_margin="+/- 3.2cm"
            )
            db.add(inc)
            db.commit()

            # Add Evidence Items
            cams = [
                EvidenceItem(
                    id="EVD_CAM_18YD_L",
                    incident_id="INC_68_PEN_CHECK",
                    camera_id="CAM_18YD_LEFT",
                    camera_name="18-Yard Line (Left Camera)",
                    camera_name_ar="كاميرا خط الـ 18 ياردة (يسار)",
                    is_recommended=True,
                    clarity_score=94.2,
                    collinearity_score=98.5,
                    distance_to_play=14.2,
                    occlusion_level="LOW",
                    camera_type="Collinear 18-Yard Line Camera",
                    description="Aligned collinear with 18-yard penalty box line. Contact initiated at X=83.60m vs Line at X=83.50m (10cm outside)."
                ),
                EvidenceItem(
                    id="EVD_CAM_MAIN_HIGH",
                    incident_id="INC_68_PEN_CHECK",
                    camera_id="CAM_MAIN_HIGH",
                    camera_name="Main High Tactical",
                    camera_name_ar="الكاميرا التكتيكية العلوية الرئيسية",
                    is_recommended=False,
                    clarity_score=81.0,
                    collinearity_score=52.0,
                    distance_to_play=48.0,
                    occlusion_level="MEDIUM",
                    camera_type="High Broadcast Tactical",
                    description="Wide angle overview showing player run-up and defensive recovery run."
                ),
                EvidenceItem(
                    id="EVD_CAM_GOAL_LINE",
                    incident_id="INC_68_PEN_CHECK",
                    camera_id="CAM_GOAL_LINE_L",
                    camera_name="Behind Goal Line (Left)",
                    camera_name_ar="خلف خط المرمى (يسار)",
                    is_recommended=False,
                    clarity_score=78.5,
                    collinearity_score=40.1,
                    distance_to_play=26.4,
                    occlusion_level="HIGH",
                    camera_type="Behind Goal Camera",
                    description="Frontal perspective showing attacker foot orientation at moment of trip."
                )
            ]
            db.add_all(cams)

            # Add initial AuditEvent
            aud = AuditEvent(
                id="AUD_INIT_INC_68",
                incident_id="INC_68_PEN_CHECK",
                action_type="VAR_CHECK_TRIGGERED",
                previous_status="AWAITING_REVIEW",
                new_status="UNDER_REVIEW",
                actor_name="VAR Official David Alpert",
                details="VAR review initiated for potential penalty foul on Marcus Vance (#9 APX) near boundary line.",
                evidence_references={"camera_selected": "CAM_18YD_LEFT", "collinearity_score": 98.5}
            )
            db.add(aud)
            db.commit()

        # Seed events for MATCH_PL_2026_01 if not yet present
        existing_pl_events = db.query(MatchEvent).filter_by(match_id="MATCH_PL_2026_01").count()
        if existing_pl_events == 0:
            from app.simulation.match_engine import MatchEngine
            eng = MatchEngine(seed="MATCH_PL_2026_01")
            pl_events = []
            for ev in eng.all_events:
                pl_events.append(MatchEvent(
                    id=ev.event_id,
                    match_id="MATCH_PL_2026_01",
                    event_type=ev.event_type.value if hasattr(ev.event_type, "value") else str(ev.event_type),
                    minute=ev.minute,
                    second=ev.second,
                    timestamp_seconds=float(ev.timestamp_seconds),
                    team_id=ev.team_id,
                    player_id=ev.player_id,
                    player_name=ev.player_id,
                    x=ev.coordinates.x if ev.coordinates else None,
                    y=ev.coordinates.y if ev.coordinates else None,
                    description=f"{ev.event_type} by {ev.player_id or ev.team_id}",
                    is_synthetic=True
                ))
            db.bulk_save_objects(pl_events)
            db.commit()

        # 5. Seed 5 Fan Arena Games
        if not db.query(FanGame).filter_by(id="GAME_01_PREDICT_XI").first():
            games = [
                FanGame(
                    id="GAME_01_PREDICT_XI",
                    game_type="PREDICT_XI",
                    match_id="MATCH_PL_2026_01",
                    title_en="Predict the Starting XI",
                    title_ar="توقع التشكيلة الأساسية",
                    description_en="Select 5 key starting players for Apex Vanguard FC. Earn 10 points per correct starter!",
                    description_ar="اختر 5 لاعبين أساسيين لفريق أبيكس فانغارد. اكسب 10 نقاط لكل اختيار صحيح!",
                    options_json=[
                        {"option_id": "OPT_XI_01", "name": "Julian Vance (GK)", "is_starter": True},
                        {"option_id": "OPT_XI_04", "name": "Kieran Vance (DF)", "is_starter": True},
                        {"option_id": "OPT_XI_08", "name": "Mateo Silva (MF)", "is_starter": True},
                        {"option_id": "OPT_XI_09", "name": "Marcus Vance (FW)", "is_starter": True},
                        {"option_id": "OPT_XI_10", "name": "Darius Cole (AM)", "is_starter": True},
                        {"option_id": "OPT_XI_14", "name": "Ethan Cross (Sub)", "is_starter": False},
                        {"option_id": "OPT_XI_17", "name": "Noah Sterling (Sub)", "is_starter": False}
                    ],
                    correct_option_id="OPT_XI_09",
                    points_reward=50,
                    deadline_minute=15,
                    deadline_seconds=900.0,
                    status="OPEN"
                ),
                FanGame(
                    id="GAME_02_FIRST_CARD",
                    game_type="FIRST_CARD",
                    match_id="MATCH_PL_2026_01",
                    title_en="First Booking Challenge",
                    title_ar="تحدي البطاقة الأولى",
                    description_en="Who will receive the match's first yellow or red card?",
                    description_ar="من سيكون أول لاعب يحصل على بطاقة ملونة في المباراة؟",
                    options_json=[
                        {"option_id": "OPT_CARD_DEVON", "name": "Devon Cole (#5 CRN)", "team": "CRN"},
                        {"option_id": "OPT_CARD_MATEO", "name": "Mateo Silva (#8 APX)", "team": "APX"},
                        {"option_id": "OPT_CARD_KIERAN", "name": "Kieran Vance (#4 APX)", "team": "APX"},
                        {"option_id": "OPT_CARD_NONE", "name": "No Cards in Match", "team": "NONE"}
                    ],
                    correct_option_id="OPT_CARD_DEVON",
                    points_reward=75,
                    deadline_minute=67,
                    deadline_seconds=4020.0,
                    status="OPEN"
                ),
                FanGame(
                    id="GAME_03_SPOT_THE_RULE",
                    game_type="SPOT_THE_RULE",
                    match_id="MATCH_PL_2026_01",
                    title_en="Spot the Rule: Penalty Box Boundary",
                    title_ar="اكتشف القانون: خط منطقة الجزاء",
                    description_en="A trip begins 10cm before the 18-yard line, but the attacker falls inside the box. What is the official restart?",
                    description_ar="بدأت العرقلة قبل خط الـ 18 بـ 10 سم ولكن اللاعب سقط داخل المنطقة. ما هو الاستئناف القانوني الصحيح؟",
                    options_json=[
                        {"option_id": "OPT_RULE_DFK", "text": "Direct Free Kick outside the penalty area (Point of initial contact)", "is_correct": True},
                        {"option_id": "OPT_RULE_PEN", "text": "Penalty Kick (Where attacker ended up)", "is_correct": False},
                        {"option_id": "OPT_RULE_IFK", "text": "Indirect Free Kick for simulation", "is_correct": False},
                        {"option_id": "OPT_RULE_DROP", "text": "Dropped Ball to goalkeeper", "is_correct": False}
                    ],
                    correct_option_id="OPT_RULE_DFK",
                    points_reward=100,
                    deadline_minute=90,
                    deadline_seconds=5400.0,
                    status="OPEN"
                ),
                FanGame(
                    id="GAME_04_MATCH_MINUTE",
                    game_type="MATCH_MINUTE",
                    match_id="MATCH_PL_2026_01",
                    title_en="Match Minute: When will VAR intervene?",
                    title_ar="دقيقة المباراة: متى ستتدخل تقنية الـ VAR؟",
                    description_en="Predict which 15-minute interval the referee will be called to the pitchside monitor.",
                    description_ar="توقع في أي فترة زمنية (15 دقيقة) سيتم استدعاء الحكم لشاشة الـ VAR.",
                    options_json=[
                        {"option_id": "OPT_MIN_0_15", "interval": "00:00 - 15:00"},
                        {"option_id": "OPT_MIN_16_45", "interval": "15:01 - 45:00"},
                        {"option_id": "OPT_MIN_46_60", "interval": "45:01 - 60:00"},
                        {"option_id": "OPT_MIN_61_75", "interval": "60:01 - 75:00"},
                        {"option_id": "OPT_MIN_76_90", "interval": "75:01 - 90:00"}
                    ],
                    correct_option_id="OPT_MIN_61_75",
                    points_reward=60,
                    deadline_minute=65,
                    deadline_seconds=3900.0,
                    status="OPEN"
                ),
                FanGame(
                    id="GAME_05_TOUCHLINE_TACTICIAN",
                    game_type="TOUCHLINE_TACTICIAN",
                    match_id="MATCH_PL_2026_01",
                    title_en="Touchline Tactician: Attacking Overload",
                    title_ar="المحلل التكتيكي: الزيادة الهجومية",
                    description_en="At 1-1 in minute 68, Apex Vanguard has 61% possession in the final third. What is the optimal tactical adjustment for Crown Meridian?",
                    description_ar="عند التعادل 1-1 في الدقيقة 68 واستحواذ أبيكس بنسبة 61% في الثلث الهجومي، ما هو التعديل التكتيكي الأنسب لكراون ميريديان؟",
                    options_json=[
                        {"option_id": "OPT_TAC_LOW_BLOCK", "text": "Compact low block with rapid transitional winger counter-attack", "is_correct": True},
                        {"option_id": "OPT_TAC_HIGH_PRESS", "text": "Aggressive high press leaving space behind center backs", "is_correct": False},
                        {"option_id": "OPT_TAC_PASSIVE", "text": "Passive possession recycling in own defensive third", "is_correct": False}
                    ],
                    correct_option_id="OPT_TAC_LOW_BLOCK",
                    points_reward=80,
                    deadline_minute=85,
                    deadline_seconds=5100.0,
                    status="OPEN"
                )
            ]
            db.add_all(games)
            db.commit()

        # 6. Seed Demo User Profile
        if not db.query(UserProfile).filter_by(id="USR_DEMO_01").first():
            user = UserProfile(
                id="USR_DEMO_01",
                username="Alex_PremierFan",
                favorite_team_id="APX",
                points=140,
                streak_count=2,
                predictions_count=3,
                accuracy_rate=66.7,
                badges_json=[
                    {
                        "badge_id": "BDG_FIRST_CORRECT",
                        "name": "Sharp Eye",
                        "name_ar": "العين الثاقبة",
                        "description": "Successfully predicted your first live match event.",
                        "description_ar": "نجحت في توقع أول حدث مباشر في المباراة.",
                        "icon_name": "Target",
                        "is_unlocked": True,
                        "unlocked_at": "2026-10-24T22:15:00Z"
                    },
                    {
                        "badge_id": "BDG_STREAK_2",
                        "name": "On A Roll",
                        "name_ar": "سلسلة انتصارات",
                        "description": "Maintained a 2-prediction winning streak.",
                        "description_ar": "حافظت على سلسلة توقعات ناجحة لمرتين متتاليتين.",
                        "icon_name": "Zap",
                        "is_unlocked": True,
                        "unlocked_at": "2026-10-24T22:45:00Z"
                    },
                    {
                        "badge_id": "BDG_VAR_GURU",
                        "name": "VAR Whisperer",
                        "name_ar": "خبير الـ VAR",
                        "description": "Correctly predicted a complex officiating review outcome.",
                        "description_ar": "توقعت بنجاح نتيجة مراجعة تحكيمية معقدة بتقنية الفيديو.",
                        "icon_name": "Award",
                        "is_unlocked": False
                    }
                ]
            )
            db.add(user)
            db.commit()

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
