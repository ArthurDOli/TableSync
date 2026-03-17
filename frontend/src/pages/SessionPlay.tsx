import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Tabletop } from "../components/Tabletop";
import { PanelRightClose, PanelRightOpen, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = {
    id: number;
    username: string;
    characterName: string;
    content: string;
    messageType: 'NORMAL' | 'DICE_ROLL' | 'SYSTEM' | 'WHISPER';
    diceFormula?: string;
    rollResult?: number;
};

type Character = {
    id: string;
    name: string;
    playerName: string;
};

const TOKEN_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
];

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
    const [initialBgUrl, setInitialBgUrl] = useState('');
    const [initialBgScale, setInitialBgScale] = useState(1);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const currentUsername = localStorage.getItem('username');
    const currentUserId = Number(localStorage.getItem('userId'));

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const sessionRes = await api.get(`/sessions/${id}`);
                const isMasterUser = currentUserId === sessionRes.data.masterId;
                setIsMaster(isMasterUser);

                setInitialBgUrl(sessionRes.data.backgroundImageUrl || '');
                setInitialBgScale(sessionRes.data.backgroundImageScale || 1);

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

                const historyRes = await api.get(`/chat/history/${id}?size=50`);
                setMessages(historyRes.data.reverse());
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

        let type = 'NORMAL';
        let contentToSend = currentMessage;

        if (currentMessage.trim().toLowerCase().startsWith('/roll ')) {
            type = 'DICE_ROLL';
            contentToSend = currentMessage.trim().substring(6);
        }

        stompClient.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify({
                sessionId: id,
                characterName: myCharacterName,
                content: contentToSend,
                messageType: type
            })
        });
        setCurrentMessage('');
    }

    function getCharacterColor(charName: string) {
        if (charName === 'Master') return '#eab308';

        const index = characters.findIndex(c => c.name === charName);
        if (index === -1) return '#a1a1aa';

        return TOKEN_COLORS[index % TOKEN_COLORS.length];
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
                    initialBackground={initialBgUrl}
                    initialScale={initialBgScale}
                />

                {!showSidebar && (
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-[rgb(5,5,6)] p-3 rounded-l-xl border border-r-0
                            border-zinc-800 z-10 text-zinc-400
                            hover:bg-zinc-800
                            hover:text-white
                            shadow-[-5px_0_20px_rgba(0,0,0,0.3)]"
                    >
                        <PanelRightOpen size={24}/>
                    </button>
                )}
            </div>

            <div
                className={`flex flex-col bg-[rgb(5,5,6)] border-zinc-800 shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
                    showSidebar ? 'w-[400px] border-l opacity-100' : 'w-0 border-none opacity-0'
                }`}
            >
                <div className="w-[400px] flex flex-col h-full">
                    <div className="p-3 border-b border-zinc-800 flex justify-between items-center shrink-0">
                        <div>
                            <p className="text-xs text-zinc-500 font-medium">
                                {isMaster ? 'Playing as: Master' : `Playing as: ${myCharacterName}`}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="text-zinc-500 rounded p-1 transition-colors
                                hover:text-white
                                hover-bg-zinc-800"
                        >
                            <PanelRightClose size={20}/>
                        </button>
                    </div>

                    <div
                        ref={chatContainerRef}
                        className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 scroll-smooth"
                    >
                        {messages.map((msg, index) => {
                            if (msg.messageType === 'DICE_ROLL') {
                                return (
                                    <div
                                        key={msg.id || index}
                                        className="bg-zinc-800/90 border border-zinc-700 p-3 rounded-lg shadow-sm text-center"
                                    >
                                        <span className="font-bold text-sm text-zinc-400 flex items-center justify-center gap-1 mb-1">
                                            System
                                        </span>
                                        <p className="text-zinc-300 text-sm">
                                            <span
                                                className="font-bold"
                                                style={{ color: getCharacterColor(msg.characterName) }}
                                            >
                                                {msg.characterName}
                                            </span>
                                            {' '}roled <span className="text-blue-400 font-bold">{msg.diceFormula}</span>
                                            {' '}and resulted in <span className="text-green-400 font-bold">{msg.rollResult}</span>
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={msg.id || index}
                                    className="bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-lg shadow-sm"
                                >
                                    <span
                                        className="font-bold text-sm block mb-1 drop-shadow-sm"
                                        style={{ color: getCharacterColor(msg.characterName) }}
                                    >
                                        {msg.characterName}{' '}
                                        <span className="text-zinc-500 text-xs font-normal">
                                            ({msg.username})
                                        </span>                                        
                                    </span>

                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        {msg.content}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    <form
                        onSubmit={handleSendMessage}
                        className="p-3 bg-[rgb(5,5,6)] border-t border-zinc-800 flex gap-2 shrink-0"
                    >
                        <Input
                            type="text"
                            placeholder={isConnected ? "Type your message..." : "Connecting to chat..."}
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            disabled={!isConnected}
                            className="flex-1 bg-zinc-900/50 border-zinc-700 
                            focus-visible:ring-blue-500
                            placeholder:text-zinc-600"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!isConnected || !currentMessage.trim()}
                            className="bg-blue-600 transition-all
                            hover:bg-blue-700
                            hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        >
                            <Send size={18} className="-ml-0.5"/>
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}