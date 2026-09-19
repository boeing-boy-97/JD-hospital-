'use client';
import {useState} from 'react';
import {Building2,HeartPulse,MapPin,Search,ShieldCheck,Stethoscope} from 'lucide-react';

type Mode='doctor'|'hospital'|'specialty';
type Option={slug:string;name:string};
const modes=[
  {id:'doctor' as const,label:'Find a doctor',short:'Doctor',icon:Stethoscope},
  {id:'hospital' as const,label:'Find a hospital',short:'Hospital',icon:Building2},
  {id:'specialty' as const,label:'Explore specialties',short:'Specialty',icon:HeartPulse},
];
export default function HeroDiscovery({locations,specialties}:{locations:string[];specialties:Option[]}){
 const[mode,setMode]=useState<Mode>('doctor');
 const copy={doctor:{title:'Find the right specialist',hint:'Search by name, condition or area of care',placeholder:'Doctor name, condition or keyword'},hospital:{title:'Find care near you',hint:'Search our demonstration hospital network',placeholder:'Hospital name, city or locality'},specialty:{title:'Explore care by specialty',hint:'Start with a condition or clinical discipline',placeholder:'Condition or specialty'}}[mode];
 return <div className="discovery-shell"><div className="discovery-panel">
  <aside className="discovery-intro"><span className="discovery-kicker"><ShieldCheck/> Care navigation</span><h2>{copy.title}</h2><p>{copy.hint}</p><small>Demonstration network information</small></aside>
  <div className="discovery-main">
   <div className="discovery-tabs" role="tablist" aria-label="Choose how to find care">{modes.map(({id,label,short,icon:Icon})=><button key={id} type="button" role="tab" aria-selected={mode===id} className={mode===id?'active':''} onClick={()=>setMode(id)}><Icon/><span className="tab-long">{label}</span><span className="tab-short">{short}</span></button>)}</div>
   <form className={`discovery-form mode-${mode}`} action="/search"><input type="hidden" name="type" value={mode}/>
    <label className="discovery-field query-field"><span>{mode==='doctor'?'Doctor or care need':mode==='hospital'?'Hospital or location':'Condition or specialty'}</span><span className="field-control"><Search/><input name="q" placeholder={copy.placeholder}/></span></label>
    {mode!=='specialty'&&<label className="discovery-field"><span>Preferred city</span><span className="field-control"><MapPin/><select name="location" defaultValue=""><option value="">All locations</option>{locations.map(city=><option key={city} value={city}>{city}</option>)}</select></span></label>}
    {mode!=='hospital'&&<label className="discovery-field"><span>Specialty</span><span className="field-control"><HeartPulse/><select name="specialty" defaultValue=""><option value="">All specialties</option>{specialties.map(s=><option key={s.slug} value={s.slug}>{s.name}</option>)}</select></span></label>}
    <button className="btn btn-primary discovery-submit" type="submit"><Search/> Search {mode==='doctor'?'doctors':mode==='hospital'?'hospitals':'specialties'}</button>
   </form>
  </div>
 </div></div>
}
