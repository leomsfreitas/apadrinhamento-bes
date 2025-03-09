import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";

export const LandPage = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full h-full flex flex-col items-center gap-3 p-2 pt-5 bg-purple-900 overflow-y-scroll">
            <img src={Logo} className="w-1/3 lg:w-1/9 md:w-1/6 h-auto" alt="Logo" />
            
            <h1 className="mt-8 text-4xl text-center font-extrabold text-orange-500">
                Bem-vindo ao Sistema de Apadrinhamento
            </h1>
            
            <p className="mt-8 text-xl max-w-3xl text-white text-center">
                A Comissão da Calourada de Engenharia de Software 2025 desenvolveu este sistema para facilitar a integração dos novos estudantes. Aqui, vocês serão agrupados em duplas ou trios com veteranos, que irão apresentar o funcionamento do Instituto Federal e ajudar a esclarecer qualquer dúvida!
            </p>
            
            <button
                className="mt-8 bg-orange-500 text-white text-xl font-bold py-2 px-4 rounded-lg cursor-pointer"
                onClick={() => navigate("/login")}
            >
                Começar
            </button>
            
            <p className="mt-8 text-md max-w-3xl text-white text-center">
                Este projeto foi inspirado em um sistema originalmente desenvolvido na Unicamp e distribuído sob licença pública.
            </p>
        </div>
    );
};