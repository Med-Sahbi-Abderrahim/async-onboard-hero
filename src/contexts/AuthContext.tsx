import React, { useState, useEffect, createContext, useContext } from 'react';

// --- MOCK SUPABASE/FIREBASE CLIENT ---
// In a real application, this would be imported from your backend integration file.
const mockSupabase = {
    auth: {
        async signInWithPassword({ email, password }: { email: string, password: string }) {
            console.log(`[MOCK AUTH] User attempting sign-in: ${email}`);
            // Simulate API latency
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (email.includes('fail')) {
                return { data: null, error: { message: "Invalid credentials (Mock failure)." } };
            }
            const user = { id: 'mock-user-123', email, role: email.includes('client') ? 'client' : 'agency' };
            localStorage.setItem('mockUser', JSON.stringify(user));
            return { data: { user }, error: null };
        },
        async signOut() {
            console.log("[MOCK AUTH] User signed out.");
            localStorage.removeItem('mockUser');
            return { error: null };
        },
        onAuthStateChange(callback: (event: string, session: { user: any } | null) => void) {
            // Mock persistent session check
            const userJson = localStorage.getItem('mockUser');
            const user = userJson ? JSON.parse(userJson) : null;
            
            // Initial call to simulate session load
            const session = user ? { user } : null;
            callback('INITIAL_SESSION', session);

            // Simple listener logic (does not truly listen for external changes)
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'mockUser') {
                    const newUser = e.newValue ? JSON.parse(e.newValue) : null;
                    const newSession = newUser ? { user: newUser } : null;
                    callback(newUser ? 'SIGNED_IN' : 'SIGNED_OUT', newSession);
                }
            };
            
            window.addEventListener('storage', handleStorageChange);

            // Return unsubscribe function
            return {
                data: {
                    subscription: {
                        unsubscribe: () => window.removeEventListener('storage', handleStorageChange)
                    }
                }
            };
        }
    }
};

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
