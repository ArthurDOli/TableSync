import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Eye, EyeOff, User, Mail, Lock, Layers3 } from "lucide-react";
import backgroundImage from "@/assets/background-image.jpg"

interface FormErrors {
    username?: string;
    email?: string;
    password?: string;
    general?: string;
}

export function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    const [errors, setErrors] = useState<FormErrors>({});

    const navigate = useNavigate();

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        const newErrors: FormErrors = {};
        if (username.length < 2 || username.length > 50) newErrors.username = "Username must be between 2 and 50 characters";
        if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

        const emailRegex = /\S+@\S+\.\S+/;
        if (!email || !emailRegex.test(email)) {
            newErrors.email = "Must be a valid email address.";
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await api.post('/auth/register', {
                username: username,
                email: email,
                password: password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userId', response.data.user.id);
            localStorage.setItem('username', response.data.user.username);

            navigate('/dashboard');
        } catch (error: any) {
            setErrors({ general: "Registration error. Email or username might be taken." });
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen overflow-hidden
            bg-black bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] 
            bg-[size:128px_128px] text-white relative">
            
            <div className="flex w-full flex-col justify-center items-center lg:w-1/2 px-4">
                <div className="w-full max-w-md lg:ml-32">
                    <div className="flex items-center gap-3 mb-10">
                        <Layers3 className="text-white" size={32}/>
                        <span className="text-3xl font-extrabold text-white tracking-tighter">
                            TableSync
                        </span>
                    </div>

                    <form
                        onSubmit={handleRegister}
                        noValidate
                        className="flex flex-col gap-4 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl shadow-2xl w-full
                            shadow-[0_0_50px_10px_rgba(255,255,255,0.05)]"
                    >
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold">Register</h1>
                            <p className="text-zinc-400 text-sm mb-4">Create your account to enter the table</p>
                        </div>

                        {errors.general && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                                {errors.general}
                            </div>
                        )}

                        <FieldGroup>
                            <Field data-invalid={!!errors.username || undefined}>
                                <FieldLabel htmlFor="username">
                                    Username
                                </FieldLabel>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        aria-invalid={!!errors.username || undefined}
                                        required
                                        placeholder="Ex: MyUsername"
                                        className="placeholder:text-zinc-500 pl-10"
                                    />
                                </div>
                                <FieldDescription className={errors.username ? "text-red-500" : "text-zinc-500"}>
                                    {errors.username || "Must be between 2 and 50 characters."}
                                </FieldDescription>
                            </Field>

                            <Field data-invalid={!!errors.email || undefined}>
                                <FieldLabel htmlFor="email">
                                    Email
                                </FieldLabel>      
                                <div className="relative">       
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />               
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        aria-invalid={!!errors.email || undefined}
                                        required
                                        placeholder="Ex: player@gmail.com"
                                        className="placeholder:text-zinc-500 pl-10"
                                    />
                                </div>
                                <FieldDescription className={errors.email ? "text-red-500" : "text-zinc-500"}>
                                    {errors.email || "Must be a valid email address."}
                                </FieldDescription>
                            </Field>

                            <Field data-invalid={!!errors.password || undefined}>
                                <FieldLabel htmlFor="password">
                                    Password
                                </FieldLabel>
                                
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /> 
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"} 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        aria-invalid={!!errors.password || undefined}
                                        required
                                        placeholder="Ex: **********"
                                        className="pr-10 placeholder:text-zinc-500 pl-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <FieldDescription className={errors.password ? "text-red-500" : "text-zinc-500"}>
                                    {errors.password || "Must be at least 6 characters long."}
                                </FieldDescription>
                            </Field>
                        </FieldGroup>

                        <Button
                            type="submit"
                            className="mt-4 font-bold w-full transition-all duration-300 hover:bg-zinc-800
                                hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                        >
                            Enter
                        </Button>
                        
                        <p className="text-center text-sm text-zinc-400 mt-2">
                            Already has an account? <a href="/login" className="text-white hover:underline">Login here!</a>
                        </p>

                    </form>
                </div>
            </div>

            <div className="hidden lg:flex w-1/2 items-center justify-end relative h-screen">
                <img 
                    src={backgroundImage} 
                    alt="TablesSync Background Image" 
                    className="
                        w-full max-w-[900px] h-full object-cover 
                        absolute right-0
                        opacity-40
                        [mask-image:linear-gradient(ellipse_at_right_center,white_20%,transparent_75%)]
                        [-webkit-mask-image:radial-gradient(ellipse_at_right_center,white_20%,transparent_75%)]
                        "
                />

                <div className="absolute bottom-20 right-24 text-right w-full max-w-[350px]">
                    <p className="text-[26px] text-zinc-400 italic leading-relaxed">
                        "The longest journey begins with a single step."
                    </p>
                    <p className="text-[20px] text-zinc-500 mt-1 font-medium">
                        — A Wise Master
                    </p>
                </div>
            </div>
        </div>
    );
}