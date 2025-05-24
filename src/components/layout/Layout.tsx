import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useScreenType } from '@/hooks/useScreenType';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useScreenType();

  return (
    <div className="flex h-screen w-full flex-col bg-black text-white overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <Sidebar />}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
