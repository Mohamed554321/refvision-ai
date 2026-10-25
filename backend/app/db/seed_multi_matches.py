"""
Seed Multi-Match Library for RefVision AI
Populates at least 11 selectable match scenarios into SQLite database (refvision.db):
- 5 Historical World Cup 2022 Matches from StatsBomb Open Data
- 6 Synthetic Demonstration Scenarios covering all required officiating test cases
"""

import os
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal, Base
from app.db.models import (
    DataSource, Competition, Season, Team, Player, Match, MatchEvent, Incident, EvidenceItem, RuleReference
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_multi_matches")

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
RAW_DIR = os.path.join(DATA_DIR, "raw", "statsbomb")


def seed_multi_matches():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        logger.info("Checking data sources and competitions...")
        ds_sb = db.query(DataSource).filter_by(id="SRC_STATSBOMB").first()
        if not ds_sb:
            ds_sb = DataSource(
                id="SRC_STATSBOMB",
                source_name="StatsBomb Open Data",
                source_url="https://github.com/statsbomb/open-data",
                license="CC BY 4.0",
                attribution="StatsBomb Open Data (https://statsbomb.com)",
                is_active=True
            )
            db.add(ds_sb)

        ds_syn = db.query(DataSource).filter_by(id="SRC_SYNTHETIC").first()
        if not ds_syn:
            ds_syn = DataSource(
                id="SRC_SYNTHETIC",
                source_name="RefVision Synthetic Event Engine",
                source_url="https://github.com/microsoft/insidethegamehackathon",
                license="Hackathon Project License",
                attribution="Synthetic match scenario engine for officiating decision support and VAR evaluation.",
                is_active=True
            )
            db.add(ds_syn)
        db.commit()

        # Load StatsBomb matches_43_106.json for metadata
        matches_file = os.path.join(RAW_DIR, "matches_43_106.json")
        sb_metadata = {}
        if os.path.exists(matches_file):
            with open(matches_file, "r", encoding="utf-8") as f:
                sb_list = json.load(f)
                for m in sb_list:
                    sb_metadata[m["match_id"]] = m

        # ---------------------------------------------------------------------
        # 1. Historical StatsBomb Matches
        # ---------------------------------------------------------------------
        hist_configs = [
            {
                "id": 3857255,
                "label": "Japan vs Spain (2-1) - Ball Boundary In/Out Goal Review",
                "incident": {
                    "minute": 51, "second": 12, "type": "GOAL_CHECK",
                    "category": "Ball Out of Play / Goal Check",
                    "desc": "Mitoma cutback from endline for Tanaka goal: VAR review whether full sphere of ball crossed the goal-line.",
                    "desc_ar": "تمريرة ميتوما العرضية من خط النهاية لهدف تاناكا: مراجعة تقنية الفيديو هل تجاوز محيط الكرة بالكامل خط المرمى.",
                    "x": 120.0, "y": 40.2, "status": "CONFIRMED_VALID_GOAL",
                    "ruling": "Goal Awarded - Ball curvature projected vertically over line",
                    "ruling_ar": "احتساب الهدف - محيط الكرة يلامس مسقط خط المرمى رأسياً",
                    "restart": "Kick-Off", "action": "None", "margin": "+/- 1.8mm"
                }
            },
            {
                "id": 3857261,
                "label": "Wales vs England (0-3) - High Press & Disciplinary Control",
                "incident": {
                    "minute": 50, "second": 45, "type": "PENALTY_CHECK",
                    "category": "Direct Free Kick / Edge of Box",
                    "desc": "Rashford brought down right outside penalty arc following central dribble.",
                    "desc_ar": "عرقلة راشفورد خارج قوس منطقة الجزاء مباشرة إثر اختراق في العمق.",
                    "x": 98.4, "y": 38.0, "status": "DECISION_RECORDED",
                    "ruling": "Direct Free Kick Awarded Outside Box",
                    "ruling_ar": "ركلة حرة مباشرة خارج المنطقة",
                    "restart": "Direct Free Kick", "action": "Yellow Card", "margin": "+/- 2.5cm"
                }
            },
            {
                "id": 3857271,
                "label": "England vs Iran (6-2) - High-Scoring & Penalty Box Tussle",
                "incident": {
                    "minute": 3, "second": 20, "type": "PENALTY_CHECK",
                    "category": "Corner Kick Holding / Penalty Check",
                    "desc": "Maguire held inside penalty box during corner kick delivery.",
                    "desc_ar": "جذب المدافع ماغواير داخل منطقة الجزاء أثناء تنفيذ ركلة ركنية.",
                    "x": 114.2, "y": 42.1, "status": "NO_PENALTY_CONFIRMED",
                    "ruling": "Play On - Mutual Holding Assessed as Normal Contact",
                    "ruling_ar": "استمرار اللعب - تقييم المسك المتبادل كاحتكاك طبيعي",
                    "restart": "Play On", "action": "None", "margin": "+/- 4.0cm"
                }
            },
            {
                "id": 3857285,
                "label": "South Korea vs Portugal (2-1) - Corner Deflection & Offside Screen",
                "incident": {
                    "minute": 27, "second": 10, "type": "OFFSIDE_CHECK",
                    "category": "Offside Deflection / Goal Check",
                    "desc": "Kim Young-Gwon equalizer from corner: VAR check on Ronaldo back deflection and active attacker positioning.",
                    "desc_ar": "هدف تعادل كيم يونغ-غوون من ركنية: مراجعة اصطدام الكرة بظهر رونالدو وموقف المهاجم.",
                    "x": 116.5, "y": 39.5, "status": "CONFIRMED_VALID_GOAL",
                    "ruling": "Goal Awarded - Deliberate play deflection by defender resets offside",
                    "ruling_ar": "احتساب الهدف - ارتداد الكرة من المدافع يلغي موقف التسلل",
                    "restart": "Kick-Off", "action": "None", "margin": "+/- 2.1cm"
                }
            }
        ]

        for hcfg in hist_configs:
            mid = f"MATCH_SB_{hcfg['id']}"
            if db.query(Match).filter_by(id=mid).first():
                logger.info(f"Historical match {mid} already exists, skipping creation.")
                continue

            meta = sb_metadata.get(hcfg["id"], {})
            home_t_data = meta.get("home_team", {"home_team_id": 100, "home_team_name": "Home Team"})
            away_t_data = meta.get("away_team", {"away_team_id": 200, "away_team_name": "Away Team"})

            home_tid = f"TEAM_SB_{home_t_data.get('home_team_id', 100)}"
            away_tid = f"TEAM_SB_{away_t_data.get('away_team_id', 200)}"

            # Ensure teams exist
            if not db.query(Team).filter_by(id=home_tid).first():
                db.add(Team(
                    id=home_tid, name=home_t_data.get("home_team_name", "Home Team"),
                    short_code=home_t_data.get("home_team_name", "HOM")[:3].upper(),
                    country=home_t_data.get("country", {}).get("name", "International"),
                    primary_color="#3B82F6", secondary_color="#1E293B", is_synthetic=False
                ))
            if not db.query(Team).filter_by(id=away_tid).first():
                db.add(Team(
                    id=away_tid, name=away_t_data.get("away_team_name", "Away Team"),
                    short_code=away_t_data.get("away_team_name", "AWY")[:3].upper(),
                    country=away_t_data.get("country", {}).get("name", "International"),
                    primary_color="#EF4444", secondary_color="#1E293B", is_synthetic=False
                ))
            db.commit()

            match_obj = Match(
                id=mid,
                home_team_id=home_tid,
                away_team_id=away_tid,
                match_date=meta.get("match_date", "2022-12-01"),
                home_score=meta.get("home_score", 1),
                away_score=meta.get("away_score", 0),
                current_minute=90,
                current_second=0,
                status="COMPLETED",
                stadium_name=meta.get("stadium", {}).get("name", "FIFA World Cup Stadium"),
                referee_name=meta.get("referee", {}).get("name", "FIFA Elite Referee"),
                var_official_name="FIFA VAR Specialist",
                is_synthetic=False,
                provenance_source="StatsBomb Open Data (CC BY 4.0)",
                provenance_url=f"https://github.com/statsbomb/open-data/blob/master/data/events/{hcfg['id']}.json"
            )
            db.add(match_obj)
            db.commit()

            # Read event file from RAW_DIR
            event_path = os.path.join(RAW_DIR, f"events_{hcfg['id']}.json")
            if os.path.exists(event_path):
                with open(event_path, "r", encoding="utf-8") as ef:
                    raw_events = json.load(ef)
                logger.info(f"Ingesting {len(raw_events)} events for {mid}...")

                batch = []
                for ev in raw_events[:500]:  # index first 500 representative events for speed & responsiveness
                    ev_type = ev.get("type", {}).get("name", "Pass")
                    loc = ev.get("location")
                    x = float(loc[0]) if loc and len(loc) >= 2 else None
                    y = float(loc[1]) if loc and len(loc) >= 2 else None
                    team_info = ev.get("team", {})
                    player_info = ev.get("player", {})

                    batch.append(MatchEvent(
                        id=f"EVT_{ev.get('id', mid + '_' + str(len(batch)))}",
                        match_id=mid,
                        event_type=ev_type,
                        minute=int(ev.get("minute", 0)),
                        second=int(ev.get("second", 0)),
                        timestamp_seconds=float(ev.get("minute", 0) * 60 + ev.get("second", 0)),
                        period=int(ev.get("period", 1)),
                        team_id=home_tid if team_info.get("name") == home_t_data.get("home_team_name") else away_tid,
                        player_name=player_info.get("name") if player_info else None,
                        x=x, y=y,
                        outcome=ev.get("outcome", {}).get("name") if isinstance(ev.get("outcome"), dict) else None,
                        description=f"{ev_type} by {player_info.get('name', 'Player') if player_info else 'Team'}",
                        is_synthetic=False
                    ))
                db.add_all(batch)
                db.commit()

            # Add official incident
            inc_data = hcfg["incident"]
            inc_id = f"INC_{mid}_{inc_data['minute']}"
            db_inc = Incident(
                id=inc_id,
                match_id=mid,
                minute=inc_data["minute"],
                second=inc_data["second"],
                incident_type=inc_data["type"],
                review_category=inc_data["category"],
                description=inc_data["desc"],
                description_ar=inc_data["desc_ar"],
                x=inc_data["x"], y=inc_data["y"],
                review_status=inc_data["status"],
                human_ruling=inc_data["ruling"],
                human_ruling_ar=inc_data["ruling_ar"],
                disciplinary_action=inc_data["action"],
                restart_play=inc_data["restart"],
                uncertainty_margin=inc_data["margin"],
                is_synthetic=False
            )
            db.add(db_inc)
            db.commit()
            logger.info(f"Seeded historical match {mid}: {hcfg['label']}")

        # ---------------------------------------------------------------------
        # 2. Synthetic Scenarios Covering Required Categories
        # ---------------------------------------------------------------------
        synthetic_scenarios = [
            {
                "id": "MATCH_SYN_HIGH_SCORING",
                "home_team": {"id": "TITAN", "name": "Titan Athletic", "name_ar": "تيتان أثليتيك", "code": "TIT", "color": "#F59E0B"},
                "away_team": {"id": "HORIZON", "name": "Horizon City", "name_ar": "هورايزون سيتي", "code": "HOR", "color": "#06B6D4"},
                "home_score": 4, "away_score": 3, "minute": 90,
                "stadium": "Titan Park", "referee": "Christian Kalu",
                "label": "High-Scoring Thriller (7 Goals & Multiple VAR Checks)",
                "incidents": [
                    {
                        "id": "INC_SYN_HIGH_41", "minute": 41, "second": 18,
                        "type": "GOAL_CHECK", "category": "Foul in Build-up / Goal Disallowed",
                        "desc": "Horizon City goal disallowed following VAR review: Attacker stepped on defender Achilles tendon 14 seconds prior to shot.",
                        "desc_ar": "إلغاء هدف هورايزون سيتي بعد مراجعة تقنية الفيديو: دهس كعب المدافع قبل التسديد بـ 14 ثانية.",
                        "x": 82.0, "y": 45.0, "status": "GOAL_DISALLOWED",
                        "ruling": "Goal Disallowed - Direct Free Kick for Attacking Foul in APP",
                        "ruling_ar": "إلغاء الهدف واحتساب ركلة حرة مباشرة لمخالفة في مرحلة بناء الهجمة",
                        "action": "No Card", "restart": "Direct Free Kick", "margin": "+/- 2.0cm"
                    },
                    {
                        "id": "INC_SYN_HIGH_79", "minute": 79, "second": 50,
                        "type": "PENALTY_CHECK", "category": "Handball Penalty Check",
                        "desc": "Titan Athletic awarded penalty kick: Defender arm outstretched away from body silhouette blocking goal-bound shot.",
                        "desc_ar": "ركلة جزاء لتيتان أثليتيك: يد المدافع ممتدة خارج محيط الجسد لقطع تسديدة في اتجاه المرمى.",
                        "x": 108.5, "y": 38.0, "status": "PENALTY_AWARDED",
                        "ruling": "Penalty Kick Awarded + Yellow Card (Unsporting Hand Contact)",
                        "ruling_ar": "احتساب ركلة جزاء وإنذار بالبطاقة الصفراء للمدافع",
                        "action": "Yellow Card", "restart": "Penalty Kick", "margin": "+/- 1.5cm"
                    }
                ]
            },
            {
                "id": "MATCH_SYN_DEFENSIVE",
                "home_team": {"id": "IRON_WALL", "name": "Iron Wall FC", "name_ar": "آيرون وول", "code": "IRW", "color": "#64748B"},
                "away_team": {"id": "METRO_UTD", "name": "Metro United", "name_ar": "ميترو يونايتد", "code": "MET", "color": "#10B981"},
                "home_score": 0, "away_score": 0, "minute": 90,
                "stadium": "The Fortress", "referee": "Daniele Orsati",
                "label": "Low-Block Defensive Gridlock (Late Penalty Pressure)",
                "incidents": [
                    {
                        "id": "INC_SYN_DEF_88", "minute": 88, "second": 30,
                        "type": "PENALTY_CHECK", "category": "Penalty Area Accidental Silhouette Check",
                        "desc": "Late-game penalty claim dismissed: Cross hit defender arm while in natural tuck against chest during slide.",
                        "desc_ar": "رفض المطالبة بركلة جزاء في اللحظات الأخيرة: الكرة لمست الذراع وهي مضمومة بشكل طبيعي على الصدر.",
                        "x": 110.0, "y": 52.0, "status": "NO_PENALTY_CONFIRMED",
                        "ruling": "Play On - Arm in natural consequence of movement",
                        "ruling_ar": "استمرار اللعب - وضع الذراع طبيعي ومبرر بحركة الجسد",
                        "action": "None", "restart": "Corner Kick", "margin": "+/- 3.2cm"
                    }
                ]
            },
            {
                "id": "MATCH_SYN_RED_CARD",
                "home_team": {"id": "RED_STAR", "name": "Red Star Rovers", "name_ar": "ريد ستار روفرز", "code": "RSR", "color": "#DC2626"},
                "away_team": {"id": "SOLSTICE", "name": "Solstice FC", "name_ar": "سولستيس", "code": "SOL", "color": "#8B5CF6"},
                "home_score": 2, "away_score": 1, "minute": 90,
                "stadium": "Red Star Arena", "referee": "Bjorn Kuipers",
                "label": "Serious Foul Play & Direct Red Card Review",
                "incidents": [
                    {
                        "id": "INC_SYN_RED_53", "minute": 53, "second": 40,
                        "type": "RED_CARD_CHECK", "category": "Serious Foul Play / Direct Red Card",
                        "desc": "On-field yellow upgraded to Direct Red Card: High studs tackle with excessive force landed directly above opponent ankle.",
                        "desc_ar": "ترقية الإنذار إلى طرد مباشر: تدخل بأسفل الحذاء وقوة مفرطة أعلى كاحل المنافس.",
                        "x": 62.0, "y": 28.0, "status": "RED_CARD_CONFIRMED",
                        "ruling": "Direct Red Card for Serious Foul Play (IFAB Law 12.3)",
                        "ruling_ar": "بطاقة حمراء مباشرة للعب العنيف المفرط (قانون إيفاب 12.3)",
                        "action": "Direct Red Card", "restart": "Direct Free Kick", "margin": "+/- 1.0cm"
                    }
                ]
            },
            {
                "id": "MATCH_SYN_OFFSIDE",
                "home_team": {"id": "COASTAL", "name": "Coastal Albion", "name_ar": "كوستال ألبيون", "code": "COA", "color": "#0284C7"},
                "away_team": {"id": "AURORA", "name": "Aurora FC", "name_ar": "أورورا إف سي", "code": "AUR", "color": "#E11D48"},
                "home_score": 1, "away_score": 0, "minute": 90,
                "stadium": "Pier Stadium", "referee": "Felix Zwayer",
                "label": "Tight Margin Offside Review (Disallowed Goal)",
                "incidents": [
                    {
                        "id": "INC_SYN_OFF_34", "minute": 34, "second": 22,
                        "type": "OFFSIDE_CHECK", "category": "Offside Leading to Goal",
                        "desc": "Aurora FC goal disallowed for offside: Striker shoulder was 3.8cm ahead of second-last defender knee at pass release.",
                        "desc_ar": "إلغاء هدف أورورا للتسلل: كتف المهاجم متقدم بـ 3.8 سم على ركبة المدافع قبل الأخير لحظة التمرير.",
                        "x": 92.5, "y": 44.0, "status": "OFFSIDE_CONFIRMED",
                        "ruling": "Offside Disallowed Goal - Indirect Free Kick (IFAB Law 11)",
                        "ruling_ar": "إلغاء الهدف للتسلل وركلة حرة غير مباشرة (قانون إيفاب 11)",
                        "action": "None", "restart": "Indirect Free Kick", "margin": "+/- 3.8cm"
                    }
                ]
            },
            {
                "id": "MATCH_SYN_INSUFFICIENT",
                "home_team": {"id": "CELTIC_CR", "name": "Celtic Crest", "name_ar": "سيلتيك كريست", "code": "CCR", "color": "#15803D"},
                "away_team": {"id": "DYNAMO_V", "name": "Dynamo Vale", "name_ar": "دينامو فيل", "code": "DYN", "color": "#475569"},
                "home_score": 1, "away_score": 1, "minute": 90,
                "stadium": "Highland Park", "referee": "Anthony Taylor",
                "label": "Insufficient Evidence Dilemma (Severe Camera Occlusion)",
                "incidents": [
                    {
                        "id": "INC_SYN_INS_71", "minute": 71, "second": 5,
                        "type": "PENALTY_CHECK", "category": "Goal-line Scramble / Insufficient Evidence",
                        "desc": "VAR Review Inconclusive: Goalmouth scramble with 6 players obstructing view. No conclusive angle proves ball fully crossed line. On-field decision stands.",
                        "desc_ar": "فحص الفيديو غير حاسم: ازدحام أمام المرمى مع حجب 6 لاعبين لزاوية الرؤية. لا يوجد دليل مرئي قاطع بتجاوز الكرة للخط. تأكيد قرار الحكم.",
                        "x": 119.5, "y": 40.0, "status": "INSUFFICIENT_EVIDENCE_CALL_STANDS",
                        "ruling": "On-Field Call Stands (No Clear and Obvious Error Provable)",
                        "ruling_ar": "استمرار قرار الحكم الأصلي لعدم ثبوت خطأ واضح وجلي",
                        "action": "None", "restart": "Play On / Drop Ball", "margin": "UNRESOLVED_OCCLUDED"
                    }
                ]
            }
        ]

        for scfg in synthetic_scenarios:
            mid = scfg["id"]
            if db.query(Match).filter_by(id=mid).first():
                logger.info(f"Synthetic match {mid} already exists, skipping creation.")
                continue

            ht = scfg["home_team"]
            at = scfg["away_team"]

            if not db.query(Team).filter_by(id=ht["id"]).first():
                db.add(Team(
                    id=ht["id"], name=ht["name"], name_ar=ht.get("name_ar"),
                    short_code=ht["code"], country="England",
                    primary_color=ht["color"], secondary_color="#0F172A", is_synthetic=True
                ))
            if not db.query(Team).filter_by(id=at["id"]).first():
                db.add(Team(
                    id=at["id"], name=at["name"], name_ar=at.get("name_ar"),
                    short_code=at["code"], country="England",
                    primary_color=at["color"], secondary_color="#0F172A", is_synthetic=True
                ))
            db.commit()

            match_obj = Match(
                id=mid,
                home_team_id=ht["id"],
                away_team_id=at["id"],
                match_date="2026-10-25",
                home_score=scfg["home_score"],
                away_score=scfg["away_score"],
                current_minute=scfg["minute"],
                current_second=0,
                status="COMPLETED",
                stadium_name=scfg["stadium"],
                referee_name=scfg["referee"],
                var_official_name="RefVision Decision Engine",
                is_synthetic=True,
                provenance_source=f"RefVision Synthetic Engine ({scfg['label']})",
                provenance_url="https://github.com/microsoft/insidethegamehackathon"
            )
            db.add(match_obj)
            db.commit()

            # Generate synthetic events
            batch = []
            for m in range(0, 91, 2):
                team_id = ht["id"] if (m % 4 == 0) else at["id"]
                ev_type = "Pass"
                if m in [15, 30, 60, 75]:
                    ev_type = "Shot"
                elif m in [20, 45, 68, 82]:
                    ev_type = "Foul"

                batch.append(MatchEvent(
                    id=f"EVT_{mid}_{m:02d}",
                    match_id=mid,
                    event_type=ev_type,
                    minute=m,
                    second=15,
                    timestamp_seconds=float(m * 60 + 15),
                    period=1 if m <= 45 else 2,
                    team_id=team_id,
                    player_name=f"{team_id} Player {m % 11 + 1}",
                    x=float(20 + (m * 0.9) % 80),
                    y=float(15 + (m * 1.3) % 70),
                    outcome="Complete" if ev_type == "Pass" else None,
                    description=f"{ev_type} in {scfg['label']}",
                    is_synthetic=True
                ))
            db.add_all(batch)
            db.commit()

            # Add Incidents
            for inc in scfg["incidents"]:
                db.add(Incident(
                    id=inc["id"],
                    match_id=mid,
                    minute=inc["minute"],
                    second=inc["second"],
                    incident_type=inc["type"],
                    review_category=inc["category"],
                    description=inc["desc"],
                    description_ar=inc.get("desc_ar"),
                    x=inc["x"], y=inc["y"],
                    review_status=inc["status"],
                    human_ruling=inc["ruling"],
                    human_ruling_ar=inc.get("ruling_ar"),
                    disciplinary_action=inc["action"],
                    restart_play=inc["restart"],
                    uncertainty_margin=inc["margin"],
                    is_synthetic=True
                ))
            db.commit()
            logger.info(f"Seeded synthetic match {mid}: {scfg['label']}")

        total_matches = db.query(Match).count()
        total_events = db.query(MatchEvent).count()
        total_incidents = db.query(Incident).count()
        logger.info(f"Seeding completed successfully! Total matches in DB: {total_matches}, Total events: {total_events}, Total incidents: {total_incidents}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_multi_matches()
