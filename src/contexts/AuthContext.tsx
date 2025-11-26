import React, { useState, useEffect, createContext, useContext } from 'react';
// Import the mock client from the centralized location. Added the explicit .ts extension to resolve compilation error.
import { mockSupabase } from '../lib/supabase.ts';

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
    signIn: typeof mockSupabase.auth.signInWithPassword; 
    signOut: typeof mockSupabase.auth.signOut;
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
        // Mock authentication state listener
        const { data: { subscription } } = mockSupabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user || null);
                setLoading(false);
                
                // For demonstration: force a refresh if signed in/out via mock storage
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                     window.location.reload(); 
                }
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
        signIn: mockSupabase.auth.signInWithPassword,
        signOut: mockSupabase.auth.signOut,
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
