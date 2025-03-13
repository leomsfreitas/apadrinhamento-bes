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
    state: number;
    parties: number;
    games: "Sim" | "Não" | "Neutro";
    sports: "Sim" | "Não" | "Neutro";
    interest: "Desenvolvimento de software" | "Inteligência artificial" | "Gestão de projetos" | "Segurança da informação" | "UX/UI Design";
}

export const ResultPage = () => {
    const authCtx = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState<User[]>([]);

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

            const MAX_BIXOS_PER_VETERANO = 2;

            const matchQuery = query(
                collection(db, "matches"),
                where(userData.role === "bixo" ? "bixoId" : "veteranoId", "==", authCtx.user.uid)
            );
    
            const matchSnapshot = await getDocs(matchQuery);
    
            if (!matchSnapshot.empty) {
                const matchDataList = await Promise.all(matchSnapshot.docs.map(async (matchDoc) => {
                    const matchData = matchDoc.data();
                    const matchedUserId = userData.role === "bixo" ? matchData.veteranoId : matchData.bixoId;
                    const matchedUserDoc = await getDoc(doc(db, "users", matchedUserId));
                    return matchedUserDoc.exists() ? matchedUserDoc.data() as User : null;
                }));
                setMatches(matchDataList.filter(Boolean) as User[]);
                return;
            }
    
            if (userData.role === "veterano") return;
    
            const allUsersSnapshot = await getDocs(collection(db, "users"));
            const allUsers: User[] = allUsersSnapshot.docs.map(userDoc => ({ id: userDoc.id, ...userDoc.data() } as User));
    
            const matchesSnapshot = await getDocs(collection(db, "matches"));
            const usedVeteranIds = new Map<string, number>();
    
            matchesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (usedVeteranIds.has(data.veteranoId)) {
                    usedVeteranIds.set(data.veteranoId, usedVeteranIds.get(data.veteranoId)! + 1);
                } else {
                    usedVeteranIds.set(data.veteranoId, 1);
                }
            });
    
            const potentialMatches = allUsers.filter(u => u.role === "veterano" && (usedVeteranIds.get(u.id) || 0) < MAX_BIXOS_PER_VETERANO);
    
            let bestMatch: User | null = null;
            let bestScore = -1;
    
            for (const potential of potentialMatches) {
                let score = 0;
                if (potential.city === userData.city) score += 2;
                if (potential.state === userData.state) score += 1;
                if (potential.pronouns === userData.pronouns) score += 1;
                if (potential.ethnicity === userData.ethnicity) score += 1;
                if (potential.parties === userData.parties) score += 2;
                if (potential.games === userData.games) score += 2;
                if (potential.sports === userData.sports) score += 1;
                if (potential.interest === userData.interest) score += 1;
    
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = potential;
                }
            }
    
            if (bestMatch) {
                await setDoc(doc(collection(db, "matches")), {
                    bixoId: authCtx.user.uid,
                    veteranoId: bestMatch.id,
                });
    
                setMatches([bestMatch]);
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
            {matches.length > 0 ? (
                matches.map((match) => (
                    <div key={match.id} className="text-center">
                        <p className="text-white text-2xl font-semibold">{match.name}</p>
                        <p className="text-white text-xl">Telefone: {match.phone}</p>
                    </div>
                ))
            ) : (
                <p className="text-white text-2xl font-semibold">Nenhum match disponível no momento, volte mais tarde!</p>
            )}
            <button className="mt-8 bg-amber-600 text-white text-xl py-2 px-4 rounded-lg cursor-pointer" onClick={() => authCtx.logout()}>Sair</button>
        </div>
    );
};