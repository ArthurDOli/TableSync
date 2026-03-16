import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Layers3, LogOut, Plus, LogIn, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

type Session = {
    id: string;
    name: string;
    description: string;
    status: string;
};

export function Dashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionName, setSessionName] = useState('');

    const [description, setDescription] = useState('');

    const [createPassword, setCreatePassword] = useState('');
    const [enterPassword, setEnterPassword] = useState('');

    const [sessionId, setSessionId] = useState('');

    const navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        navigate('/login');
    }

    async function handleSessionCreation(e: React.FormEvent) {
        e.preventDefault();

        try {
            const response = await api.post('/sessions', {
                name: sessionName,
                description: description,
                password: createPassword
            });

            setSessions(prev => [...prev, response.data]);

            setSessionName('');
            setDescription('');
            setCreatePassword('');
        } catch (error) {
            console.error("Error creating session", error);
            alert("Failed to create session. Please check your inputs");
        }
    }

    async function handleSessionEnter(e: React.FormEvent) {
        e.preventDefault();

        try {
            const response = await api.post('/sessions/join', {
            sessionId: sessionId,
            password: enterPassword,
        });

        setSessions(prev => [...prev, response.data]);

        setSessionId('');
        setEnterPassword('');
        } catch (error) {
        console.error("Error entering session", error);
        alert("Failed to enter session. Please check your inputs");
        }
    }

    useEffect(() => {
        async function loadSessions() {
            try {
                const response = await api.get('/sessions/my-sessions');
                setSessions(response.data);
            } catch (error) {
                console.error("Error loading sessions", error);
            }
        } loadSessions();
    }, []);

    return (
        <div className="min-h-screen bg-black 
            bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] 
            bg-[size:128px_128px] text-white">
            <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-black/50 backdrop-blur-md border-b 
                border-zinc-800">
                <div className="flex items-center gap-3">
                    <Layers3 className="text-white" size={28}/>
                    <span className="text-2xl font-extrabold text-white tracking-tighter">
                        TableSync
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-800 bg-[rgb(5,5,6)] text-zinc-400
                        font-semibold transition-all duration-300
                        hover:border-red-500
                        hover:text-red-500
                        hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                    <LogOut size={18}/>
                    Logout
                </button>
            </nav>

            <main className="max-w-7xl mx-auto p-8 flex flex-col gap-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <form
                        onSubmit={handleSessionCreation}
                        className="flex flex-col gap-6 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Plus className="text-blue-500"/>
                            <h2 className="text-2xl font-bold">
                                Create Session
                            </h2>
                        </div>

                        <FieldGroup>
                            <Field>
                                <FieldLabel>
                                    Session Name
                                </FieldLabel>
                                <Input
                                    type="text"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    required
                                    placeholder="Ex: D&D Campain"
                                    className="bg-zinc-900/50
                                        placeholder:text-zinc-600"
                                />
                            </Field>

                            <Field>
                                <FieldLabel>
                                    Description
                                </FieldLabel>
                                <Input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    placeholder="Ex: xxx"
                                    className="bg-zinc-900/50
                                        placeholder:text-zinc-600"
                                />
                            </Field>

                            <Field>
                                <FieldLabel>
                                    Passwprd
                                </FieldLabel>
                                <Input
                                    type="text"
                                    value={createPassword}
                                    onChange={(e) => setCreatePassword(e.target.value)}
                                    required
                                    placeholder="Ex: D&D Campain"
                                    className="bg-zinc-900/50
                                        placeholder:text-zinc-600"
                                />
                            </Field>
                        </FieldGroup>

                        <Button
                            type="submit"
                            className="mt-2 font-bold w-full transition-all duration-300 hover:bg-zinc-800
                                hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                        >
                            Create
                        </Button>
                    </form>

                    <form
                        onSubmit={handleSessionEnter}
                        className="flex flex-col gap-6 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <LogIn className="text-green-500"/>
                            <h2 className="text-2xl font-bold">
                                Enter Session
                            </h2>
                        </div>

                            <FieldGroup>
                                <Field>
                                    <FieldLabel>
                                        Session ID
                                    </FieldLabel>
                                    <Input
                                        type="text"
                                        value={sessionId}
                                        onChange={(e) => setSessionId(e.target.value)}
                                        required
                                        placeholder="Ex: 123e4567-e89b..."
                                        className="bg-zinc-900/50
                                            placeholder:text-zinc-600"
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel>
                                        Password
                                    </FieldLabel>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>
                                        <Input
                                            type="password"
                                            value={enterPassword}
                                            onChange={(e) => setEnterPassword(e.target.value)}
                                            required
                                            placeholder="Ex: *********"
                                            className="pl-10 bg-zinc-900/50
                                                placeholder:text-zinc-600"
                                        />
                                    </div>                                    
                                </Field>
                            </FieldGroup>

                            <div className="flex-grow"></div>

                            <Button
                                type="submit"
                                className="mt-2 font-bold w-full transition-all duration-300 hover:bg-zinc-800
                                    hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                            >
                                Enter
                            </Button>
                    </form>
                </div>
            </main>
            
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sessions.map(session => (
                    <div key={session.id} className="bg-zinc-800 p-4 rounded-lg">
                        <h2 className="text-xl font-bold text-blue-400">{session.name} - {session.id}</h2>
                        <p className="text-zinc-400">{session.description}</p>
                    </div>
                ))}
            </div>

            <h2>Create Session</h2>

            <form
                onSubmit={handleSessionCreation}
                className="flex flex-col gap-4 bg-zinc-800 p-8 rounded-lg shadow-lg w-96"
            >
                <div>
                    <label className="block mb-1 text-sm text-zinc-400">Session Name</label>
                    <input
                        type="text"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm text-zinc-400">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm text-zinc-400">Password</label>
                    <input
                        type="password"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="mt-4 bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition-colors"
                >
                    Create Session
                </button>
            </form>

            <h2>Enter Session</h2>

            <form
                onSubmit={handleSessionEnter}
                className="flex flex-col gap-4 bg-zinc-800 p-8 rounded-lg shadow-lg w-96"
            >
                <div>
                    <label className="block mb-1 text-sm text-zinc-400">Session Id</label>
                    <input
                        type="text"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm text-zinc-400">Password</label>
                    <input
                        type="password"
                        value={enterPassword}
                        onChange={(e) => setEnterPassword(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="mt-4 bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition-colors"
                >
                    Enter Session
                </button>
            </form> */}
        </div>
    );
}