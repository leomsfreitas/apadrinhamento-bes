import { useEffect, useState } from "react";
import Logo from "../assets/logo.png";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, getDoc, setDoc, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface User {
    id: string;
    name: string;
    phone: string;
    role: "bixo" | "veterano";
    pronouns: "Ela/Dela" | "Ele/Dele" | "Eles/Delas";
    ethnicity: "Preta" | "Branca" | "Parda" | "Amarela" | "Indígena";
    city: string;
    parties: number;
    games: "Sim" | "Não" | "Neutro";
    sports: "Sim" | "Não" | "Neutro";
}

export const ResultPage = () => {
    const authCtx = useAuth();
    const navigate = useNavigate();
    const [match, setMatch] = useState<User | null>(null);
    useEffect(() => {
        const checkAuthAndFetch = async () => {
            await authCtx.verify();
    
            if (!authCtx.user) {
                return;
            }
    
            const userDoc = await getDoc(doc(db, "users", authCtx.user.uid));
            if (!userDoc.exists()) {
                navigate('/signup');
                return;
            }
    
            const userData = userDoc.data() as User;
    
            const matchQuery = query(
                collection(db, "matches"),
                where(userData.role === "bixo" ? "bixoId" : "veteranoId", "==", authCtx.user.uid)
            );
    
            const matchSnapshot = await getDocs(matchQuery);
    
            if (!matchSnapshot.empty) {
                const matchData = matchSnapshot.docs[0].data();
                const matchedUserId = userData.role === "bixo" ? matchData.veteranoId : matchData.bixoId;
                const matchedUserDoc = await getDoc(doc(db, "users", matchedUserId));
    
                if (matchedUserDoc.exists()) {
                    setMatch(matchedUserDoc.data() as User);
                }
                return;
            }
    
            if (userData.role === "veterano") return;
    
            const allUsersSnapshot = await getDocs(collection(db, "users"));
            const allUsers: User[] = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    
            const usedVeteranIds = new Set(
                (await getDocs(collection(db, "matches"))).docs.map(doc => doc.data().veteranoId)
            );
    
            const potentialMatches = allUsers.filter(u => u.role === "veterano" && !usedVeteranIds.has(u.id));
    
            let bestMatch: User | null = null;
            let bestScore = -1;
    
            for (const potential of potentialMatches) {
                let score = 0;
                if (potential.city === userData.city) score += 2;
                if (potential.pronouns === userData.pronouns) score += 1;
                if (potential.ethnicity === userData.ethnicity) score += 1;
                if (potential.parties === userData.parties) score += 2;
                if (potential.games === userData.games) score += 1;
                if (potential.sports === userData.sports) score += 1;
    
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = potential;
                }
            }
    
            if (bestMatch) {
                await setDoc(doc(collection(db, "matches")), {
                    bixoId: authCtx.user.uid,
                    veteranoId: bestMatch.id,
                    timestamp: new Date(),
                });
    
                setMatch(bestMatch);
            }
        };
    
        if (authCtx.user === undefined) {
            const interval = setInterval(() => {
                if (authCtx.user !== undefined) {
                    clearInterval(interval);
                    checkAuthAndFetch();
                }
            }, 100);
            return () => clearInterval(interval);
        } else {
            checkAuthAndFetch();
        }
    }, [authCtx.user, navigate]);
    
    return (
        <div className="w-full h-full flex flex-col items-center gap-9 p-2 pt-8 bg-purple-900 overflow-y-scroll">
            <img src={Logo} className="w-1/3 lg:w-1/9 md:w-1/6 h-auto" />
            <h1 className="mt-8 text-4xl text-center font-extrabold text-orange-500">
                {authCtx?.role === 'bixo' ? 'Você foi apadrinhado por:' : 'Você apadrinhou:'}
            </h1>
            <p className="text-white text-2xl font-semibold">
                {match ? match.name : "Nenhum match disponível no momento :("}
            </p>
            {match && (
                <p className="text-white text-xl">
                    Telefone: {match.phone}
                </p>
            )}
            <button className="mt-8 bg-amber-600 text-white text-xl py-2 px-4 rounded-lg cursor-pointer" onClick={() => authCtx.logout()}>Sair</button>
        </div>
    );
};