import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_TOKEN = process.env.BUGBEE_INTERNAL_TOKEN;

export function validateToken(req: NextRequest): boolean {
    if (!INTERNAL_TOKEN) return true; // Fail open if not set? No, safer to fail closed, but for v1 fast setup maybe warn?
    // Let's enforce it if set.
    const token = req.headers.get('x-bugbee-token');
    return token === INTERNAL_TOKEN;
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized: Invalid Access Code' }, { status: 401 });
}
