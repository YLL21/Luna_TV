/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { AlertCircle, CheckCircle, User, Lock, Sparkles, UserPlus, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AuthIntroShell, LoginIntroConfig } from '@/components/AuthIntroShell';
import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

import { VersionDisplay } from './VersionDisplay';

interface RegisterPageClientProps {
  requireInviteCode: boolean;
  loginIntro?: LoginIntroConfig | null;
}

function RegisterForm({ requireInviteCode, loginIntro }: RegisterPageClientProps) {
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
    <div translate="no" className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8 px-[5px] min-[888px]:px-[max(calc(50vw-600px),100px)] bg-black'>
      {/* 全屏氛围背景 */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-[#0d1b2a] via-[#10233a] to-[#050a14]'>
        <div className='absolute -top-40 right-[15%] w-[36rem] h-[36rem] rounded-full bg-[#3BB0FE]/15 blur-3xl'></div>
        <div className='absolute -bottom-48 -left-32 w-[32rem] h-[32rem] rounded-full bg-[#1e3a5f]/40 blur-3xl'></div>
      </div>

      <div className='absolute top-3 right-3 sm:top-4 sm:right-4 z-20'>
        <ThemeToggle />
      </div>

      {/* 介绍文字 + 注册卡片（介绍文字后台可配） */}
      <AuthIntroShell siteName={siteName} intro={loginIntro ?? null}>
      <div className='relative z-10 w-full max-w-[400px] shrink-0 rounded-[10px] bg-[#F9F9FB] p-[35px] text-center overflow-hidden'>
        {/* 标题区域 */}
        <div className='mb-5'>
          <div className='inline-flex items-center justify-center gap-2 mb-2.5'>
            <UserPlus className='w-6 h-6 text-[#3BB0FE]' />
            <h1 className='text-xl font-bold text-black tracking-tight'>
              {siteName}
            </h1>
          </div>
          <p className='text-[.85em] text-black/80'>创建您的新账户</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='flex items-center h-10 my-[5px] rounded-[5px] border border-black/5 bg-[#FCFCFC] transition-colors focus-within:border-[#3BB0FE] focus-within:bg-white overflow-hidden cursor-text'>
            <User className='h-4 w-4 ml-2.5 shrink-0 text-[#5C5C5C]' />
            <input
              id='username'
              type='text'
              autoComplete='username'
              className='w-full bg-transparent border-0 px-2.5 py-[5px] text-base text-black placeholder:text-gray-400 focus:outline-none'
              placeholder='用户名（3-20位字母数字下划线）'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className='flex items-center h-10 my-[5px] rounded-[5px] border border-black/5 bg-[#FCFCFC] transition-colors focus-within:border-[#3BB0FE] focus-within:bg-white overflow-hidden cursor-text'>
            <Lock className='h-4 w-4 ml-2.5 shrink-0 text-[#5C5C5C]' />
            <input
              id='password'
              type='password'
              autoComplete='new-password'
              className='w-full bg-transparent border-0 px-2.5 py-[5px] text-base text-black placeholder:text-gray-400 focus:outline-none'
              placeholder='密码（至少6位字符）'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className='flex items-center h-10 my-[5px] rounded-[5px] border border-black/5 bg-[#FCFCFC] transition-colors focus-within:border-[#3BB0FE] focus-within:bg-white overflow-hidden cursor-text'>
            <Shield className='h-4 w-4 ml-2.5 shrink-0 text-[#5C5C5C]' />
            <input
              id='confirmPassword'
              type='password'
              autoComplete='new-password'
              className='w-full bg-transparent border-0 px-2.5 py-[5px] text-base text-black placeholder:text-gray-400 focus:outline-none'
              placeholder='再次输入密码'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {requireInviteCode && (
            <div className='flex items-center h-10 my-[5px] rounded-[5px] border border-black/5 bg-[#FCFCFC] transition-colors focus-within:border-[#3BB0FE] focus-within:bg-white overflow-hidden cursor-text'>
              <Sparkles className='h-4 w-4 ml-2.5 shrink-0 text-[#5C5C5C]' />
              <input
                id='inviteCode'
                type='text'
                autoComplete='off'
                className='w-full bg-transparent border-0 px-2.5 py-[5px] text-base text-black placeholder:text-gray-400 focus:outline-none uppercase'
                placeholder='请输入邀请码'
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              />
            </div>
          )}

          {error && (
            <div className='flex items-center gap-2 my-[5px] px-2.5 py-[5px] rounded-[5px] bg-red-50 text-left'>
              <AlertCircle className='h-4 w-4 text-red-500 shrink-0' />
              <p className='text-[.85em] text-red-500'>{error}</p>
            </div>
          )}

          {success && (
            <div className='flex items-center gap-2 my-[5px] px-2.5 py-[5px] rounded-[5px] bg-[#E8F5FF] text-left'>
              <CheckCircle className='h-4 w-4 text-[#3BB0FE] shrink-0' />
              <p className='text-[.85em] text-black/80'>{success}</p>
            </div>
          )}

          <button
            type='submit'
            disabled={
              !username || !password || !confirmPassword || loading || !!success
            }
            className='w-full h-[35px] my-[5px] rounded-[5px] bg-[#3BB0FE] text-base text-white border-0 transition-[filter] hover:brightness-95 active:brightness-90 disabled:grayscale disabled:cursor-not-allowed'
          >
            {loading ? '注册中...' : success ? '注册成功，正在跳转...' : '立即注册'}
          </button>

          <Link
            href='/login'
            prefetch={true}
            className='flex items-center justify-center gap-2 w-full h-[35px] my-[5px] rounded-[5px] bg-[#E8F5FF] text-[#3BB0FE] text-base transition-[filter] hover:brightness-[.97] active:brightness-95'
          >
            <Lock className='w-4 h-4' />
            <span>立即登录</span>
          </Link>
          <div className='mt-[15px] text-[.85em] text-black/80'>
            已有账户？直接登录即可
          </div>
        </form>
      </div>
      </AuthIntroShell>

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
