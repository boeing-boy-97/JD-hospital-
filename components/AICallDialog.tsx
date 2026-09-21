'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ConversationProvider,useConversation} from '@elevenlabs/react';
import {AlertTriangle,Mic,MicOff,PhoneOff,RefreshCw,ShieldCheck,X} from 'lucide-react';

type Phase='permission'|'connecting'|'active'|'ending'|'ended'|'error';
type SessionResponse={connection:'signed';signedUrl:string}|{connection:'public';agentId:string};

function stopStream(stream:MediaStream|null|undefined){stream?.getTracks().forEach(track=>track.stop())}
function friendlyError(error:unknown){
 const name=error instanceof DOMException?error.name:'';
 if(name==='NotAllowedError'||name==='PermissionDeniedError')return 'Microphone access is required to talk with JD Hospital AI. Allow microphone access in your browser site settings, then try again.';
 if(name==='NotFoundError'||name==='DevicesNotFoundError')return 'No microphone was found. Connect or enable a microphone, then try again.';
 if(name==='NotReadableError'||name==='TrackStartError')return 'Your microphone is being used by another application. Close the other application and try again.';
 if(name==='NotSupportedError'||name==='TypeError')return 'Voice calling is not supported in this browser. Try the latest Chrome, Edge, Firefox, or Safari.';
 if(error instanceof Error&&error.message)return error.message;
 return 'Unable to connect right now. Please check your internet connection and try again.';
}

