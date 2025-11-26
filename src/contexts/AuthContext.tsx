import React, { useState, useEffect, createContext, useContext } from 'react';
// Import the mock client from the centralized location. Added the explicit .ts extension to resolve compilation error.
import { supabase } from "../integrations/supabase/client";

// --- TYPESCRIPT INTERFACES ---
interface UserProfile {
    id: string;
    email: string;
    role: 'agency' | 'client';
    // Add other profile fields here
}

interface AuthContextType {
    user: UserProfile | null;
    session: { user: UserProfile } | null;
    loading: boolean;
    isAuthenticated: boolean;
    role: 'agency' | 'client' | null;
    // Note: The type is slightly adjusted to reference the imported client structure
    signIn: typeof supabase.auth.signInWithPassword; 
    signOut: typeof supabase.auth.signOut;
    // Add signUp, resetPassword methods here
}

// --- CONTEXT CREATION ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<{ user: UserProfile } | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                const userProfile: UserProfile = {
                    id: session.user.id,
                    email: session.user.email || '',
                    role: (session.user.user_metadata?.role as 'agency' | 'client') || 'client'
                };
                setSession({ user: userProfile });
                setUser(userProfile);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session?.user) {
                    const userProfile: UserProfile = {
                        id: session.user.id,
                        email: session.user.email || '',
                        role: (session.user.user_metadata?.role as 'agency' | 'client') || 'client'
                    };
                    setSession({ user: userProfile });
                    setUser(userProfile);
                } else {
                    setSession(null);
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const isAuthenticated = !!user;
    const role = user?.role || null;

    const value: AuthContextType = {
        session,
        user,
        loading,
        isAuthenticated,
        role,
        signIn: supabase.auth.signInWithPassword,
        signOut: supabase.auth.signOut,
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-700">
                <p>Loading Authentication...</p>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- HOOK ---
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
