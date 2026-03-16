import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Layers3, LogOut, Plus, LogIn, Lock, Check, Copy, Ghost } from "lucide-react";
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

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        navigate('/login');
    }

    function handleCopy(id: string) {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
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

        if (!sessions.find(s => s.id === response.data.id)) {
            setSessions(prev => [...prev, response.data]);
        }

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

                <hr className="border-zinc-800 my-4" />

                <div>
                    <h2 className="text-2xl font-bold mb-8">
                        My Sessions
                    </h2>

                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-[rgb(5,5,6)] border border-dashed
                            border-zinc-700 rounded-xl">
                            <Ghost className="text-zinc-600 mb-4" size={64}/>
                            <h3 className="text-xl font-bold text-zinc-300 mb-2">
                                No sessions yet
                            </h3>
                            <p className="text-zinc-500 text-sm max-w-sm text-center">
                                You haven't created or joined any sessions. Use the forms above to start your journey.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sessions.map(session => (
                                <div 
                                    key={session.id} 
                                    className="group flex flex-col justify-between bg-[rgb(5,5,6)] border border-zinc-800 p-6 rounded-xl 
                                    transition-all duration-300 
                                    hover:-translate-y-2 
                                    hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] 
                                    hover:border-zinc-700 
                                    h-[200px]"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1" title={session.name}>
                                            {session.name}
                                        </h3>
                                        <p className="text-sm text-zinc-400 line-clamp-3">
                                            {session.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                                        <span className="text-xs text-zinc-600 font-mono truncate mr-4">
                                            ID: {session.id.substring(0, 8)}...
                                        </span>
                                        
                                        <button 
                                            onClick={() => handleCopy(session.id)}
                                            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded 
                                            bg-zinc-800/50 text-zinc-300 
                                            hover:bg-zinc-700 
                                            hover:text-white 
                                            transition-colors"
                                        >
                                            {copiedId === session.id ? (
                                                <>
                                                    <Check size={14} className="text-green-500" />
                                                    <span className="text-green-500">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={14} />
                                                    Copy ID
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}