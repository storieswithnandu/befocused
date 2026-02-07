import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
                name: 'BeFocused Productivity',
                short_name: 'BeFocused',
                description: 'A minimalistic, multi-user focus and productivity dashboard',
                theme_color: '#00f0ff',
                icons: [
                    {
                        src: 'logo.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        }),
        // Simple mock API plugin for development
        {
            name: 'mock-api',
            configureServer(server) {
                // In-memory user store for dev session
                const registeredUsers = new Map();

                // Seed some initial accounts (use lowercase keys for normalization)
                registeredUsers.set('storieswithnandu@gmail.com', { id: 'default', email: 'storieswithnandu@gmail.com', name: 'Nandu', password: 'Nandu@2004' });
                registeredUsers.set('nandujm86@gmail.com', { id: 'default', email: 'nandujm86@gmail.com', name: 'Nandu', password: 'password' });

                server.middlewares.use((req, res, next) => {
                    if (req.url) {
                        const url = new URL(req.url, 'http://localhost');
                        const path = url.pathname.replace(/\/$/, '');

                        if (path.startsWith('/api/')) {
                            console.log(`[Mock API] Request: ${req.method} ${path}`);
                            res.setHeader('Content-Type', 'application/json');

                            // Mock Login
                            if (path === '/api/auth/login' && req.method === 'POST') {
                                let body = '';
                                req.on('data', chunk => { body += chunk.toString(); });
                                req.on('end', () => {
                                    try {
                                        const { email, password } = JSON.parse(body);
                                        const normalizedEmail = email.toLowerCase().trim();
                                        const user = registeredUsers.get(normalizedEmail);

                                        if (!user) {
                                            res.statusCode = 404;
                                            return res.end(JSON.stringify({ message: 'Account not found' }));
                                        }

                                        const isNandu = normalizedEmail === 'storieswithnandu@gmail.com' || normalizedEmail === 'nandujm86@gmail.com';
                                        const passwordMatch = user.password === password || (isNandu && (password === 'Nandu@2004' || password === 'any'));

                                        if (!passwordMatch) {
                                            res.statusCode = 401;
                                            return res.end(JSON.stringify({ message: 'Incorrect password' }));
                                        }

                                        res.end(JSON.stringify({
                                            token: `mock-jwt-token-${user.id}`,
                                            user: { id: user.id, email: user.email, name: user.name }
                                        }));
                                    } catch (e) {
                                        res.statusCode = 400;
                                        res.end(JSON.stringify({ message: 'Invalid request' }));
                                    }
                                });
                                return;
                            }

                            // Mock Signup
                            if (path === '/api/auth/signup' && req.method === 'POST') {
                                let body = '';
                                req.on('data', chunk => { body += chunk.toString(); });
                                req.on('end', () => {
                                    try {
                                        const { email, name, password } = JSON.parse(body);
                                        const normalizedEmail = email.toLowerCase().trim();

                                        if (registeredUsers.has(normalizedEmail)) {
                                            res.statusCode = 409;
                                            return res.end(JSON.stringify({ message: 'Email already registered' }));
                                        }

                                        const userId = (normalizedEmail.split('@')[0] || 'user') + '_id';
                                        const newUser = { id: userId, email: normalizedEmail, name: name || email.split('@')[0], password: password || 'password' };
                                        registeredUsers.set(normalizedEmail, newUser);

                                        res.end(JSON.stringify({
                                            user: { id: userId, email: newUser.email, name: newUser.name },
                                            token: `mock-token-${userId}`
                                        }));
                                    } catch (e) {
                                        res.statusCode = 400;
                                        res.end(JSON.stringify({ message: 'Invalid request' }));
                                    }
                                });
                                return;
                            }

                            // Mock Forgot/Reset (Always success in dev)
                            if (path === '/api/auth/forgot-password') {
                                return res.end(JSON.stringify({ message: 'Code sent', debug_code: '123456' }));
                            }
                            if (path === '/api/auth/reset-password') {
                                return res.end(JSON.stringify({ message: 'Password updated' }));
                            }
                        }
                    }
                    next();
                });
            }
        }
    ],
})
