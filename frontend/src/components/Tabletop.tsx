import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Circle, Text, Image as KonvaImage, Rect } from "react-konva";
import { Client } from "@stomp/stompjs";
import useImage from "use-image";

type Character = {
    id: string;
    name: string;
    playerName: string;
};

type TokenState = {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
};

type TabletopMessage = {
    sessionId: string;
    type: string;
    characterId?: string;
    x?: number;
    y?: number;
    imageUrl?: string;
    senderUsername?: string;
};

interface TabletopProps {
    sessionId: string;
    isMaster: boolean;
    characters: Character[];
    stompClient: Client | null;
    isConnected: boolean;
}

const TOKEN_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
];

function BackgroundImage({ url }: { url: string }) {
    const [image] = useImage(url, 'anonymous');
    if (!image) return null;
    return <KonvaImage image={image} x={0} y={0} />;
}

export function Tabletop({ sessionId, isMaster, characters, stompClient, isConnected }: TabletopProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [backgroundUrl, setBackgroundUrl] = useState('');
    const [inputUrl, setInputUrl] = useState('');
    const [tokens, setTokens] = useState<TokenState[]>([]);

    useEffect(() => {
        function updateSize() {
            if (containerRef.current) {
                setStageSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        }
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        if (characters.length === 0) return;

        setTokens(characters.map((char, index) => ({
            id: char.id,
            name: char.name,
            x: 80 + (index % 5) * 120,
            y: 80 + Math.floor(index / 5) * 120,
            color: TOKEN_COLORS[index % TOKEN_COLORS.length],
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
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [stompClient, isConnected, sessionId]);

    function handleTokenDragEnd(tokenId: string, x: number, y: number) {
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
    }

    function handleSetBackground() {
        setBackgroundUrl(inputUrl);

        if (stompClient && isConnected) {
            stompClient.publish({
                destination: '/app/tabletop.update',
                body: JSON.stringify({
                    sessionId,
                    type: 'BACKGROUND_UPDATE',
                    imageUrl: inputUrl,
                })
            });
        }
        setInputUrl('');
    }

    return (
        <div className="w-full h-full flex flex-col">

            {isMaster && (
                <div className="flex gap-2 p-2 bg-zinc-950 border-b border-zinc-700 shrink-0">
                    <input
                        type="text"
                        placeholder="URL da imagem de fundo..."
                        value={inputUrl}
                        onChange={e => setInputUrl(e.target.value)}
                        className="flex-1 p-1 rounded bg-zinc-800 text-white text-sm outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                    <button
                        onClick={handleSetBackground}
                        className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm font-bold"
                    >
                        Definir Fundo
                    </button>
                    {backgroundUrl && (
                        <button
                            onClick={() => {
                                setBackgroundUrl('');
                                if (stompClient && isConnected) {
                                    stompClient.publish({
                                        destination: '/app/tabletop.update',
                                        body: JSON.stringify({ sessionId, type: 'BACKGROUND_UPDATE', imageUrl: '' })
                                    });
                                }
                            }}
                            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            )}

            <div ref={containerRef} className="flex-1 overflow-hidden bg-zinc-950 cursor-crosshair">
                <Stage width={stageSize.width} height={stageSize.height}>

                    <Layer>
                        <Rect
                            x={0} y={0}
                            width={stageSize.width}
                            height={stageSize.height}
                            fill="#09090b"
                        />
                        {backgroundUrl && <BackgroundImage url={backgroundUrl} />}
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
        <>
            <Circle
                x={token.x}
                y={token.y}
                radius={RADIUS}
                fill={token.color}
                stroke="white"
                strokeWidth={2}
                draggable
                shadowBlur={8}
                shadowColor="black"
                shadowOpacity={0.5}
                onDragEnd={(e) => {
                    onDragEnd(token.id, e.target.x(), e.target.y());
                }}
            />
            <Text
                x={token.x - RADIUS}
                y={token.y - 8}
                width={RADIUS * 2}
                text={initials}
                align="center"
                fill="white"
                fontSize={14}
                fontStyle="bold"
                listening={false}
            />
            <Text
                x={token.x - 50}
                y={token.y + RADIUS + 4}
                width={100}
                text={token.name}
                align="center"
                fill="#a1a1aa"
                fontSize={11}
                listening={false}
            />
        </>
    );
}