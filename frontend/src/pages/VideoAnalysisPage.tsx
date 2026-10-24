import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { VideoAnalysisDetail, ExtractedFrame } from '../types/football';
import {
  Upload, Video, AlertTriangle, Shield, CheckCircle, Clock,
  Eye, FileText, Trash2, Play, Pause, RotateCcw, Crosshair,
  ExternalLink, Layers, Award, Info
} from 'lucide-react';

export const VideoAnalysisPage: React.FC = () => {
  const { isRtl } = useLanguage();

  // Upload & File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [incidentTimestamp, setIncidentTimestamp] = useState<number>(2.0);
  const [incidentType, setIncidentType] = useState<string>('PENALTY_AREA_CONTACT');
  const [userDescription, setUserDescription] = useState<string>(
    'Check if initial contact occurred outside or inside the 18-yard box line.'
  );

  // Processing & Results State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<VideoAnalysisDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<ExtractedFrame | null>(null);

  // Video Player Controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Human Review Form State
  const [ruling, setRuling] = useState<string>('Direct Free Kick Outside Box');
  const [disciplinary, setDisciplinary] = useState<string>('Yellow Card (SPA)');
  const [restart, setRestart] = useState<string>('Direct Free Kick');
  const [rationale, setRationale] = useState<string>(
    'Frame-by-frame inspection proves initial physical contact was initiated 10cm outside the 18-yard line before momentum carried player into the area.'
  );
  const [reviewedBy, setReviewedBy] = useState<string>('Marcus Sterling (Official Referee)');
  const [isSavingDecision, setIsSavingDecision] = useState<boolean>(false);
  const [decisionSuccess, setDecisionSuccess] = useState<boolean>(false);

  // Auto-sync video player time
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const seekToTime = (timeSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, timeSeconds);
      setCurrentTime(timeSeconds);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Handle Drag & Drop / File selection
  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    const validExts = ['.mp4', '.webm', '.mov', '.avi'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) {
      setErrorMsg(`Unsupported file type '${ext}'. Please upload an MP4, WebM, or MOV video.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 50MB local limit.`);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalysis(null);
  };

  // 1-Click Load Demo Sample Video
  const handleLoadSample = async () => {
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const sample = await api.getSampleVideo();
      setPreviewUrl(`http://localhost:8000${sample.video_url}`);
      setIncidentTimestamp(sample.incident_timestamp || 2.0);
      setIncidentType(sample.incident_type || 'PENALTY_AREA_CONTACT');
      setUserDescription(sample.user_description || '');

      // Trigger automatic run for sample
      setIsAnalyzing(true);
      const res = await api.runVideoAnalysis(sample.analysis_id, {
        incident_timestamp: sample.incident_timestamp || 2.0,
        incident_type: sample.incident_type || 'PENALTY_AREA_CONTACT',
        user_description: sample.user_description
      });
      const detail = await api.getVideoAnalysis(sample.analysis_id);
      setAnalysis(detail);
      if (detail.extracted_frames && detail.extracted_frames.length > 0) {
        setSelectedFrame(detail.extracted_frames[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load demo video');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  // Upload and Run Analysis
  const handleAnalyzeVideo = async () => {
    if (!selectedFile && !analysis) {
      setErrorMsg('Please select a video file or load the sample video.');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      let analysisId = analysis?.analysis_id;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('incident_timestamp', incidentTimestamp.toString());
        formData.append('incident_type', incidentType);
        if (userDescription) formData.append('user_description', userDescription);

        const uploadRes = await api.uploadVideoClip(formData);
        analysisId = uploadRes.analysis_id;
      }

      if (!analysisId) throw new Error('No analysis ID generated');

      setIsUploading(false);

      // Run OpenCV frame extraction and referee analysis
      await api.runVideoAnalysis(analysisId, {
        incident_timestamp: incidentTimestamp,
        incident_type: incidentType,
        user_description: userDescription
      });

      // Retrieve full report
      const detail = await api.getVideoAnalysis(analysisId);
      setAnalysis(detail);
      setPreviewUrl(`http://localhost:8000${detail.video_url}`);
      if (detail.extracted_frames && detail.extracted_frames.length > 0) {
        setSelectedFrame(detail.extracted_frames[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Video analysis execution failed.');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  // Record Human Referee Decision
  const handleRecordHumanDecision = async () => {
    if (!analysis) return;
    setIsSavingDecision(true);
    try {
      await api.recordVideoDecision(analysis.analysis_id, {
        official_ruling: ruling,
        disciplinary_action: disciplinary,
        restart_play: restart,
        rationale: rationale,
        reviewed_by: reviewedBy
      });
      const updated = await api.getVideoAnalysis(analysis.analysis_id);
      setAnalysis(updated);
      setDecisionSuccess(true);
      setTimeout(() => setDecisionSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save referee decision.');
    } finally {
      setIsSavingDecision(false);
    }
  };

  // Delete Video Analysis
  const handleDeleteAnalysis = async () => {
    if (!analysis) return;
    if (!window.confirm('Delete this video analysis and purge all extracted frame files from disk?')) return;
    try {
      await api.deleteVideoAnalysis(analysis.analysis_id);
      setAnalysis(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete analysis');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Broadcast Header Banner */}
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
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 255, 135, 0.1)',
            border: '1px solid rgba(0, 255, 135, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00FF87'
          }}>
            <Video size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                {isRtl ? 'تحليل الفيديو والتحقق التحكيمي المستند للأدلة' : 'Video-Based Referee Analysis & Evidence Extraction'}
              </h1>
              <span style={{
                backgroundColor: '#00FF87',
                color: '#060a12',
                fontSize: '10px',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}>
                OPENCV 5.0
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {isRtl
                ? 'استخراج إطارات الفيديو محلياً، تحليل الحركة والحدود المكانية، والربط الدقيق مع مواد قانون كرة القدم (IFAB)'
                : 'Upload football clips for local frame extraction, spatial motion inspection, and IFAB law-grounded decision support.'}
            </p>
          </div>
        </div>

        {/* Quick Demo Button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleLoadSample}
            disabled={isUploading || isAnalyzing}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isUploading || isAnalyzing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Play size={14} />
            <span>{isRtl ? 'تجربة مقطع تدريبي جاهز (نقرة واحدة)' : 'Load Demo Referee Clip (1-Click)'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fca5a5',
          fontSize: '13px'
        }}>
          <AlertTriangle size={18} color="#ef4444" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Workspace Grid: Upload & Controls (Left) + Video Player & Scrub (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: previewUrl ? 'minmax(340px, 420px) 1fr' : '1fr',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Upload & Incident Setup Panel */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} color="#00FF87" />
            <span>{isRtl ? 'تحميل مقطع الفيديو وتحديد الحالة' : 'Upload Match Clip & Target Incident'}</span>
          </h2>

          {/* Drag & Drop Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            style={{
              border: '2px dashed #24354d',
              borderRadius: '10px',
              padding: '24px 16px',
              textAlign: 'center',
              backgroundColor: '#080d16',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'border-color 0.2s ease'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.webm,.mov,.avi"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <Upload size={32} color="#00FF87" style={{ margin: '0 auto 8px auto', opacity: 0.8 }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
              {selectedFile ? selectedFile.name : (isRtl ? 'اسحب ملف الفيديو إلى هنا أو انقر للاختيار' : 'Drag & drop football clip or click to browse')}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              MP4, WebM, MOV (Max 50MB • Processed 100% locally)
            </div>
            {selectedFile && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#00FF87', fontWeight: 600 }}>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for OpenCV ingestion
              </div>
            )}
          </div>

          {/* Incident Parameters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                {isRtl ? 'فئة الحالة التحكيمية' : 'Incident Category'}
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid #1e2e45',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="PENALTY_AREA_CONTACT">Penalty Area Boundary / Potential Foul (Law 12.1 / 14)</option>
                <option value="HANDBALL">Handball / Arm Silhouette Assessment (Law 12.1)</option>
                <option value="OFFSIDE">Offside Demarcation / Penultimate Defender (Law 11)</option>
                <option value="SERIOUS_FOUL_PLAY">Serious Foul Play / Possible Red Card / DOGSO (Law 12.3)</option>
                <option value="GOAL_INFRINGING">Goal Infringement / Attacking Challenge</option>
                <option value="OTHER">Other Disciplinary Incident</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                {isRtl ? 'توقيت الواقعة في المقطع (بالثواني):' : 'Incident Timestamp in Clip (Seconds):'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={incidentTimestamp}
                  onChange={(e) => setIncidentTimestamp(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100px',
                    padding: '8px 12px',
                    backgroundColor: '#070b14',
                    border: '1px solid #1e2e45',
                    borderRadius: '6px',
                    color: '#00FF87',
                    fontWeight: 700,
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIncidentTimestamp(Math.round(currentTime * 10) / 10)}
                  style={{
                    backgroundColor: '#162235',
                    border: '1px solid #253954',
                    color: '#94a3b8',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  {isRtl ? 'استخدام وقت المشغل الحالي' : 'Use Current Player Time'} ({currentTime.toFixed(1)}s)
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                {isRtl ? 'سؤال المراجعة / استفسار الحكم' : 'Review Inquiry / Context for Officiating AI'}
              </label>
              <textarea
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                rows={3}
                placeholder="e.g. Check whether physical challenge began before the 18-yard perimeter line..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid #1e2e45',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Main Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={handleAnalyzeVideo}
                disabled={isUploading || isAnalyzing || (!selectedFile && !previewUrl)}
                style={{
                  flex: 1,
                  backgroundColor: '#00FF87',
                  color: '#040d1a',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: isUploading || isAnalyzing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 15px rgba(0, 255, 135, 0.2)'
                }}
              >
                <Crosshair size={18} />
                <span>
                  {isAnalyzing
                    ? (isRtl ? 'جاري الفحص واستخراج الإطارات...' : 'Extracting Frames & Analyzing...')
                    : (isRtl ? 'تشغيل فحص الفيديو الآن' : 'Run Video Analysis')}
                </span>
              </button>

              {analysis && (
                <button
                  onClick={handleDeleteAnalysis}
                  title="Purge local video and extracted artifacts"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: '8px',
                    padding: '0 14px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Player & Synchronized Inspection Window */}
        {previewUrl ? (
          <div style={{
            backgroundColor: '#0c121d',
            border: '1px solid #1e2e45',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00FF87' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  {analysis?.filename || selectedFile?.name || 'Football Incident Clip'}
                </span>
                {analysis?.metadata && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    ({analysis.metadata.width}x{analysis.metadata.height} • {analysis.metadata.fps} FPS • {analysis.metadata.duration_seconds}s)
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                color: '#00FF87',
                fontWeight: 700,
                backgroundColor: '#070b14',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #1e2e45'
              }}>
                TC: {currentTime.toFixed(2)}s / {(analysis?.metadata.duration_seconds || 0).toFixed(2)}s
              </div>
            </div>

            {/* Video Element */}
            <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000000' }}>
              <video
                ref={videoRef}
                src={previewUrl}
                onTimeUpdate={handleTimeUpdate}
                controls
                style={{ width: '100%', maxHeight: '420px', display: 'block' }}
              />
            </div>

            {/* Player Controls Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#070b14',
              borderRadius: '6px',
              border: '1px solid #1e2e45'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={togglePlay}
                  style={{
                    backgroundColor: '#162235',
                    border: '1px solid #24354d',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  onClick={() => seekToTime(0)}
                  style={{
                    backgroundColor: '#162235',
                    border: '1px solid #24354d',
                    color: '#94a3b8',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => seekToTime(incidentTimestamp)}
                  style={{
                    backgroundColor: 'rgba(255, 0, 85, 0.15)',
                    border: '1px solid #ff0055',
                    color: '#ff4d88',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Crosshair size={13} />
                  <span>{isRtl ? 'القفز إلى لحظة الواقعة' : 'Jump to Incident Anchor'} ({incidentTimestamp}s)</span>
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {analysis?.observable_evidence?.spatial_tolerance_margin && (
                  <span>Tolerance: <strong style={{ color: '#F1F5F9' }}>{analysis.observable_evidence.spatial_tolerance_margin}</strong></span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#0c121d',
            border: '1px solid #1e2e45',
            borderRadius: '12px',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <Video size={48} style={{ opacity: 0.3, marginBottom: '14px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#94a3b8' }}>
              {isRtl ? 'لا يوجد فيديو محدد حالياً' : 'No Football Clip Loaded'}
            </div>
            <p style={{ maxWidth: '400px', fontSize: '12px', margin: '6px 0 16px 0' }}>
              {isRtl
                ? 'قم بتحميل مقطع فيديو قصير (حتى 50 ميجابايت) أو انقر على زر "تجربة مقطع تدريبي جاهز" لبدء الفحص الفوري.'
                : 'Upload a short football video (up to 50MB) or click "Load Demo Referee Clip" to inspect real OpenCV frame processing.'}
            </p>
            <button
              onClick={handleLoadSample}
              style={{
                backgroundColor: '#162235',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Load Demo Referee Clip
            </button>
          </div>
        )}
      </div>

      {/* EXTRACTED FRAMES GALLERY */}
      {analysis?.extracted_frames && analysis.extracted_frames.length > 0 && (
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#00FF87" />
              <span>{isRtl ? 'معرض الإطارات المستخرجة وتحليل الحركة (OpenCV)' : 'Extracted Keyframes & Motion Dynamics (OpenCV)'}</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {analysis.extracted_frames.length} {isRtl ? 'إطارات مأخوذة حول وقت الواقعة' : 'calibrated timestamps extracted'}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '6px'
          }}>
            {analysis.extracted_frames.map((frame, idx) => {
              const isSelected = selectedFrame?.frame_id === frame.frame_id;
              return (
                <div
                  key={frame.frame_id || idx}
                  onClick={() => {
                    setSelectedFrame(frame);
                    seekToTime(frame.timestamp_seconds);
                  }}
                  style={{
                    backgroundColor: isSelected ? 'rgba(0, 255, 135, 0.08)' : '#070b14',
                    border: isSelected ? '2px solid #00FF87' : '1px solid #1e2e45',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: frame.is_focal_point ? '0 0 10px rgba(255, 0, 85, 0.3)' : 'none'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '95px', backgroundColor: '#000' }}>
                    <img
                      src={`http://localhost:8000${frame.url}`}
                      alt={`Frame at ${frame.timestamp_seconds}s`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {frame.is_focal_point && (
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: '#ff0055',
                        color: '#FFF',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        ANCHOR
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                      <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{frame.timestamp_seconds.toFixed(2)}s</span>
                      <span style={{ color: frame.motion_energy > 5 ? '#ffaa00' : '#00FF87' }}>
                        Δ {frame.motion_energy.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      Clarity: {frame.sharpness_score}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4-STAGE ANALYSIS RESULTS WORKSPACE */}
      {analysis?.observable_evidence && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '24px',
          marginBottom: '28px'
        }}>
          {/* STAGE 1: Observable Evidence & Video Quality */}
          <div style={{
            backgroundColor: '#0c121d',
            border: '1px solid #1e2e45',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} />
                <span>{isRtl ? 'المرحلة 1: الأدلة المرئية المقاسة' : 'Stage 1: Measured Visual Evidence'}</span>
              </h3>
              <span style={{
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                OPENCV EXTRACTED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#070b14', padding: '10px', borderRadius: '6px', border: '1px solid #1e2e45' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Inspection Window</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {analysis.observable_evidence.inspection_window}
                </div>
              </div>
              <div style={{ backgroundColor: '#070b14', padding: '10px', borderRadius: '6px', border: '1px solid #1e2e45' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Spatial Tolerance Margin</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#eab308', marginTop: '2px' }}>
                  {analysis.observable_evidence.spatial_tolerance_margin}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', margin: '0 0 8px 0' }}>
              {isRtl ? 'الملاحظات المرئية المسجلة:' : 'Key Visual Observations:'}
            </h4>
            <ul style={{ margin: 0, paddingLeft: isRtl ? 0 : '18px', paddingRight: isRtl ? '18px' : 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              {analysis.observable_evidence.visual_observations.map((obs, i) => (
                <li key={i}>{obs}</li>
              ))}
            </ul>

            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', margin: '14px 0 8px 0' }}>
              {isRtl ? 'القيود التقنية والأدلة المفقودة:' : 'Technical Limitations & Missing Telemetry:'}
            </h4>
            <ul style={{ margin: 0, paddingLeft: isRtl ? 0 : '18px', paddingRight: isRtl ? '18px' : 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              {analysis.observable_evidence.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* STAGE 2 & 3: IFAB Rule Grounding */}
          <div style={{
            backgroundColor: '#0c121d',
            border: '1px solid #1e2e45',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#00FF87', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} />
                <span>{isRtl ? 'المرحلة 2 و3: الربط بقوانين الإيفاب الرسمية' : 'Stage 2 & 3: Official IFAB Laws Grounding'}</span>
              </h3>
              <span style={{
                backgroundColor: 'rgba(0, 255, 135, 0.1)',
                border: '1px solid rgba(0, 255, 135, 0.3)',
                color: '#00FF87',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                IFAB 2025/26
              </span>
            </div>

            {analysis.rule_references && analysis.rule_references.map((rule, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#070b14',
                  border: '1px solid #1e2e45',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: '#00FF87', fontWeight: 700, fontSize: '13px' }}>
                    {rule.law_number} — {rule.law_title}
                  </span>
                  <a
                    href={rule.official_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <span>Source</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {rule.summary}
                </p>
                {rule.key_criteria_to_assess && (
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                      {isRtl ? 'عناصر التحقق القانوني الواجب بحثها:' : 'Legal Criteria to Assess:'}
                    </span>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: isRtl ? 0 : '16px', paddingRight: isRtl ? '16px' : 0, fontSize: '11px', color: '#94a3b8' }}>
                      {rule.key_criteria_to_assess.map((crit, cIdx) => (
                        <li key={cIdx}>{crit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* STAGE 4: AI Decision-Support Recommendation */}
          {analysis.decision_support && (
            <div style={{
              backgroundColor: '#0c121d',
              border: '1px solid #1e2e45',
              borderRadius: '12px',
              padding: '20px',
              gridColumn: '1 / -1'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} color="#f59e0b" />
                  <span>{isRtl ? 'المرحلة 4: توصية تقييم الحالة ودعم القرار' : 'Stage 4: Officiating Review Recommendation'}</span>
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid #f59e0b',
                    color: '#fbbf24',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '6px'
                  }}>
                    {isRtl ? analysis.decision_support.recommendation_label_ar : analysis.decision_support.recommendation_label_en}
                  </span>
                  <span style={{
                    backgroundColor: '#162235',
                    border: '1px solid #253954',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    Sufficiency: {analysis.decision_support.evidence_sufficiency_rating}
                  </span>
                </div>
              </div>

              {/* Supporting vs Contradicting Factors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: 'rgba(0, 255, 135, 0.04)', border: '1px solid rgba(0, 255, 135, 0.2)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#00FF87', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} />
                    <span>{isRtl ? 'العوامل المؤيدة لوجود مخالفة:' : 'Factors Supporting an Infraction:'}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: isRtl ? 0 : '16px', paddingRight: isRtl ? '16px' : 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                    {analysis.decision_support.factors_supporting_offence.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} />
                    <span>{isRtl ? 'العوامل المعارضة / الشكوك القانونية:' : 'Counter-Factors & Ambiguities:'}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: isRtl ? 0 : '16px', paddingRight: isRtl ? '16px' : 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                    {analysis.decision_support.factors_against_offence.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Legal Disclaimer Box */}
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '12px',
                color: '#fde68a',
                lineHeight: '1.5'
              }}>
                <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#f59e0b' }} />
                <div>
                  <strong>{isRtl ? 'بيان عدم المسؤولية والصلاحية القانونية:' : 'Officiating Authority & Legal Grounding Notice:'}</strong>{' '}
                  {isRtl ? analysis.decision_support.uncertainty_statement_ar : analysis.decision_support.uncertainty_statement}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HUMAN REFEREE RECORDING PANEL */}
      {analysis && (
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#00FF87" />
                <span>{isRtl ? 'تسجيل قرار الحكم البشري الرسمي (سجل التدقيق)' : 'Record Official Human Referee Decision (Audit Trail)'}</span>
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {isRtl
                  ? 'يفصل النظام بين التوصيات الاستشارية والقرار السيادي للحكم المعتمد، ويوثق ذلك في سجل التدقيق العام.'
                  : 'Distinguishes machine advisory evidence from the certified ruling of the human official.'}
              </p>
            </div>
            {analysis.human_decision && (
              <span style={{
                backgroundColor: 'rgba(0, 255, 135, 0.15)',
                border: '1px solid #00FF87',
                color: '#00FF87',
                fontSize: '12px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '6px'
              }}>
                ✓ {isRtl ? 'تم تسجيل القرار رسمياً' : 'OFFICIAL DECISION RECORDED'}
              </span>
            )}
          </div>

          {decisionSuccess && (
            <div style={{
              backgroundColor: 'rgba(0, 255, 135, 0.15)',
              border: '1px solid #00FF87',
              borderRadius: '6px',
              padding: '10px 14px',
              color: '#00FF87',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              ✓ Decision successfully committed to database and public audit trail.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                {isRtl ? 'القرار الرسمي للحكم:' : 'Official Ruling:'}
              </label>
              <select
                value={ruling}
                onChange={(e) => setRuling(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid #1e2e45',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="Direct Free Kick Outside Box">Direct Free Kick (Outside Penalty Area)</option>
                <option value="Penalty Kick Awarded">Penalty Kick Awarded (Inside Area)</option>
                <option value="No Foul / Play On">No Foul / Fair Challenge / Play On</option>
                <option value="Offside Restart (Indirect Free Kick)">Offside Confirmed (Indirect Free Kick)</option>
                <option value="Direct Red Card (Serious Foul Play)">Direct Red Card (Serious Foul Play)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                {isRtl ? 'الإجراء التأديبي:' : 'Disciplinary Sanction:'}
              </label>
              <select
                value={disciplinary}
                onChange={(e) => setDisciplinary(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid #1e2e45',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="None">None</option>
                <option value="Yellow Card (Reckless Challenge)">Yellow Card (Reckless Challenge)</option>
                <option value="Yellow Card (SPA)">Yellow Card (Stopping a Promising Attack)</option>
                <option value="Red Card (DOGSO)">Red Card (Denying Obvious Goal Chance)</option>
                <option value="Red Card (Excessive Force)">Red Card (Excessive Force / Violent Conduct)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                {isRtl ? 'طريقة استئناف اللعب:' : 'Match Restart:'}
              </label>
              <select
                value={restart}
                onChange={(e) => setRestart(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid #1e2e45',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="Direct Free Kick">Direct Free Kick</option>
                <option value="Penalty Kick">Penalty Kick</option>
                <option value="Indirect Free Kick">Indirect Free Kick</option>
                <option value="Dropped Ball">Dropped Ball</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                {isRtl ? 'اسم الحكم المعتمد:' : 'Certified Match Official:'}
              </label>
              <input
                type="text"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid #1e2e45',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              {isRtl ? 'حيثيات القرار والأسباب القانونية المسجلة:' : 'Decision Rationale & Law Assessment:'}
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#070b14',
                border: '1px solid #1e2e45',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={handleRecordHumanDecision}
            disabled={isSavingDecision}
            style={{
              backgroundColor: '#00FF87',
              color: '#050a14',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: isSavingDecision ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle size={16} />
            <span>{isSavingDecision ? 'Saving Ruling...' : (isRtl ? 'اعتماد وحفظ قرار الحكم في سجل التدقيق' : 'Commit Ruling to Audit Log')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
