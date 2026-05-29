/**
 * ImageUploadLogger — shared AI image-upload panel
 * Drop into any log component; calls the /api/ai/v1/* endpoint.
 */

import React, { useRef, useState, useCallback } from 'react';
import { Upload, Camera, Sparkles, X, CheckCircle, Loader } from 'lucide-react';
import { API_ORIGIN, getToken, getUserId } from '../api';
import styles from './ImageUploadLogger.module.css';

const AI_BASE = `${API_ORIGIN.replace(/\/$/, '')}/api/ai/v1`;

interface Props {
  endpoint: string;
  extraFields?: Record<string, string>;
  onSuccess: (data: any) => void;
  onError?: (msg: string) => void;
  label?: string;
  hint?: string;
}

type UploadState = 'idle' | 'dragging' | 'preview' | 'uploading' | 'success' | 'error';

export default function ImageUploadLogger({
  endpoint, extraFields = {}, onSuccess, onError, label = 'AI Log from Image', hint,
}: Props) {
  const [state, setState] = useState<UploadState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  const setFileAndPreview = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
    setState('preview');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) setFileAndPreview(f);
    else setState('idle');
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFileAndPreview(f);
  };

  const clearFile = () => {
    setFile(null); setPreview(null); setState('idle');
    setErrorMsg(''); setSuccessMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const upload = async () => {
    if (!file || inFlight.current) return;
    inFlight.current = true;
    setState('uploading');
    setErrorMsg(''); setSuccessMsg('');

    const fd = new FormData();
    fd.append('userId', getUserId() || '');
    fd.append('image', file);
    Object.entries(extraFields).forEach(([k, v]) => fd.append(k, v));

    try {
      const token = getToken();
      const res = await fetch(`${AI_BASE}/${endpoint}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setState('success');
      setSuccessMsg('Logged successfully via AI! ✓');
      onSuccess(data);
      setTimeout(() => clearFile(), 2200);
    } catch (e: any) {
      const msg = e.message || 'Upload failed';
      setState('error');
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.aiPill}>
        <Sparkles size={13} />
        <span>AI Vision — snap &amp; log instantly</span>
      </div>

      {(state === 'preview' || state === 'uploading' || state === 'success' || state === 'error') ? (
        <div className={styles.previewArea}>
          <div className={styles.previewImgWrap}>
            {preview && <img src={preview} alt="preview" className={styles.previewImg} />}
            {state === 'uploading' && (
              <div className={styles.previewOverlay}>
                <Loader size={32} className={styles.spin} />
                <span>Analyzing with AI…</span>
              </div>
            )}
            {state === 'success' && (
              <div className={`${styles.previewOverlay} ${styles.successOverlay}`}>
                <CheckCircle size={32} />
                <span>{successMsg}</span>
              </div>
            )}
            {state !== 'uploading' && state !== 'success' && (
              <button className={styles.clearBtn} onClick={clearFile}><X size={14} /></button>
            )}
          </div>
          <div className={styles.previewMeta}>
            <span className={styles.previewFileName}>{file?.name}</span>
            <span className={styles.previewFileSize}>{file ? (file.size / 1024).toFixed(0) + ' KB' : ''}</span>
          </div>
          {state === 'error' && <div className={styles.errorMsg}>{errorMsg}</div>}
          {(state === 'preview' || state === 'error') && (
            <div className={styles.previewActions}>
              <button className={styles.cancelSmall} onClick={clearFile}>Change photo</button>
              <button className={styles.uploadBtn} onClick={upload} disabled={inFlight.current}>
                <Sparkles size={14} /> Analyze &amp; Log
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${state === 'dragging' ? styles.dragging : ''}`}
          onDragOver={e => { e.preventDefault(); setState('dragging'); }}
          onDragLeave={() => setState('idle')}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className={styles.dropIcon}><Camera size={28} /></div>
          <div className={styles.dropText}>
            <span className={styles.dropHeading}>Drop image or tap to browse</span>
            <span className={styles.dropHint}>{hint || 'JPG, PNG, WEBP — max 10 MB'}</span>
          </div>
          <div className={styles.dropOr}><span />or<span /></div>
          <button className={styles.browseBtn} type="button" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
            <Upload size={14} /> Choose File
          </button>
        </div>
      )}

      <input
        ref={inputRef} type="file" accept="image/*"
        className={styles.hiddenInput}
        onChange={handleFileInput}
      />
    </div>
  );
}
