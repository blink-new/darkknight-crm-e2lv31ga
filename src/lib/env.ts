/**
 * Environment variables helper
 */

export const ENV = {
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  
  // Supabase Functions
  // Make sure we have a properly formatted functions URL
  get SUPABASE_FUNCTIONS_URL() {
    // First try to use the direct functions URL if available
    const directFunctionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string;
    if (directFunctionsUrl) {
      console.log('Using configured Supabase Functions URL:', directFunctionsUrl);
      return directFunctionsUrl;
    }
    
    // Fall back to constructing from the base URL
    const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    if (!baseUrl) {
      console.error('Missing VITE_SUPABASE_URL environment variable');
      return '';
    }
    
    // Normalize URL by removing trailing slash if present
    const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const functionsUrl = `${normalizedUrl}/functions/v1`;
    
    console.log('Using derived Supabase Functions URL:', functionsUrl);
    return functionsUrl;
  },
  
  // Google
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
  GOOGLE_REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI as string,
};

// Function to check if important environment variables are set
export function checkRequiredEnvVars(): boolean {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  // Log available environment variables for debugging
  console.log('Environment check: SUPABASE_URL =', ENV.SUPABASE_URL);
  console.log('Environment check: SUPABASE_FUNCTIONS_URL =', ENV.SUPABASE_FUNCTIONS_URL);
  
  return true;
}