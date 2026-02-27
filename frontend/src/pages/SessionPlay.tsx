import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type ChatMessage = {
    id: number;
    username: string;
    characterName: string;
    content: string;
};

export function SessionPlay() {
    const { id } = useParams();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [stompClient, setStompClient] = useState<Client | null>(null);
    
    const [isConnected, setIsConnected] = useState(false); 

    const [myCharacterName, setMyCharacterName] = useState('Unknown');
    const currentUsername = localStorage.getItem('username');

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const charResponse = await api.get(`/characters/session/${id}`);
                
                console.log("Lista de personagens retornada:", charResponse.data);
                console.log("Meu username no localStorage:", currentUsername);

                const myCharacter = charResponse.data.find(
                    (char: any) => char.playerName === currentUsername
                );

                if (myCharacter) {
                    console.log("Personagem encontrado:", myCharacter);
                    setMyCharacterName(myCharacter.name || 'Nome Indefinido'); 
                } else {
                    console.log("Nenhum personagem encontrado para este username. Você é o Mestre?");
                }

            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        }
        
        if (id && currentUsername) {
            fetchInitialData();
        }
    }, [id, currentUsername]);

    useEffect(() => {
        if (!id) return;

        const token = localStorage.getItem('token');

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected to Websocket');
                
                setIsConnected(true); 

                client.subscribe(`/topic/session/${id}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessages((prev) => [...prev, receivedMessage]);
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        client.activate();
        setStompClient(client);

        return () => {
            client.deactivate();
        };
    }, [id]);

    function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();

        if (!currentMessage.trim() || !stompClient || !isConnected) return;

        const chatRequest = {
            sessionId: id,
            characterName: myCharacterName,
            content: currentMessage,
            messageType: 'NORMAL'
        };
        
        stompClient.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(chatRequest)
        });

        setCurrentMessage('');
    }

    return (
        <div className="flex h-screen w-screen bg-zinc-900 text-white overflow-hidden">
            
            <div className="w-[70%] relative border-r border-zinc-700 flex items-center justify-center bg-zinc-950">
                <h1 className="text-4xl font-bold text-zinc-700">Tabletop Area</h1>
                
                <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-zinc-800 p-2 rounded-r-lg border border-l-0 border-zinc-600 hover:bg-zinc-700">
                    ▶
                </button>
            </div>

            <div className="w-[30%] flex flex-col bg-zinc-900">
                <div className="p-4 border-b border-zinc-800 bg-zinc-950">
                    <h2 className="text-lg font-bold text-blue-400">Session Chat</h2>
                    <p className="text-xs text-zinc-500">Playing as: {myCharacterName}</p>
                </div>

                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                    {messages.map((msg, index) => (
                        <div key={msg.id || index} className="bg-zinc-800 p-3 rounded-lg">
                            <span className="font-bold text-green-400 text-sm block mb-1">
                                {msg.characterName} <span className="text-zinc-500 text-xs font-normal">({msg.username})</span>
                            </span>
                            <p className="text-zinc-200">{msg.content}</p>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-2">
                    <input 
                        type="text" 
                        placeholder={isConnected ? "Type a message or roll a dice (1d20)..." : "Connecting to chat..."}
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        className="flex-1 p-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        disabled={!isConnected}
                    />
                    <button 
                        type="submit"
                        disabled={!isConnected}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold transition-colors disabled:opacity-50"
                    >
                        Send
                    </button>
                </form>
            </div>

        </div>
    );
}