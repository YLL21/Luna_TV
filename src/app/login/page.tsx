/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { AlertCircle, User, Lock, Sparkles, UserPlus, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AuthVersionDisplay } from '@/components/AuthVersionDisplay';

import { AuthIntroShell, LoginIntroConfig } from '@/components/AuthIntroShell';
import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { OIDCProviderLogo, detectProvider, getProviderButtonStyle, getProviderButtonText } from '@/components/OIDCProviderLogos';

function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const shouldAskUsername = process.env.NEXT_PUBLIC_STORAGE_TYPE !== 'localstorage';

  // Telegram Magic Link 状态
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramDeepLink, setTelegramDeepLink] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');

  // OIDC 登录状态
  const [oidcProviders, setOidcProviders] = useState<Array<{
    id: string;
    name: string;
    buttonText: string;
    issuer: string;
  }>>([]);
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [oidcButtonText, setOidcButtonText] = useState('使用OIDC登录');
  const [oidcIssuer, setOidcIssuer] = useState<string>('');
  const [allowRegister, setAllowRegister] = useState(true);

  // 登录页介绍文字配置（后台可配）
  const [loginIntro, setLoginIntro] = useState<LoginIntroConfig | null>(null);

  const { siteName } = useSite();

  // 获取 Telegram Magic Link 配置
  useEffect(() => {
    const fetchTelegramConfig = async () => {
      try {
        console.log('[Login] Fetching server config...');
        const response = await fetch('/api/server-config');
        const data = await response.json();
        console.log('[Login] Server config received:', data);
        console.log('[Login] TelegramAuthConfig:', data.TelegramAuthConfig);
        if (data.TelegramAuthConfig?.enabled) {
          console.log('[Login] Telegram is enabled!');
          setTelegramEnabled(true);
        } else {
          console.log('[Login] Telegram is NOT enabled');
        }

        // 登录页介绍文字配置
        if (data.LoginIntroConfig) {
          setLoginIntro(data.LoginIntroConfig);
        }

        // 注册开关（关闭时登录页注册入口展示禁用态）
        if (typeof data.AllowRegister === 'boolean') {
          setAllowRegister(data.AllowRegister);
        }

        // 检查 OIDC 配置
        console.log('[Login] OIDCConfig:', data.OIDCConfig);
        console.log('[Login] OIDCProviders:', data.OIDCProviders);

        // 优先使用新的多 Provider 配置
        if (data.OIDCProviders && data.OIDCProviders.length > 0) {
          console.log('[Login] Multiple OIDC providers enabled!');
          setOidcProviders(data.OIDCProviders);
          setOidcEnabled(true);
        } else if (data.OIDCConfig?.enabled) {
          // 向后兼容：旧的单 Provider 配置
          console.log('[Login] OIDC is enabled!');
          setOidcEnabled(true);
          setOidcButtonText(data.OIDCConfig.buttonText || '使用OIDC登录');
          setOidcIssuer(data.OIDCConfig.issuer || '');
        } else {
          console.log('[Login] OIDC is NOT enabled');
        }
      } catch (error) {
        console.log('Failed to fetch server config:', error);
      }
    };

    fetchTelegramConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!password || (shouldAskUsername && !username)) return;

    try {
      setLoading(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          ...(shouldAskUsername ? { username } : {}),
        }),
      });

      if (res.ok) {
        // 记录登入时间
        const loginTime = Date.now();
        try {
          await fetch('/api/user/my-stats', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginTime })
          });
          // 更新 localStorage 记录
          localStorage.setItem('lastRecordedLogin', loginTime.toString());
        } catch (error) {
          console.log('记录登入时间失败:', error);
          // 登入时间记录失败不影响正常登录流程
        }

        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else if (res.status === 401) {
        setError('密码错误');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '服务器错误');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 生成 Telegram 登录链接
  const handleTelegramLogin = async () => {
    console.log('[Frontend] Telegram login clicked');
    setError(null);

    // 验证 Telegram 用户名
    if (!telegramUsername || telegramUsername.trim() === '') {
      setError('请输入您的 Telegram 用户名');
      return;
    }

    setTelegramLoading(true);

    try {
      console.log('[Frontend] Generating deep link for user:', telegramUsername);
      const res = await fetch('/api/telegram/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramUsername: telegramUsername.trim() }),
      });

      const data = await res.json();
      console.log('[Frontend] API response:', { ok: res.ok, status: res.status, data });

      if (res.ok && data.deepLink) {
        setTelegramDeepLink(data.deepLink);
        // 自动打开 Telegram
        window.open(data.deepLink, '_blank');
      } else {
        setError(data.error || '生成链接失败，请重试');
      }
    } catch (error) {
      console.error('[Frontend] Error:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setTelegramLoading(false);
    }
  };


  return (
    <div translate="no" className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8 px-[5px] min-[888px]:px-[max(calc(50vw-600px),100px)] bg-black'>
      {/* 全屏氛围背景 */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-[#0d1b2a] via-[#10233a] to-[#050a14]'>
        <div className='absolute -top-40 right-[15%] w-[36rem] h-[36rem] rounded-full bg-[#3BB0FE]/15 blur-3xl'></div>
        <div className='absolute -bottom-48 -left-32 w-[32rem] h-[32rem] rounded-full bg-[#1e3a5f]/40 blur-3xl'></div>
      </div>

      {/* 右上角主题切换 */}
      <div className='absolute top-4 right-4 z-20'>
        <ThemeToggle />
      </div>

      {/* 介绍文字 + 登录卡片（介绍文字后台可配） */}
      <AuthIntroShell siteName={siteName} intro={loginIntro}>
      <div className='relative z-10 w-full max-w-[400px] shrink-0 bg-[#F9F9FB] rounded-[10px] p-[35px] text-center overflow-hidden'>
        {/* 标题区域 */}
        <div className='mb-5'>
          <div className='inline-flex items-center justify-center gap-2 mb-2.5'>
            <Sparkles className='w-6 h-6 text-[#3BB0FE]' />
            <h1 className='text-xl font-bold text-black tracking-tight'>
              {siteName}
            </h1>
          </div>
          <p className='text-[.85em] text-black/80'>
            欢迎回来，请登录您的账户
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit}>
          {shouldAskUsername && (
            <div className='flex items-center h-10 my-[5px] rounded-[5px] border border-black/5 bg-[#FCFCFC] transition-colors focus-within:border-[#3BB0FE] focus-within:bg-white overflow-hidden cursor-text'>
              <User className='h-4 w-4 ml-2.5 shrink-0 text-[#5C5C5C]' />
              <input
                id='username'
                type='text'
                autoComplete='username'
                className='w-full bg-transparent border-0 px-2.5 py-[5px] text-base text-black placeholder:text-gray-400 focus:outline-none'
                placeholder='请输入用户名'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div className='flex items-center h-10 my-[5px] rounded-[5px] border border-black/5 bg-[#FCFCFC] transition-colors focus-within:border-[#3BB0FE] focus-within:bg-white overflow-hidden cursor-text'>
            <Lock className='h-4 w-4 ml-2.5 shrink-0 text-[#5C5C5C]' />
            <input
              id='password'
              type='password'
              autoComplete='current-password'
              className='w-full bg-transparent border-0 px-2.5 py-[5px] text-base text-black placeholder:text-gray-400 focus:outline-none'
              placeholder='请输入访问密码'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className='flex items-center gap-2 my-[5px] px-2.5 py-[5px] rounded-[5px] bg-red-50 text-left'>
              <AlertCircle className='h-4 w-4 text-red-500 shrink-0' />
              <p className='text-[.85em] text-red-500'>{error}</p>
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type='submit'
            disabled={!password || loading || (shouldAskUsername && !username)}
            className='w-full h-[35px] my-[5px] rounded-[5px] bg-[#3BB0FE] text-base text-white border-0 transition-[filter] hover:brightness-95 active:brightness-90 disabled:grayscale disabled:cursor-not-allowed'
          >
            {loading ? '登录中...' : '立即登录'}
          </button>

          {/* 注册链接 */}
          {shouldAskUsername && (
            <>
              {allowRegister ? (
                <Link
                  href='/register'
                  prefetch={true}
                  className='flex items-center justify-center gap-2 w-full h-[35px] my-[5px] rounded-[5px] bg-[#E8F5FF] text-[#3BB0FE] text-base transition-[filter] hover:brightness-[.97] active:brightness-95'
                >
                  <UserPlus className='w-4 h-4' />
                  <span>立即注册</span>
                </Link>
              ) : (
                <div className='flex items-center justify-center gap-2 w-full h-[35px] my-[5px] rounded-[5px] bg-black/5 text-black/30 text-base cursor-not-allowed'>
                  <UserPlus className='w-4 h-4' />
                  <span>注册已关闭</span>
                </div>
              )}
              <div className='mt-[15px] text-[.85em] text-black/80'>
                {allowRegister ? '还没有账户？注册即可开始使用' : '管理员已关闭注册'}
              </div>
            </>
          )}
        </form>

        {/* Telegram Magic Link 登录 */}
        {telegramEnabled && (
          <div className='mt-5 pt-4 border-t border-black/5'>
            <p className='text-[.85em] text-black/80 mb-2.5'>
              或使用 Telegram 登录
            </p>

            {/* Telegram 用户名输入 */}
            <div className='flex items-center h-10 my-[5px] rounded-[5px] border border-black/5 bg-[#FCFCFC] transition-colors focus-within:border-[#3BB0FE] focus-within:bg-white overflow-hidden cursor-text'>
              <Send className='h-4 w-4 ml-2.5 shrink-0 text-[#5C5C5C]' />
              <input
                type='text'
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder='输入您的 Telegram 用户名（不含 @）'
                className='w-full bg-transparent border-0 px-2.5 py-[5px] text-base text-black placeholder:text-gray-400 focus:outline-none'
                disabled={telegramLoading}
              />
            </div>

            <button
              onClick={handleTelegramLogin}
              disabled={telegramLoading || !telegramUsername.trim()}
              className='w-full h-[35px] my-[5px] rounded-[5px] bg-[#3BB0FE] text-base text-white border-0 transition-[filter] hover:brightness-95 active:brightness-90 disabled:grayscale disabled:cursor-not-allowed'
            >
              {telegramLoading ? '正在打开 Telegram...' : '通过 Telegram 登录'}
            </button>

            {telegramDeepLink && (
              <div className='my-[5px] px-2.5 py-[5px] rounded-[5px] bg-[#E8F5FF] text-left'>
                <p className='text-[.85em] text-black/80'>
                  已在新标签页打开 Telegram，如果没有自动打开，请点击{' '}
                  <a
                    href={telegramDeepLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-[#3BB0FE] hover:underline'
                  >
                    这里
                  </a>
                </p>
              </div>
            )}
          </div>
        )}

        {/* OIDC 登录 */}
        {oidcEnabled && shouldAskUsername && (
          <div className='mt-5 pt-4 border-t border-black/5'>
            <div className='relative mb-4'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-black/5'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-3 bg-[#F9F9FB] text-black/50'>
                  或
                </span>
              </div>
            </div>

            {/* 多 Provider 按钮 */}
            {oidcProviders.length > 0 ? (
              <div className='space-y-2.5'>
                {oidcProviders.map((provider) => {
                  const providerId = provider.id.toLowerCase();
                  const detectedProvider = ['google', 'github', 'microsoft', 'facebook', 'wechat', 'apple', 'linuxdo'].includes(providerId)
                    ? (providerId as 'google' | 'github' | 'microsoft' | 'facebook' | 'wechat' | 'apple' | 'linuxdo')
                    : detectProvider(provider.issuer || provider.buttonText);
                  const buttonStyle = getProviderButtonStyle(detectedProvider);
                  const customText = provider.buttonText && provider.buttonText !== '使用OIDC登录' ? provider.buttonText : undefined;
                  const buttonText = getProviderButtonText(detectedProvider, customText);

                  return (
                    <button
                      key={provider.id}
                      type='button'
                      onClick={() => window.location.href = `/api/auth/oidc/login?provider=${provider.id}`}
                      className={`w-full inline-flex justify-center items-center h-[35px] my-[5px] rounded-[5px] text-base font-semibold transition-colors ${buttonStyle}`}
                    >
                      <OIDCProviderLogo provider={detectedProvider} />
                      <span className='ml-2'>{buttonText}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* 单 Provider 按钮（向后兼容） */
              (() => {
                const provider = detectProvider(oidcIssuer || oidcButtonText);
                const buttonStyle = getProviderButtonStyle(provider);
                const customText = oidcButtonText && oidcButtonText !== '使用OIDC登录' ? oidcButtonText : undefined;
                const buttonText = getProviderButtonText(provider, customText);

                return (
                  <button
                    type='button'
                    onClick={() => window.location.href = '/api/auth/oidc/login'}
                    className={`w-full inline-flex justify-center items-center rounded-md py-2.5 text-sm font-semibold transition-colors ${buttonStyle}`}
                  >
                    <OIDCProviderLogo provider={provider} />
                    <span className='ml-2'>{buttonText}</span>
                  </button>
                );
              })()
            )}
          </div>
        )}
      </div>
      </AuthIntroShell>

      {/* 版本信息显示 */}
      <AuthVersionDisplay />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
