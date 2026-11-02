'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const ICE = process.env.NEXT_PUBLIC_ICE_SERVERS
  ? JSON.parse(process.env.NEXT_PUBLIC_ICE_SERVERS)
  : [{ urls: 'stun:stun.l.google.com:19302' }];

// 1:1 voice or video call. Signalling uses a Realtime broadcast channel; the call row is the log.
export function CallPanel({ supabase, ticketId, profile, canStart }) {
  const [state, setState] = useState('idle'); // idle | ringing | calling | live
  const [error, setError] = useState(null);
  const refs = useRef({ channel: null, pc: null, stream: null, sessionId: null, offer: null, pending: [] });
  const remote = useRef(null);
  const local = useRef(null);
  const [video, setVideo] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [remoteOff, setRemoteOff] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [sharing, setSharing] = useState(false);
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
    r.remoteStream = null;
    r.facing = 'user';
    Object.assign(r, { pc: null, stream: null, sessionId: null, offer: null, pending: [] });
    setState('idle');
    setVideo(false);
    setMuted(false);
    setCamOff(false);
    setRemoteOff(false);
    setSwapped(false);
    setSharing(false);
  }

  async function peer(withVideo) {
    const r = refs.current;
    r.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
    if (local.current) local.current.srcObject = withVideo ? r.stream : null;
    const pc = new RTCPeerConnection({ iceServers: ICE });
    r.stream.getTracks().forEach((t) => pc.addTrack(t, r.stream));
    // A video slot on voice calls lets screen sharing start without renegotiating.
    if (!withVideo && !r.offer) pc.addTransceiver('video', { direction: 'sendrecv' });
    pc.onicecandidate = (e) => e.candidate && send('ice', { candidate: e.candidate });
    pc.ontrack = (e) => {
      r.remoteStream ??= new MediaStream();
      r.remoteStream.addTrack(e.track);
      remote.current.srcObject = r.remoteStream;
    };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'connected') setState('live'); };
    r.pc = pc;
    return pc;
  }

  useEffect(() => {
    const r = refs.current;
    const mine = (fn) => ({ payload }) => { if (payload.from !== profile.id) fn(payload); };
    let channel;
    let cancelled = false;
    (async () => {
      if (supabase.realtime?.setAuth) await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase.channel(`call:${ticketId}`, { config: { private: true, broadcast: { self: false } } })
      .on('broadcast', { event: 'offer' }, mine((p) => { if (r.pc) return; r.offer = p; setVideo(!!p.video); setState('ringing'); }))
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
      .on('broadcast', { event: 'view' }, mine((p) => { setRemoteOff(!!p.off); if (p.share) setVideo(true); }))
      .on('broadcast', { event: 'hangup' }, mine(() => cleanup()))
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') setError('Calls are not allowed for this account.');
      });
      r.channel = channel;
    })();
    return () => {
      cancelled = true;
      cleanup();
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, ticketId, profile.id]);

  async function start(withVideo) {
    setError(null);
    setVideo(withVideo);
    try {
      const { data, error: err } = await supabase.from('call_sessions')
        .insert({ ticket_id: ticketId, started_by: profile.id }).select('id').single();
      if (err) throw err;
      refs.current.sessionId = data.id;
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

  function toggleCamera() {
    refs.current.stream?.getVideoTracks().forEach((t) => { t.enabled = camOff; });
    send('view', { off: !camOff });
    setCamOff(!camOff);
  }

  async function switchCamera() {
    const r = refs.current;
    const facing = r.facing === 'environment' ? 'user' : 'environment';
    try {
      r.stream.getVideoTracks().forEach((t) => { t.stop(); r.stream.removeTrack(t); });
      const fresh = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } } });
      const track = fresh.getVideoTracks()[0];
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
    await videoSender()?.replaceTrack(r.stream?.getVideoTracks()[0] ?? null);
    local.current.srcObject = r.stream;
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
      setVideo(true);
      setSharing(true);
      send('view', { share: true });
    } catch { r.screen = null; }
  }

  async function hangup() {
    const id = refs.current.sessionId ?? refs.current.offer?.sessionId;
    send('hangup');
    cleanup();
    if (id) await supabase.from('call_sessions').update({ ended_at: new Date().toISOString() }).eq('id', id);
  }

  const busy = state !== 'idle';
  return (
    <>
      {canStart && !busy && <div className="row call-buttons">
        <button onClick={() => start(false)}>Call</button>
        <button onClick={() => start(true)}>Video</button>
      </div>}
      {error && <p className="error">{error}</p>}
      <div className={`call-stage ${busy ? 'open' : ''} ${video ? 'video' : ''} ${swapped ? 'swapped' : ''}`}>
        <video ref={remote} autoPlay playsInline className="remote" />
        <video ref={local} autoPlay playsInline muted className="local" onClick={() => setSwapped(!swapped)} />
        {remoteOff && <p className="cam-off">Camera off</p>}
        <div className="call-bar">
          <span>{state === 'live' ? 'In call' : state === 'ringing' ? `Incoming ${video ? 'video ' : ''}call` : 'Calling…'}</span>
          {state === 'ringing'
            ? <motion.div className="row" animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                <button className="primary" onClick={accept}>Answer</button>
                <button onClick={hangup}>Decline</button>
              </motion.div>
            : <div className="row call-tools">
                <button onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</button>
                {video && <button onClick={toggleCamera}>{camOff ? 'Camera on' : 'Camera off'}</button>}
                {video && !sharing && <button onClick={switchCamera}>Flip</button>}
                {video && <button onClick={() => setSwapped(!swapped)}>Swap</button>}
                {canShare && <button onClick={sharing ? stopShare : startShare}>{sharing ? 'Stop sharing' : 'Share screen'}</button>}
                <button className="danger" onClick={hangup}>End</button>
              </div>}
        </div>
      </div>
    </>
  );
}
