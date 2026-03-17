import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Tabletop } from "../components/Tabletop";

type ChatMessage = {
    id: number;
    username: string;
    characterName: string;
    content: string;
};

type Character = {
    id: string;
    name: string;
    playerName: string;
};

export function SessionPlay() {
    const { id } = useParams();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [myCharacterName, setMyCharacterName] = useState('Master');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isMaster, setIsMaster] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    const currentUsername = localStorage.getItem('username');
    const currentUserId = Number(localStorage.getItem('userId'));

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const sessionRes = await api.get(`/sessions/${id}`);
                const isMasterUser = currentUserId === sessionRes.data.masterId;
                setIsMaster(isMasterUser);

                if (isMasterUser) {
                    setMyCharacterName('Master');
                } else {
                    setMyCharacterName('Loading...');
                }

                const charResponse = await api.get(`/characters/session/${id}`);
                setCharacters(charResponse.data);

                const myCharacter = charResponse.data.find(
                    (char: Character) => char.playerName === currentUsername
                );
                if (myCharacter) {
                    setMyCharacterName(myCharacter.name);
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        }

        if (id && currentUsername) fetchInitialData();
    }, [id, currentUsername, currentUserId]);

    useEffect(() => {
        if (!id) return;
        const token = localStorage.getItem('token');

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                setIsConnected(true);
                client.subscribe(`/topic/session/${id}`, (message) => {
                    const received = JSON.parse(message.body);
                    setMessages(prev => [...prev, received]);
                });
            },
            onDisconnect: () => setIsConnected(false),
        });

        client.activate();
        setStompClient(client);
        return () => { client.deactivate(); };
    }, [id]);

    function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!currentMessage.trim() || !stompClient || !isConnected) return;

        stompClient.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify({
                sessionId: id,
                characterName: myCharacterName,
                content: currentMessage,
                messageType: 'NORMAL'
            })
        });
        setCurrentMessage('');
    }

    return (
        <div className="flex h-screen w-screen bg-zinc-900 text-white overflow-hidden">

            <div className="flex-1 relative flex flex-col overflow-hidden">
                <Tabletop
                    sessionId={id!}
                    isMaster={isMaster}
                    characters={characters}
                    stompClient={stompClient}
                    isConnected={isConnected}
                />

                {!showSidebar && (
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-800 p-2 rounded-l-lg border border-r-0 border-zinc-600 hover:bg-zinc-700 z-10"
                    >
                        ◀
                    </button>
                )}
            </div>

            {showSidebar && (
                <div className="w-[300px] flex flex-col bg-zinc-900 border-l border-zinc-700 shrink-0">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-blue-400">Session Chat</h2>
                            <p className="text-xs text-zinc-500">
                                {isMaster ? 'Master' : `Playing as: ${myCharacterName}`}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="text-zinc-500 hover:text-white text-sm"
                        >
                            ▶
                        </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                        {messages.map((msg, index) => (
                            <div key={msg.id || index} className="bg-zinc-800 p-3 rounded-lg">
                                <span className="font-bold text-green-400 text-sm block mb-1">
                                    {msg.characterName}{' '}
                                    <span className="text-zinc-500 text-xs font-normal">({msg.username})</span>
                                </span>
                                <p className="text-zinc-200">{msg.content}</p>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-2">
                        <input
                            type="text"
                            placeholder={isConnected ? "Type a message..." : "Connecting..."}
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            className="flex-1 p-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                            disabled={!isConnected}
                        />
                        <button
                            type="submit"
                            disabled={!isConnected}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded font-bold transition-colors disabled:opacity-50 text-sm"
                        >
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}