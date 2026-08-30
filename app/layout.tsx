import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '研究生课程规划器',
  description: '本地优先的博士课程规划工具，支持课程筛选、学分检查、时间冲突检测和方案备份。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
