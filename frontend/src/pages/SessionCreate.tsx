import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "@/components/ui/button";
import { Ghost, Sparkles } from "lucide-react";

type Template = {
    id: string;
    name: string;
    schema: Record<string, string>
};

export function SessionCreate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [template, setTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // const [characterName, setCharacterName] = useState('');

    // const [sheetData, setSheetData] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchTemplate() {
            try {
                const response = await api.get(`/templates/session/${id}`);
                const fetchedTemplate = response.data[0];
                
                if (fetchedTemplate) {
                    setTemplate(fetchedTemplate);
                }
            } catch (error) {
                console.error("Error fetching template", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTemplate();
    }, [id]);

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
                bg-[linear-gradient(to__right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]
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

    // function handleFieldChange(key: string, value: string) {
    //     setSheetData(prev => ({
    //         ...prev,
    //         [key]: value
    //     }));
    // }

    // async function handleCreateCharacter(e: React.FormEvent) {
    //     e.preventDefault();

    //     try {
    //         await api.post("/characters", {
    //             sessionId: id,
    //             templateId: template?.id,
    //             name: characterName,
    //             sheetData: sheetData
    //         });

    //         navigate(`/session/${id}/play`);
    //     } catch (error) {
    //         console.error("Error creating character", error);
    //         alert("Failed to create character");
    //     }
    // }

    // if (!template) {
    //     return <div className="flex justify-center items-center h-screen bg-zinc-900 text-white">Loading template...</div>;
    // }

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden relative">
            <div className="w-full lg:w-1/2 h-full flex flex-col items-center overflow-y-auto px-6 py-12 z-10
                bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px),transparent)]
                bg-[size:128px_128px]"
            >
                <div className="w-full max-w-md">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100 mb-2">
                            Forge your Hero
                        </h1>

                        <p className="text-zinc-400 text-sm">
                            Using template: <span className="text-vlue-400 font-semibold">{template.name}</span>
                        </p>
                    </div>

                    <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-600 bg-zinc-950/50">
                        Placeholder
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex w-1/2 h-full bg-zinc-950 flex-col items-center justify-center relative border-l border-zinc-900
                shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-20"
            >
                <div className="absolute top-10 text-center">
                    <p className="text-zinc-500 font-mono tracking-[0.2em] text-sm uppercase">
                        Live Token Preview
                    </p>
                </div>

                <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-600 bg-black/50">
                    Placeholder
                </div>
            </div>
        </div>

        // <div className="min-h-screen bg-zinc-900 text-white p-8">
        //     <h1 className="text-3xl font-bold mb-2 text-green-500">Player: Create Character</h1>
        //     <p className="text-zinc-400 mb-8">Using template: {template.name}</p>

        //     <form onSubmit={handleCreateCharacter} className="max-w-2xl bg-zinc-800 p-6 rounded-lg shadow-lg">
                
        //         <div className="mb-6">
        //             <label className="block mb-2 text-zinc-400 font-bold">Character Name</label>
        //             <input 
        //                 type="text" 
        //                 value={characterName}
        //                 onChange={e => setCharacterName(e.target.value)}
        //                 className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-green-500"
        //                 required
        //             />
        //         </div>

        //         <hr className="border-zinc-700 my-6" />
        //         <h2 className="text-xl font-bold mb-4">Attributes</h2>

        //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        //             {Object.keys(template.schema).map(key => (
        //                 <div key={key}>
        //                     <label className="block mb-2 text-zinc-400">{key}</label>
        //                     <input 
        //                         type="text"
        //                         value={sheetData[key] || ''}
        //                         onChange={e => handleFieldChange(key, e.target.value)}
        //                         className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-green-500"
        //                         required
        //                     />
        //                 </div>
        //             ))}
        //         </div>

        //         <button 
        //             type="submit"
        //             className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-bold transition-colors text-lg"
        //         >
        //             Create Character & Enter Table
        //         </button>
        //     </form>
        // </div>
    );
}