import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const ProfileInitializer = () => {
  const { user, profile, loading: authLoading } = useAuth(); // Added authLoading
  const [isProcessing, setIsProcessing] = useState(false); // Renamed for clarity
  const { toast } = useToast();

  useEffect(() => {
    const ensureProfileExists = async () => {
      // Only proceed if auth is no longer loading, we have a user, but no profile yet,
      // and we are not already processing.
      if (!authLoading && user && !profile && !isProcessing) {
        setIsProcessing(true);
        console.log('[ProfileInitializer] Auth loaded, user exists, no profile. Ensuring profile for:', user.id);

        try {
          // Attempt to fetch the profile one more time directly here
          // .maybeSingle() returns null if not found, instead of an error for PGRST116
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('id') // Only need to check for existence
            .eq('id', user.id)
            .maybeSingle();

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is handled by maybeSingle returning null
            console.error('[ProfileInitializer] Error fetching profile directly:', fetchError);
            toast({
              title: 'Profile Check Error',
              description: `Failed to verify profile: ${fetchError.message}. Please refresh.`,
              variant: 'destructive',
            });
            setIsProcessing(false);
            return;
          }

          if (existingProfile) {
            console.log('[ProfileInitializer] Profile confirmed to exist by direct check. AuthContext should pick it up.');
            // If it exists, AuthContext should eventually load it. If not, there might be an RLS issue for AuthContext's select('*').
            // We could potentially set it here if AuthContext failed, but that might mask RLS issues.
            setIsProcessing(false);
            return;
          }

          // Profile doesn't exist, proceed to create it.\
          console.log('[ProfileInitializer] Profile does not exist. Creating default profile for user:', user.id);
          const newProfileData: Partial<Profile> = {
            id: user.id,
            email: user.email || '',
            role: 'sales', // Default role
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfileData);

          if (insertError) {
            console.error('[ProfileInitializer] Error creating profile:', insertError);
            toast({
              title: 'Profile Creation Failed',
              description: `Could not create your profile: ${insertError.message}. Please try refreshing or contact support.`,
              variant: 'destructive',
            });
          } else {
            console.log('[ProfileInitializer] Profile created successfully. AuthContext will reload it.');
            toast({
              title: 'Profile Created',
              description: 'Your user profile has been set up.',
            });
            // AuthContext's onAuthStateChange or next getSession should pick up the new profile.
            // A forced reload might be too disruptive if not strictly necessary.
            // Consider if a manual refresh of profile in AuthContext is better.
          }
        } catch (err) {
          console.error('[ProfileInitializer] Unexpected error during profile ensure process:', err);
          toast({
            title: 'Unexpected Error',
            description: 'An unexpected error occurred while setting up your profile.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
        }
      } else if (!authLoading && user && profile) {
        console.log('[ProfileInitializer] Auth loaded, user and profile exist.');
      } else if (authLoading) {
        console.log('[ProfileInitializer] Waiting for auth to load...');
      }
    };

    ensureProfileExists();
  }, [user, profile, authLoading, isProcessing, toast]); // Added authLoading to dependencies

  return null;
};