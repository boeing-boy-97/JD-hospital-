import {NextRequest,NextResponse} from 'next/server';

export const dynamic='force-dynamic';
const DEFAULT_AGENT_ID='agent_2901m31hatahf83vycj155k8h0zg';
const DEFAULT_BRANCH_ID='agtbrch_1401m31havreetgbqha40b6qss02';
const WINDOW_MS=60_000;
const MAX_REQUESTS=8;
const attempts=new Map<string,{count:number;reset:number}>();

function sameOrigin(request:NextRequest){
 const origin=request.headers.get('origin');
 if(!origin)return true;
 try{return new URL(origin).host===request.headers.get('host')}catch{return false}
}
function rateLimited(request:NextRequest){
 const forwarded=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
 const key=forwarded||request.headers.get('x-real-ip')||'unknown';
 const now=Date.now();
 const current=attempts.get(key);
 if(!current||current.reset<=now){attempts.set(key,{count:1,reset:now+WINDOW_MS});return false}
 current.count+=1;
 if(attempts.size>500)for(const[k,value]of attempts)if(value.reset<=now)attempts.delete(k);
 return current.count>MAX_REQUESTS;
}
const headers={'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'};

export async function POST(request:NextRequest){
 if(!sameOrigin(request))return NextResponse.json({message:'This request must come from the JD Hospital website.'},{status:403,headers});
 if(rateLimited(request))return NextResponse.json({message:'Too many connection attempts. Please wait a minute and try again.'},{status:429,headers});
 const agentId=process.env.ELEVENLABS_AGENT_ID||DEFAULT_AGENT_ID;
 const branchId=process.env.ELEVENLABS_BRANCH_ID||DEFAULT_BRANCH_ID;
 const apiKey=process.env.ELEVENLABS_API_KEY;
 const requireSigned=process.env.ELEVENLABS_REQUIRE_SIGNED_URL==='true';
 if(!apiKey){
  if(requireSigned)return NextResponse.json({message:'AI calling is temporarily unavailable while secure access is being configured.'},{status:503,headers});
  return NextResponse.json({connection:'public',agentId},{headers});
 }
 try{
  const query=new URLSearchParams({agent_id:agentId});
  if(branchId)query.set('branch_id',branchId);
  const response=await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?${query}`,{headers:{'xi-api-key':apiKey,'Accept':'application/json'},cache:'no-store',signal:AbortSignal.timeout(10_000)});
  if(!response.ok)return NextResponse.json({message:'JD Hospital AI could not create a secure call session. Please try again shortly.'},{status:502,headers});
  const data=await response.json() as {signed_url?:string};
  if(!data.signed_url)return NextResponse.json({message:'JD Hospital AI returned an invalid call session. Please try again.'},{status:502,headers});
  return NextResponse.json({connection:'signed',signedUrl:data.signed_url},{headers});
 }catch{
  return NextResponse.json({message:'Unable to reach the voice service right now. Please check your connection and try again.'},{status:503,headers});
 }
}
