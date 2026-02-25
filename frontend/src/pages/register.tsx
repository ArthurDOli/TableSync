import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

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

            navigate('/dashboard');
        } catch (error) {
            alert('Registration error. Please verify credentials');
        }
    }

    return (
        <div className="flex items-center justify-center h-screen bg-zinc-900 text-white">
            
            <form
                onSubmit={handleRegister}
                className="flex flex-col gap-4 bg-zinc-800 p-8 rounded-lg shadow-lg w-96"
            >
                <h1 className="text-3xl font-bold">TableSync - Register Page</h1>

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

                <button
                    type="submit"
                    className="mt-4 bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition-colors"
                >
                    Enter
                </button>
                
                <p>Already has an account? <a href="/login">Login here!</a></p>

            </form>

        </div>
    );
}