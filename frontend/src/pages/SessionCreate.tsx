import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "@/components/ui/button";
import { Ghost, Sparkles, ImageIcon, User, Swords, AlertCircle, ArrowLeft } from "lucide-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Template = {
    id: string;
    name: string;
    schema: Record<string, string>
};

export function SessionCreate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [template, setTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [characterName, setCharacterName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [sheetData, setSheetData] = useState<Record<string, string>>({});

    const [imageScale, setImageScale] = useState(1);
    const [imageOffsetX, setImageOffsetX] = useState(50);
    const [imageOffsetY, setImageOffsetY] = useState(50);

    const [formError, setFormError] = useState('');

    const currentUserId = Number(localStorage.getItem('userId'));

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionRes = await api.get(`/sessions/${id}`);
                if (currentUserId === sessionRes.data.masterId) {
                    navigate(`/session/${id}/play`, { replace: true });
                    return;
                }

                const response = await api.get(`/templates/session/${id}`);
                const fetchedTemplate = response.data[0];
                
                if (fetchedTemplate) {
                    setTemplate(fetchedTemplate);

                    const initialData: Record<string, string> = {};
                    Object.keys(fetchedTemplate.schema).forEach(key => {
                        initialData[key] = '';
                    });
                    setSheetData(initialData);
                }
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id, currentUserId, navigate]);

    function handleFieldChange(key: string, value: string) {
        setSheetData(prev => ({
            ...prev,
            [key]: value
        }));
    }

    async function handleCreateCharacter(e: React.FormEvent) {
        e.preventDefault();
        setFormError('');

        if (!characterName.trim()) {
            setFormError("Character name is required.");
            return;
        }

        if (characterName.trim().length < 2) {
            setFormError("Character name must be at least 2 characters.");
            return;
        }

        const emptyFields = Object.keys(sheetData).filter(key => !sheetData[key].trim());
        if (emptyFields.length > 0) {
            setFormError(`Please fill in all attributes: ${emptyFields.join(', ')}.`);
            return;
        }

        setIsSaving(true);

        try {
            await api.post("/characters", {
                sessionId: id,
                templateId: template?.id,
                name: characterName,
                imageUrl: imageUrl,
                imageScale: imageScale,
                imageOffsetX: imageOffsetX,
                imageOffsetY: imageOffsetY,
                sheetData: sheetData
            });

            navigate(`/session/${id}/play`);
        } catch (error) {
            console.error("Error creating character", error);
            setFormError("Failed to create character. Please try again.");
            setIsSaving(false);
        }
    }

    const initials = characterName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
                <Sparkles className="animate-pulse" size={32}/>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="min-h-screen bg-black
                bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]
                bg-[size:128px_128px] flex flex-col items-center justify-center text-center px-4"
            >
                <div className="bg-[rgb(5,5,6)] border border-zinc-800 p-12 rounded-2xl shadow-2xl flex flex-col items-center max-w-md
                    animate-in fade-in zoom-in duration-500"
                >
                    <div className="bg-zinc-900/50 p-4 rounded-full border border-zinc-800 mb-6">
                        <Ghost className="text-zinc-500" size={48}/>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        The Realm is Not Ready
                    </h1>

                    <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                        The Game Master hasn't set up the character sheet template for this session yet. Please wait for them to finish and refresh the page.
                    </p>

                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-zinc-100 text-black w-full font-bold
                            hover:bg-white"
                    >
                        Refresh Page
                    </Button>

                    <Button
                        onClick={() => navigate('/dashboard')}
                        variant="ghost"
                        className="mt-2 text-zinc-500 w-full
                            hover:text-white"
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden relative">
            <div className="w-full lg:w-1/2 h-full flex flex-col items-center overflow-y-auto px-6 py-12 z-10
                bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]
                bg-[size:128px_128px]"
            >
                <div className="w-full max-w-md">
                    <div className="mb-6 flex items-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            title="Back to Dashboard"
                            className="text-zinc-500 rounded-lg p-2 border border-zinc-800 bg-zinc-900/50 transition-colors
                                hover:bg-zinc-800 hover:text-white"
                        >
                            <ArrowLeft size={18}/>
                        </button>
                    </div>

                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100 mb-2">
                            Forge your Hero
                        </h1>

                        <p className="text-zinc-400 text-sm">
                            Using template: <span className="text-blue-400 font-semibold">{template.name}</span>
                        </p>
                    </div>

                    <form
                        onSubmit={handleCreateCharacter}
                        noValidate
                        className="flex flex-col gap-8 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl shadow-2xl"
                    >
                        <div className="flex flex-col gap-5">
                            <h2 className="text-lg font-bold text-zinc-200 border-b border-zinc-800 pb-2 flex items-center gap-2">
                                <User className="text-zinc-500" size={18}/> Identity
                            </h2>

                            <FieldGroup>
                                <Field>
                                    <FieldLabel>
                                        Character Name
                                    </FieldLabel>

                                    <Input
                                        type="text"
                                        value={characterName}
                                        onChange={e => setCharacterName(e.target.value)}
                                        placeholder="Ex: Artorias of the Abyss"
                                        className="h-11 bg-zinc-900/50 border-zinc-700 text-zinc-200
                                            focus-visible:ring-blue-500"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>
                                        Avatar URL <span className="text-zinc-500 text-xs font-normal ml-1">(Optional)</span>
                                    </FieldLabel>
                                    
                                    <div className="relative">
                                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>

                                        <Input
                                            type="url"
                                            value={imageUrl}
                                            onChange={e => setImageUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="pl-9 h-11 bg-zinc-900/50 border-zinc-700 text-zinc-200
                                                focus-visible:ring-blue-500"
                                        />
                                    </div>
                                </Field>

                                {imageUrl && (
                                    <div className="flex flex-col gap-3 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg animate-in
                                        fade-in zoom-in-95 duration-300"
                                    >
                                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
                                            Avatar Adjustments
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-zinc-500 w-12">Zoom</span>
                                            <input
                                                type="range"
                                                min="1"
                                                max="3"
                                                step="0.1"
                                                value={imageScale}
                                                onChange={e => setImageScale(Number(e.target.value))}
                                                className="flex-1 accent-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-zinc-500 w-12">X-Axis</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={imageOffsetX}
                                                onChange={e => setImageOffsetX(Number(e.target.value))}
                                                className="flex-1 accent-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-zinc-500 w-12">Y-Axis</span>
                                            <input 
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={imageOffsetY}
                                                onChange={e => setImageOffsetY(Number(e.target.value))}
                                                className="flex-1 accent-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </FieldGroup>
                        </div>

                        <div className="flex flex-col gap-5">
                            <h2 className="text-lg font-bold text-zinc-200 border-b border-zinc-800 pb-2 flex items-center gap-2">
                                <Swords className="text-zinc-500" size={18}/> Attributes
                            </h2>

                            <div className="flex flex-col gap-4">
                                {Object.keys(template.schema).map(key => (
                                    <Field key={key}>
                                        <FieldLabel className="text-xs text-zinc-400 uppercase tracking-wider">
                                            {key}
                                        </FieldLabel>

                                        <Input 
                                            type="text"
                                            value={sheetData[key] || ''}
                                            onChange={e => handleFieldChange(key, e.target.value)}
                                            className="h-10 bg-zinc-900/50 border-zinc-700 text-zinc-200
                                                focus-visible:ring-blue-500"
                                        />
                                    </Field>
                                ))}
                            </div>
                        </div>

                        <hr className="border-zinc-800 -mx-8" />

                        <div className="flex flex-col gap-4">
                            {formError && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3
                                    rounded-lg text-sm animate-in fade-in zoom-in-95">
                                    <AlertCircle size={16}/>
                                    {formError}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-12 bg-blue-700 text-white font-bold text-lg transition-all
                                    shadow-[0_0_20px_rgba(37,99,235,0.2)]
                                    hover:bg-blue-700"
                            >
                                {isSaving ? "Forging..." : "Join Tabletop"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="hidden lg:flex w-1/2 h-full bg-zinc-950 flex-col items-center justify-center relative border-l border-zinc-900
                shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-20 overflow-y-auto"
            >
                <div className="absolute top-14 text-center">
                    <p className="text-zinc-500 font-mono tracking-[0.2em] text-sm uppercase">
                        Live Token Preview
                    </p>
                </div>

                <div className="flex flex-col items-center w-full px-8 pt-16 pb-8 animate-in zoom-in-95 duration-500">
                    <div className="w-64 h-64 shrink-0 rounded-full border-4 border-zinc-800 overflow-hidden flex items-center
                        justify-center relative group
                        shadow-[0_0_50px_rgba(0,0,0,0.3)]
                        bg-[rgb(5,5,6)]"
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="Token Preview"
                                style={{
                                    objectPosition: `${imageOffsetX}% ${imageOffsetY}%`,
                                    transformOrigin: `${imageOffsetX}% ${imageOffsetY}%`,
                                    transform: `scale(${imageScale})`
                                }}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <span className="text-6xl font-black text-zinc-700 select-none">
                                {initials}
                            </span>
                        )}
                    </div>

                    <div className="mt-8 bg-[rgb(5,5,6)] px-6 py-2 rounded-full border border-zinc-800 shadow-xl">
                        <span className="text-xl font-bold text-zinc-200">
                            {characterName || "Unknown Hero"}
                        </span>
                    </div>

                    <TooltipProvider delayDuration={200}>
                        <div className="mt-8 flex flex-wrap justify-center gap-3 w-full max-w-lg">
                            {Object.keys(sheetData).map(key => {
                                if (!sheetData[key]) return null;

                                return (
                                    <Tooltip key={key}>
                                        <TooltipTrigger asChild>
                                            <div className="bg-zinc-900/80 border border-zinc-800 px-3 py-2 rounded-lg text-sm flex
                                                flex-col items-center gap-1 max-w-[200px] shadow-sm cursor-help transition-colors
                                                hover:border-zinc-700"
                                            >
                                                <span className="text-zinc-500 uppercase tracking-wider text-xs">
                                                    {key}
                                                </span>

                                                <span className="font-medium text-blue-400 truncate w-full text-center">
                                                    {sheetData[key]}
                                                </span>
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent
                                            side="bottom"
                                            className="bg-zinc-800 border-zinc-700 text-zinc-200 max-w-[300px] whitespace-pre-wrap 
                                                break-all text-xs p-3 shadow-xl animate-in zoom-in-95
                                                data-[state=closed]:animate-out
                                                data-[state=closed]:zoom-out-95"
                                        >
                                            <p className="leading-relaxed">{sheetData[key]}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
}