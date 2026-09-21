'use client';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {Mic,ShieldCheck} from 'lucide-react';

const AICallDialog=lazy(()=>import('./AICallDialog'));

function LoadingDialog({onClose}:{onClose:()=>void}){return <div className="ai-call-backdrop" role="presentation"><section className="ai-call-dialog ai-call-loading" role="dialog" aria-modal="true" aria-label="JD Hospital AI voice call"><ShieldCheck/><p>Preparing secure voice calling…</p><button className="btn btn-secondary" onClick={onClose}>Cancel</button></section></div>}

export default function AICallLauncher(){
 const[open,setOpen]=useState(false);
 const[permissionRequest,setPermissionRequest]=useState<Promise<MediaStream>|null>(null);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const scrollRef=useRef(0);
 function launch(){
  if(open)return;
  setOpen(true);
  if(typeof navigator==='undefined'||!navigator.mediaDevices?.getUserMedia){
   setPermissionRequest(()=>Promise.reject(new DOMException('Voice calling is not supported by this browser.','NotSupportedError')));
   return;
  }
  const request=navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  request.catch(()=>undefined);
  setPermissionRequest(()=>request);
 }
 function close(){setOpen(false);setPermissionRequest(null)}
 useEffect(()=>{
  if(!open){triggerRef.current?.focus({preventScroll:true});return}
  scrollRef.current=window.scrollY;
  const body=document.body;
  const previous={position:body.style.position,top:body.style.top,width:body.style.width,overflow:body.style.overflow};
  body.style.position='fixed';body.style.top=`-${scrollRef.current}px`;body.style.width='100%';body.style.overflow='hidden';
  const background=[...document.querySelectorAll<HTMLElement>('body > header, body > main, body > footer, .mobile-bar')];
  background.forEach(element=>element.setAttribute('inert',''));
  return()=>{
   Object.assign(body.style,previous);
   background.forEach(element=>element.removeAttribute('inert'));
   const root=document.documentElement,scrollBehavior=root.style.scrollBehavior;
   root.style.scrollBehavior='auto';
   window.scrollTo({top:scrollRef.current,left:0,behavior:'auto'});
   requestAnimationFrame(()=>{root.style.scrollBehavior=scrollBehavior});
  }
 },[open]);
 return <div className="ai-call-root">{!open&&<button ref={triggerRef} className="ai-call-launcher" type="button" onClick={launch} aria-label="Talk to JD Hospital AI"><span className="ai-call-launcher-icon"><Mic/></span><span><strong>Talk to AI</strong><small>Voice call</small></span></button>}{open&&<Suspense fallback={<LoadingDialog onClose={close}/>}><AICallDialog permissionRequest={permissionRequest} onClose={close}/></Suspense>}</div>
}