function CallSession({permissionRequest,onClose}:{permissionRequest:Promise<MediaStream>|null;onClose:()=>void}){
 const panelRef=useRef<HTMLElement>(null),mountedRef=useRef(true),endingRef=useRef(false),connectedRef=useRef(false),startedRef=useRef(false),timerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const[phase,setPhase]=useState<Phase>('permission');
 const[error,setError]=useState('');
 const{startSession,endSession,status,isMuted,setMuted,isSpeaking}=useConversation({
  onConnect:()=>{if(!mountedRef.current)return;connectedRef.current=true;setError('');setPhase('active')},
  onDisconnect:details=>{if(!mountedRef.current)return;startedRef.current=false;if(endingRef.current||details.reason==='user'||details.reason==='agent'){setPhase('ended');timerRef.current=setTimeout(onClose,700)}else if(connectedRef.current){setError('Connection interrupted. Check your internet connection, then reconnect or end the call.');setPhase('error')}},
  onError:()=>{if(!mountedRef.current||endingRef.current)return;startedRef.current=false;setError('JD Hospital AI could not continue the call. Please check your connection and try again.');setPhase('error')},
 });
 const releasePending=useCallback(()=>{permissionRequest?.then(stopStream).catch(()=>undefined)},[permissionRequest]);
 const begin=useCallback(async(freshPermission=false)=>{
  if(startedRef.current)return;
  startedRef.current=true;endingRef.current=false;connectedRef.current=false;setError('');setPhase('permission');
  try{
   if(!window.isSecureContext)throw new DOMException('Voice calling requires a secure connection.','NotSupportedError');
   const stream=freshPermission?await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}}):await(permissionRequest||navigator.mediaDevices.getUserMedia({audio:true}));
   stopStream(stream);
   if(!mountedRef.current||endingRef.current)return;
   setPhase('connecting');
   const controller=new AbortController();
   timerRef.current=setTimeout(()=>controller.abort(),12_000);
   const response=await fetch('/api/elevenlabs/session',{method:'POST',headers:{'Accept':'application/json'},cache:'no-store',signal:controller.signal});
   if(timerRef.current)clearTimeout(timerRef.current);
   const body=await response.json().catch(()=>({message:''})) as SessionResponse&{message?:string};
   if(!response.ok)throw new Error(body.message||'Unable to create a secure voice session. Please try again.');
   if(!mountedRef.current||endingRef.current)return;
   if(body.connection==='signed'&&body.signedUrl)startSession({signedUrl:body.signedUrl,connectionType:'websocket'});
   else if(body.connection==='public'&&body.agentId)startSession({agentId:body.agentId,connectionType:'websocket'});
   else throw new Error('The voice service returned an invalid session. Please try again.');
   timerRef.current=setTimeout(()=>{if(mountedRef.current&&!connectedRef.current){endSession();startedRef.current=false;setError('The voice service took too long to connect. Check your internet connection and try again.');setPhase('error')}},20_000);
  }catch(reason){
   if(!mountedRef.current||endingRef.current)return;
   startedRef.current=false;
   const message=reason instanceof DOMException&&reason.name==='AbortError'?'The voice service took too long to respond. Please try again.':friendlyError(reason);
   setError(message);setPhase('error');releasePending();
  }
 },[endSession,permissionRequest,releasePending,startSession]);
 const endCall=useCallback(()=>{
  if(endingRef.current)return;
  endingRef.current=true;startedRef.current=false;if(timerRef.current)clearTimeout(timerRef.current);releasePending();
  if(status==='connected'||status==='connecting'){
   setPhase('ending');endSession();
   timerRef.current=setTimeout(()=>{if(mountedRef.current){setPhase('ended');onClose()}},900);
  }else onClose();
 },[endSession,onClose,releasePending,status]);
 useEffect(()=>{const id=setTimeout(()=>{panelRef.current?.focus();begin(false)},0);return()=>clearTimeout(id)},[begin]);
 useEffect(()=>{const offline=()=>{if(connectedRef.current&&!endingRef.current){endSession();startedRef.current=false;setError('Connection interrupted. Check your internet connection, then reconnect or end the call.');setPhase('error')}};window.addEventListener('offline',offline);return()=>window.removeEventListener('offline',offline)},[endSession]);
 useEffect(()=>{if(phase==='error'&&(status==='connected'||status==='connecting'))endSession()},[endSession,phase,status]);
 useEffect(()=>{mountedRef.current=true;endingRef.current=false;return()=>{mountedRef.current=false;endingRef.current=true;startedRef.current=false;if(timerRef.current)clearTimeout(timerRef.current);endSession();releasePending()}},[endSession,releasePending]);
 function keyboard(e:React.KeyboardEvent){
  if(e.key==='Escape'){e.preventDefault();endCall();return}
  if(e.key!=='Tab'||!panelRef.current)return;
  const items=[...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')];
  if(!items.length)return;const first=items[0],last=items[items.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
 const active=phase==='active'&&status==='connected';
 const label=phase==='permission'?'Requesting microphone access…':phase==='connecting'?'Connecting to JD Hospital AI…':phase==='ending'?'Ending call…':phase==='ended'?'Call ended':phase==='error'?'Unable to connect':isMuted?'Microphone muted':isSpeaking?'JD Hospital AI is speaking…':'Listening…';
 return <div className="ai-call-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&phase!=='active')endCall()}}><section ref={panelRef} className={`ai-call-dialog phase-${phase}`} role="dialog" aria-modal="true" aria-labelledby="ai-call-title" aria-describedby="ai-call-description" tabIndex={-1} onKeyDown={keyboard}>
  <header className="ai-call-head"><div><ShieldCheck/><span><strong>JD HOSPITAL</strong><small>SECURE VOICE ASSISTANCE</small></span></div><button type="button" className="ai-call-close" onClick={endCall} aria-label={active?'End call and close':'Close AI call'}><X/></button></header>
  <div className="ai-call-body"><span className="eyebrow">AI voice assistant</span><h2 id="ai-call-title">JD Hospital AI</h2><p id="ai-call-description">Speak naturally to find hospital information and care pathways.</p>
   <div className={`voice-orb ${active&&isSpeaking?'speaking':active&&!isMuted?'listening':''} ${isMuted?'muted':''}`} aria-hidden="true"><span className="voice-orb-core">{isMuted?<MicOff/>:<Mic/>}</span><span className="voice-ring ring-one"/><span className="voice-ring ring-two"/></div>
   <div className="voice-bars" aria-hidden="true">{[0,1,2,3,4,5,6].map(i=><i key={i}/>)}</div>
   <div className={`ai-call-status ${phase==='error'?'has-error':''}`} role="status" aria-live="polite">{phase==='error'?<AlertTriangle/>:<span className="status-dot"/>}<strong>{label}</strong>{error&&<p>{error}</p>}</div>
  </div>
  <div className="ai-call-controls">{phase==='error'?<><button type="button" className="ai-control secondary" onClick={()=>begin(true)}><RefreshCw/>Try again</button><button type="button" className="ai-control end" onClick={endCall}><PhoneOff/>Close</button></>:<><button type="button" className="ai-control secondary" disabled={!active} onClick={()=>setMuted(!isMuted)} aria-label={isMuted?'Unmute microphone':'Mute microphone'}>{isMuted?<Mic/>:<MicOff/>}{isMuted?'Unmute':'Mute'}</button><button type="button" className="ai-control end" onClick={endCall}><PhoneOff/>End call</button></>}</div>
  <footer className="ai-call-safety"><AlertTriangle/><span>AI-generated information is not a diagnosis. For emergencies, call <strong>112</strong> directly.</span></footer>
 </section></div>
}

export default function AICallDialog(props:{permissionRequest:Promise<MediaStream>|null;onClose:()=>void}){return <ConversationProvider><CallSession {...props}/></ConversationProvider>}
