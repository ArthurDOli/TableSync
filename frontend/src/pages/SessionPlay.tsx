import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Tabletop } from "../components/Tabletop";
import {
    PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen,
    Send, Save, ScrollText, ArrowLeft, Pencil, Plus, Trash2, Check, X, ImageIcon, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ChatMessage = {
    id: number;
    username: string;
    characterName: string;
    content: string;
    messageType: 'NORMAL' | 'DICE_ROLL' | 'SYSTEM';
    diceFormula?: string;
    rollResult?: number;
};

type Character = {
    id: string;
    name: string;
    playerName: string;
    tokenX?: number;
    tokenY?: number;
    imageUrl?: string;
    imageScale?: number;
    imageOffsetX?: number;
    imageOffsetY?: number;
    sheetData?: Record<string, unknown>;
};

type NpcToken = {
    id: string;
    name: string;
    x: number;
    y: number;
    imageUrl: string;
    imageScale: number;
};

type Template = {
    id: string;
    name: string;
    schema: Record<string, string>;
};

const TOKEN_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
];

export function SessionPlay() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [myCharacterName, setMyCharacterName] = useState('Master');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isMaster, setIsMaster] = useState(false);
    const [initialBgUrl, setInitialBgUrl] = useState('');
    const [initialBgScale, setInitialBgScale] = useState(1);
    const [initialNpcTokens, setInitialNpcTokens] = useState<NpcToken[]>([]);

    const [showCharSheet, setShowCharSheet] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);

    const [myCharacterId, setMyCharacterId] = useState<string | null>(null);
    const [myCharacterImageUrl, setMyCharacterImageUrl] = useState('');
    const [charSheetData, setCharSheetData] = useState<Record<string, string>>({});
    const [originalSheetData, setOriginalSheetData] = useState<Record<string, string>>({});
    const [isSavingSheet, setIsSavingSheet] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    const [editingPhoto, setEditingPhoto] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');

    const [template, setTemplate] = useState<Template | null>(null);

    const [templateEditMode, setTemplateEditMode] = useState(false);
    const [editFields, setEditFields] = useState<string[]>([]);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [templateSaveStatus, setTemplateSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    const [originalEditFields, setOriginalEditFields] = useState<string[]>([]);

    const currentUsername = localStorage.getItem('username');
    const currentUserId = Number(localStorage.getItem('userId'));

    const hasSheetChanges = JSON.stringify(charSheetData) !== JSON.stringify(originalSheetData);
    const hasTemplateChanges = JSON.stringify(editFields) !== JSON.stringify(originalEditFields);

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

                try {
                    const npcJson = sessionRes.data.npcTokensJson;
                    if (npcJson) setInitialNpcTokens(JSON.parse(npcJson));
                } catch {
                    setInitialNpcTokens([]);
                }

                if (isMasterUser) {
                    setMyCharacterName('Master');
                    const templateRes = await api.get(`/templates/session/${id}`);
                    if (templateRes.data && templateRes.data.length > 0) {
                        setTemplate(templateRes.data[0]);
                    }
                } else {
                    setMyCharacterName('Loading...');
                }

                const charResponse = await api.get(`/characters/session/${id}`);
                setCharacters(charResponse.data);

                const myCharacter: Character | undefined = charResponse.data.find(
                    (char: Character) => char.playerName === currentUsername
                );

                if (myCharacter) {
                    setMyCharacterName(myCharacter.name);
                    setMyCharacterId(myCharacter.id);
                    setMyCharacterImageUrl(myCharacter.imageUrl ?? '');

                    const rawSheet = myCharacter.sheetData ?? {};
                    const stringSheet: Record<string, string> = {};
                    Object.keys(rawSheet).forEach(key => {
                        stringSheet[key] = String(rawSheet[key] ?? '');
                    });
                    setCharSheetData(stringSheet);
                    setOriginalSheetData(stringSheet);
                }

                const historyRes = await api.get(`/chat/history/${id}?size=50`);
                setMessages(historyRes.data.reverse());
            } catch (error) {
                console.error("Error fetching initial data:", error);
                navigate('/dashboard');
            }
        }

        if (id && currentUsername) fetchInitialData();
    }, [id, currentUsername, currentUserId, navigate]);

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

    async function handleCharacterJoined() {
        try {
            const charResponse = await api.get(`/characters/session/${id}`);
            setCharacters(charResponse.data);
        } catch (error) {
            console.error("Error refreshing characters:", error);
        }
    }

    function handleTemplateUpdated(newSchema: Record<string, string>) {
        setTemplate(prev => prev ? { ...prev, schema: newSchema } : prev);

        if (!isMaster) {
            setCharSheetData(prev => {
                const updated: Record<string, string> = {};
                Object.keys(newSchema).forEach(key => {
                    updated[key] = prev[key] ?? '';
                });
                return updated;
            });
            setOriginalSheetData(prev => {
                const updated: Record<string, string> = {};
                Object.keys(newSchema).forEach(key => {
                    updated[key] = prev[key] ?? '';
                });
                return updated;
            });
        }
    }

    async function handleSaveSheet() {
        if (!myCharacterId || !hasSheetChanges) return;
        setIsSavingSheet(true);
        setSaveStatus('idle');
        try {
            await api.patch(`/characters/${myCharacterId}`, { sheetData: charSheetData });
            setOriginalSheetData({ ...charSheetData });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Error saving sheet:", error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 2500);
        } finally {
            setIsSavingSheet(false);
        }
    }

    function handleSheetFieldChange(key: string, value: string) {
        setCharSheetData(prev => ({ ...prev, [key]: value }));
    }

    async function handleSavePhoto() {
        if (!myCharacterId) return;

        try {
            await api.patch(`/characters/${myCharacterId}`, { imageUrl: newPhotoUrl.trim() });
            
            setMyCharacterImageUrl(newPhotoUrl.trim());
            setEditingPhoto(false);
            
            if (stompClient && isConnected) {
                stompClient.publish({
                    destination: '/app/tabletop.update',
                    body: JSON.stringify({
                        sessionId: id,
                        type: 'CHARACTER_IMAGE_UPDATED',
                        characterId: myCharacterId,
                        imageUrl: newPhotoUrl.trim(),
                    }),
                });
            }
            setNewPhotoUrl('');
        } catch (error) {
            console.error("Error saving photo: ", error);
        }

        try {
            await api.patch(`/characters/${myCharacterId}`, { imageUrl: newPhotoUrl.trim() });
            setMyCharacterImageUrl(newPhotoUrl.trim());
            setEditingPhoto(false);
            setNewPhotoUrl('');
        } catch (error) {
            console.error("Error saving photo:", error);
        }
    }

    function startTemplateEdit() {
        if (!template) return;
        setEditFields(Object.keys(template.schema));
        setOriginalEditFields(Object.keys(template.schema));
        setTemplateEditMode(true);
    }

    function cancelTemplateEdit() {
        setTemplateEditMode(false);
        setEditFields([]);
        setOriginalEditFields([]);
    }

    async function saveTemplateEdit() {
        if (!template) return;

        const validFields = editFields.filter(f => f.trim() !== '');
        if (validFields.length === 0) return;

        setIsSavingTemplate(true);
        const newSchema: Record<string, string> = {};
        validFields.forEach(f => { newSchema[f.trim()] = ''; });

        try {
            await api.put(`/templates/${template.id}`, { name: template.name, schema: newSchema });
            setTemplate(prev => prev ? { ...prev, schema: newSchema } : prev);
            setTemplateEditMode(false);
            setTemplateSaveStatus('saved');

            if (stompClient && isConnected) {
                stompClient.publish({
                    destination: '/app/tabletop.update',
                    body: JSON.stringify({
                        sessionId: id,
                        type: 'TEMPLATE_UPDATED',
                        schemaJson: JSON.stringify(newSchema),
                    }),
                });
            }

            setTimeout(() => setTemplateSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Error saving template:", error);
            setTemplateSaveStatus('error');
            setTimeout(() => setTemplateSaveStatus('idle'), 2500);
        } finally {
            setIsSavingTemplate(false);
        }
    }

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
                messageType: type,
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

    const saveButtonLabel = isSavingSheet
        ? 'Saving...'
        : saveStatus === 'saved'
        ? 'Saved!'
        : saveStatus === 'error'
        ? 'Error!'
        : 'Save';

    const saveButtonClass = saveStatus === 'saved'
        ? 'bg-emerald-600 hover:bg-emerald-600'
        : saveStatus === 'error'
        ? 'bg-red-600 hover:bg-red-600'
        : hasSheetChanges
        ? 'bg-emerald-700 hover:bg-emerald-600 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)]'
        : 'bg-zinc-700 opacity-50 cursor-not-allowed';

    return (
        <div className="flex h-screen w-screen bg-zinc-900 text-white overflow-hidden">

            <div className={`flex flex-col bg-[rgb(5,5,6)] border-zinc-800 shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${showCharSheet ? 'w-[380px] border-r opacity-100' : 'w-0 border-none opacity-0'}`}>
                <div className="w-[380px] flex flex-col h-full">

                    <div className="p-3 border-b border-zinc-800 flex items-center shrink-0">
                        <div className="flex items-center gap-2 justify-center w-full">
                            <ScrollText size={14} className="text-zinc-500" />
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                                {isMaster ? 'Template' : 'Character Sheet'}
                            </p>
                        </div>

                        {!isMaster ? (
                            <Button
                                onClick={handleSaveSheet}
                                disabled={isSavingSheet || !hasSheetChanges}
                                size="sm"
                                className={`h-7 px-3 text-xs font-bold text-white transition-all ${saveButtonClass}`}
                            >
                                <Save size={13} className="mr-1" />
                                {saveButtonLabel}
                            </Button>
                        ) : (
                            !templateEditMode ? (
                                <Button
                                    onClick={startTemplateEdit}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-3 text-xs border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800"
                                >
                                    <Pencil size={12} className="mr-1" /> Edit
                                </Button>
                            ) : (
                                <div className="flex gap-1">
                                    <Button
                                        onClick={saveTemplateEdit}
                                        disabled={isSavingTemplate || !hasTemplateChanges}
                                        size="sm"
                                        className="h-7 px-2 text-xs bg-emerald-700 hover:bg-emerald-600 text-white"
                                    >
                                        <Check size={12} className="mr-1" />
                                        {templateSaveStatus === 'saved' ? 'Saved!' : 'Save'}
                                    </Button>
                                    <Button
                                        onClick={cancelTemplateEdit}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs text-zinc-400 hover:text-white"
                                    >
                                        <X size={12} />
                                    </Button>
                                </div>
                            )
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth">

                        {!isMaster && (
                            <>
                                <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                                    <div className="relative group w-12 h-12 shrink-0">
                                        <div className="w-12 h-12 rounded-full border-2 border-zinc-700 overflow-hidden bg-zinc-800 flex items-center justify-center">
                                            {myCharacterImageUrl ? (
                                                <img src={myCharacterImageUrl} alt={myCharacterName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-black text-zinc-600 select-none">
                                                    {myCharacterName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => { setEditingPhoto(true); setNewPhotoUrl(myCharacterImageUrl); }}
                                            className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ImageIcon size={14} className="text-white" />
                                        </button>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-zinc-100 truncate">{myCharacterName || '—'}</p>
                                        <p className="text-xs text-zinc-500 truncate">{currentUsername}</p>
                                    </div>
                                </div>

                                {editingPhoto && (
                                    <div className="flex flex-col gap-2 p-3 bg-zinc-900/50 border border-zinc-700 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Update Avatar</p>
                                        <Input
                                            type="text"
                                            placeholder="https://..."
                                            value={newPhotoUrl}
                                            onChange={e => setNewPhotoUrl(e.target.value)}
                                            className="h-8 text-sm bg-zinc-900 border-zinc-700"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSavePhoto}
                                                size="sm"
                                                className="flex-1 h-7 text-xs bg-blue-700 hover:bg-blue-600 text-white"
                                            >
                                                <Check size={12} className="mr-1" /> Apply
                                            </Button>
                                            <Button
                                                onClick={() => { setEditingPhoto(false); setNewPhotoUrl(''); }}
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-xs text-zinc-400 hover:text-white"
                                            >
                                                <X size={12} />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {Object.keys(charSheetData).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center flex-1 text-center text-zinc-600 gap-2 py-8">
                                        <ScrollText size={32} className="opacity-30" />
                                        <p className="text-sm">No sheet data available.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {Object.keys(charSheetData).map(key => (
                                            <div key={key} className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">{key}</label>
                                                <Input
                                                    type="text"
                                                    value={charSheetData[key]}
                                                    onChange={e => handleSheetFieldChange(key, e.target.value)}
                                                    className="h-9 bg-zinc-900/60 border-zinc-800 text-zinc-200 text-sm focus-visible:ring-emerald-600 focus-visible:border-emerald-700/50"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {isMaster && (
                            <>
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Template Name</p>
                                    <p className="text-sm font-bold text-zinc-100">{template?.name ?? '—'}</p>
                                </div>

                                {!templateEditMode && (
                                    !template || Object.keys(template.schema).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center flex-1 text-center text-zinc-600 gap-2 py-8">
                                            <ScrollText size={32} className="opacity-30" />
                                            <p className="text-sm">No template fields defined.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Fields</p>
                                            {Object.keys(template.schema).map((key, index) => (
                                                <div key={key} className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/80 rounded-lg px-3 py-2">
                                                    <span className="text-[10px] text-zinc-600 font-mono w-5 text-right shrink-0">{index + 1}</span>
                                                    <span className="text-sm text-zinc-300 font-medium">{key}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}

                                {templateEditMode && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Edit Fields</p>

                                        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
                                            {editFields.map((field, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <Input
                                                        type="text"
                                                        placeholder="Field name..."
                                                        value={field}
                                                        onChange={e => {
                                                            const next = [...editFields];
                                                            next[index] = e.target.value;
                                                            setEditFields(next);
                                                        }}
                                                        className="flex-1 h-9 bg-zinc-900/50 border-zinc-700 text-zinc-200 text-sm"
                                                    />
                                                    {editFields.length > 1 && (
                                                        <button
                                                            onClick={() => setEditFields(prev => prev.filter((_, i) => i !== index))}
                                                            className="text-zinc-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={() => setEditFields(prev => [...prev, ''])}
                                            variant="outline"
                                            size="sm"
                                            className="border-dashed border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800"
                                        >
                                            <Plus size={13} className="mr-1" /> Add Field
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex flex-col overflow-hidden">
                <Tabletop
                    sessionId={id!}
                    isMaster={isMaster}
                    characters={characters}
                    stompClient={stompClient}
                    isConnected={isConnected}
                    initialBackground={initialBgUrl}
                    initialScale={initialBgScale}
                    initialNpcTokens={initialNpcTokens}
                    onCharacterJoined={handleCharacterJoined}
                    onTemplateUpdated={handleTemplateUpdated}
                />

                <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-[rgb(5,5,6)] p-1.5 rounded-xl border border-zinc-800 shadow-xl">
                    <button
                        onClick={() => navigate('/dashboard')}
                        title="Back to Dashboard"
                        className="text-red-500 rounded-lg p-2 border border-red-800 bg-zinc-900/50 transition-colors hover:bg-red-800 hover:text-white shrink-0 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                    >
                        <ArrowLeft size={14} />
                    </button>
                    <div className="w-px h-5 bg-zinc-800" />
                    <button
                        onClick={() => setShowCharSheet(prev => !prev)}
                        title={showCharSheet ? 'Close character sheet' : 'Open character sheet'}
                        className="text-zinc-400 rounded-lg p-2 transition-colors hover:bg-zinc-800 hover:text-white border-zinc-800 border"
                    >
                        {showCharSheet ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                    </button>
                </div>

                {!showSidebar && (
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="absolute right-0 top-10 -translate-y-1/2 bg-[rgb(5,5,6)] p-2 rounded-l-lg border border-r-0 border-zinc-800 z-10 text-zinc-400 hover:bg-zinc-800 hover:text-white shadow-[-5px_0_20px_rgba(0,0,0,0.3)]"
                    >
                        <PanelRightOpen size={24} />
                    </button>
                )}
            </div>

            <div className={`flex flex-col bg-[rgb(5,5,6)] border-zinc-800 shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${showSidebar ? 'w-[400px] border-l opacity-100' : 'w-0 border-none opacity-0'}`}>
                <div className="w-[400px] flex flex-col h-full">
                    <div className="p-3 border-b border-zinc-800 flex justify-between items-center shrink-0">
                        <div>
                            <p className="text-xs text-zinc-500 font-medium">
                                {isMaster ? 'Playing as: Master' : `Playing as: ${myCharacterName}`}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="text-zinc-500 rounded p-1 transition-colors hover:text-white"
                        >
                            <PanelRightClose size={20} />
                        </button>
                    </div>

                    <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 scroll-smooth">
                        {messages.map((msg, index) => {
                            if (msg.messageType === 'DICE_ROLL') {
                                return (
                                    <div key={msg.id || index} className="bg-zinc-800/90 border border-zinc-700 p-3 rounded-lg shadow-sm text-center">
                                        <span className="font-bold text-sm text-zinc-400 flex items-center justify-center gap-1 mb-1">System</span>
                                        <p className="text-zinc-300 text-sm">
                                            <span className="font-bold" style={{ color: getCharacterColor(msg.characterName) }}>{msg.characterName}</span>
                                            {' '}roled <span className="text-blue-400 font-bold">{msg.diceFormula}</span>
                                            {' '}and resulted in <span className="text-green-400 font-bold">{msg.rollResult}</span>
                                        </p>
                                    </div>
                                );
                            }
                            return (
                                <div key={msg.id || index} className="bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-lg shadow-sm">
                                    <span className="font-bold text-sm block mb-1 drop-shadow-sm" style={{ color: getCharacterColor(msg.characterName) }}>
                                        {msg.characterName}{' '}
                                        <span className="text-zinc-500 text-xs font-normal">({msg.username})</span>
                                    </span>
                                    <p className="text-zinc-300 text-sm leading-relaxed">{msg.content}</p>
                                </div>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 bg-[rgb(5,5,6)] border-t border-zinc-800 flex gap-2 shrink-0">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        type="button"
                                        className="shrink-0 text-zinc-600 transition-colors
                                            hover:text-zinc-400"
                                    >
                                        <Info size={16}/>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[600px] text-xs text-center flex flex-col gap-1">
                                    Use <span className="font-mono text-blue-400">/roll 2d20</span> to roll dice.<br/>
                                    Format: <span className="font-mono text-zinc-300">NdN+N</span>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Input
                            type="text"
                            placeholder={isConnected ? "Type your message..." : "Connecting to chat..."}
                            value={currentMessage}
                            onChange={e => setCurrentMessage(e.target.value)}
                            disabled={!isConnected}
                            className="flex-1 bg-zinc-900/50 border-zinc-700 focus-visible:ring-blue-500 placeholder:text-zinc-600"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!isConnected || !currentMessage.trim()}
                            className="bg-blue-600 transition-all hover:bg-blue-700 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        >
                            <Send size={18} className="-ml-0.5" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}