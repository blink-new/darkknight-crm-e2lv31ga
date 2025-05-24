// Follow this setup guide to integrate the Deno runtime and Supabase Functions
// https://supabase.com/docs/guides/functions/deno-deploy
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface Profile {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the API provided in the request
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Use fetch directly since we're having issues with the Supabase client
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if profile exists using fetch
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      }
    );

    if (!profileResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error checking profile', 
          details: await profileResponse.text() 
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const profileData = await profileResponse.json();
    
    // If profile already exists
    if (profileData && profileData.length > 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Profile already exists', profile: profileData[0] }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user details for email
    const userResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    );

    if (!userResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error fetching user', 
          details: await userResponse.text() 
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const userData = await userResponse.json();
    
    // Create new profile
    const newProfile: Profile = {
      id: userId,
      email: userData.email || '',
      role: 'sales', // Default role
      first_name: null,
      last_name: null,
      phone: null,
      avatar_url: null
    };

    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newProfile)
      }
    );

    if (!insertResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create profile', 
          details: await insertResponse.text() 
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const insertData = await insertResponse.json();

    return new Response(
      JSON.stringify({ success: true, message: 'Profile created', profile: insertData[0] }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server error', details: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})