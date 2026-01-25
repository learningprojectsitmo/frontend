import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { Head } from '@/components/seo';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';


import backgroundImage from '@/assets/back-ground.svg';

type LayoutProps = {
  children: React.ReactNode;
  title: string;
};

export const AuthLayout = ({ children, title }: LayoutProps) => {
  const user = useUser();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const navigate = useNavigate();

  useEffect(() => {
    if (user.data) {
      navigate(redirectTo ? redirectTo : paths.app.spase.getHref(), {
        replace: true,
      });
    }
  }, [user.data, navigate, redirectTo]);

  return (
    <>
      <Head title={title} />

      <div 
        className="relative flex min-h-screen items-center justify-center bg-black bg-cover bg-center bg-no-repeat"
        // 2. Apply the imported image via inline style
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* 3. Overlay (Optional: adds contrast if the image is too bright) */}
        {/* <div className="absolute inset-0 bg-black/40" /> */}

        {/* 4. Form Container */}
        {/* <div className="relative z-10 w-full max-w-[440px] px-4">
          <div className="bg-white rounded-[32px] bg-white p-8 shadow-2xl"> */}
            {children}
          {/* </div>
        </div> */}
      </div>
    </>
  );
};