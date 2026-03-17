import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Circle, Text, Image as KonvaImage, Group } from "react-konva";
import { Client } from "@stomp/stompjs";
import useImage from "use-image";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ImageIcon, X } from "lucide-react";

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
    const [stageScale, setStageScale] = useState(1);
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

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
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[rgb(5,5,6)] p-3 rounded-xl border 
                    border-zinc-800 shadow-xl backdrop-blur-sm bg-opacity-90">
                    <ImageIcon size={18} className="text-zinc-400"/>
                    <Input
                        type="text"
                        placeholder="Image URL..."
                        value={inputUrl}
                        onChange={e => setInputUrl(e.target.value)}
                        className="w-64 h-8 bg-zinc-900/50 border-zinc-700  text-sm
                            placeholder:text-zinc-600"
                    />
                    <Button
                        onClick={handleSetBackground}
                        size="sm"
                        className="h-8 bg-blue-600 font-bold
                            hover:bg-blue-700"
                    >
                        Apply
                    </Button>
                    {backgroundUrl && (
                        <Button
                            onClick={() => {
                                setBackgroundUrl('');
                                if (stompClient && isConnected) {
                                    stompClient.publish({
                                        destination: '/app/tabletop.update',
                                        body: JSON.stringify({ sessionId, type: 'BACKGROUND_UPDATE', imageUrl: '' })
                                    });
                                }
                            }}
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                        >
                            <X size={17}/>
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
            <Circle
                radius={RADIUS}
                fill={token.color}
                stroke="white"
                strokeWidth={2}
                shadowBlur={8}
                shadowColor="black"
                shadowOpacity={0.5}
            />
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
            <Text
                x={- 50}
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