'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { endTone, notify, startRing, startRingback, unlockAudio } from '@/lib/alerts';
import { BASE } from '@/lib/base';

const ICE = process.env.NEXT_PUBLIC_ICE_SERVERS
  ? JSON.parse(process.env.NEXT_PUBLIC_ICE_SERVERS)
  : [{ urls: 'stun:stun.l.google.com:19302' }];

const HELPER = 'http://127.0.0.1:47615/';

const I = {
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z',
  end: 'M3 15c5-5 13-5 18 0l-2 3-4-2v-3a10 10 0 0 0-6 0v3l-4 2z',
  cam: 'M3 7h12v10H3zM15 11l6-4v10l-6-4',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  flip: 'M4 12a8 8 0 0 1 14-5l2 2V4M20 12a8 8 0 0 1-14 5l-2-2v5',
  screen: 'M3 5h18v12H3zM8 21h8M12 17v4',
  mouse: 'M5 3l14 8-6 2-2 6z',
};
const Icon = ({ d }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
const Tool = ({ label, d, on, onClick }) => (
  <button type="button" className={`tool ${on ? 'on' : ''}`} onClick={onClick}><i className="round"><Icon d={d} /></i><small>{label}</small></button>
);
const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// 1:1 voice or video call. Signalling uses a Realtime broadcast channel; the call row is the log.
export function CallPanel({ supabase, ticketId, profile, canStart, staff, peerName = 'IT Support' }) {
  const [state, setState] = useState('idle'); // idle | ringing | calling | live
  const [error, setError] = useState(null);
  const refs = useRef({ channel: null, pc: null, stream: null, sessionId: null, offer: null, pending: [] });
  const remote = useRef(null);
  const local = useRef(null);
  const sound = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [offerVideo, setOfferVideo] = useState(false);
  const [remoteVideo, setRemoteVideo] = useState(false);
  const [localVideo, setLocalVideo] = useState(false);
  const [small, setSmall] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [touch, setTouch] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [control, setControl] = useState('off'); // off | asked | on
  const [code, setCode] = useState('');
  const moved = useRef(0);
  const canShare = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;
  const send = (event, payload = {}) =>
    refs.current.channel?.send({ type: 'broadcast', event, payload: { ...payload, from: profile.id } });

  function cleanup() {
    const r = refs.current;
    clearInterval(r.timer);
    clearTimeout(r.giveUp);
    r.pc?.close();
    r.stream?.getTracks().forEach((t) => t.stop());
    r.screen?.getTracks().forEach((t) => t.stop());
    r.screen = null;
    if (r.helperCode) supabase.rpc('log_remote_control', { p_ticket: ticketId, p_action: 'remote_control_stopped' });
    r.helperCode = null;
    r.controlChannel = null;
    r.remoteStream = null;
    r.facing = 'user';
    Object.assign(r, { pc: null, stream: null, sessionId: null, offer: null, pending: [] });
    setState('idle');
    setOfferVideo(false);
    setRemoteVideo(false);
    setLocalVideo(false);
    setSmall(false);
    setSoundBlocked(false);
    setMuted(false);
    setCamOff(false);
    setSwapped(false);
    setSharing(false);
    setControl('off');
    setCode('');
  }

  async function peer(withVideo) {
    const r = refs.current;
    r.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
    if (local.current) local.current.srcObject = withVideo ? r.stream : null;
    setLocalVideo(withVideo);
    setRemoteVideo(withVideo);
    // Sound has its own element: browsers do not play a hidden video.
    r.remoteStream = new MediaStream();
    sound.current.srcObject = r.remoteStream;
    playSound();
    const pc = new RTCPeerConnection({ iceServers: ICE });
    r.stream.getTracks().forEach((t) => pc.addTrack(t, r.stream));
    // A video slot on voice calls lets screen sharing start without renegotiating.
    if (!withVideo && !r.offer) pc.addTransceiver('video', { direction: 'sendrecv' });
    // Negotiated, so both sides create it and neither depends on who called.
    const dc = pc.createDataChannel('control', { negotiated: true, id: 0 });
    dc.onmessage = (e) => onControl(JSON.parse(e.data));
    r.controlChannel = dc;
    pc.onicecandidate = (e) => e.candidate && send('ice', { candidate: e.candidate });
    pc.ontrack = (e) => {
      r.remoteStream.addTrack(e.track);
      remote.current.srcObject = r.remoteStream;
      playSound();
    };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'connected') setState('live'); };
    r.pc = pc;
    return pc;
  }

  function playSound() {
    sound.current?.play().then(() => setSoundBlocked(false)).catch(() => setSoundBlocked(true));
  }

  useEffect(() => {
    setMounted(true);
    setTouch(matchMedia('(pointer: coarse)').matches);
  }, []);

  const ringing = state === 'ringing';
  const dialing = state === 'calling' && !refs.current.offer;
  useEffect(() => (ringing ? startRing() : undefined), [ringing]);
  useEffect(() => (dialing ? startRingback() : undefined), [dialing]);

  useEffect(() => {
    if (state !== 'live') return undefined;
    setSeconds(0);
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    const r = refs.current;
    const mine = (fn) => ({ payload }) => { if (payload.from !== profile.id) fn(payload); };
    let channel;
    let cancelled = false;
    (async () => {
      if (supabase.realtime?.setAuth) await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase.channel(`call:${ticketId}`, { config: { private: true, broadcast: { self: false } } })
      .on('broadcast', { event: 'offer' }, mine((p) => {
        if (r.pc) return;
        r.offer = p;
        setOfferVideo(!!p.video);
        setState('ringing');
        if (window.__answerTicket === ticketId) { window.__answerTicket = null; accept(); }
      }))
      .on('broadcast', { event: 'answer' }, mine(async (p) => {
        if (r.pc?.signalingState !== 'have-local-offer') return;
        clearInterval(r.timer);
        clearTimeout(r.giveUp);
        await r.pc.setRemoteDescription(p.sdp);
        for (const c of r.pending.splice(0)) await r.pc.addIceCandidate(c);
      }))
      .on('broadcast', { event: 'ice' }, mine(async (p) => {
        if (r.pc?.remoteDescription) await r.pc.addIceCandidate(p.candidate);
        else r.pending.push(p.candidate);
      }))
      .on('broadcast', { event: 'view' }, mine((p) => setRemoteVideo(!!p.video)))
      .on('broadcast', { event: 'hangup' }, mine(() => { if (r.pc || r.offer) endTone(); cleanup(); }))
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') setError('Calls are not allowed for this account.');
      });
      r.channel = channel;
    })();
    // A decline from the app-wide panel only updates the call row.
    const ended = supabase.channel(`call-end:${ticketId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_sessions', filter: `ticket_id=eq.${ticketId}` }, ({ new: c }) => {
        if (c.ended_at && c.id === r.sessionId) { endTone(); cleanup(); }
      })
      .subscribe();
    return () => {
      cancelled = true;
      cleanup();
      supabase.removeChannel(ended);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, ticketId, profile.id]);

  async function start(withVideo) {
    setError(null);
    unlockAudio();
    try {
      const { data, error: err } = await supabase.from('call_sessions')
        .insert({ ticket_id: ticketId, started_by: profile.id }).select('id').single();
      if (err) throw err;
      refs.current.sessionId = data.id;
      notify(supabase, 'call', data.id);
      setState('calling');
      const pc = await peer(withVideo);
      await pc.setLocalDescription(await pc.createOffer());
      // The other person may still be opening the ticket, so keep ringing.
      const offer = () => send('offer', { sdp: pc.localDescription, sessionId: data.id, video: withVideo });
      offer();
      refs.current.timer = setInterval(offer, 2000);
      refs.current.giveUp = setTimeout(() => { setError('No answer.'); hangup(); }, 45000);
    } catch (e) { setError(e.message); hangup(); }
  }

  async function accept() {
    setError(null);
    unlockAudio();
    const r = refs.current;
    try {
      const { sdp, sessionId, video: withVideo } = r.offer;
      r.sessionId = sessionId;
      setState('calling');
      const pc = await peer(!!withVideo);
      await pc.setRemoteDescription(sdp);
      pc.getTransceivers().filter((t) => !t.sender.track).forEach((t) => { t.direction = 'sendrecv'; });
      for (const c of r.pending.splice(0)) await pc.addIceCandidate(c);
      await pc.setLocalDescription(await pc.createAnswer());
      send('answer', { sdp: pc.localDescription });
    } catch (e) { setError(e.message); hangup(); }
  }

  const videoSender = () => refs.current.pc?.getTransceivers().find((t) => t.receiver.track.kind === 'video')?.sender;

  function toggleMute() {
    refs.current.stream?.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted(!muted);
  }

  async function toggleCamera() {
    const r = refs.current;
    if (!r.stream.getVideoTracks().length) {
      // Voice call: turn the camera on in the video slot kept for this.
      try {
        const track = (await navigator.mediaDevices.getUserMedia({ video: true })).getVideoTracks()[0];
        r.stream.addTrack(track);
        if (!r.screen) await videoSender()?.replaceTrack(track);
        if (!r.screen) local.current.srcObject = r.stream;
        setLocalVideo(true);
        setCamOff(false);
        send('view', { video: true });
      } catch (e) { setError(e.message); }
      return;
    }
    r.stream.getVideoTracks().forEach((t) => { t.enabled = camOff; });
    setLocalVideo(camOff);
    send('view', { video: camOff || !!r.screen });
    setCamOff(!camOff);
  }

  async function switchCamera() {
    const r = refs.current;
    const facing = r.facing === 'environment' ? 'user' : 'environment';
    try {
      r.stream.getVideoTracks().forEach((t) => { t.stop(); r.stream.removeTrack(t); });
      const fresh = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } } });
      const track = fresh.getVideoTracks()[0];
      track.enabled = !camOff;
      r.stream.addTrack(track);
      r.facing = facing;
      if (!r.screen) await videoSender()?.replaceTrack(track);
      local.current.srcObject = r.stream;
    } catch (e) { setError(e.message); }
  }

  async function stopShare() {
    const r = refs.current;
    r.screen?.getTracks().forEach((t) => t.stop());
    r.screen = null;
    setSharing(false);
    stopControl();
    await videoSender()?.replaceTrack(r.stream?.getVideoTracks()[0] ?? null);
    local.current.srcObject = r.stream;
    const cam = !!r.stream?.getVideoTracks().length && !camOff;
    setLocalVideo(cam);
    send('view', { video: cam });
  }

  // The browser asks the person which screen to show; nothing starts without that.
  async function startShare() {
    const r = refs.current;
    try {
      r.screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = r.screen.getVideoTracks()[0];
      track.onended = stopShare;
      await videoSender()?.replaceTrack(track);
      local.current.srcObject = r.screen;
      setLocalVideo(true);
      setSharing(true);
      send('view', { video: true });
    } catch { r.screen = null; }
  }

  const sendControl = (m) => { const c = refs.current.controlChannel; if (c?.readyState === 'open') c.send(JSON.stringify(m)); };

  // Employee side: IT's input reaches the helper, in order, only after consent.
  function onControl(m) {
    const r = refs.current;
    if (m.t === 'request') {
      // The helper is Windows only, and phones cannot share a screen.
      if (!canShare || !/Windows/.test(navigator.userAgent)) return sendControl({ t: 'unsupported' });
      return setControl((c) => (c === 'off' ? 'asked' : c));
    }
    if (m.t === 'unsupported') {
      setControl('off');
      return setError('Control only works when the employee joins from a Windows PC.');
    }
    if (m.t === 'granted') return setControl('on');
    if (m.t === 'stopped') return setControl('off');
    if (!r.helperCode) return;
    r.queue = (r.queue ?? Promise.resolve()).then(() => toHelper(m)).catch(stopControl);
  }

  const toHelper = (m) => fetch(HELPER, {
    method: 'POST', headers: { 'content-type': 'text/plain', 'x-code': refs.current.helperCode }, body: JSON.stringify(m),
  }).then((res) => { if (!res.ok) throw new Error('Helper refused'); });

  async function allowControl(e) {
    e.preventDefault();
    const r = refs.current;
    if (r.screen?.getVideoTracks()[0].getSettings().displaySurface !== 'monitor') {
      return setError('Share your entire screen first, then press Allow.');
    }
    r.helperCode = code.trim().toUpperCase();
    try {
      await toHelper({ t: 'ping' });
      setControl('on');
      setError(null);
      sendControl({ t: 'granted' });
      supabase.rpc('log_remote_control', { p_ticket: ticketId, p_action: 'remote_control_granted' });
    } catch {
      r.helperCode = null;
      setError('Could not reach the helper. Check that it is open and the code is correct.');
    }
  }

  function stopControl() {
    const r = refs.current;
    if (r.helperCode) supabase.rpc('log_remote_control', { p_ticket: ticketId, p_action: 'remote_control_stopped' });
    r.helperCode = null;
    setControl('off');
    setCode('');
    sendControl({ t: 'stopped' });
  }

  // IT side: positions are fractions of the shared screen, inside any letterboxing.
  function point(e) {
    const v = remote.current;
    const box = v.getBoundingClientRect();
    const scale = Math.min(box.width / v.videoWidth, box.height / v.videoHeight);
    const x = (e.clientX - box.left - (box.width - v.videoWidth * scale) / 2) / (v.videoWidth * scale);
    const y = (e.clientY - box.top - (box.height - v.videoHeight * scale) / 2) / (v.videoHeight * scale);
    return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null;
  }
  const mouse = (t, e, extra) => { const p = point(e); if (p) sendControl({ t, ...p, ...extra }); };
  const controlling = staff && control === 'on';
  const controlProps = controlling ? {
    tabIndex: 0,
    onPointerMove: (e) => { const now = Date.now(); if (now - moved.current > 33) { moved.current = now; mouse('move', e); } },
    onPointerDown: (e) => { e.currentTarget.focus(); mouse('down', e, { b: e.button }); },
    onPointerUp: (e) => mouse('up', e, { b: e.button }),
    onContextMenu: (e) => e.preventDefault(),
    onWheel: (e) => mouse('wheel', e, { d: e.deltaY }),
    onKeyDown: (e) => { e.preventDefault(); sendControl({ t: 'keydown', c: e.code }); },
    onKeyUp: (e) => { e.preventDefault(); sendControl({ t: 'keyup', c: e.code }); },
  } : {};

  async function hangup() {
    const id = refs.current.sessionId ?? refs.current.offer?.sessionId;
    send('hangup');
    endTone();
    cleanup();
    if (id) await supabase.from('call_sessions').update({ ended_at: new Date().toISOString() }).eq('id', id);
  }

  const busy = state !== 'idle';
  const live = state === 'live';
  const incoming = state === 'ringing';
  const showRemote = remoteVideo;
  const showLocal = localVideo && !incoming;
  const statusText = control === 'on' ? (staff ? 'Controlling PC' : 'IT is controlling your PC')
    : live ? clock(seconds) : incoming ? `Incoming ${offerVideo ? 'video ' : ''}call` : 'Calling…';
  const stage = (
    <div className={`call-stage ${busy ? 'open' : ''} ${showRemote ? 'video' : ''} ${swapped ? 'swapped' : ''} ${controlling ? 'controlling' : ''} ${small ? 'small' : ''}`}>
      <audio ref={sound} autoPlay playsInline />
      <video ref={remote} autoPlay playsInline muted className="remote" {...controlProps} />
      <video ref={local} autoPlay playsInline muted className={`local ${showLocal ? 'shown' : ''}`} onClick={() => setSwapped(!swapped)} />
      {!showRemote && !small && <div className="call-who">
        <span className={`call-photo ${incoming ? 'pulse' : ''}`}>{peerName.trim()[0]?.toUpperCase()}</span>
      </div>}
      <header className="call-top">
        {!incoming && <button className="call-min" aria-label={small ? 'Expand call' : 'Minimize call'} onClick={() => setSmall(!small)}>{small ? '⌃' : '⌄'}</button>}
        <div className="call-title"><strong>{peerName}</strong><span>{statusText}{muted ? ' · Muted' : ''}</span></div>
      </header>
      {soundBlocked && <button className="call-sound" onClick={playSound}>Tap to turn on sound</button>}
      {error && busy && <p className="call-note">{error}</p>}
      {!staff && control === 'asked' && <form className="control-ask" onSubmit={allowControl}>
        <strong>IT is asking to control this PC</strong>
        <ol>
          <li>{sharing ? 'Screen shared' : <button type="button" className="link" onClick={startShare}>Share your entire screen</button>}</li>
          <li><a href={`${BASE}/it-tiket-remote.cmd`} download>Download the helper</a> and run it</li>
          <li>Enter the 8-character code it shows</li>
        </ol>
        <label>Helper code<input value={code} maxLength={8} autoComplete="off" onChange={(e) => setCode(e.target.value)} /></label>
        <span className="row">
          <button className="primary" disabled={code.trim().length !== 8}>Allow</button>
          <button type="button" onClick={() => { setControl('off'); setCode(''); sendControl({ t: 'stopped' }); }}>Decline</button>
        </span>
      </form>}
      {incoming
        ? <div className="call-actions answer">
            <button className="round red" aria-label="Decline" onClick={hangup}><Icon d={I.end} /></button>
            <motion.button className="round green" aria-label="Answer" onClick={accept} animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}><Icon d={I.phone} /></motion.button>
          </div>
        : <div className="call-actions">
            <Tool on={muted} label={muted ? 'Unmute' : 'Mute'} d={I.mic} onClick={toggleMute} />
            <Tool on={!localVideo} label={localVideo ? 'Camera off' : 'Camera on'} d={I.cam} onClick={toggleCamera} />
            {touch && localVideo && !sharing && <Tool label="Flip" d={I.flip} onClick={switchCamera} />}
            {canShare && <Tool on={sharing} label={sharing ? 'Stop sharing' : 'Share'} d={I.screen} onClick={sharing ? stopShare : startShare} />}
            {staff && live && control === 'off' && <Tool label="Control" d={I.mouse} onClick={() => { setControl('asked'); sendControl({ t: 'request' }); }} />}
            {staff && control === 'asked' && <span className="call-wait">Waiting for permission…</span>}
            {!staff && control === 'on' && <Tool on label="Stop control" d={I.mouse} onClick={stopControl} />}
            <button className="round red" aria-label="End call" onClick={hangup}><Icon d={I.end} /></button>
          </div>}
    </div>
  );

  return (
    <>
      {canStart && !busy && <div className="row call-buttons">
        <button aria-label="Voice call" onClick={() => start(false)}><Icon d={I.phone} /></button>
        <button aria-label="Video call" onClick={() => start(true)}><Icon d={I.cam} /></button>
      </div>}
      {error && !busy && <p className="error">{error}</p>}
      {mounted && createPortal(stage, document.body)}
    </>
  );
}
