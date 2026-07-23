'use client';

import { ReactNode } from 'react';

export interface LoginIntroConfig {
  enabled: boolean;
  position: 'left' | 'right' | 'top' | 'bottom';
  text: string;
  copyright: string;
}

interface AuthIntroShellProps {
  siteName: string;
  intro: LoginIntroConfig | null;
  children: ReactNode;
}

/**
 * 登录/注册页布局壳：
 * 介绍区（站名 + 介绍文字 + 版权）与表单卡片按配置位置排布，
 * 宽屏左右两端排布，小屏隐藏介绍区（上/下位置时保留并堆叠）。
 */
export function AuthIntroShell({ siteName, intro, children }: AuthIntroShellProps) {
  const show = !!intro?.enabled && !!(intro.text || intro.copyright);

  if (!show || !intro) {
    return <>{children}</>;
  }

  const pos = intro.position || 'left';
  const horizontal = pos === 'left' || pos === 'right';
  const containerClass =
    pos === 'right'
      ? 'flex-col lg:flex-row-reverse lg:justify-between'
      : pos === 'left'
        ? 'flex-col lg:flex-row lg:justify-between'
        : 'flex-col';
  const introFirst = pos !== 'bottom';

  const panel = (
    <div
      className={`flex-col ${
        horizontal
          ? 'hidden lg:flex max-w-md items-start text-left'
          : 'flex w-full max-w-md items-center text-center'
      }`}
    >
      <h2 className='text-3xl lg:text-4xl font-bold text-white mb-5 tracking-tight drop-shadow-sm'>
        {siteName}
      </h2>
      {intro.text && (
        <div className='text-sm lg:text-base leading-7 text-white/85 whitespace-pre-line drop-shadow-sm'>
          {intro.text}
        </div>
      )}
      {intro.copyright && (
        <div className='mt-6 text-xs leading-6 text-white/50 whitespace-pre-line'>
          {intro.copyright}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`relative z-10 flex ${containerClass} items-center justify-center gap-8 lg:gap-12 w-full max-w-5xl lg:px-2`}
    >
      {introFirst && panel}
      {children}
      {!introFirst && panel}
    </div>
  );
}
