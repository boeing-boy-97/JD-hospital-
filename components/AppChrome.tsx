'use client';
import {usePathname} from 'next/navigation';import {Header,Footer,MobileBar} from './SiteShell';
export default function AppChrome({children}:{children:React.ReactNode}){const path=usePathname();if(path.startsWith('/admin'))return <main id="main">{children}</main>;return <><Header/><main id="main">{children}</main><Footer/><MobileBar/></>}
