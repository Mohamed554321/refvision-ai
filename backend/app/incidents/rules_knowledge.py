from typing import Dict, Any

IFAB_RULES_KNOWLEDGE: Dict[str, Dict[str, Any]] = {
    "LAW_12_SECTION_1_FOULS": {
        "law_number": "Law 12",
        "title": "Fouls and Misconduct - Direct Free Kick",
        "title_ar": "القانون 12 - الأخطاء وسوء السلوك (الركلة الحرة المباشرة)",
        "summary": "A direct free kick is awarded if a player commits any of the following offences against an opponent in a manner considered by the referee to be careless, reckless or using excessive force: charges, jumps at, kicks or attempts to kick, pushes, strikes, tackles or challenges, trips or attempts to trip.",
        "summary_ar": "تُمنح ركلة حرة مباشرة إذا ارتكب لاعب أي مخالفة بحق منافس بتهور أو إهمال أو إفراط في القوة: شحن، قفز، ركل، دفع، ضرب، عرقلة أو محاولة عرقلة.",
        "penalty_rule": "If an offence involves contact it is penalised by a direct free kick or penalty kick (if committed inside the offender's penalty area).",
        "penalty_rule_ar": "إذا انطوت المخالفة على التحام بدني يُعاقب عليها بركلة حرة مباشرة، أو بركلة جزاء إذا ارتُكبت داخل منطقة جزاء المخالف.",
        "boundary_clause": "The lines demarcating the penalty area belong to the penalty area. If contact begins outside the boundary line, the restart must be a direct free kick outside the area, regardless of where the player subsequently falls.",
        "boundary_clause_ar": "تُعتبر الخطوط المحددة لمنطقة الجزاء جزءاً من المنطقة. إذا بدأ الالتحام خارج خط الحدود، فإن الاستئناف يكون بركلة حرة مباشرة خارج المنطقة بصرف النظر عن مكان سقوط اللاعب بعد ذلك."
    },
    "LAW_12_SECTION_HANDBALL": {
        "law_number": "Law 12",
        "title": "Handling the Ball",
        "title_ar": "القانون 12 - لمس الكرة باليد",
        "summary": "It is an offence if a player deliberately touches the ball with hand/arm, or touches the ball when their hand/arm has made their body unnaturally bigger. A player is not penalized if the ball comes off their own body/nearby player and strikes an arm close to the body without unnatural extension.",
        "summary_ar": "تُعد لمسة يد مخالفة إذا لمس اللاعب الكرة عمداً، أو إذا جعلت يده/ذراعه جسده أكبر بشكل غير طبيعي. لا يُعاقب اللاعب إذا ارتدت الكرة من مسافة قريبة جداً وكانت الذراع مضمومة للجسد.",
        "proximity_threshold_meters": 1.8
    },
    "LAW_11_OFFSIDE": {
        "law_number": "Law 11",
        "title": "Offside",
        "title_ar": "القانون 11 - التسلل",
        "summary": "A player is in an offside position if any part of the head, body or feet is in the opponents' half and nearer to the opponents' goal line than both the ball and the second-last opponent. The hands and arms of all players are not considered.",
        "summary_ar": "يكون اللاعب في موقف تسلل إذا كان أي جزء من رأسه أو جسده أو قدميه أقرب إلى خط مرمى المنافس من الكرة واللاعب قبل الأخير من المنافس. لا تُحتسب أيدي وأذرع اللاعبين."
    },
    "VAR_PROTOCOL": {
        "law_number": "VAR Protocol",
        "title": "Clear and Obvious Error Standard",
        "title_ar": "بروتوكول الـ VAR - معيار الخطأ الواضح والجلي",
        "summary": "The VAR may assist the referee only in the event of a 'clear and obvious error' or 'serious missed incident' in relation to: Goal/no goal, Penalty/no penalty, Direct red card, Mistaken identity.",
        "summary_ar": "يساعد حكم الفيديو الحكم الرئيسي فقط في حالات الخطأ الواضح والجلي أو الحالات الخطيرة غير المشاهدة المتعلقة بـ: هدف/لا هدف، ركلة جزاء/لا ركلة جزاء، بطاقة حمراء مباشرة، والخطأ في تحديد هوية اللاعب.",
        "human_authority_clause": "The original decision given by the referee will not be changed unless the video review clearly shows that the decision was a clear and obvious error. The referee always makes the final decision.",
        "human_authority_clause_ar": "لا يتم تغيير القرار الأصلي للحكم إلا إذا أظهرت المراجعة بالفيديو وجود خطأ واضح وجلي. الحكم دائماً هو صاحب القرار النهائي."
    }
}
