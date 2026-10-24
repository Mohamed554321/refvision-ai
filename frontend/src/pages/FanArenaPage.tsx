import React, { useState } from 'react';
import { ActivePredictionGame, FanUserProfile, LeaderboardEntry } from '../types/football';
import { useLanguage } from '../i18n/LanguageContext';
import { Flame, Trophy, Award, Lock, CheckCircle, XCircle, Zap, ShieldCheck } from 'lucide-react';

interface FanArenaPageProps {
  games: ActivePredictionGame[];
  profile: FanUserProfile;
  leaderboard: LeaderboardEntry[];
  currentSeconds: number;
  onSubmitPrediction: (gameId: string, optionId: string) => Promise<void>;
}

export const FanArenaPage: React.FC<FanArenaPageProps> = ({
  games,
  profile,
  leaderboard,
  currentSeconds,
  onSubmitPrediction
}) => {
  const { t, isRtl } = useLanguage();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [submittingGameId, setSubmittingGameId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelect = (gameId: string, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [gameId]: optionId }));
  };

  const handleSubmit = async (gameId: string) => {
    const optId = selectedOptions[gameId];
    if (!optId) return;

    setSubmittingGameId(gameId);
    setErrorMsg(null);
    try {
      await onSubmitPrediction(gameId, optId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setSubmittingGameId(null);
    }
  };

  return (
    <div style={{ padding: '28px 20px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #091322 0%, #050b14 100%)',
        border: '1px solid #1e2e45',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 215, 0, 0.15)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFD700'
          }}>
            <Flame size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              {t.fanTitle}
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              {t.fanSubtitle}
            </p>
          </div>
        </div>

        {/* Non-monetary points badge */}
        <div style={{
          backgroundColor: '#070b14',
          border: '1px solid #1e2e45',
          borderRadius: '8px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Trophy size={16} color="#FFD700" />
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Your Points</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFD700' }}>{profile.points} PTS</div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#fca5a5'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Prediction Games (Left 65%) + Profile & Leaderboard (Right 35%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Active Prediction Mini-Games */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{
            backgroundColor: 'rgba(0, 255, 135, 0.05)',
            border: '1px solid rgba(0, 255, 135, 0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: '#cbd5e1'
          }}>
            <ShieldCheck size={18} color="#00FF87" />
            <span>{t.ruleNotice}</span>
          </div>

          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', margin: '6px 0 0 0' }}>
            {t.openPredictions} ({games.length})
          </h2>

          {games.map((game) => {
            const isLocked = currentSeconds >= game.lock_deadline_seconds || game.is_locked;
            const isResolved = game.is_resolved;
            const userSub = profile.prediction_history.find(s => s.game_id === game.game_id);
            const selectedOpt = selectedOptions[game.game_id] || userSub?.selected_option_id;

            return (
              <div
                key={game.game_id}
                style={{
                  backgroundColor: '#0c1324',
                  border: isResolved
                    ? '1px solid #334155'
                    : isLocked
                    ? '1px solid rgba(234, 179, 8, 0.4)'
                    : '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                }}
              >
                {/* Game Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#00FF87',
                      backgroundColor: 'rgba(0, 255, 135, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {game.game_type}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '6px 0 2px 0' }}>
                      {isRtl ? game.title_ar : game.title}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isResolved ? (
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}>
                        RESOLVED
                      </span>
                    ) : isLocked ? (
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                        color: '#eab308',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Lock size={12} />
                        LOCKED
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: 'rgba(0, 255, 135, 0.15)',
                        color: '#00FF87',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}>
                        OPEN
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                  {isRtl ? game.description_ar : game.description}
                </p>

                {/* Options List */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                  {game.options.map((opt) => {
                    const isPicked = selectedOpt === opt.id;
                    const isCorrect = isResolved && game.correct_option_id === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isLocked || isResolved}
                        onClick={() => handleSelect(game.game_id, opt.id)}
                        style={{
                          backgroundColor: isCorrect
                            ? 'rgba(0, 255, 135, 0.2)'
                            : isPicked
                            ? 'rgba(58, 134, 255, 0.25)'
                            : '#070b16',
                          border: isCorrect
                            ? '2px solid #00FF87'
                            : isPicked
                            ? '1px solid #3A86FF'
                            : '1px solid #1e293b',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          textAlign: isRtl ? 'right' : 'left',
                          cursor: (isLocked || isResolved) ? 'default' : 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                            {isRtl ? opt.label_ar : opt.label}
                          </div>
                          {opt.subtext && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{opt.subtext}</div>
                          )}
                        </div>

                        <span style={{
                          fontSize: '11px',
                          color: '#FFD700',
                          backgroundColor: 'rgba(255, 215, 0, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          {opt.points_multiplier}x
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Outcome resolution banner if resolved */}
                {isResolved && (
                  <div style={{
                    backgroundColor: '#070b16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#e2e8f0'
                  }}>
                    <span style={{ fontWeight: 700, color: '#00FF87', marginRight: '6px' }}>
                      {isRtl ? 'النتيجة المحسومة:' : 'Verified Outcome:'}
                    </span>
                    <span>{isRtl ? game.outcome_summary_ar : game.outcome_summary}</span>
                  </div>
                )}

                {/* Submission footer */}
                {!isResolved && !isLocked && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleSubmit(game.game_id)}
                      disabled={!selectedOptions[game.game_id] || submittingGameId === game.game_id}
                      style={{
                        backgroundColor: '#00FF87',
                        color: '#070b15',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: (!selectedOptions[game.game_id] || submittingGameId === game.game_id) ? 'not-allowed' : 'pointer',
                        opacity: (!selectedOptions[game.game_id] || submittingGameId === game.game_id) ? 0.6 : 1
                      }}
                    >
                      {t.btnSubmitPrediction}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Fan Profile & Badges & Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User Profile Card */}
          <div style={{
            backgroundColor: '#0c1324',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px 0' }}>
              {t.yourProfile}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#1e3a8a',
                border: '2px solid #00FF87',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                color: '#FFFFFF'
              }}>
                {profile.username.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                  {profile.username}
                </div>
                <div style={{ fontSize: '11px', color: '#00FF87', fontWeight: 600 }}>
                  Fan of Apex Vanguard FC
                </div>
              </div>
            </div>

            {/* Profile Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ backgroundColor: '#070b16', padding: '10px 8px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Points</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFD700', marginTop: '2px' }}>
                  {profile.points}
                </div>
              </div>

              <div style={{ backgroundColor: '#070b16', padding: '10px 8px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Streak</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ff0055', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                  <Zap size={14} fill="#ff0055" />
                  <span>{profile.streak_count}</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#070b16', padding: '10px 8px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Accuracy</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#00FF87', marginTop: '2px' }}>
                  {profile.accuracy_rate}%
                </div>
              </div>
            </div>

            {/* Badges Section */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '10px' }}>
                {t.badgesTitle}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {profile.badges.map((badge) => (
                  <div
                    key={badge.badge_id}
                    style={{
                      backgroundColor: badge.is_unlocked ? 'rgba(0, 255, 135, 0.08)' : '#070b16',
                      border: badge.is_unlocked ? '1px solid rgba(0, 255, 135, 0.3)' : '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      opacity: badge.is_unlocked ? 1 : 0.5
                    }}
                  >
                    <Award size={18} color={badge.is_unlocked ? '#00FF87' : '#64748b'} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: badge.is_unlocked ? '#FFFFFF' : '#94a3b8' }}>
                        {isRtl ? badge.name_ar : badge.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {isRtl ? badge.description_ar : badge.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leaderboard Card */}
          <div style={{
            backgroundColor: '#0c1324',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Trophy size={16} color="#FFD700" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                {t.leaderboard}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.username === profile.username;
                return (
                  <div
                    key={entry.rank}
                    style={{
                      backgroundColor: isCurrentUser ? 'rgba(0, 255, 135, 0.12)' : '#070b16',
                      border: isCurrentUser ? '1px solid #00FF87' : '1px solid #1e293b',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : '#CD7F32',
                        minWidth: '16px'
                      }}>
                        #{entry.rank}
                      </span>
                      <span style={{ fontWeight: 600, color: '#FFFFFF' }}>
                        {entry.username} {isCurrentUser && '(You)'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#00FF87', fontWeight: 700 }}>{entry.points} pts</span>
                      <span style={{ color: '#94a3b8' }}>{entry.accuracy_rate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
