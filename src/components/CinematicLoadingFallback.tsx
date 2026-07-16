'use client';

import { useEffect, useState } from 'react';

/**
 * Loading Fallback - 扁平化、苹果风格的简洁加载界面
 *
 * 设计原则：
 * - 纯色背景，无背景图 / 无渐变遮罩
 * - 无 emoji、无装饰性动画
 * - 细环旋转指示器（iOS 风格）+ 一行灰色提示文字
 * - 圆角 ≤ 6px，无阴影
 */

const loadingMessages = [
  '正在为您准备观影清单...',
  '正在加载精彩内容...',
  '正在寻找适合您的推荐...',
  '马上就好，请稍候...',
];

export function CinematicLoadingFallback() {
  const [messageIndex, setMessageIndex] = useState(0);

  // 每 2.5 秒轮换提示文字
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7] dark:bg-black">
      {/* 简洁旋转指示环 - 苹果蓝细环 */}
      <div
        className="w-9 h-9 rounded-full border-2 border-gray-300 border-t-[#007AFF] dark:border-gray-700 dark:border-t-[#0A84FF] animate-spin"
        role="status"
        aria-label="加载中"
      />

      {/* 轮换提示文字 */}
      <p
        key={messageIndex}
        className="mt-5 text-sm text-gray-500 dark:text-gray-400 animate-[fadeIn_0.4s_ease-out]"
      >
        {loadingMessages[messageIndex]}
      </p>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-\[fadeIn_0_4s_ease-out\],
          .animate-spin {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
