import { BrowserRouter, Routes, Outlet, Navigate, Route } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useEffect, useState } from "react";

import { SignupPage, LoginPage, LandPage, ResultPage } from "./pages";

const PrivateRoutes = () => {
    const auth = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        auth.verify().then((user) => {
            setIsAuthenticated(!!user);
        }).catch(() => {
            setIsAuthenticated(false);
        });
    }, [auth]);

    if (isAuthenticated === null) return <p>Carregando...</p>;

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandPage />} />
                <Route path="/login" element={<LoginPage />} />

                <Route element={<PrivateRoutes />}>
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/results" element={<ResultPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};
