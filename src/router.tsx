import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { App } from './App';
import { NotFound } from './components/NotFound';
import { LanguageProvider } from './lib/language';

/** Every page sits inside the language provider, which reads the language from the address. */
// the case study is its own download: most visitors never open it
const CaseStudy = lazy(() => import('./components/CaseStudy').then((m) => ({ default: m.CaseStudy })));
const Case = () => <Suspense fallback={null}><CaseStudy /></Suspense>;

function Shell() {
  return <LanguageProvider><Outlet /></LanguageProvider>;
}

// / is Persian, /en is English; the blog will add /blog and /en/blog here
export const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <App /> },
      { path: '/en', element: <App /> },
      // the live intro, before the site (a prototype on its own address for now)
      { path: '/intro', element: <App /> },
      { path: '/en/intro', element: <App /> },
      // case studies: the work told in full
      { path: '/work/atarinaji', element: <Case /> },
      { path: '/en/work/atarinaji', element: <Case /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
