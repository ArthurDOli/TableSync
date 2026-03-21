import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Circle, Text, Image as KonvaImage, Group } from "react-konva";
import { Client } from "@stomp/stompjs";
import useImage from "use-image";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ImageIcon, X, ChevronDown, ChevronUp, Plus, Trash2, Skull } from "lucide-react";
import { api } from "@/services/api";

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
};

type NpcToken = {
    id: string;
    name: string;
    x: number;
    y: number;
    imageUrl: string;
    imageScale: number;
};

type TokenState = {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    imageUrl: string;
    imageScale: number;
    imageOffsetX: number;
    imageOffsetY: number;
};

type TabletopMessage = {
    sessionId: string;
    type: string;
    characterId?: string;
    x?: number;
    y?: number;
    imageUrl?: string;
    senderUsername?: string;
    imageScale?: number;
    npcId?: string;
    npcName?: string;
    schemaJson?: string;
};

interface TabletopProps {
    sessionId: string;
    isMaster: boolean;
    characters: Character[];
    stompClient: Client | null;
    isConnected: boolean;
    initialBackground: string;
    initialScale: number;
    initialNpcTokens: NpcToken[];
    onCharacterJoined: () => void;
    onCharacterLeft?: (characterId: string) => void;
    onTemplateUpdated?: (schema: Record<string, string>) => void;
}

const TOKEN_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
];

function BackgroundImage({ url, scale }: { url: string; scale: number }) {
    const [image] = useImage(url, 'anonymous');
    if (!image) return null;
    return <KonvaImage image={image} x={0} y={0} scaleX={scale} scaleY={scale} />;
}

function TokenImage({ url, offsetX, offsetY, scale, radius }: {
    url: string; offsetX: number; offsetY: number; scale: number; radius: number;
}) {
    const [image] = useImage(url, 'anonymous');
    if (!image || !image.width || !image.height) return null;

    const diameter = radius * 2;
    const coverScale = Math.max(diameter / image.width, diameter / image.height) * scale;
    const finalW = image.width * coverScale;
    const finalH = image.height * coverScale;
    const imgX = -radius + (offsetX / 100) * (diameter - finalW);
    const imgY = -radius + (offsetY / 100) * (diameter - finalH);

    return <KonvaImage image={image} x={imgX} y={imgY} width={finalW} height={finalH} listening={false} />;
}

function NpcImage({ url, radius }: { url: string; radius: number }) {
    const [image] = useImage(url, 'anonymous');
    if (!image || !image.width || !image.height) return null;

    const diameter = radius * 2;
    const coverScale = Math.max(diameter / image.width, diameter / image.height);
    const finalW = image.width * coverScale;
    const finalH = image.height * coverScale;
    const imgX = -radius + (diameter - finalW) / 2;
    const imgY = -radius + (diameter - finalH) / 2;

    return <KonvaImage image={image} x={imgX} y={imgY} width={finalW} height={finalH} listening={false} />;
}

