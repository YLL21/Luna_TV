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
 * 宽屏两端排布，窄屏（<888px）隐藏介绍区、卡片居中（上/下位置时保留堆叠）。
 */
export function AuthIntroShell({ siteName, intro, children }: AuthIntroShellProps) {
  const show = !!intro?.enabled && !!(intro.text || intro.copyright);

  if (!show || !intro) {
    return <>{children}</>;
  }

  const pos = intro.position || 'left';
  const horizontal = pos === 'left' || pos === 'right';
  const containerClass = horizontal
    ? pos === 'right'
      ? 'flex-col justify-center min-[888px]:flex-row-reverse min-[888px]:justify-between min-[888px]:gap-[50px]'
      : 'flex-col justify-center min-[888px]:flex-row min-[888px]:justify-between min-[888px]:gap-[50px]'
    : 'flex-col justify-center gap-8';
  const introFirst = pos !== 'bottom';

  const panel = (
    <div
      className={
        horizontal
          ? 'hidden min-[888px]:block max-w-md text-left'
          : 'block w-full max-w-md text-center'
      }
    >
      <div className='text-[1.7rem] font-bold text-white mb-[30px] leading-tight'>
        {siteName}
      </div>
      <div className='text-white leading-[1.6] whitespace-pre-line'>
        {intro.text && <>{intro.text}</>}
        {intro.text && intro.copyright && (
          <>
            <br />
            <br />
          </>
        )}
        {intro.copyright && <>{intro.copyright}</>}
      </div>
    </div>
  );

  return (
    <div
      className={`relative z-10 flex items-center w-full max-w-[1200px] ${containerClass}`}
    >
      {introFirst && panel}
      {children}
      {!introFirst && panel}
    </div>
  );
}
