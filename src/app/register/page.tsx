/* eslint-disable @typescript-eslint/no-explicit-any */

import { redirect } from 'next/navigation';

import { getConfig } from '@/lib/config';

import RegisterDisabledPage from './RegisterDisabledPage';
import RegisterPageClient from './RegisterPageClient';

export default async function RegisterPage() {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';

  // localStorage 模式不支持注册，直接重定向到登录
  if (storageType === 'localstorage') {
    redirect('/login');
  }

  // 服务端获取配置
  const config = await getConfig();

  // 检查注册是否被禁用
  const registrationDisabled = !(config.UserConfig?.AllowRegister ?? true);
  const disabledReason = '管理员已关闭用户注册功能';

  // 如果注册被禁用，显示禁用页面
  if (registrationDisabled) {
    return <RegisterDisabledPage reason={disabledReason} />;
  }

  // 检查是否需要邀请码
  const requireInviteCode = config.UserConfig?.RequireInviteCode ?? false;

  // 登录/注册页介绍文字配置
  const loginIntro = {
    enabled: config.SiteConfig.LoginIntroEnabled ?? false,
    position: (config.SiteConfig.LoginIntroPosition || 'left') as 'left' | 'right' | 'top' | 'bottom',
    text: config.SiteConfig.LoginIntroText || '',
    copyright: config.SiteConfig.LoginIntroCopyright || '',
  };

  // 显示注册表单
  return <RegisterPageClient requireInviteCode={requireInviteCode} loginIntro={loginIntro} />;
}
