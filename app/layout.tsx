import type { Metadata } from 'next';
import './globals.css';
import './phase2.css';
import AppChrome from '@/components/AppChrome';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title:{default:'JD Hospital | Expert Care. Human Compassion.',template:'%s | JD Hospital'},description:'A modern multispeciality hospital network focused on expert medicine, advanced technology and compassionate care.',openGraph:{title:'JD Hospital',description:'Expert care. Advanced medicine. Human compassion.',type:'website'},twitter:{card:'summary_large_image'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main">Skip to main content</a><AppChrome>{children}</AppChrome></body></html>}
