'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const ICE = process.env.NEXT_PUBLIC_ICE_SERVERS
  ? JSON.parse(process.env.NEXT_PUBLIC_ICE_SERVERS)
  : [{ urls: 'stun:stun.l.google.com:19302' }];

// 1:1 voice call. Signalling uses a Realtime broadcast channel; the call row is the log.
export function CallPanel({ supabase, ticketId, profile, disabled }) {
  const [state, setState] = useState('idle'); // idle | ringing | calling | live
  const [error, setError] = useState(null);
  const refs = useRef({ channel: null, pc: null, stream: null, sessionId: null, offer: null, pending: [] });
  const audio = useRef(null);
  const send = (event, payload = {}) =>
    refs.current.channel?.send({ type: 'broadcast', event, payload: { ...payload, from: profile.id } });

  function cleanup() {
    const r = refs.current;
    r.pc?.close();
    r.stream?.getTracks().forEach((t) => t.stop());
    Object.assign(r, { pc: null, stream: null, sessionId: null, offer: null, pending: [] });
    setState('idle');
  }

  async function peer() {
    const r = refs.current;
    r.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const pc = new RTCPeerConnection({ iceServers: ICE });
    r.stream.getTracks().forEach((t) => pc.addTrack(t, r.stream));
    pc.onicecandidate = (e) => e.candidate && send('ice', { candidate: e.candidate });
    pc.ontrack = (e) => { audio.current.srcObject = e.streams[0]; };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'connected') setState('live'); };
    r.pc = pc;
    return pc;
  }

  useEffect(() => {
    const r = refs.current;
    const mine = (fn) => ({ payload }) => { if (payload.from !== profile.id) fn(payload); };
    const channel = supabase.channel(`call:${ticketId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'offer' }, mine((p) => { r.offer = p; setState('ringing'); }))
      .on('broadcast', { event: 'answer' }, mine(async (p) => {
        await r.pc?.setRemoteDescription(p.sdp);
        for (const c of r.pending.splice(0)) await r.pc.addIceCandidate(c);
      }))
      .on('broadcast', { event: 'ice' }, mine(async (p) => {
        if (r.pc?.remoteDescription) await r.pc.addIceCandidate(p.candidate);
        else r.pending.push(p.candidate);
      }))
      .on('broadcast', { event: 'hangup' }, mine(() => cleanup()))
      .subscribe();
    r.channel = channel;
    return () => { cleanup(); supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, ticketId, profile.id]);

  async function start() {
    setError(null);
    try {
      const { data, error: err } = await supabase.from('call_sessions')
        .insert({ ticket_id: ticketId, started_by: profile.id }).select('id').single();
      if (err) throw err;
      refs.current.sessionId = data.id;
      setState('calling');
      const pc = await peer();
      await pc.setLocalDescription(await pc.createOffer());
      send('offer', { sdp: pc.localDescription, sessionId: data.id });
    } catch (e) { setError(e.message); hangup(); }
  }

  async function accept() {
    setError(null);
    const r = refs.current;
    try {
      const { sdp, sessionId } = r.offer;
      r.sessionId = sessionId;
      const pc = await peer();
      await pc.setRemoteDescription(sdp);
      for (const c of r.pending.splice(0)) await pc.addIceCandidate(c);
      await pc.setLocalDescription(await pc.createAnswer());
      send('answer', { sdp: pc.localDescription });
    } catch (e) { setError(e.message); hangup(); }
  }

  async function hangup() {
    const id = refs.current.sessionId ?? refs.current.offer?.sessionId;
    send('hangup');
    cleanup();
    if (id) await supabase.from('call_sessions').update({ ended_at: new Date().toISOString() }).eq('id', id);
  }

  return (
    <div className="card stack">
      <strong>Panggilan suara</strong>
      <audio ref={audio} autoPlay />
      {state === 'idle' && <button disabled={disabled} onClick={start}>Mula panggilan</button>}
      {state === 'ringing' && (
        <motion.div className="row" animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          <button className="primary" onClick={accept}>Jawab</button>
          <button onClick={hangup}>Tolak</button>
        </motion.div>
      )}
      {(state === 'calling' || state === 'live') && <>
        <span className="muted">{state === 'live' ? 'Sedang bercakap' : 'Memanggil…'}</span>
        <button className="danger" onClick={hangup}>Tamat</button>
      </>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
