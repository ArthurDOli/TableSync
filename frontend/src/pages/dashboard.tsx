import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Layers3, LogOut, Plus, LogIn, Lock, Check, Copy, Ghost, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Session = {
    id: string;
    name: string;
    description: string;
    status: string;
    masterId: number;
    backgroundImageUrl?: string;
};

interface CreateFormErrors {
    sessionName?: string;
    description?: string;
    password?: string;
}

interface EnterFormErrors {
    sessionId?: string;
    password?: string;
}

export function Dashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionName, setSessionName] = useState('');
    const [description, setDescription] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [enterPassword, setEnterPassword] = useState('');
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [showEnterPassword, setShowEnterPassword] = useState(false);
    const [createErrors, setCreateErrors] = useState<CreateFormErrors>({});
    const [enterErrors, setEnterErrors] = useState<EnterFormErrors>({});
    const [sessionId, setSessionId] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const currentUsername = localStorage.getItem('username') || 'User';
    const initials = currentUsername.substring(0, 2).toUpperCase();
    const navigate = useNavigate();
    const currentUserId = Number(localStorage.getItem('userId'));

    function handleLeaveOrDeleteSession(e: React.MouseEvent, session: Session) {
        e.stopPropagation();
        setSessionToDelete(session);
        setShowDeleteDialog(true);
    }

    async function confirmDelete() {
        if (!sessionToDelete) return;

        setIsDeleting(true);

        try {
            const isMaster = sessionToDelete.masterId === currentUserId;

            if (isMaster) {
                await api.delete(`/sessions/${sessionToDelete.id}`);
            } else {
                await api.delete(`/sessions/${sessionToDelete.id}/participants/${currentUserId}`);
            }

            setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
            setShowDeleteDialog(false);
            setSessionToDelete(null);
        } catch (error) {
            console.log("Error processing action", error);
            alert("An erro occurred. Please try again");
        } finally {
            setIsDeleting(false);
        }
    }

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
        setCreateErrors({});

        const newErrors: CreateFormErrors = {};
        if (sessionName.length < 2 || sessionName.length > 100) newErrors.sessionName = "Session name must be between 2 and 100 characters.";
        if (description.length > 1000) newErrors.description = "Description must be less than 1000 characters.";
        if (createPassword.length < 4) newErrors.password = "Password must be at least 4 characters."

        if (Object.keys(newErrors).length > 0) {
            setCreateErrors(newErrors);
            return;
        }

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
        }
    }

    async function handleSessionEnter(e: React.FormEvent) {
        e.preventDefault();
        setEnterErrors({});

        const newErrors: EnterFormErrors = {};
        if (sessionId.length < 5) newErrors.sessionId = "Please enter a valid Session ID";
        if (enterPassword.length < 4) newErrors.password = "Password must be at least 4 characters";

        if (Object.keys(newErrors).length > 0) {
            setEnterErrors(newErrors);
            return;
        }

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
        } 
        loadSessions();
    }, []);

    return (
        <div className="min-h-screen bg-black bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:128px_128px] text-white">
            <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-black/50 backdrop-blur-md border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <Layers3 className="text-white" size={28}/>
                    <span className="text-2xl font-extrabold text-white tracking-tighter">
                        TableSync
                    </span>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 group focus:outline-none"
                    >
                        <div className="flex flex-col text-right hidden sm:flex">
                            <span className="text-sm font-bold text-zinc-200 transition-colors group-hover:text-white">
                                {currentUsername}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-zinc-800 flex items-center justify-center text-white font-bold shadow-lg transition-colors group-hover:border-blue-400">
                            {initials}
                        </div>
                    </button>

                    {showUserMenu && (
                        <>
                            <div 
                                className="fixed inset-0 z-40"
                                onClick={() => setShowUserMenu(false)}
                            ></div>
                            <div className="absolute right-0 mt-3 w-48 bg-[rgb(10,10,12)] border border-zinc-800 rounded-xl shadow-2xl z-50 flex flex-col py-2 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-2 border-b border-zinc-800/80 mb-2">
                                    <p className="text-sm font-bold text-white truncate">{currentUsername}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full text-left"
                                >
                                    <LogOut size={16}/> Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-8 flex flex-col gap-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <form
                        onSubmit={handleSessionCreation}
                        noValidate
                        className="flex flex-col gap-6 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Plus className="text-blue-500"/>
                            <h2 className="text-2xl font-bold">
                                Create Session
                            </h2>
                        </div>

                        <FieldGroup>
                            <Field data-invalid={!!createErrors.sessionName || undefined}>
                                <FieldLabel>
                                    Session Name
                                </FieldLabel>
                                <Input
                                    type="text"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    aria-invalid={!!createErrors.sessionName || undefined}
                                    required
                                    placeholder="Ex: D&D Campaign"
                                    className="bg-zinc-900/50 placeholder:text-zinc-600"
                                />
                                <FieldDescription className={createErrors.sessionName ? "text-red-500" : "text-zinc-500"}>
                                    {createErrors.sessionName || "Give your session a memorable name."}
                                </FieldDescription>
                            </Field>

                            <Field data-invalid={!!createErrors.description || undefined}>
                                <FieldLabel>
                                    Description <span className="text-zinc-500 text-xs font-normal ml-1">(Optional)</span>
                                </FieldLabel>
                                <Input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    aria-invalid={!!createErrors.description || undefined}
                                    required
                                    placeholder="Ex: A weekly adventure in the Forgotten Realms"
                                    className="bg-zinc-900/50 placeholder:text-zinc-600"
                                />
                                <FieldDescription className={createErrors.description ? "text-red-500" : "text-zinc-500"}>
                                    {createErrors.description || "Briefly describe the theme or rules."}
                                </FieldDescription>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    Password
                                </FieldLabel>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>
                                    <Input
                                        type={showCreatePassword ? "text" : "password"}
                                        value={createPassword}
                                        onChange={(e) => setCreatePassword(e.target.value)}
                                        aria-invalid={!!createErrors.password || undefined}
                                        required
                                        placeholder="Ex: *********"
                                        className="pl-10 bg-zinc-900/50 placeholder:text-zinc-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                                    >
                                        {showCreatePassword ? <EyeOff size={18}/> : <Eye aria-setsize={18}/>}
                                    </button>
                                </div>
                                <FieldDescription className={createErrors.password ? "text-red-500" : "text-zinc-500"}>
                                    {createErrors.password || "Set a password for players to join."}
                                </FieldDescription>
                            </Field>
                        </FieldGroup>

                        <Button
                            type="submit"
                            className="mt-2 w-full h-11 bg-zinc-100 text-zinc-900 font-bold transition-all duration-300 hover:bg-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Create
                        </Button>
                    </form>

                    <form
                        onSubmit={handleSessionEnter}
                        noValidate
                        className="flex flex-col gap-6 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <LogIn className="text-green-500"/>
                            <h2 className="text-2xl font-bold">
                                Enter Session
                            </h2>
                        </div>

                        <FieldGroup>
                            <Field data-invalid={!!enterErrors.sessionId || undefined}>
                                <FieldLabel>
                                    Session ID
                                </FieldLabel>
                                <Input
                                    type="text"
                                    value={sessionId}
                                    onChange={(e) => setSessionId(e.target.value)}
                                    aria-invalid={!!enterErrors.sessionId || undefined}
                                    required
                                    placeholder="Ex: 123e4567-e89b..."
                                    className="bg-zinc-900/50 placeholder:text-zinc-600"
                                />
                                <FieldDescription className={enterErrors.sessionId ? "text-red-500" : "text-zinc-500"}>
                                    {enterErrors.sessionId || "Paste the ID provided by the host."}
                                </FieldDescription>
                            </Field>

                            <Field data-invalid={!!enterErrors.password || undefined}>
                                <FieldLabel>
                                    Password
                                </FieldLabel>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>
                                    <Input
                                        type={showEnterPassword ? "text" : "password"}
                                        value={enterPassword}
                                        onChange={(e) => setEnterPassword(e.target.value)}
                                        aria-invalid={!!enterErrors.password || undefined}
                                        required
                                        placeholder="Ex: *********"
                                        className="pl-10 bg-zinc-900/50 placeholder:text-zinc-600"
                                    />
                                    <button
                                        type="button" 
                                        onClick={() => setShowEnterPassword(!showEnterPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                                    >
                                        {showEnterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div> 
                                <FieldDescription className={enterErrors.password ? "text-red-500" : "text-zinc-500"}>
                                    {enterErrors.password || "Enter the session password."}
                                </FieldDescription>                                    
                            </Field>
                        </FieldGroup>

                        <div className="flex-grow"></div>

                        <Button
                            type="submit"
                            className="mt-2 w-full h-11 bg-zinc-100 text-zinc-900 font-bold transition-all duration-300 hover:bg-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
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
                        <div className="flex flex-col items-center justify-center py-20 bg-[rgb(5,5,6)] border border-dashed border-zinc-700 rounded-xl">
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
                                    onClick={() => navigate(`/session/${session.id}`)}
                                    style={{
                                        backgroundImage: session.backgroundImageUrl 
                                            ? `linear-gradient(to bottom, rgba(5,5,6,0.8), rgba(5,5,6,0.95)), url(${session.backgroundImageUrl})` 
                                            : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                    className="group flex flex-col justify-between bg-[rgb(5,5,6)] border border-zinc-800 p-6 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:border-zinc-700 h-[200px] cursor-pointer"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-2">
                                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-1" title={session.name}>
                                                {session.name}
                                            </h3>
                                            <p className="text-xs text-zinc-400 line-clamp-2" title={session.description}>
                                                {session.description}
                                            </p>
                                        </div>
                                        
                                        <button 
                                            onClick={(e) => handleLeaveOrDeleteSession(e, session)}
                                            className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                                            title={session.masterId === currentUserId ? "Delete Session" : "Leave Session"}
                                        >
                                            {session.masterId === currentUserId ? <Trash2 size={18} /> : <LogOut size={18} />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                                        <span className="text-xs text-zinc-600 font-mono truncate mr-4">
                                            ID: {session.id.substring(0, 8)}...
                                        </span>
                                        
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(session.id);
                                            }}
                                            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
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

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="bg-[rgb(10,10,12)] border-zinc-900 text-white border">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {sessionToDelete?.masterId === currentUserId ? 'Delete Session' : 'Leave Session'}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            {sessionToDelete?.masterId === currentUserId 
                                ? `Are you sure you want to DELETE "${sessionToDelete.name}"? This will remove all characters and chat history permanently.`
                                : `Are you sure you want to EXIT "${sessionToDelete?.name}"?`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 bg-[rgb(10,10,12)]">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeleting}
                            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100
                                transition-all duration-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 text-white border-red-600 hover:bg-red-800 hover:text-red-100
                                transition-all duration-300"
                        >
                            {isDeleting ? 'Processing...' : (sessionToDelete?.masterId === currentUserId ? 'Delete' : 'Leave')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}