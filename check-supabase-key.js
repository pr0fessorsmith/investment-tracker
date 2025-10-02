// Quick script to validate your Supabase anon key
// Run this in your browser console on localhost:3000

console.log('🔍 Checking Supabase Configuration...\n');

// Check if env vars are loaded
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', url || '❌ Not found');
console.log('Key length:', key ? key.length : '❌ Not found');

if (key) {
    // Count dots in JWT
    const dots = (key.match(/\./g) || []).length;
    console.log('JWT dots (should be 2):', dots, dots === 2 ? '✅' : '❌ Invalid!');
    
    // Check if it's two JWTs concatenated
    if (dots > 2) {
        console.warn('⚠️ Your key appears to have multiple JWTs concatenated!');
        console.log('Key preview:', key.substring(0, 100) + '...');
        
        // Try to split and show both
        const parts = key.split('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.');
        console.log('Found', parts.length - 1, 'JWT(s)');
        
        if (parts.length > 2) {
            console.log('\n🔧 Suggested fix:');
            console.log('Use only the LAST JWT token:');
            const lastToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + parts[parts.length - 1];
            console.log(lastToken);
        }
    }
    
    // Try to decode the header
    try {
        const headerB64 = key.split('.')[0];
        const header = JSON.parse(atob(headerB64));
        console.log('\nJWT Header:', header);
    } catch (e) {
        console.error('❌ Could not decode JWT header:', e.message);
    }
    
    // Try to decode the payload
    try {
        const payloadB64 = key.split('.')[1];
        const payload = JSON.parse(atob(payloadB64));
        console.log('JWT Payload:', payload);
        
        // Check expiration
        const exp = new Date(payload.exp * 1000);
        const now = new Date();
        console.log('Expires:', exp.toLocaleDateString(), exp > now ? '✅' : '❌ EXPIRED!');
        console.log('Project ref:', payload.ref);
        console.log('Role:', payload.role, payload.role === 'anon' ? '✅' : '❌ Should be "anon"');
    } catch (e) {
        console.error('❌ Could not decode JWT payload:', e.message);
    }
}
