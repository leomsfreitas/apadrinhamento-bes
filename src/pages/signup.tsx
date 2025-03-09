import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { MenuItem, Select, Slider, TextField } from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { db } from "../firebaseConfig";
import { useAuth } from "../hooks/useAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";
import MaskedInput from 'react-text-mask';

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string({
    required_error: "Número de telefone é obrigatório",
    invalid_type_error: "Número de telefone é obrigatório"
  }).min(10, "Número de telefone inválido"),
  role: z.enum(["bixo", "veterano"], { 
    required_error: "Selecione uma opção" 
  }),
  pronouns: z.enum(
    ["Ela/Dela", "Ele/Dele", "Eles/Delas"], 
    { 
      required_error: "Selecione seus pronomes",
      invalid_type_error: "Selecione seus pronomes"
    }
  ),
  ethnicity: z.enum(
    ["Preta", "Branca", "Parda", "Amarela", "Indígena"], 
    { 
      required_error: "Selecione sua etnia",
      invalid_type_error: "Selecione sua etnia"
    }
  ),
  state: z.string().min(1, "Informe seu estado"),
  city: z.string()
    .min(1, "Informe sua cidade")
    .refine((city: string) => city !== 'Cidade', { 
      message: 'Informe sua cidade' 
    }),
  parties: z.number()
    .min(0, "Valor mínimo é 0")
    .max(10, "Valor máximo é 10"),
  games: z.enum(["Sim", "Não", "Neutro"], { 
    required_error: "Selecione uma opção para videogames",
    invalid_type_error: "Selecione uma opção para videogames"
  }),
  sports: z.enum(["Sim", "Não", "Neutro"], { 
    required_error: "Selecione uma opção para esportes",
    invalid_type_error: "Selecione uma opção para esportes"
  })
});

export type FormType = z.infer<typeof formSchema>;

interface CityData {
  id: number;
  nome: string;
}

