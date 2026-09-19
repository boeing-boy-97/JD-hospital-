import {redirect} from 'next/navigation';import {requireAdmin} from '@/lib/supabase-server';import AdminContentManager from '@/components/AdminContentManager';
export default async function Page(){const {user,admin}=await requireAdmin();if(!process.env.NEXT_PUBLIC_SUPABASE_URL)redirect('/admin');if(!user||!admin)redirect('/admin/login');return <AdminContentManager/>}
