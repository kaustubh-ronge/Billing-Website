import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Protect dashboard, customers, products, settings, invoices, and api routes, while allowing public access to the landing page and auth
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/join/(.*)',
    '/public/invoices/(.*)',
    '/public/customers/(.*)'
])

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
        // Always run for Clerk-specific frontend API routes
        '/__clerk/(.*)',
    ],
}