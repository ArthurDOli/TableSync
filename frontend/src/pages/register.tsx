import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";

export function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [hasError, setHasError] = useState(false);

    const navigate = useNavigate();

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setHasError(false);

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
        } catch (error) {
            setHasError(true);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen 
            bg-black bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] 
            bg-[size:128px_128px] text-white">
            
            <div className="flex w-full flex-col justify-center items-center lg:w-1/2 px-4">
                <form
                    onSubmit={handleRegister}
                    className="flex flex-col gap-4 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl shadow-2xl w-full max-w-md"
                >
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold">Register</h1>
                        <p className="text-zinc-400 text-sm mb-4">Create your account to enter the table</p>
                    </div>

                    <FieldGroup>
                        <Field data-invalid={hasError ? true : undefined}>
                            <FieldLabel htmlFor="username">
                                Username
                            </FieldLabel>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                aria-invalid={hasError ? true : undefined}
                                required
                            />
                        </Field>

                        <Field data-invalid={hasError ? true : undefined}>
                            <FieldLabel htmlFor="email">
                                Email
                            </FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-invalid={hasError ? true : undefined}
                                required
                            />
                        </Field>

                        <Field data-invalid={hasError ? true : undefined}>
                            <FieldLabel htmlFor="password">
                                Password
                            </FieldLabel>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                aria-invalid={hasError ? true : undefined}
                                required
                            />
                            {hasError && (
                                <FieldDescription className="text-red-500 font-medium">
                                    Registration error. Please verify credentials.
                                </FieldDescription>
                            )}
                        </Field>
                    </FieldGroup>

                    <Button
                        type="submit"
                        className="mt-4 font-bold w-full"
                    >
                        Enter
                    </Button>
                    
                    <p className="text-center text-sm text-zinc-400 mt-2">
                        Already has an account? <a href="/login" className="text-white hover:underline">Login here!</a>
                    </p>

                </form>
            </div>

            <div className="hidden lg:flex w-1/2 items-center justify-center p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-zinc-400 border border-zinc-800 lg-[rgb(5,5,6)] p-6 rounded-xl">
                        Placeholder
                    </h2>
                </div>
            </div>
        </div>
    );
}