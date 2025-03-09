import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    User 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<User | null>;
    verify: () => Promise<User | null>;
    logout: () => Promise<void>;
    status: boolean;
    setStatus: React.Dispatch<React.SetStateAction<boolean>>;
    token: string | null;
    role: string | null;
}

export const useAuth = (): AuthContextType => {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchRole = async (uid: string): Promise<string | null> => {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return data.role || null;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Erro ao buscar role:", error);
            return null;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const idToken = await currentUser.getIdToken();
                    setToken(idToken);
                    const userRole = await fetchRole(currentUser.uid);
                    setRole(userRole);
                } catch (error) {
                    console.error("Erro ao obter token:", error);
                }
            } else {
                setToken(null);
                setRole(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<User | null> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            setStatus(true);
            const idToken = await userCredential.user.getIdToken();
            setToken(idToken);
            
            const userRole = await fetchRole(userCredential.user.uid);
            setRole(userRole);

            return userCredential.user;
        } catch (error: any) {
            if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
                try {
                    const newUser = await createUserWithEmailAndPassword(auth, email, password);
                    setStatus(true);
                    const idToken = await newUser.user.getIdToken();
                    setToken(idToken);

                    return newUser.user;
                } catch (createError: any) {
                    console.error("Erro ao criar usuário:", createError.code, createError.message);
                    throw createError;
                }
            }
            throw error;
        }
    };

    const verify = async (): Promise<User | null> => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setUser(null);
                setToken(null);
                setRole(null);
                return null;
            }

            const idToken = await currentUser.getIdToken();
            const fetchedRole = await fetchRole(currentUser.uid);

            setToken(idToken);
            setRole(fetchedRole);
            setUser(currentUser);

            return currentUser;
        } catch (error) {
            console.error("Erro ao verificar usuário:", error);
            return null;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
            setUser(null);
            setToken(null);
            setRole(null);
            navigate("/login");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    return { user, login, verify, logout, status, setStatus, token, role };
};