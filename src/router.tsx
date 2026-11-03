import { createBrowserRouter, Outlet } from 'react-router-dom';
import { App } from './App';
import { NotFound } from './components/NotFound';
import { LanguageProvider } from './lib/language';

/** Every page sits inside the language provider, which reads the language from the address. */
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
      { path: '*', element: <NotFound /> },
    ],
  },
]);
