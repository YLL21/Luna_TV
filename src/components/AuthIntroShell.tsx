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
 * 登录/注册页介绍文字布局壳（CAS 风格）：
 * 介绍区（站名 + 介绍文字 + 版权）与表单卡片按配置位置排布，
 * 小屏自动堆叠（介绍在上），保持响应式。
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
      ? 'flex-col lg:flex-row-reverse'
      : pos === 'left'
        ? 'flex-col lg:flex-row'
        : 'flex-col';
  const introFirst = pos !== 'bottom';

  const panel = (
    <div
      className={`flex flex-col ${
        horizontal
          ? 'w-full lg:w-auto lg:max-w-md items-center lg:items-start text-center lg:text-left'
          : 'w-full max-w-md items-center text-center'
      }`}
    >
      <h2 className='text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3 tracking-tight'>
        {siteName}
      </h2>
      {intro.text && (
        <div className='text-sm leading-7 text-gray-600 dark:text-gray-300 whitespace-pre-line'>
          {intro.text}
        </div>
      )}
      {intro.copyright && (
        <div className='mt-5 text-xs leading-6 text-gray-400 dark:text-gray-500 whitespace-pre-line'>
          {intro.copyright}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`relative z-10 flex ${containerClass} items-center justify-center gap-6 lg:gap-14 w-full max-w-5xl`}
    >
      {introFirst && panel}
      {children}
      {!introFirst && panel}
    </div>
  );
}
