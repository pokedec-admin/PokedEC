import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('token');

    console.log('[Auth Interceptor] Request URL:', req.url);
    console.log('[Auth Interceptor] Token found:', !!token);

    if (token) {
        // Clone the request and add the authorization header
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('[Auth Interceptor] Added Authorization header');
        return next(clonedRequest);
    }

    console.warn('[Auth Interceptor] No token found, request sent without auth');
    return next(req);
};
