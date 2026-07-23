'use client';

import { AlertCircle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

import { VersionDisplay } from './VersionDisplay';

interface RegisterDisabledPageProps {
  reason: string;
}

export default function RegisterDisabledPage({ reason }: RegisterDisabledPageProps) {
  const router = useRouter();
  const { siteName } = useSite();

  return (
    <div translate="no" className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8 px-[5px] bg-black'>
      {/* 全屏氛围背景 */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-[#0d1b2a] via-[#10233a] to-[#050a14]'>
        <div className='absolute -top-40 right-[15%] w-[36rem] h-[36rem] rounded-full bg-[#3BB0FE]/15 blur-3xl'></div>
        <div className='absolute -bottom-48 -left-32 w-[32rem] h-[32rem] rounded-full bg-[#1e3a5f]/40 blur-3xl'></div>
      </div>

      <div className='absolute top-3 right-3 sm:top-4 sm:right-4 z-20'>
        <ThemeToggle />
      </div>

      <div className='relative z-10 w-full max-w-[400px] shrink-0 rounded-[10px] bg-[#F9F9FB] p-[35px] text-center overflow-hidden'>
        {/* 标题区域 */}
        <div className='mb-5'>
          <div className='inline-flex items-center justify-center gap-2 mb-2.5'>
            <AlertCircle className='w-6 h-6 text-[#3BB0FE]' />
            <h1 className='text-xl font-bold text-black tracking-tight'>
              {siteName}
            </h1>
          </div>
          <p className='text-[.85em] text-black/80'>注册功能暂不可用</p>
        </div>

        <div className='flex items-center gap-2 my-[5px] px-2.5 py-[5px] rounded-[5px] bg-[#E8F5FF] text-left'>
          <AlertCircle className='h-4 w-4 text-[#3BB0FE] shrink-0' />
          <p className='text-[.85em] text-black/80'>
            {reason || '管理员已关闭用户注册功能'}
          </p>
        </div>

        <button
          onClick={() => router.push('/login')}
          className='flex items-center justify-center gap-2 w-full h-[35px] my-[5px] rounded-[5px] bg-[#3BB0FE] text-base text-white border-0 transition-[filter] hover:brightness-95 active:brightness-90'
        >
          <Lock className='w-4 h-4' />
          <span>返回登录</span>
        </button>

        <div className='mt-[15px] text-[.85em] text-black/80'>
          如需注册账户，请联系网站管理员
        </div>
      </div>

      <VersionDisplay />
    </div>
  );
}
