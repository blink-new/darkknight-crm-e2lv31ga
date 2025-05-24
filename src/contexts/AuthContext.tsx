import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Profile, UserRole } from '@/types';

// ... (interface AuthContextType remains the same)
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; data: any; }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any; data: any; }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any; data: any; }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any; data: any; }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ error: any; data: any; }>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    console.log('[AuthContext] Fetching profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        
        // Only attempt to create a default profile if the row is specifically not found.
        // A 500 error or other errors might indicate a different problem.
        if (error.code === 'PGRST116') { // Row not found error
          console.log('[AuthContext] Profile not found (PGRST116), attempting to create default profile');
          return await createDefaultProfile(userId);
        }
        
        // For permission errors or other specific, non-500 errors, you might still fall back.
        if (error.code === 'PGRST301') { // Permission denied
          console.log('[AuthContext] Permission denied, using minimal profile');
          return {
            id: userId,
            email: user?.email || '',
            role: 'sales',
            first_name: null,
            last_name: null,
            phone: null,
            avatar_url: null,
            created_at: null,
            updated_at: null
          } as Profile;
        }
        // For generic 500 errors or other unhandled errors, return null and let ProfileInitializer handle it.
        console.warn('[AuthContext] Unhandled error fetching profile, returning null:', error.message);
        return null;
      }
      
      console.log('[AuthContext] Profile fetched:', data);
      return data as Profile;
    } catch (err) {
      console.error('[AuthContext] Unexpected error fetching profile:', err);
      return null;
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      // Get user email from auth
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email || '';
      
      const newProfile = {
        id: userId,
        email,
        role: 'sales',
        first_name: null,
        last_name: null,
        phone: null,
        avatar_url: null
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
        
      if (error) {
        console.error('[AuthContext] Error creating default profile:', error);
        return newProfile as Profile;
      }
      
      return data as Profile;
    } catch (err) {
      console.error('[AuthContext] Error in createDefaultProfile:', err);
      return {
        id: userId,
        email: user?.email || '',
        role: 'sales',
        first_name: null,
        last_name: null,
        phone: null,
        avatar_url: null,
        created_at: null,
        updated_at: null
      } as Profile;
    }
  };

  useEffect(() => {
    console.log('[AuthContext] useEffect started. Initial loading state:', loading);
    let initialAuthCheckDone = false;

    console.log('[AuthContext] Attempting supabase.auth.getSession()');
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log('[AuthContext] getSession .then() callback. Session:', currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        const profileData = await fetchProfile(currentSession.user.id);
        setProfile(profileData);
      }
    }).catch(error => {
      console.error('[AuthContext] Error in getSession .catch():', error);
    }).finally(() => {
      console.log('[AuthContext] getSession .finally() callback. Setting loading to false.');
      setLoading(false);
      initialAuthCheckDone = true;
      console.log('[AuthContext] Loading state after getSession.finally():', false);
    });

    console.log('[AuthContext] Setting up onAuthStateChange listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('[AuthContext] onAuthStateChange triggered. Event:', _event, 'Session:', newSession);
        try {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            const profileData = await fetchProfile(newSession.user.id);
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("[AuthContext] Error in onAuthStateChange callback:", error);
        }
        if (!initialAuthCheckDone) {
          console.log('[AuthContext] onAuthStateChange: initialAuthCheckDone was false, setting loading to false.');
          setLoading(false);
          initialAuthCheckDone = true; 
        }
      }
    );
    console.log('[AuthContext] onAuthStateChange listener set up.');

    return () => {
      console.log('[AuthContext] Unsubscribing from onAuthStateChange');
      subscription.unsubscribe();
    };
  }, []);

  // ... (signIn, signUp, signOut, etc. methods remain the same)
  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (!response.error && response.data.user) {
      await supabase.from('profiles').insert({
        id: response.data.user.id,
        email: email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: 'sales',
      });
    }
    return response;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const resetPassword = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };
  
  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated'), data: null };
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
      .select()
      .single();
    if (!error && updatedProfile) setProfile(updatedProfile as Profile);
    return { data: updatedProfile, error };
  };
  
  const updateUserRole = async (userId: string, role: UserRole) => {
    if (!profile || profile.role !== 'admin') return { error: new Error('Unauthorized'), data: null };
    const { data, error } = await supabase.rpc('update_user_role', { target_user_id: userId, new_role: role });
    return { data, error };
  };
  
  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    const rolePermissionMap: Record<UserRole, string[]> = {
      admin: ['*'],
      manager: ['view:all', 'create:all', 'update:all', 'delete:own', 'manage:team'],
      sales: ['view:own', 'create:own', 'update:own', 'delete:own'],
      support: ['view:own', 'create:own', 'update:own']
    };
    const permissions = rolePermissionMap[profile.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateUserRole,
    hasPermission
  };
  console.log('[AuthContext] Returning provider. Loading state:', loading);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};