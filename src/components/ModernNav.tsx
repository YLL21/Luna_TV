/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Cat, Clover, Film, FolderOpen, Globe, Home, MoreHorizontal, PlaySquare, Radio, Search, Sparkles, Star, Tv, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery, queryOptions } from '@tanstack/react-query';

import { FastLink } from './FastLink';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useSite } from './SiteProvider';

interface NavItem {
  icon: any;
  label: string;
  href: string;
  color: string;
  gradient: string;
}

interface ModernNavProps {
  showAIButton?: boolean;
  onAIButtonClick?: () => void;
}

// Query Options 工厂函数
const userEmbyConfigOptions = () => queryOptions({
  queryKey: ['user', 'emby-config'],
  queryFn: async () => {
    const res = await fetch('/api/user/emby-config');
    if (!res.ok) return null;
    const data = await res.json();
    return data.config;
  },
  staleTime: 5 * 60 * 1000,
  retry: false,
});

const publicSourcesOptions = () => queryOptions({
  queryKey: ['emby', 'public-sources'],
  queryFn: async () => {
    const res = await fetch('/api/emby/public-sources');
    if (!res.ok) return { sources: [] };
    return res.json();
  },
  staleTime: 5 * 60 * 1000,
  retry: false,
});

export default function ModernNav({ showAIButton = false, onAIButtonClick }: ModernNavProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(pathname);
  const { siteName } = useSite();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);

  const [menuItems, setMenuItems] = useState<NavItem[]>([
    {
      icon: Home,
      label: '首页',
      href: '/',
      color: 'text-green-500',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Search,
      label: '搜索',
      href: '/search',
      color: 'text-blue-500',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Globe,
      label: '源浏览器',
      href: '/source-browser',
      color: 'text-emerald-500',
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      icon: Film,
      label: '电影',
      href: '/douban?type=movie',
      color: 'text-red-500',
      gradient: 'from-red-500 to-pink-500',
    },
    {
      icon: Tv,
      label: '剧集',
      href: '/douban?type=tv',
      color: 'text-blue-600',
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      icon: PlaySquare,
      label: '短剧',
      href: '/shortdrama',
      color: 'text-purple-500',
      gradient: 'from-purple-500 to-violet-500',
    },
    {
      icon: Cat,
      label: '动漫',
      href: '/douban?type=anime',
      color: 'text-pink-500',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: Clover,
      label: '综艺',
      href: '/douban?type=show',
      color: 'text-orange-500',
      gradient: 'from-orange-500 to-amber-500',
    },
  ]);

  // 检查用户是否配置了 Emby
  const { data: userEmbyConfig } = useQuery(userEmbyConfigOptions());

  // 检查管理员是否设置了公共源
  const { data: publicSourcesData } = useQuery(publicSourcesOptions());

  useEffect(() => {
    const runtimeConfig = (window as any).RUNTIME_CONFIG;
    const newItems = [...menuItems];

    // 直播 - 根据 ENABLE_WEB_LIVE 动态控制
    const hasLiveInMenu = newItems.some(item => item.href === '/live');
    if (runtimeConfig?.ENABLE_WEB_LIVE && !hasLiveInMenu) {
      newItems.push({
        icon: Radio,
        label: '直播',
        href: '/live',
        color: 'text-teal-500',
        gradient: 'from-teal-500 to-cyan-500',
      });
    } else if (!runtimeConfig?.ENABLE_WEB_LIVE && hasLiveInMenu) {
      const index = newItems.findIndex(item => item.href === '/live');
      if (index > -1) newItems.splice(index, 1);
    }

    if (runtimeConfig?.CUSTOM_CATEGORIES?.length > 0 && !newItems.some(item => item.href === '/douban?type=custom')) {
      newItems.push({
        icon: Star,
        label: '自定义',
        href: '/douban?type=custom',
        color: 'text-yellow-500',
        gradient: 'from-yellow-500 to-amber-500',
      });
    }

    // Emby - 用户有私人源 OR 管理员有公共源，都显示导航
    const hasUserEmby = userEmbyConfig?.sources?.some((s: any) => s.enabled && s.ServerURL);
    const hasPublicEmby = (publicSourcesData?.sources?.length ?? 0) > 0;
    const hasEmbyConfig = hasUserEmby || hasPublicEmby;
    const hasEmbyInMenu = newItems.some(item => item.href === '/emby');

    if (hasEmbyConfig && !hasEmbyInMenu) {
      newItems.push({
        icon: FolderOpen,
        label: 'Emby',
        href: '/emby',
        color: 'text-indigo-500',
        gradient: 'from-indigo-500 to-purple-500',
      });
    } else if (!hasEmbyConfig && hasEmbyInMenu) {
      // 如果用户删除了所有 Emby 配置，移除导航项
      const index = newItems.findIndex(item => item.href === '/emby');
      if (index > -1) {
        newItems.splice(index, 1);
      }
    }

    if (newItems.length !== menuItems.length) {
      setMenuItems(newItems);
    }
  }, [userEmbyConfig, publicSourcesData]);

  useEffect(() => {
    const queryString = searchParams.toString();
    const fullPath = queryString ? `${pathname}?${queryString}` : pathname;
    setActive(fullPath);
  }, [pathname, searchParams]);

  // ---------- 桌面导航自适应：测量容器宽度，溢出项收进「更多」 ----------
  const navScrollRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(menuItems.length);
  const [resizeTick, setResizeTick] = useState(0);

  const navSignature = menuItems.map(m => `${m.label}:${m.href}`).join('|');

  useLayoutEffect(() => {
    const container = navScrollRef.current;
    const measureContainer = measureRef.current;
    if (!container || !measureContainer) return;

    const cs = getComputedStyle(container);
    const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const available = container.clientWidth - paddingX;
    const gap = 8; // gap-2
    const moreBtnWidth = 72; // 「更多」按钮预留宽度

    let total = 0;
    let count = 0;
    for (let i = 0; i < menuItems.length; i++) {
      const el = measureRefs.current[i];
      const w = el ? el.getBoundingClientRect().width : 0;
      if (count > 0 && total + w + gap + moreBtnWidth > available) break;
      total += w + gap;
      count++;
    }
    const next = Math.max(count, 1);
    setVisibleCount(prev => (prev === next ? prev : next));
  }, [navSignature, resizeTick, menuItems.length]);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setResizeTick(t => t + 1));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  // 点击外部关闭桌面「更多」下拉
  useEffect(() => {
    if (!desktopMoreOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-desktop-more]')) {
        setDesktopMoreOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [desktopMoreOpen]);

  const isActive = (href: string) => {
    const typeMatch = href.match(/type=([^&]+)/)?.[1];
    const decodedActive = decodeURIComponent(active);
    const decodedHref = decodeURIComponent(href);

    return (
      decodedActive === decodedHref ||
      (decodedActive.startsWith('/douban') &&
        typeMatch &&
        decodedActive.includes(`type=${typeMatch}`))
    );
  };

  return (
    <>
      {/* Desktop Top Navigation - 自适应：溢出项收进「更多」 */}
      <nav className='hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50'>
        <div className='max-w-[2560px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12'>
          <div className='flex items-center justify-between h-16 gap-4'>
            {/* Logo */}
            <FastLink href='/' className='shrink-0'>
              <div className='text-xl font-bold text-green-600 dark:text-green-400'>
                {siteName}
              </div>
            </FastLink>

            {/* Navigation Items - 中间自适应区域 */}
            <div ref={navScrollRef} className='flex items-center justify-center gap-2 flex-1 px-4 min-w-0'>
              {menuItems.slice(0, visibleCount).map((item) => {
                const Icon = item.icon;
                const itemActive = isActive(item.href);

                return (
                  <FastLink
                    key={item.label}
                    href={item.href}
                    useTransitionNav
                    onClick={() => setActive(item.href)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      itemActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${itemActive ? item.color : 'text-gray-500 dark:text-gray-400'}`}
                    />
                    <span>{item.label}</span>
                  </FastLink>
                );
              })}

              {/* 桌面「更多」下拉 */}
              {menuItems.length > visibleCount && (
                <div className='relative shrink-0' data-desktop-more>
                  <button
                    onClick={() => setDesktopMoreOpen(o => !o)}
                    className='flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                  >
                    <MoreHorizontal className='w-4 h-4' />
                    更多
                  </button>
                  {desktopMoreOpen && (
                    <div className='absolute top-full right-0 mt-2 w-44 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md z-50'>
                      {menuItems.slice(visibleCount).map((item) => {
                        const Icon = item.icon;
                        const itemActive = isActive(item.href);
                        return (
                          <FastLink
                            key={item.label}
                            href={item.href}
                            useTransitionNav
                            onClick={() => {
                              setActive(item.href);
                              setDesktopMoreOpen(false);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                              itemActive
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${itemActive ? item.color : 'text-gray-500 dark:text-gray-400'}`} />
                            <span>{item.label}</span>
                          </FastLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side Actions - AI Button, Theme Toggle & User Menu */}
            <div className='flex items-center gap-2 shrink-0'>
              {showAIButton && onAIButtonClick && (
                <button
                  onClick={onAIButtonClick}
                  className='relative p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                  aria-label='AI 推荐'
                >
                  <Sparkles className='h-5 w-5' />
                </button>
              )}
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>

        {/* 隐藏测量容器：始终全量渲染，用于测量每项宽度 */}
        <div
          ref={measureRef}
          className='invisible absolute top-0 left-0 flex items-center gap-2 px-4 pointer-events-none'
          aria-hidden
        >
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                ref={(el) => { measureRefs.current[idx] = el; }}
                className='flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap'
              >
                <Icon className='w-5 h-5' />
                <span className='text-sm font-medium'>{item.label}</span>
              </div>
            );
          })}
        </div>
      </nav>

      {/* More Menu Modal - Render outside nav to avoid z-index issues */}
      {showMoreMenu && (
        <div
          className='md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm'
          style={{ zIndex: 2147483647 }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className='absolute bottom-20 left-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/30 overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>全部分类</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className='p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors'
              >
                <X className='w-5 h-5 text-gray-600 dark:text-gray-400' />
              </button>
            </div>

            {/* All menu items in grid */}
            <div className='grid grid-cols-4 gap-4 p-4'>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const itemActive = isActive(item.href);

                return (
                  <FastLink
                    key={item.label}
                    href={item.href}
                    useTransitionNav
                    onClick={() => {
                      setActive(item.href);
                      setShowMoreMenu(false);
                    }}
                    className='flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors active:scale-95 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  >
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-2xl ${
                        itemActive
                          ? item.gradient.split(' ')[0].replace('from-', 'bg-')
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          itemActive
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        itemActive
                          ? item.color
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.label}
                    </span>
                  </FastLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - Netflix Full-Width Style with Light Mode Support */}
      <nav
        className='md:hidden fixed left-0 right-0 z-40 bg-white/80 dark:bg-black/95 backdrop-blur-lg border-t border-black/5 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-2xl dark:shadow-black/40'
        style={{
          bottom: 0,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className='flex items-center justify-around px-2 py-2'>
          {/* Show first 4 items + More button */}
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const itemActive = isActive(item.href);

            return (
              <FastLink
                key={item.label}
                href={item.href}
                useTransitionNav
                onClick={() => setActive(item.href)}
                className='flex flex-col items-center justify-center min-w-[60px] flex-1 py-2 px-1 transition-all duration-200 active:scale-95'
              >
                <Icon
                  className={`w-6 h-6 mb-1 transition-colors duration-200 ${
                    itemActive ? item.color : 'text-gray-600 dark:text-gray-400'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    itemActive ? item.color : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </FastLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className='flex flex-col items-center justify-center min-w-[60px] flex-1 py-2 px-1 transition-all duration-200 active:scale-95'
          >
            <MoreHorizontal className='w-6 h-6 mb-1 text-gray-600 dark:text-gray-400' />
            <span className='text-[10px] font-medium text-gray-600 dark:text-gray-400'>更多</span>
          </button>
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className='hidden md:block h-16' />
      <div className='md:hidden h-20' />
    </>
  );
}
