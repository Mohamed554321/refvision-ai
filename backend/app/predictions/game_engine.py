from typing import List, Dict, Optional, Any
import copy
from app.schemas.events import MatchEvent, EventType
from app.schemas.predictions import (
    ActivePredictionGame, GameType, EligibleOption, PredictionSubmission,
    PredictionStatus, FanUserProfile, FanBadge, LeaderboardEntry
)

class PredictionEngine:
    def __init__(self):
        self.games: Dict[str, ActivePredictionGame] = self._create_initial_games()
        self.submissions: Dict[str, PredictionSubmission] = {}
        self.user_profile = FanUserProfile(
            user_id="USR_DEMO_01",
            username="Alex_PremierFan",
            favorite_team_id="APX",
            points=140,
            streak_count=2,
            predictions_count=3,
            accuracy_rate=66.7,
            badges=[
                FanBadge(
                    badge_id="BDG_FIRST_CORRECT",
                    name="Sharp Eye",
                    name_ar="العين الثاقبة",
                    description="Successfully predicted your first live match event.",
                    description_ar="نجحت في توقع أول حدث مباشر في المباراة.",
                    icon_name="Target",
                    is_unlocked=True,
                    unlocked_at="2026-10-24T22:15:00Z"
                ),
                FanBadge(
                    badge_id="BDG_STREAK_2",
                    name="On A Roll",
                    name_ar="سلسلة انتصارات",
                    description="Maintained a 2-prediction winning streak.",
                    description_ar="حافظت على سلسلة توقعات ناجحة لمرتين متتاليتين.",
                    icon_name="Zap",
                    is_unlocked=True,
                    unlocked_at="2026-10-24T22:45:00Z"
                ),
                FanBadge(
                    badge_id="BDG_VAR_GURU",
                    name="VAR Whisperer",
                    name_ar="خبير الـ VAR",
                    description="Correctly predicted a complex officiating review outcome.",
                    description_ar="توقعت بنجاح نتيجة مراجعة تحكيمية معقدة بتقنية الفيديو.",
                    icon_name="Award",
                    is_unlocked=False
                )
            ]
        )

    def _create_initial_games(self) -> Dict[str, ActivePredictionGame]:
        g1 = ActivePredictionGame(
            game_id="GAME_01_NEXT_TOUCH",
            match_id="MATCH_PL_2026_01",
            game_type=GameType.NEXT_TOUCH,
            title="Next Ball Touch",
            title_ar="اللمسة القادمة للكرة",
            description="Predict which key playmaker makes the next registered touch between min 15 and 18.",
            description_ar="توقع من اللاعب الذي سيقوم باللمسة القادمة المسجلة للكرة بين الدقيقتين 15 و18.",
            opened_at_seconds=14 * 60.0,
            lock_deadline_seconds=15 * 60.0,
            options=[
                EligibleOption(id="OPT_APX_10", label="Adrian Ruiz (#10 APX)", label_ar="أدريان رويز (#10 APX)", subtext="Playmaker", points_multiplier=1.5),
                EligibleOption(id="OPT_APX_04", label="Kieran Vance (#4 APX)", label_ar="كيران فانس (#4 APX)", subtext="Central Defender", points_multiplier=2.0),
                EligibleOption(id="OPT_CRN_10", label="Julian Sterling (#10 CRN)", label_ar="جوليان ستيرلينغ (#10 CRN)", subtext="Attacking Mid", points_multiplier=1.8),
                EligibleOption(id="OPT_CRN_06", label="Nico Barella (#6 CRN)", label_ar="نيكو باريلا (#6 CRN)", subtext="Defensive Mid", points_multiplier=2.2)
            ],
            qualifying_event_types=["PASS", "INTERCEPTION", "TACKLE"],
            rule_explanation="Evaluated using the next qualifying touch event in the match event stream.",
            rule_explanation_ar="يتم تقييم النتيجة بناءً على أول لمسة مؤهلة في تدفق أحداث المباراة."
        )

        g2 = ActivePredictionGame(
            game_id="GAME_02_NEXT_EVENT",
            match_id="MATCH_PL_2026_01",
            game_type=GameType.NEXT_EVENT,
            title="Next Key Match Event",
            title_ar="الحدث الرئيسي القادم",
            description="What will be the next major officiating or match event before minute 30?",
            description_ar="ما هو الحدث الرئيسي أو التحكيمي القادم قبل الدقيقة 30؟",
            opened_at_seconds=22 * 60.0,
            lock_deadline_seconds=25 * 60.0,
            options=[
                EligibleOption(id="OPT_EVT_GOAL", label="Goal Scored", label_ar="تسجيل هدف", points_multiplier=2.5),
                EligibleOption(id="OPT_EVT_FOUL", label="Foul Committed", label_ar="ارتكاب مخالفة", points_multiplier=1.2),
                EligibleOption(id="OPT_EVT_CARD", label="Yellow / Red Card", label_ar="بطاقة صفراء أو حمراء", points_multiplier=3.0),
                EligibleOption(id="OPT_EVT_CORNER", label="Corner Kick", label_ar="ضربة ركنية", points_multiplier=1.6)
            ],
            qualifying_event_types=["GOAL", "FOUL", "YELLOW_CARD", "RED_CARD", "CORNER"],
            rule_explanation="Resolved by the first event category recorded in the official event log.",
            rule_explanation_ar="تُحسم النتيجة بأول فئة حدث مسجلة في سجل الأحداث الرسمي للمباراة."
        )

        g3 = ActivePredictionGame(
            game_id="GAME_03_VAR_OUTCOME",
            match_id="MATCH_PL_2026_01",
            game_type=GameType.PENALTY_PREDICTOR,
            title="VAR Incident Ruling",
            title_ar="قرار مراجعة الفيديو (VAR)",
            description="Minute 68 Review: Will Marcus Sterling award a Penalty Kick or a Free Kick Outside the Box?",
            description_ar="مراجعة الدقيقة 68: هل سيحتسب ماركوس ستيرلينغ ركلة جزاء أم ركلة حرة خارج المنطقة؟",
            opened_at_seconds=67 * 60.0 + 50.0,
            lock_deadline_seconds=68 * 60.0 + 30.0,
            options=[
                EligibleOption(id="OPT_OUTSIDE_FK", label="Direct Free Kick Outside Box", label_ar="ركلة حرة مباشرة خارج المنطقة", points_multiplier=1.8),
                EligibleOption(id="OPT_PENALTY", label="Penalty Kick Awarded", label_ar="احتساب ركلة جزاء", points_multiplier=2.2),
                EligibleOption(id="OPT_NO_FOUL", label="No Foul / Play On", label_ar="لا وجود لمخالفة / استمرار اللعب", points_multiplier=4.0)
            ],
            qualifying_event_types=["VAR_REVIEW", "PENALTY_CHECK"],
            rule_explanation="Resolved strictly by the official ruling recorded by the referee upon concluding monitor review.",
            rule_explanation_ar="تُحسم بدقة بالقرار الرسمي الذي يدونه الحكم بعد انتهاء المراجعة عند الشاشة."
        )

        g4 = ActivePredictionGame(
            game_id="GAME_04_TACTICAL_SHIFT",
            match_id="MATCH_PL_2026_01",
            game_type=GameType.TACTICAL_SHIFT,
            title="Second Half Momentum Shift",
            title_ar="تحول السيطرة في الشوط الثاني",
            description="Which team will register greater possession share in the opening 15 minutes of the second half (45' - 60')?",
            description_ar="أي فريق سيسجل نسبة استحواذ أعلى في أول 15 دقيقة من الشوط الثاني (45' - 60')؟",
            opened_at_seconds=44 * 60.0,
            lock_deadline_seconds=46 * 60.0,
            options=[
                EligibleOption(id="OPT_SHIFT_APX", label="Apex Vanguard FC", label_ar="أبيكس فانغارد", points_multiplier=1.7),
                EligibleOption(id="OPT_SHIFT_CRN", label="Crown Meridian FC", label_ar="كراون ميريديان", points_multiplier=2.1),
                EligibleOption(id="OPT_SHIFT_EVEN", label="Even (48% - 52%)", label_ar="متكافئ (48% - 52%)", points_multiplier=3.2)
            ],
            qualifying_event_types=["PASS", "POSSESSION_CHANGE"],
            rule_explanation="Determined by calculated pass share metrics from the deterministic analytics engine.",
            rule_explanation_ar="يتم تحديدها بنسبة التمريرات المحسوبة عبر محرك التحليلات الحتمية."
        )

        g5 = ActivePredictionGame(
            game_id="GAME_05_SPOT_THE_RULE",
            match_id="MATCH_PL_2026_01",
            game_type=GameType.PENALTY_PREDICTOR,
            title="Spot the Rule: Boundary Contact",
            title_ar="اكتشف القانون: التحام خط الحدود",
            description="Foul trip begins 10cm outside the 18-yard box but attacker falls inside. What is the restart?",
            description_ar="بدأت العرقلة قبل خط المنطقة بـ 10 سم وسقط اللاعب بالداخل. ما هو الاستئناف؟",
            opened_at_seconds=60.0,
            lock_deadline_seconds=90 * 60.0,
            options=[
                EligibleOption(id="OPT_RULE_DFK", label="Direct Free Kick (Contact started outside)", label_ar="ركلة حرة مباشرة (التلامس بدأ بالخارج)", points_multiplier=2.0),
                EligibleOption(id="OPT_RULE_PEN", label="Penalty Kick (Fell inside)", label_ar="ركلة جزاء (سقط بالداخل)", points_multiplier=1.5),
                EligibleOption(id="OPT_RULE_IFK", label="Indirect Free Kick", label_ar="ركلة حرة غير مباشرة", points_multiplier=3.0)
            ],
            qualifying_event_types=["VAR_REVIEW"],
            rule_explanation="IFAB Law 12: Contact begins outside line, direct free kick awarded outside.",
            rule_explanation_ar="قانون 12: إذا بدأ الالتحام خارج الخط، يُستأنف بركلة حرة مباشرة خارج المنطقة."
        )

        g6 = ActivePredictionGame(
            game_id="GAME_06_FIRST_CARD",
            match_id="MATCH_PL_2026_01",
            game_type=GameType.NEXT_EVENT,
            title="First Booking Challenge",
            title_ar="تحدي البطاقة الأولى",
            description="Predict which defender receives the match's first yellow card.",
            description_ar="توقع أي مدافع سيحصل على أول بطاقة صفراء في اللقاء.",
            opened_at_seconds=60.0,
            lock_deadline_seconds=67 * 60.0,
            options=[
                EligibleOption(id="OPT_CARD_DEVON", label="Devon Cole (#5 CRN)", label_ar="ديفون كول (#5 CRN)", points_multiplier=2.5),
                EligibleOption(id="OPT_CARD_KIERAN", label="Kieran Vance (#4 APX)", label_ar="كيران فانس (#4 APX)", points_multiplier=2.8),
                EligibleOption(id="OPT_CARD_NONE", label="No Cards in 90 mins", label_ar="لا بطاقات في 90 دقيقة", points_multiplier=4.0)
            ],
            qualifying_event_types=["YELLOW_CARD", "RED_CARD"],
            rule_explanation="Resolved by first recorded disciplinary booking in the event log.",
            rule_explanation_ar="تُحسم بأول بطاقة مسجلة في سجل الأحداث."
        )

        return {g1.game_id: g1, g2.game_id: g2, g3.game_id: g3, g4.game_id: g4, g5.game_id: g5, g6.game_id: g6}

    def submit_prediction(self, game_id: str, selected_option_id: str, current_seconds: float) -> PredictionSubmission:
        if game_id not in self.games:
            raise ValueError(f"Game {game_id} does not exist.")

        game = self.games[game_id]

        # Check deadline
        if current_seconds > game.lock_deadline_seconds:
            raise ValueError("Prediction window is closed. Submissions are locked.")
        if game.is_resolved:
            raise ValueError("Game has already resolved.")

        # Check valid option
        if not any(opt.id == selected_option_id for opt in game.options):
            raise ValueError(f"Invalid option ID {selected_option_id}.")

        sub_id = f"SUB_{game_id}_{self.user_profile.user_id}"

        # Prevent duplicate submissions after deadline, or update before deadline
        submission = PredictionSubmission(
            prediction_id=sub_id,
            game_id=game_id,
            user_id=self.user_profile.user_id,
            selected_option_id=selected_option_id,
            submission_timestamp_seconds=current_seconds,
            status=PredictionStatus.OPEN
        )
        self.submissions[sub_id] = submission

        # Update or add to user history
        existing = [i for i, s in enumerate(self.user_profile.prediction_history) if s.game_id == game_id]
        if existing:
            self.user_profile.prediction_history[existing[0]] = submission
        else:
            self.user_profile.prediction_history.append(submission)

        return submission

    def resolve_games_against_events(self, events: List[MatchEvent], current_seconds: float):
        """
        Deterministically evaluates open games against the verified event stream up to current_seconds.
        """
        for game in self.games.values():
            # If scrubbing back in time before deadline, unlock
            if current_seconds < game.lock_deadline_seconds:
                game.is_locked = False
                game.is_resolved = False
                game.correct_option_id = None
                game.resolved_at_seconds = None
                continue

            # Check locking
            if current_seconds >= game.lock_deadline_seconds:
                game.is_locked = True

            # If already resolved, skip
            if game.is_resolved:
                continue

            # Game 1: Next Touch (min 15)
            if game.game_id == "GAME_01_NEXT_TOUCH" and current_seconds >= 15 * 60 + 35:
                # Event at 15:30 was APX_04 interception
                matching = [e for e in events if e.minute == 15 and e.player_id == "APX_04"]
                if matching:
                    game.is_resolved = True
                    game.correct_option_id = "OPT_APX_04"
                    game.resolved_at_seconds = matching[0].timestamp_seconds
                    game.resolving_event_id = matching[0].event_id
                    game.outcome_summary = "Kieran Vance (#4 APX) intercepted Crown through-ball at 15:30."
                    game.outcome_summary_ar = "كيران فانس (#4 APX) قطع تمريرة كراون البينية في الدقيقة 15:30."

            # Game 2: Next Key Event (min 22 - 30)
            elif game.game_id == "GAME_02_NEXT_EVENT" and current_seconds >= 28 * 60 + 20:
                # Goal scored at 28:14
                matching = [e for e in events if e.event_type == EventType.GOAL and e.minute == 28]
                if matching:
                    game.is_resolved = True
                    game.correct_option_id = "OPT_EVT_GOAL"
                    game.resolved_at_seconds = matching[0].timestamp_seconds
                    game.resolving_event_id = matching[0].event_id
                    game.outcome_summary = "Goal scored by Marcus Vance at 28:14."
                    game.outcome_summary_ar = "سجل ماركوس فانس هدفاً في الدقيقة 28:14."

            # Game 3: VAR Incident Ruling (min 68)
            elif game.game_id == "GAME_03_VAR_OUTCOME" and current_seconds >= 68 * 60 + 40:
                game.is_resolved = True
                game.correct_option_id = "OPT_OUTSIDE_FK"
                game.resolved_at_seconds = 68 * 60 + 25.0
                game.resolving_event_id = "EVT_0019"
                game.outcome_summary = "Referee Sterling confirmed initial foul contact outside the 18-yard box: Direct Free Kick awarded."
                game.outcome_summary_ar = "أكد الحكم ستيرلينغ أن نقطة التلامس كانت خارج خط منطقة الـ 18 ياردة: احتساب ركلة حرة مباشرة."

            # Game 4: Tactical Shift (min 45-60)
            elif game.game_id == "GAME_04_TACTICAL_SHIFT" and current_seconds >= 60 * 60.0:
                game.is_resolved = True
                game.correct_option_id = "OPT_SHIFT_CRN"
                game.resolved_at_seconds = 60 * 60.0
                game.outcome_summary = "Crown Meridian surged with 58.4% possession share between 45' and 60'."
                game.outcome_summary_ar = "كراون ميريديان سيطر بنسبة استحواذ 58.4% بين الدقيقتين 45 و60."

            # Game 5: Spot the Rule (Boundary contact)
            elif game.game_id == "GAME_05_SPOT_THE_RULE" and current_seconds >= 68 * 60 + 40:
                game.is_resolved = True
                game.correct_option_id = "OPT_RULE_DFK"
                game.resolved_at_seconds = 68 * 60 + 25.0
                game.outcome_summary = "IFAB Law 12 Boundary Clause: Contact began outside the 18-yard box, restarting with Direct Free Kick outside."
                game.outcome_summary_ar = "بند حدود المنطقة في القانون 12: بدأ الالتحام بالخارج والاستئناف ركلة حرة مباشرة خارج المنطقة."

            # Game 6: First Booking Challenge
            elif game.game_id == "GAME_06_FIRST_CARD" and current_seconds >= 68 * 60 + 40:
                game.is_resolved = True
                game.correct_option_id = "OPT_CARD_DEVON"
                game.resolved_at_seconds = 68 * 60 + 25.0
                game.outcome_summary = "Devon Cole (#5 CRN) booked with a yellow card for reckless tripping challenge."
                game.outcome_summary_ar = "حصل ديفون كول (#5 CRN) على بطاقة صفراء لعرقلته المتهورة."

            # If game just resolved, score user submissions
            if game.is_resolved:
                sub_id = f"SUB_{game.game_id}_{self.user_profile.user_id}"
                if sub_id in self.submissions:
                    sub = self.submissions[sub_id]
                    if sub.status == PredictionStatus.OPEN:
                        if sub.selected_option_id == game.correct_option_id:
                            sub.status = PredictionStatus.RESOLVED_WON
                            # find option multiplier
                            opt = next((o for o in game.options if o.id == game.correct_option_id), None)
                            pts = int(50 * (opt.points_multiplier if opt else 1.0))
                            sub.points_awarded = pts
                            self.user_profile.points += pts
                            self.user_profile.streak_count += 1
                            if game.game_id == "GAME_03_VAR_OUTCOME":
                                # Unlock VAR Guru badge
                                for b in self.user_profile.badges:
                                    if b.badge_id == "BDG_VAR_GURU":
                                        b.is_unlocked = True
                                        b.unlocked_at = "2026-10-24T23:15:00Z"
                        else:
                            sub.status = PredictionStatus.RESOLVED_LOST
                            self.user_profile.streak_count = 0

                        # Recalculate accuracy
                        resolved_subs = [s for s in self.submissions.values() if s.status in [PredictionStatus.RESOLVED_WON, PredictionStatus.RESOLVED_LOST]]
                        won_subs = [s for s in resolved_subs if s.status == PredictionStatus.RESOLVED_WON]
                        if resolved_subs:
                            self.user_profile.accuracy_rate = round((len(won_subs) / len(resolved_subs)) * 100, 1)

    def get_leaderboard(self) -> List[LeaderboardEntry]:
        return [
            LeaderboardEntry(rank=1, username="TacticalGenius_99", favorite_team="APX", points=310, accuracy_rate=85.0, streak=4),
            LeaderboardEntry(rank=2, username="VAR_EagleEye", favorite_team="CRN", points=260, accuracy_rate=78.5, streak=3),
            LeaderboardEntry(rank=3, username=self.user_profile.username, favorite_team=self.user_profile.favorite_team_id, points=self.user_profile.points, accuracy_rate=self.user_profile.accuracy_rate, streak=self.user_profile.streak_count),
            LeaderboardEntry(rank=4, username="OffsideTrap_King", favorite_team="APX", points=175, accuracy_rate=62.0, streak=1),
            LeaderboardEntry(rank=5, username="CrownLoyalist", favorite_team="CRN", points=120, accuracy_rate=50.0, streak=0)
        ]
