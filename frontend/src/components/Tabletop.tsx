import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Circle, Text, Image as KonvaImage, Group } from "react-konva";
import { Client } from "@stomp/stompjs";
import useImage from "use-image";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ImageIcon, X } from "lucide-react";
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
};

interface TabletopProps {
    sessionId: string;
    isMaster: boolean;
    characters: Character[];
    stompClient: Client | null;
    isConnected: boolean;
    initialBackground: string;
    initialScale: number;
}

const TOKEN_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
];

function BackgroundImage({ url, scale }: { url: string, scale: number }) {
    const [image] = useImage(url, 'anonymous');
    if (!image) return null;
    return <KonvaImage image={image} x={0} y={0} scaleX={scale} scaleY={scale} />;
}

function TokenImage({ url, offsetX, offsetY, scale, radius }: {
    url: string;
    offsetX: number;
    offsetY: number;
    scale: number;
    radius: number;
}) {
    const [image] = useImage(url, 'anonymous');
    if (!image || !image.width || !image.height) return null;

    const diameter = radius * 2;

    const coverScale = Math.max(diameter / image.width, diameter / image.height) * scale;

    const finalW = image.width * coverScale;
    const finalH = image.height * coverScale;

    const imgX = -radius + (offsetX / 100) * (diameter - finalW);
    const imgY = -radius + (offsetY / 100) * (diameter - finalH);

    return (
        <KonvaImage
            image={image}
            x={imgX}
            y={imgY}
            width={finalW}
            height={finalH}
            listening={false}
        />
    );
}

export function Tabletop({ sessionId, isMaster, characters, stompClient, isConnected, initialBackground, initialScale }: TabletopProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [stageScale, setStageScale] = useState(1);
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

    const [backgroundUrl, setBackgroundUrl] = useState('');
    const [bgImageScale, setBgImageScale] = useState(initialScale);

    const [inputUrl, setInputUrl] = useState('');

    const [tokens, setTokens] = useState<TokenState[]>([]);

    useEffect(() => {
        if (initialBackground) {
            setBackgroundUrl(initialBackground);
        }
    }, [initialBackground]);

    useEffect(() => {
        setBgImageScale(initialScale);
    }, [initialScale]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                setStageSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
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

        const subscription = stompClient.subscribe(
            `/topic/tabletop/${sessionId}`,
            (message) => {
                const data: TabletopMessage = JSON.parse(message.body);

                if (data.type === 'TOKEN_MOVE' && data.characterId && data.x !== undefined && data.y !== undefined) {
                    setTokens(prev => prev.map(token =>
                        token.id === data.characterId
                            ? { ...token, x: data.x!, y: data.y! }
                            : token
                    ));
                }

                if (data.type === 'BACKGROUND_UPDATE' && data.imageUrl !== undefined) {
                    setBackgroundUrl(data.imageUrl);

                    if (data.imageScale !== undefined) {
                        setBgImageScale(data.imageScale);
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [stompClient, isConnected, sessionId]);

    async function handleTokenDragEnd(tokenId: string, x: number, y: number) {
        setTokens(prev => prev.map(t =>
            t.id === tokenId ? { ...t, x, y } : t
        ));

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({
                    sessionId,
                    type: 'TOKEN_MOVE',
                    characterId: tokenId,
                    x,
                    y,
                })
            });
        }

        try {
            await api.patch(`/characters/${tokenId}`, { tokenX: x, tokenY: y});
        } catch (error) {
            console.error("Error saving token position", error);
        }
    }

    async function handleSetBackground() {
        const finalUrl = inputUrl.trim() !== '' ? inputUrl : backgroundUrl;

        setBackgroundUrl(finalUrl);

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({
                    sessionId,
                    type: 'BACKGROUND_UPDATE',
                    imageUrl: finalUrl,
                    imageScale: bgImageScale
                })
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
                body: JSON.stringify({
                    sessionId,
                    type: 'BACKGROUND_UPDATE',
                    imageUrl: ''
                })
            });
        }

        try {
            await api.patch(`/sessions/${sessionId}/background?url=`);
        } catch (error) {
            console.error("Error clearing background", error);
        }
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
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[rgb(5,5,6)] p-3 rounded-xl border border-zinc-800 
                    shadow-xl backdrop-blur-sm bg-opacity-90"
                >
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
                                const newScale = Number(e.target.value);
                                setBgImageScale(newScale);

                                if (stompClient && isConnected && backgroundUrl) {
                                    stompClient.publish({
                                        destination: '/app/tabletop.update',
                                        body: JSON.stringify({
                                            sessionId,
                                            type: 'BACKGROUND_UPDATE',
                                            imageUrl: backgroundUrl,
                                            imageScale: newScale
                                        })
                                    });
                                }
                            }}
                            className="w-16 h-8 bg-zinc-900/50 border-zinc-700 text-sm"
                        />
                    </div>

                    <Button onClick={handleSetBackground} size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
                        Apply
                    </Button>
                    
                    {backgroundUrl && (
                        <Button onClick={handleClearBackground} size="icon" variant="destructive" className="h-8 w-8">
                            <X size={16} />
                        </Button>
                    )}
                </div>
            )}

            <div ref={containerRef} 
                className="flex-1 overflow-hidden bg-black bg-[size:64px_64px] cursor-crosshair
                    bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"
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
                            <TokenShape
                                key={token.id}
                                token={token}
                                onDragEnd={handleTokenDragEnd}
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
    onDragEnd
}: {
    token: TokenState;
    onDragEnd: (id: string, x: number, y: number) => void;
}) {
    const RADIUS = 28;

    const initials = token.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <Group
            x={token.x}
            y={token.y}
            draggable
            onDragStart={(e) => {
                e.cancelBubble = true;
            }}
            onDragEnd={(e) => {
                e.cancelBubble = true; 
                onDragEnd(token.id, e.target.x(), e.target.y());
            }}
            onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'grab';
            }}
            onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'move';
            }}
        >
            {token.imageUrl ? (
                <Group
                    clipFunc={(ctx) => {
                        ctx.arc(0, 0, RADIUS, 0, Math.PI * 2, false);
                    }}
                >
                    <TokenImage
                        url={token.imageUrl}
                        offsetX={token.imageOffsetX}
                        offsetY={token.imageOffsetY}
                        scale={token.imageScale}
                        radius={RADIUS}
                    />
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
                <Text
                    x={-RADIUS}
                    y={-8}
                    width={RADIUS * 2}
                    text={initials}
                    align="center"
                    fill="white"
                    fontSize={14}
                    fontStyle="bold"
                    listening={false}
                />
            )}

            <Text
                x={-50}
                y={RADIUS + 4}
                width={100}
                text={token.name}
                align="center"
                fill="#a1a1aa"
                fontSize={11}
                listening={false}
            />
        </Group>
    );
}