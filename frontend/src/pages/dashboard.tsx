import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Layers3, LogOut } from "lucide-react";

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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </form>
        </div>
    );
}