export const SignupPage = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parties: 5,
    }
  });

  const [cities, setCities] = useState<CityData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const role = watch("role");

  const inputStyle = {
    input: { color: "#f97316" },
    label: { color: "#f97316" },
    "& label.Mui-focused": { color: "#f97316" },
    "& .MuiInput-underline:before": { borderBottomColor: "#f97316" },
    "& .MuiInput-underline:after": { borderBottomColor: "#581c87" },
    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
      borderBottomColor: "#581c87",
    },
  };

  const fetchCities = useCallback(async (stateCode: string) => {
    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios?orderBy=nome`
      );
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
      toast.error("Erro ao carregar cidades");
    }
  }, []);

  const onSubmit = async (data: FormType) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        toast.error("Faça login primeiro");
        return;
      }

      await setDoc(doc(db, "users", currentUser.uid), {
        ...data,
      });
      navigate('/results');
      toast.success("Cadastro realizado com sucesso!");

    } catch (error) {
      console.error("Erro no cadastro:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao salvar: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser || !state?.edit) return;
      
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const setField = (field: keyof FormType, value: any) =>
            setValue(field, value, { shouldValidate: true });

          setField('name', userData.name);
          setField('phone', userData.phone);
          setField('role', userData.role);
          setField('state', userData.state);
          setField('city', userData.city);
          setField('pronouns', userData.pronouns);
          setField('ethnicity', userData.ethnicity);
          setField('parties', userData.parties);
          setField('games', userData.games);
          setField('sports', userData.sports);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadUserData();
  }, [currentUser, state?.edit, setValue]);

  return (
    <div className="w-full min-h-screen bg-purple-900 flex flex-col items-center p-5 gap-y-6">
      <img src={Logo} className="w-1/3 lg:w-1/9 md:w-1/6 h-auto" />

      <h1 className="mt-8 text-4xl text-center font-extrabold text-orange-500">Bem-vindo ao Sistema de Apadrinhamento</h1>

      <p className="mt-8 text-xl max-w-3xl text-white text-center">Preencha com sinceridade para encontrarmos seu padrinho/madrinha ideal no IFSP</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 w-full max-w-lg bg-white text-orange-500 p-6 rounded-lg flex flex-col gap-10">

        <div>
          <TextField
            fullWidth
            label="Qual seu nome?"
            variant="standard"
            sx={inputStyle}
            {...register("name")}
          />
          {errors.name && (<span className="text-red-400">{errors.name.message?.toString()} </span>)}
        </div>

        <div>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <MaskedInput
                {...field}
                mask={['(', /[1-9]/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
                placeholderChar={'\u2000'}
                showMask
                render={(ref, props) => (
                  <TextField
                    {...props}
                    inputRef={ref}
                    fullWidth
                    label="Número de telefone"
                    variant="standard"
                    sx={inputStyle}
                    error={!!errors.phone}
                    helperText={errors.phone ? errors.phone.message : ""}
                  />
                )}
              />
            )}
          />
        </div>

        <div>
          <p className="mb-4">Você é...</p>
          <div className="flex gap-4 justify-center">
            {(['bixo', 'veterano'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setValue("role", option, {
                    shouldDirty: false,
                    shouldValidate: false,
                    shouldTouch: false,
                  })
                }
                className={`px-6 py-2 rounded-full transition-colors ${
                  role === option
                    ? "bg-purple-900 text-white"
                    : "bg-orange-500 text-white hover:bg-purple-900"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>

          {errors.role && (
            <span className="text-red-400">{errors.role.message?.toString()}</span>
          )}
        </div>

        <div>
          <p>Pronomes:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 justify-evenly items-center">
            {(["Ela/Dela", "Ele/Dele", "Eles/Delas"] as const).map((pronoun) => (
              <label key={pronoun} className="flex justify-center items-center gap-2 text-lg">
                <input
                  className="cursor-pointer w-5 h-5 rounded-full not-checked:bg-white checked:bg-purple-900 border-2 border-gray-400 checked:border-purple-900 checked:accent-purple-900"
                  type="radio"
                  value={pronoun}
                  {...register("pronouns")}
                />
                {pronoun}
              </label>
            ))}
          </div>
          {errors.pronouns && (
            <span className="text-red-400">{errors.pronouns.message}</span>
          )}
        </div>

        <div>
          <p>Qual sua etnia?</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 justify-evenly items-center">
            {(["Preta", "Branca", "Parda", "Amarela", "Indígena"] as const).map((ethnicity) => (
              <label key={ethnicity} className="flex justify-center items-center gap-2 text-lg">
                <input
                  className="cursor-pointer w-5 h-5 rounded-full not-checked:bg-white checked:bg-purple-900 border-2 border-gray-400 checked:border-purple-900 checked:accent-purple-900"
                  type="radio"
                  value={ethnicity}
                  {...register("ethnicity")}
                />
                {ethnicity}
              </label>
            ))}
          </div>
          {errors.ethnicity && (
            <span className="text-red-400">{errors.ethnicity.message}</span>
          )}
        </div>

        <p>De onde você é?</p>
        <Select
          variant="standard"
          sx={{ ":before": { borderBottomColor: "#f97316" }, color: "#f97316", ':hover': { borderBottomColor: "#f97316" }, }}
          defaultValue=''
          {...register("state")}
          onChange={async (e) => await fetchCities(e.target.value as string)}
        >
          <MenuItem value="27">Alagoas</MenuItem>
          <MenuItem value="12">Acre</MenuItem>
          <MenuItem value="16">Amapá</MenuItem>
          <MenuItem value="13">Amazonas</MenuItem>
          <MenuItem value="29">Bahia</MenuItem>
          <MenuItem value="23">Ceará</MenuItem>
          <MenuItem value="53">Distrito Federal</MenuItem>
          <MenuItem value="32">Espírito Santo</MenuItem>
          <MenuItem value="52">Goiás</MenuItem>
          <MenuItem value="21">Maranhão</MenuItem>
          <MenuItem value="51">Mato Grosso</MenuItem>
          <MenuItem value="50">Mato Grosso do Sul</MenuItem>
          <MenuItem value="31">Minas Gerais</MenuItem>
          <MenuItem value="15">Pará</MenuItem>
          <MenuItem value="25">Paraíba</MenuItem>
          <MenuItem value="41">Paraná</MenuItem>
          <MenuItem value="26">Pernambuco</MenuItem>
          <MenuItem value="22">Piauí</MenuItem>
          <MenuItem value="33">Rio de Janeiro</MenuItem>
          <MenuItem value="24">Rio Grande do Norte</MenuItem>
          <MenuItem value="43">Rio Grande do Sul</MenuItem>
          <MenuItem value="11">Rondônia</MenuItem>
          <MenuItem value="14">Roraima</MenuItem>
          <MenuItem value="42">Santa Catarina</MenuItem>
          <MenuItem value="35">São Paulo</MenuItem>
          <MenuItem value="28">Sergipe</MenuItem>
          <MenuItem value="17">Tocantins</MenuItem>
        </Select>

        <Select
          variant="standard"
          label="Cidade"
          sx={{ ":before": { borderBottomColor: "#f97316" }, color: "#f97316" }}
          defaultValue='Cidade'
          {...register("city")}
        >
          <MenuItem value="Cidade"><em className="text-orange-500">Cidade</em></MenuItem>
          {cities.map((city) => (
            <MenuItem key={city.id} value={city.nome}>{city.nome}</MenuItem>
          ))}
        </Select>

        {errors.city && (
          <span className="text-red-400">{errors.city.message}</span>
        )}

        <p>Curte rolês e festas?</p>
        <div>
          <Slider
            aria-label="Festas"
            min={0}
            max={10}
            defaultValue={5}
            value={watch('parties')}
            sx={{ color: "#f97316" }}
            valueLabelDisplay="auto"
            onChange={(_, value) => setValue("parties", value as number)}
            />
            <div className="flex justify-between">
              <p>Pouco</p>
              <p>Muito</p>
            </div>
        </div>
        

        <p>Gosta de videogames?</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 justify-evenly items-center">
          {["Sim", "Não", "Neutro"].map((option) => (
            <label key={option} className="flex justify-center items-center gap-2 text-lg">
              <input
                className="cursor-pointer w-5 h-5 rounded-full not-checked:bg-white checked:bg-purple-900 border-2 border-gray-400 checked:border-purple-900 checked:accent-purple-900"
                type="radio"
                value={option}
                {...register("games")}
              />
              {option}
            </label>
          ))}
        </div>
        {errors.games && (
          <span className="text-red-400">{errors.games.message}</span>
        )}

        <p>Gosta de esportes?</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 justify-evenly items-center">
          {["Sim", "Não", "Neutro"].map((option) => (
            <label key={option} className="flex justify-center items-center gap-2 text-lg">
              <input
                className="cursor-pointer w-5 h-5 rounded-full not-checked:bg-white checked:bg-purple-900 border-2 border-gray-400 checked:border-purple-900 checked:accent-purple-900"
                type="radio"
                value={option}
                {...register("sports")}
              />
              {option}
            </label>
          ))}
        </div>
        {errors.sports && (
          <span className="text-red-400">{errors.sports.message}</span>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-amber-600 text-orange-500 py-3 rounded-lg text-white text-xl hover:bg-purple-900
                      disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Salvando...' : 'Finalizar Cadastro'}
        </button>
      </form>
    </div>
  );
};