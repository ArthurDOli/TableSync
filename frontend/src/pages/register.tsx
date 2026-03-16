import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "@/components/ui/button";

export function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();

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
            alert('Registration error. Please verify credentials');
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
                    <h1 className="text-3xl font-bold">Register</h1>
                    <p className="text-zinc-400 text-sm mb-4">Create your account to enter the table</p>

                    <div>
                        <label className="block mb-1 text-sm text-zinc-400">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm text-zinc-400">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm text-zinc-400">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

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