import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

type SessionDetails = {
    id: string;
    name: string;
    masterId: number;
    totalTemplates: number;
};

type Character = {
    id: string;
    playerName: string;
};

export function Session() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const currentUserId = Number(localStorage.getItem('userId'));
    const currentUsername = localStorage.getItem('username');

    useEffect(() => {
        async function routeUser() {
            try {
                const sessionRes = await api.get(`/sessions/${id}`);
                const session: SessionDetails = sessionRes.data;

                const isMaster = currentUserId === session.masterId;
                const hasTemplate = session.totalTemplates > 0;

                if (isMaster) {
                    if (!hasTemplate) {
                        navigate(`/session/${id}/edit`, { replace: true });
                    } else {
                        navigate(`/session/${id}/play`, { replace: true});
                    }
                    return;
                }

                if (!hasTemplate) {
                    navigate(`/session/${id}/create`, { replace: true })
                    return;
                }

                const charsRes = await api.get(`/characters/session/${id}`);
                const characters: Character[] = charsRes.data;

                const myCharacter = characters.find(c => c.playerName === currentUsername);

                if (!myCharacter) {
                    navigate(`/session/${id}/create`, { replace: true });
                } else {
                    navigate(`/session/${id}/play`, { replace: true });
                }
            } catch (error) {
                console.log("Error loading session", error);
                setError("Session not found or you don't have access to it");
            }
        }
        routeUser();
    }, [id, navigate, currentUserId, currentUsername]);

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-zinc-900 text-white">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{error}</h2>
                <button 
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 font-bold">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center h-screen bg-zinc-900 text-white">
            <h1 className="text-xl font-bold animate-pulse">Loading Table...</h1>
        </div>
    );
}