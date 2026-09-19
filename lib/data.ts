export const hospitals = [
 {slug:'jd-hospital-nagpur',name:'JD Hospital, Nagpur',city:'Nagpur',address:'Central Avenue, Nagpur, Maharashtra',phone:'+91 712 400 7000',emergency:'+91 712 400 7001',specialties:['Cardiac Sciences','Neurosciences','Orthopaedics'],beds:'350'},
 {slug:'jd-hospital-pune',name:'JD Hospital, Pune',city:'Pune',address:'Baner Road, Pune, Maharashtra',phone:'+91 20 4000 7000',emergency:'+91 20 4000 7001',specialties:['Oncology','Gastroenterology','Critical Care'],beds:'280'},
 {slug:'jd-hospital-mumbai',name:'JD Hospital, Mumbai',city:'Mumbai',address:'Andheri East, Mumbai, Maharashtra',phone:'+91 22 4000 7000',emergency:'+91 22 4000 7001',specialties:['Cardiac Sciences','Oncology','Nephrology'],beds:'420'}
];
export const specialties = [
 {slug:'cardiac-sciences',name:'Cardiac Sciences',icon:'HeartPulse',desc:'Integrated cardiac diagnostics, interventional care and rehabilitation.'},
 {slug:'neurosciences',name:'Neurosciences',icon:'Brain',desc:'Coordinated care for complex brain, spine and nerve conditions.'},
 {slug:'orthopaedics',name:'Orthopaedics',icon:'Bone',desc:'Mobility-focused care across joints, trauma and sports medicine.'},
 {slug:'oncology',name:'Oncology',icon:'Ribbon',desc:'Compassionate, multidisciplinary cancer care and support.'},
 {slug:'gastroenterology',name:'Gastroenterology',icon:'Activity',desc:'Advanced digestive, liver and pancreatic care.'},
 {slug:'nephrology',name:'Nephrology',icon:'Droplets',desc:'Comprehensive kidney health, dialysis and transplant support.'},
 {slug:'pulmonology',name:'Pulmonology',icon:'Wind',desc:'Specialist respiratory medicine and sleep care.'},
 {slug:'urology',name:'Urology',icon:'Stethoscope',desc:'Evidence-led urinary and reproductive health care.'}
];
export const doctors = [
 {slug:'ananya-rao',name:'Dr Ananya Rao',designation:'Consultant, Cardiac Sciences',qualification:'Demo profile — credentials pending verification',specialty:'Cardiac Sciences',hospital:'JD Hospital, Nagpur',experience:12,languages:['English','Hindi','Marathi'],gender:'Female',initials:'AR'},
 {slug:'vikram-mehta',name:'Dr Vikram Mehta',designation:'Senior Consultant, Neurosciences',qualification:'Demo profile — credentials pending verification',specialty:'Neurosciences',hospital:'JD Hospital, Pune',experience:18,languages:['English','Hindi'],gender:'Male',initials:'VM'},
 {slug:'meera-kulkarni',name:'Dr Meera Kulkarni',designation:'Consultant, Orthopaedics',qualification:'Demo profile — credentials pending verification',specialty:'Orthopaedics',hospital:'JD Hospital, Mumbai',experience:10,languages:['English','Hindi','Marathi'],gender:'Female',initials:'MK'},
 {slug:'arjun-shah',name:'Dr Arjun Shah',designation:'Consultant, Oncology',qualification:'Demo profile — credentials pending verification',specialty:'Oncology',hospital:'JD Hospital, Nagpur',experience:14,languages:['English','Hindi','Gujarati'],gender:'Male',initials:'AS'},
 {slug:'sana-khan',name:'Dr Sana Khan',designation:'Consultant, Gastroenterology',qualification:'Demo profile — credentials pending verification',specialty:'Gastroenterology',hospital:'JD Hospital, Pune',experience:9,languages:['English','Hindi','Urdu'],gender:'Female',initials:'SK'},
 {slug:'rohan-iyer',name:'Dr Rohan Iyer',designation:'Consultant, Nephrology',qualification:'Demo profile — credentials pending verification',specialty:'Nephrology',hospital:'JD Hospital, Mumbai',experience:16,languages:['English','Hindi','Tamil'],gender:'Male',initials:'RI'}
];
export const packages = [
 {slug:'essential-health',name:'Essential Health Screen',hospital:'JD Hospital, Nagpur',category:'Preventive',price:2499,tests:18,duration:'3–4 hours'},
 {slug:'heart-assurance',name:'Heart Assurance Screen',hospital:'JD Hospital, Pune',category:'Cardiac',price:4999,tests:24,duration:'4–5 hours'},
 {slug:'womens-wellness',name:"Women's Wellness Screen",hospital:'JD Hospital, Mumbai',category:'Wellness',price:3799,tests:21,duration:'3–4 hours'}
];
