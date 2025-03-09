import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Logo from "../assets/logo.png";

interface ILogin {
    email: string;
    password: string;
}

const loginSchema = z.object({
    email: z.string().regex(/^[a-zA-Z0-9.]+@aluno\.ifsp\.edu\.br$/, "E-mail deve ser do domínio aluno.ifsp.edu.br"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const LoginPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<ILogin>({
        resolver: zodResolver(loginSchema),
        reValidateMode: "onBlur",
    });

    const { login } = useAuth();
    const navigate = useNavigate();
    
    const onSubmit = async (data: ILogin) => {
        if (errors.email || errors.password) return;

        const pendingToast = toast.loading("Carregando...");

        try {
            const user = await login(data.email, data.password);
            toast.dismiss(pendingToast);
            toast.success("Login bem-sucedido!");

            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
            
                if (userDoc.exists() && userDoc.data().name) {
                    navigate("/results");
                } else {
                    navigate("/signup");
                }
            }
            
        } catch (e) {
            toast.dismiss(pendingToast);
            toast.error("Erro ao fazer login");
            console.error(e);
        }
    };

    useEffect(() => {
        if (errors.email) {
            toast.error("Por favor, insira um e-mail válido do IFSP.");
        }

        if (errors.password) {
            toast.error("Por favor, insira uma senha com pelo menos 6 caracteres.");
        }
    }, [errors]);

    return (
        <div className="w-full h-full flex flex-col items-center gap-5 p-2 pt-7 bg-purple-900 overflow-y-scroll">
            <img src={Logo} className="w-1/3 lg:w-1/9 md:w-1/6 h-auto" />
            <h1 className="mt-8 text-4xl text-center font-extrabold text-orange-500">Logue ou cadastre-se para começar</h1>
            <p className="mt-8 text-xl max-w-3xl text-rose-100 text-center">Use seu e-mail institucional para começar no sistema de apadrinhamento</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 mb-8 w-5/6 lg:w-1/3 md:w-4/6 flex flex-col gap-3 bg-white p-6 rounded-2xl">
                <label htmlFor="email" className="text-lg text-orange-500">E-mail:</label>
                <input
                    type="email"
                    id="email"
                    className={`w-full border-1 border-${errors.email ? "red" : "gray"}-400 p-4 rounded-lg text-orange-500`}
                    {...register("email", { required: true })}
                />
                
                <label htmlFor="password" className="text-lg text-orange-500">Senha:</label>
                <input
                    type="password"
                    id="password"
                    className={`w-full border-1 border-${errors.password ? "red" : "gray"}-400 p-4 rounded-lg text-orange-500`}
                    {...register("password", { required: true })}
                />

                <button className="mt-8 bg-amber-600 hover:bg-purple-900 text-white text-xl font-bold py-2 px-4 rounded-lg cursor-pointer" type="submit">Começar</button>
            </form>
        </div>
    );
};