/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { AlertCircle, CheckCircle, User, Lock, Sparkles, UserPlus, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

import { VersionDisplay } from './VersionDisplay';

interface RegisterPageClientProps {
  requireInviteCode: boolean;
}

function RegisterForm({ requireInviteCode }: RegisterPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { siteName } = useSite();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username || !password || !confirmPassword) {
      setError('请填写完整信息');
      return;
    }

    if (requireInviteCode && !inviteCode) {
      setError('请输入邀请码');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          confirmPassword,
          inviteCode: inviteCode || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // 显示成功消息，稍等一下再跳转
        setError(null);
        setSuccess('注册成功！正在跳转...');

        // Upstash 需要额外延迟等待数据同步
        const delay = data.needDelay ? 2500 : 1500;

        setTimeout(() => {
          const redirect = searchParams.get('redirect') || '/';
          router.replace(redirect);
        }, delay);
      } else {
        const data = await res.json();
        setError(data.error ?? '注册失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div translate="no" className='fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-[#f5f5f7] dark:bg-gray-950'>
      <div className='absolute top-3 right-3 sm:top-4 sm:right-4 z-20'>
        <ThemeToggle />
      </div>

      <div className='relative z-10 w-full max-w-md rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 sm:p-8'>
        {/* 标题区域 */}
        <div className='text-center mb-6 sm:mb-8'>
          <div className='inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4 rounded-md bg-blue-500'>
            <UserPlus className='w-6 h-6 sm:w-7 sm:h-7 text-white' />
          </div>
          <h1 className='text-blue-600 dark:text-blue-400 text-2xl sm:text-3xl font-bold mb-2'>
            {siteName}
          </h1>
          <p className='text-gray-500 dark:text-gray-400 text-sm'>创建您的新账户</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='group'>
            <label htmlFor='username' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              用户名
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                <User className='h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors' />
              </div>
              <input
                id='username'
                type='text'
                autoComplete='username'
                className='block w-full pl-12 pr-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none sm:text-base transition-colors'
                placeholder='3-20位字母数字下划线'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className='group'>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              密码
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                <Lock className='h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors' />
              </div>
              <input
                id='password'
                type='password'
                autoComplete='new-password'
                className='block w-full pl-12 pr-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none sm:text-base transition-colors'
                placeholder='至少6位字符'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className='group'>
            <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              确认密码
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                <Shield className='h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors' />
              </div>
              <input
                id='confirmPassword'
                type='password'
                autoComplete='new-password'
                className='block w-full pl-12 pr-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none sm:text-base transition-colors'
                placeholder='再次输入密码'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {requireInviteCode && (
            <div className='group'>
              <label htmlFor='inviteCode' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                邀请码
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <Sparkles className='h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors' />
                </div>
                <input
                  id='inviteCode'
                  type='text'
                  autoComplete='off'
                  className='block w-full pl-12 pr-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none sm:text-base transition-colors uppercase'
                  placeholder='请输入邀请码'
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          )}

          {error && (
            <div className='flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'>
              <AlertCircle className='h-4 w-4 text-red-600 dark:text-red-400 shrink-0' />
              <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
            </div>
          )}

          {success && (
            <div className='flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'>
              <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400 shrink-0' />
              <p className='text-sm text-green-600 dark:text-green-400'>{success}</p>
            </div>
          )}

          <button
            type='submit'
            disabled={
              !username || !password || !confirmPassword || loading || !!success
            }
            className='inline-flex w-full justify-center items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 py-3 text-base font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <UserPlus className='h-5 w-5' />
            {loading ? '注册中...' : success ? '注册成功，正在跳转...' : '立即注册'}
          </button>

          <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <p className='text-center text-gray-500 dark:text-gray-400 text-sm mb-3'>
              已有账户？
            </p>
            <Link
              href='/login'
              prefetch={true}
              className='flex items-center justify-center gap-2 w-full px-6 py-2.5 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors'
            >
              <Lock className='w-4 h-4' />
              <span>立即登录</span>
            </Link>
          </div>
        </form>
      </div>

      <VersionDisplay />
    </div>
  );
}

export default function RegisterPageClient(props: RegisterPageClientProps) {
  return (
    <Suspense fallback={null}>
      <RegisterForm {...props} />
    </Suspense>
  );
}
