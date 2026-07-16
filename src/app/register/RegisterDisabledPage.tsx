'use client';

import { AlertCircle } from 'lucide-react';
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
    <div className='fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-[#f5f5f7] dark:bg-gray-950'>
      <div className='absolute top-4 right-4 z-20'>
        <ThemeToggle />
      </div>

      <div className='relative z-10 w-full max-w-md rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-8'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-14 h-14 mb-4 rounded-md bg-yellow-500'>
            <AlertCircle className='w-7 h-7 text-white' />
          </div>
          <h1 className='text-yellow-600 dark:text-yellow-400 text-2xl font-bold mb-2'>
            {siteName}
          </h1>
        </div>
        <div className='text-center space-y-6'>
          <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200'>
            注册功能暂不可用
          </h2>
          <div className='p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50'>
            <p className='text-gray-700 dark:text-gray-300 text-sm leading-relaxed'>
              {reason || '管理员已关闭用户注册功能'}
            </p>
          </div>
          <p className='text-gray-500 dark:text-gray-500 text-xs'>
            如需注册账户，请联系网站管理员
          </p>
          <button
            onClick={() => router.push('/login')}
            className='inline-flex w-full justify-center items-center gap-2 rounded-md bg-green-600 hover:bg-green-700 py-3 text-base font-semibold text-white transition-colors'
          >
            返回登录 →
          </button>
        </div>
      </div>
      <VersionDisplay />
    </div>
  );
}
