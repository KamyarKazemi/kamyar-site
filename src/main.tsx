import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/vazirmatn';
import './styles/global.css';
import { primeSfx } from './lib/sfx';
import { router } from './router';

primeSfx();
const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');
createRoot(root).render(<StrictMode><RouterProvider router={router} /></StrictMode>);
