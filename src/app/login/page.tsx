/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { AlertCircle, CheckCircle, User, Lock, Sparkles, UserPlus, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { CURRENT_VERSION } from '@/lib/version';
import { checkForUpdates, UpdateStatus } from '@/lib/version_check';

import { AuthIntroShell, LoginIntroConfig } from '@/components/AuthIntroShell';
import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { OIDCProviderLogo, detectProvider, getProviderButtonStyle, getProviderButtonText } from '@/components/OIDCProviderLogos';

// 版本显示组件
function VersionDisplay() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const status = await checkForUpdates();
        setUpdateStatus(status);
      } catch (_) {
        // do nothing
      } finally {
        setIsChecking(false);
      }
    };

    checkUpdate();
  }, []);

  return (
    <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500'>
      <span className='font-mono'>v{CURRENT_VERSION}</span>
      {!isChecking && updateStatus !== UpdateStatus.FETCH_FAILED && (
        <div
          className={`flex items-center gap-1.5 ${
            updateStatus === UpdateStatus.HAS_UPDATE
              ? 'text-amber-600 dark:text-amber-400'
              : updateStatus === UpdateStatus.NO_UPDATE
                ? 'text-green-600 dark:text-green-400'
                : ''
          }`}
        >
          {updateStatus === UpdateStatus.HAS_UPDATE && (
            <>
              <AlertCircle className='w-3.5 h-3.5' />
              <span className='font-semibold'>有新版本</span>
            </>
          )}
          {updateStatus === UpdateStatus.NO_UPDATE && (
            <>
              <CheckCircle className='w-3.5 h-3.5' />
              <span className='font-semibold'>已是最新</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
    <div translate="no" className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8 bg-gray-950'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/10 blur-3xl'></div>
        <div className='absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-indigo-500/10 blur-3xl'></div>
      </div>

      {/* 右上角主题切换 */}
      <div className='absolute top-4 right-4 z-20'>
        <ThemeToggle />
      </div>

      {/* 介绍文字 + 登录卡片（介绍文字后台可配） */}
      <AuthIntroShell siteName={siteName} intro={loginIntro}>
      <div className='relative z-10 w-full max-w-sm shrink-0 bg-[#F9F9FB] dark:bg-gray-900 rounded-2xl p-8 shadow-2xl shadow-black/50 ring-1 ring-black/5 dark:ring-white/10'>
        {/* 标题区域 */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-12 h-12 mb-4 rounded-md bg-green-600'>
            <Sparkles className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5 tracking-tight'>
            {siteName}
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            欢迎回来，请登录您的账户
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          {shouldAskUsername && (
            <div>
              <label htmlFor='username' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'>
                用户名
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <User className='h-4 w-4 text-gray-400 dark:text-gray-500' />
                </div>
                <input
                  id='username'
                  type='text'
                  autoComplete='username'
                  className='block w-full pl-10 pr-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400 text-sm transition-colors'
                  placeholder='请输入用户名'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'>
              密码
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Lock className='h-4 w-4 text-gray-400 dark:text-gray-500' />
              </div>
              <input
                id='password'
                type='password'
                autoComplete='current-password'
                className='block w-full pl-10 pr-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400 text-sm transition-colors'
                placeholder='请输入访问密码'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className='flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'>
              <AlertCircle className='h-4 w-4 text-red-600 dark:text-red-400 shrink-0' />
              <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type='submit'
            disabled={!password || loading || (shouldAskUsername && !username)}
            className='w-full py-2.5 rounded-md bg-green-600 hover:bg-green-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? '登录中...' : '立即登录'}
          </button>

          {/* 注册链接 */}
          {shouldAskUsername && (
            <div className='pt-4 border-t border-gray-200 dark:border-gray-800'>
              <p className='text-center text-sm text-gray-500 dark:text-gray-400 mb-3'>
                还没有账户？
              </p>
              <Link
                href='/register'
                prefetch={true}
                className='flex items-center justify-center gap-2 w-full py-2.5 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
              >
                <UserPlus className='w-4 h-4' />
                <span>立即注册</span>
              </Link>
            </div>
          )}
        </form>

        {/* Telegram Magic Link 登录 */}
        {telegramEnabled && (
          <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-800'>
            <p className='text-center text-sm text-gray-500 dark:text-gray-400 mb-4'>
              或使用 Telegram 登录
            </p>

            {/* Telegram 用户名输入 */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'>
                Telegram 用户名
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Send className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder='输入您的 Telegram 用户名'
                  className='block w-full pl-10 pr-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors'
                  disabled={telegramLoading}
                />
              </div>
              <p className='mt-1.5 text-xs text-gray-400 dark:text-gray-500'>
                输入您的 Telegram 用户名（不含 @）
              </p>
            </div>

            <button
              onClick={handleTelegramLogin}
              disabled={telegramLoading || !telegramUsername.trim()}
              className='w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {telegramLoading ? '正在打开 Telegram...' : '通过 Telegram 登录'}
            </button>

            {telegramDeepLink && (
              <div className='mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50'>
                <p className='text-sm text-blue-800 dark:text-blue-200 mb-1.5'>
                  已在新标签页打开 Telegram
                </p>
                <p className='text-xs text-blue-600 dark:text-blue-300'>
                  如果没有自动打开，请点击{' '}
                  <a
                    href={telegramDeepLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline font-semibold'
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
          <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-800'>
            <div className='relative mb-4'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-200 dark:border-gray-800'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-3 bg-[#F9F9FB] dark:bg-gray-900 text-gray-400 dark:text-gray-500'>
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
                      className={`w-full inline-flex justify-center items-center rounded-md py-2.5 text-sm font-semibold transition-colors ${buttonStyle}`}
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
      <VersionDisplay />
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