export function Tabletop({
    sessionId,
    isMaster,
    characters,
    stompClient,
    isConnected,
    initialBackground,
    initialScale,
    initialNpcTokens,
    onCharacterJoined,
    onCharacterLeft,
    onTemplateUpdated,
}: TabletopProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [stageScale, setStageScale] = useState(1);
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

    const [backgroundUrl, setBackgroundUrl] = useState('');
    const [bgImageScale, setBgImageScale] = useState(initialScale);
    const [inputUrl, setInputUrl] = useState('');

    const [tokens, setTokens] = useState<TokenState[]>([]);

    const [npcTokens, setNpcTokens] = useState<NpcToken[]>(initialNpcTokens ?? []);
    const [npcPanelOpen, setNpcPanelOpen] = useState(false);
    const [newNpcName, setNewNpcName] = useState('');
    const [newNpcImageUrl, setNewNpcImageUrl] = useState('');
    const [newNpcScale, setNewNpcScale] = useState(1);

    useEffect(() => {
        if (initialBackground) setBackgroundUrl(initialBackground);
    }, [initialBackground]);

    useEffect(() => {
        setBgImageScale(initialScale);
    }, [initialScale]);

    useEffect(() => {
        if (initialNpcTokens && initialNpcTokens.length > 0) {
            setNpcTokens(initialNpcTokens);
        }
    }, [initialNpcTokens]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const ro = new ResizeObserver(() => {
            if (containerRef.current) {
                setStageSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        });
        ro.observe(container);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (characters.length === 0) return;
        setTokens(characters.map((char, index) => ({
            id: char.id,
            name: char.name,
            x: char.tokenX ?? (80 + (index % 5) * 120),
            y: char.tokenY ?? (80 + Math.floor(index / 5) * 120),
            color: TOKEN_COLORS[index % TOKEN_COLORS.length],
            imageUrl: char.imageUrl ?? '',
            imageScale: char.imageScale ?? 1,
            imageOffsetX: char.imageOffsetX ?? 50,
            imageOffsetY: char.imageOffsetY ?? 50,
        })));
    }, [characters]);

    useEffect(() => {
        if (!stompClient || !isConnected) return;

        const sub = stompClient.subscribe(
            `/topic/tabletop/${sessionId}`,
            (message) => {
                const data: TabletopMessage = JSON.parse(message.body);

                if (data.type === 'TOKEN_MOVE' && data.characterId && data.x !== undefined && data.y !== undefined) {
                    setTokens(prev => prev.map(t =>
                        t.id === data.characterId ? { ...t, x: data.x!, y: data.y! } : t
                    ));
                }

                if (data.type === 'BACKGROUND_UPDATE' && data.imageUrl !== undefined) {
                    setBackgroundUrl(data.imageUrl);
                    if (data.imageScale !== undefined) setBgImageScale(data.imageScale);
                }

                if (data.type === 'CHARACTER_JOINED') {
                    onCharacterJoined();
                }

                if (data.type === 'CHARACTER_LEFT' && data.characterId) {
                    setTokens(prev => prev.filter(t => t.id !== data.characterId));
                    onCharacterLeft?.(data.characterId);
                }

                if (data.type === 'NPC_TOKEN_ADD' && data.npcId) {
                    setNpcTokens(prev => {
                        if (prev.find(n => n.id === data.npcId)) return prev;
                        return [...prev, {
                            id: data.npcId!,
                            name: data.npcName || 'NPC',
                            x: data.x ?? 200,
                            y: data.y ?? 200,
                            imageUrl: data.imageUrl ?? '',
                            imageScale: data.imageScale ?? 1,
                        }];
                    });
                }

                if (data.type === 'NPC_TOKEN_REMOVE' && data.npcId) {
                    setNpcTokens(prev => prev.filter(n => n.id !== data.npcId));
                }

                if (data.type === 'NPC_TOKEN_MOVE' && data.npcId && data.x !== undefined && data.y !== undefined) {
                    setNpcTokens(prev => prev.map(n =>
                        n.id === data.npcId ? { ...n, x: data.x!, y: data.y! } : n
                    ));
                }

                if (data.type === 'NPC_TOKEN_SCALE' && data.npcId && data.imageScale !== undefined) {
                    setNpcTokens(prev => prev.map(n =>
                        n.id === data.npcId ? { ...n, imageScale: data.imageScale! } : n
                    ));
                }

                if (data.type === 'TEMPLATE_UPDATED' && data.schemaJson && onTemplateUpdated) {
                    try {
                        const parsed = JSON.parse(data.schemaJson);
                        onTemplateUpdated(parsed);
                    } catch {
                        // ignore malformed payload
                    }
                }

                if (data.type === 'CHARACTER_IMAGE_UPDATED' && data.characterId && data.imageUrl !== undefined) {
                    setTokens(prev => prev.map(t =>
                        t.id === data.characterId ? { ...t, imageUrl: data.imageUrl! } : t
                    ));
                }
            }
        );

        return () => sub.unsubscribe();
    }, [stompClient, isConnected, sessionId, onCharacterJoined, onCharacterLeft, onTemplateUpdated]);

    function saveNpcTokensToApi(updatedTokens: NpcToken[]) {
        api.patch(`/sessions/${sessionId}/npc-tokens`, {
            npcTokensJson: JSON.stringify(updatedTokens),
        }).catch(err => console.error('Error saving NPC tokens', err));
    }

    async function handleTokenDragEnd(tokenId: string, x: number, y: number) {
        setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, x, y } : t));

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({ sessionId, type: 'TOKEN_MOVE', characterId: tokenId, x, y }),
            });
        }

        try {
            await api.patch(`/characters/${tokenId}`, { tokenX: x, tokenY: y });
        } catch (error) {
            console.error("Error saving token position", error);
        }
    }

    function handleNpcDragEnd(npcId: string, x: number, y: number) {
        if (!isMaster) return;

        const updated = npcTokens.map(n => n.id === npcId ? { ...n, x, y } : n);
        setNpcTokens(updated);

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({ sessionId, type: 'NPC_TOKEN_MOVE', npcId, x, y }),
            });
        }

        saveNpcTokensToApi(updated);
    }

    async function handleSetBackground() {
        const finalUrl = inputUrl.trim() !== '' ? inputUrl : backgroundUrl;
        setBackgroundUrl(finalUrl);

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({ sessionId, type: 'BACKGROUND_UPDATE', imageUrl: finalUrl, imageScale: bgImageScale }),
            });
        }

        try {
            await api.patch(`/sessions/${sessionId}/background?url=${encodeURIComponent(finalUrl)}&scale=${bgImageScale}`);
        } catch (error) {
            console.error("Error saving background", error);
        }

        setInputUrl('');
    }

    async function handleClearBackground() {
        setBackgroundUrl('');

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({ sessionId, type: 'BACKGROUND_UPDATE', imageUrl: '' }),
            });
        }

        try {
            await api.patch(`/sessions/${sessionId}/background?url=`);
        } catch (error) {
            console.error("Error clearing background", error);
        }
    }

    function handleAddNpc() {
        if (!newNpcName.trim()) return;

        const npcId = crypto.randomUUID();
        const npc: NpcToken = {
            id: npcId,
            name: newNpcName.trim(),
            x: 300,
            y: 300,
            imageUrl: newNpcImageUrl.trim(),
            imageScale: newNpcScale,
        };

        const updated = [...npcTokens, npc];
        setNpcTokens(updated);

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({
                    sessionId,
                    type: 'NPC_TOKEN_ADD',
                    npcId,
                    npcName: npc.name,
                    x: npc.x,
                    y: npc.y,
                    imageUrl: npc.imageUrl,
                    imageScale: npc.imageScale,
                }),
            });
        }

        saveNpcTokensToApi(updated);
        setNewNpcName('');
        setNewNpcImageUrl('');
        setNewNpcScale(1);
    }

    function handleRemoveNpc(npcId: string) {
        const updated = npcTokens.filter(n => n.id !== npcId);
        setNpcTokens(updated);

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({ sessionId, type: 'NPC_TOKEN_REMOVE', npcId }),
            });
        }

        saveNpcTokensToApi(updated);
    }

    function handleNpcScaleChange(npcId: string, newScale: number) {
        const updated = npcTokens.map(n => n.id === npcId ? { ...n, imageScale: newScale } : n);
        setNpcTokens(updated);

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({ sessionId, type: 'NPC_TOKEN_SCALE', npcId, imageScale: newScale }),
            });
        }

        saveNpcTokensToApi(updated);
    }

    function handleWheel(e: any) {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        setStageScale(newScale);
        setStagePosition({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    }

    return (
        <div className="w-full h-full flex flex-col relative">

            {isMaster && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[rgb(5,5,6)] p-3 rounded-xl border border-zinc-800 shadow-xl backdrop-blur-sm">
                    <ImageIcon size={18} className="text-zinc-400" />
                    <Input
                        type="text"
                        placeholder="Image URL..."
                        value={inputUrl}
                        onChange={e => setInputUrl(e.target.value)}
                        className="w-64 h-8 bg-zinc-900/50 border-zinc-700 text-sm"
                    />
                    <div className="flex items-center gap-2 px-2 border-l border-zinc-700">
                        <span className="text-xs text-zinc-500 font-bold">Size:</span>
                        <Input
                            type="number"
                            step="0.1"
                            value={bgImageScale}
                            onChange={e => {
                                const s = Number(e.target.value);
                                setBgImageScale(s);
                                if (stompClient && isConnected && backgroundUrl) {
                                    stompClient.publish({
                                        destination: '/app/tabletop.update',
                                        body: JSON.stringify({ sessionId, type: 'BACKGROUND_UPDATE', imageUrl: backgroundUrl, imageScale: s }),
                                    });
                                }
                                if (backgroundUrl) {
                                    api.patch(`/sessions/${sessionId}/background?url=${encodeURIComponent(backgroundUrl)}&scale=${s}`)
                                        .catch(() => {});
                                }
                            }}
                            className="w-16 h-8 bg-zinc-900/50 border-zinc-700 text-sm"
                        />
                    </div>
                    <Button onClick={handleSetBackground} size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">Apply</Button>
                    {backgroundUrl && (
                        <Button onClick={handleClearBackground} size="icon" variant="destructive" className="h-8 w-8">
                            <X size={16} />
                        </Button>
                    )}
                </div>
            )}

            {isMaster && (
                <div className="absolute bottom-4 right-4 z-10 w-80 bg-[rgb(5,5,6)] border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
                    <button
                        onClick={() => setNpcPanelOpen(prev => !prev)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Skull size={15} className="text-red-400" />
                            NPC / Enemy Tokens
                        </span>
                        {npcPanelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>

                    <div
                        className={`border-t border-zinc-800 flex flex-col gap-3 overflow-hidden transition-all duration-300 ease-in-out ${
                            npcPanelOpen ? 'max-h-[480px] p-3 opacity-100' : 'max-h-0 p-0 opacity-0 border-t-0'
                        }`}
                    >
                        <div className="flex flex-col gap-2">
                            <Input
                                placeholder="Token name (e.g. Goblin)"
                                value={newNpcName}
                                onChange={e => setNewNpcName(e.target.value)}
                                className="h-8 text-sm bg-zinc-900/50 border-zinc-700"
                            />
                            <Input
                                placeholder="Image URL (optional)"
                                value={newNpcImageUrl}
                                onChange={e => setNewNpcImageUrl(e.target.value)}
                                className="h-8 text-sm bg-zinc-900/50 border-zinc-700"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 w-12 shrink-0">Size</span>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={newNpcScale}
                                    onChange={e => setNewNpcScale(Number(e.target.value))}
                                    className="flex-1 accent-red-500"
                                />
                                <span className="text-xs text-zinc-500 w-8 text-right">{newNpcScale.toFixed(1)}</span>
                            </div>
                            <Button
                                onClick={handleAddNpc}
                                disabled={!newNpcName.trim()}
                                size="sm"
                                className="h-8 bg-red-700 hover:bg-red-600 text-white gap-1.5"
                            >
                                <Plus size={13} /> Add Token
                            </Button>
                        </div>

                        {npcTokens.length > 0 && (
                            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Placed tokens</p>
                                {npcTokens.map(npc => (
                                    <div key={npc.id} className="flex flex-col gap-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-200 font-medium truncate">{npc.name}</span>
                                            <button
                                                onClick={() => handleRemoveNpc(npc.id)}
                                                className="text-zinc-500 hover:text-red-400 transition-colors shrink-0 ml-2"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-zinc-600 w-10">Size</span>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="3"
                                                step="0.1"
                                                value={npc.imageScale}
                                                onChange={e => handleNpcScaleChange(npc.id, Number(e.target.value))}
                                                className="flex-1 accent-red-500"
                                            />
                                            <span className="text-[10px] text-zinc-600 w-6 text-right">{npc.imageScale.toFixed(1)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div
                ref={containerRef}
                className="flex-1 overflow-hidden bg-black bg-[size:64px_64px] cursor-crosshair bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"
            >
                <Stage
                    width={stageSize.width}
                    height={stageSize.height}
                    draggable
                    onWheel={handleWheel}
                    scaleX={stageScale}
                    scaleY={stageScale}
                    x={stagePosition.x}
                    y={stagePosition.y}
                    className="cursor-move"
                >
                    <Layer>
                        {backgroundUrl && <BackgroundImage url={backgroundUrl} scale={bgImageScale} />}
                    </Layer>
                    <Layer>
                        {tokens.map(token => (
                            <TokenShape key={token.id} token={token} onDragEnd={handleTokenDragEnd} />
                        ))}
                    </Layer>
                    <Layer>
                        {npcTokens.map(npc => (
                            <NpcTokenShape
                                key={npc.id}
                                npc={npc}
                                draggable={isMaster}
                                onDragEnd={isMaster ? handleNpcDragEnd : undefined}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
}

function TokenShape({
    token,
    onDragEnd,
}: {
    token: TokenState;
    onDragEnd: (id: string, x: number, y: number) => void;
}) {
    const RADIUS = 28;
    const initials = token.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <Group
            x={token.x}
            y={token.y}
            draggable
            onDragStart={e => { e.cancelBubble = true; }}
            onDragEnd={e => { e.cancelBubble = true; onDragEnd(token.id, e.target.x(), e.target.y()); }}
            onMouseEnter={e => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'grab'; }}
            onMouseLeave={e => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'move'; }}
        >
            {token.imageUrl ? (
                <Group clipFunc={ctx => ctx.arc(0, 0, RADIUS, 0, Math.PI * 2, false)}>
                    <TokenImage url={token.imageUrl} offsetX={token.imageOffsetX} offsetY={token.imageOffsetY} scale={token.imageScale} radius={RADIUS} />
                </Group>
            ) : null}
            <Circle
                radius={RADIUS}
                fill={token.imageUrl ? 'transparent' : token.color}
                stroke="white"
                strokeWidth={2}
                shadowBlur={8}
                shadowColor="black"
                shadowOpacity={0.5}
            />
            {!token.imageUrl && (
                <Text x={-RADIUS} y={-8} width={RADIUS * 2} text={initials} align="center" fill="white" fontSize={14} fontStyle="bold" listening={false} />
            )}
            <Text
                x={-50}
                y={RADIUS + 4}
                width={100}
                text={token.name}
                align="center"
                fill="white"
                fontSize={16}
                fontStyle="bold"
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={1}
                listening={false}
            />
        </Group>
    );
}

function NpcTokenShape({
    npc,
    draggable,
    onDragEnd,
}: {
    npc: NpcToken;
    draggable: boolean;
    onDragEnd?: (id: string, x: number, y: number) => void;
}) {
    const RADIUS = 28 * npc.imageScale;
    const initials = npc.name.slice(0, 2).toUpperCase();

    return (
        <Group
            x={npc.x}
            y={npc.y}
            draggable={draggable}
            onDragStart={e => { e.cancelBubble = true; }}
            onDragEnd={e => { e.cancelBubble = true; onDragEnd?.(npc.id, e.target.x(), e.target.y()); }}
            onMouseEnter={e => { if (draggable) { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'grab'; } }}
            onMouseLeave={e => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'move'; }}
        >
            {npc.imageUrl ? (
                <Group clipFunc={ctx => ctx.arc(0, 0, RADIUS, 0, Math.PI * 2, false)}>
                    <NpcImage url={npc.imageUrl} radius={RADIUS} />
                </Group>
            ) : null}
            <Circle
                radius={RADIUS}
                fill={npc.imageUrl ? 'transparent' : '#7f1d1d'}
                stroke="#ef4444"
                strokeWidth={2.5}
                shadowBlur={10}
                shadowColor="#ef4444"
                shadowOpacity={0.4}
            />
            {!npc.imageUrl && (
                <Text x={-RADIUS} y={-8} width={RADIUS * 2} text={initials} align="center" fill="white" fontSize={14} fontStyle="bold" listening={false} />
            )}
            <Text
                x={-50}
                y={RADIUS + 4}
                width={100}
                text={npc.name}
                align="center"
                fill="#ef4444"
                fontSize={16}
                fontStyle="bold"
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={1}
                listening={false}
            />
        </Group>
    );
}