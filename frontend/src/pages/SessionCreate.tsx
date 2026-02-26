import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

type Template = {
    id: string;
    name: string;
    schema: Record<string, string>
};

export function SessionCreate() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [template, setTemplate] = useState<Template | null>(null);
    const [characterName, setCharacterName] = useState('');

    const [sheetData, setSheetData] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchTemplate() {
            try {
                const response = await api.get(`/templates/session/${id}`);
                const fetchedTemplate = response.data[0];
                setTemplate(fetchedTemplate);

                const initialData: Record<string, string> = {};
                Object.keys(fetchedTemplate.schema).forEach(key => {
                    initialData[key] = '';
                });
                setSheetData(initialData);
            } catch (error) {
                console.error("Error fetching template", error);
            }
        }
        fetchTemplate();
    }, [id]);

    function handleFieldChange(key: string, value: string) {
        setSheetData(prev => ({
            ...prev,
            [key]: value
        }));
    }

    async function handleCreateCharacter(e: React.FormEvent) {
        e.preventDefault();

        try {
            await api.post("/characters", {
                sessionId: id,
                templateId: template?.id,
                name: characterName,
                sheetData: sheetData
            });

            navigate(`/session/${id}/play`);
        } catch (error) {
            console.error("Error creating character", error);
            alert("Failed to create character");
        }
    }

    if (!template) {
        return <div className="flex justify-center items-center h-screen bg-zinc-900 text-white">Loading template...</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-2 text-green-500">Player: Create Character</h1>
            <p className="text-zinc-400 mb-8">Using template: {template.name}</p>

            <form onSubmit={handleCreateCharacter} className="max-w-2xl bg-zinc-800 p-6 rounded-lg shadow-lg">
                
                <div className="mb-6">
                    <label className="block mb-2 text-zinc-400 font-bold">Character Name</label>
                    <input 
                        type="text" 
                        value={characterName}
                        onChange={e => setCharacterName(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-green-500"
                        required
                    />
                </div>

                <hr className="border-zinc-700 my-6" />
                <h2 className="text-xl font-bold mb-4">Attributes</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {Object.keys(template.schema).map(key => (
                        <div key={key}>
                            <label className="block mb-2 text-zinc-400">{key}</label>
                            <input 
                                type="text"
                                value={sheetData[key] || ''}
                                onChange={e => handleFieldChange(key, e.target.value)}
                                className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                    ))}
                </div>

                <button 
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-bold transition-colors text-lg"
                >
                    Create Character & Enter Table
                </button>
            </form>
        </div>
    );
}