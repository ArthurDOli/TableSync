import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

type Field = {
    name: string;
};

export function SessionEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [templateName, setTemplateName] = useState('Default Template');

    const [fields, setFields] = useState<Field[]>([{ name: '' }]);

    function handleAddField() {
        setFields(prev => [...prev, { name: '' }]);
    }

    function handleRemoveField(indexToRemove: number) {
        setFields(prev => prev.filter((_, index) => index !== indexToRemove));
    }

    function handleFieldChange(indexToUpdate: number, newValue: string) {
        setFields(prev => {
            const newFields = [...prev];
            newFields[indexToUpdate].name = newValue;
            return newFields;
        });
    }

    async function handleSaveTemplate(e: React.FormEvent) {
        e.preventDefault();

        const schemaObject: Record<string, string> = {};

        fields.forEach(field => {
            schemaObject[field.name] = '';
        })

        try {
            await api.post("/templates", {
                sessionId: id,
                name: templateName,
                schema: schemaObject
            });

            navigate(`/session/${id}/play`);
        } catch (error) {
            console.log("Error creating template", error);
            alert("Failed to save template")
        }
    }

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8 text-yellow-500">Master: Setup Character Sheet</h1>

            <form onSubmit={handleSaveTemplate} className="max-w-2xl bg-zinc-800 p-6 rounded-lg shadow-lg">
                <div className="mb-6">
                    <label className="block mb-2 text-zinc-400">Template Name</label>
                    <input 
                        type="text" 
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-yellow-500"
                        required
                    />
                </div>

                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Attributes</h2>
                    <button 
                        type="button" 
                        onClick={handleAddField}
                        className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded font-bold transition-colors"
                    >
                        + Add Attribute
                    </button>
                </div>

                <div className="flex flex-col gap-3 mb-8">
                    {fields.map((field, index) => (
                        <div key={index} className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="E.g., HP, Strength, Backstory..."
                                value={field.name}
                                onChange={e => handleFieldChange(index, e.target.value)}
                                className="flex-1 p-2 rounded bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-yellow-500"
                                required
                            />
                            {fields.length > 1 && (
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveField(index)}
                                    className="bg-red-600 hover:bg-red-700 px-3 rounded font-bold transition-colors"
                                >
                                    -
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button 
                    type="submit"
                    className="w-full bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold transition-colors text-lg"
                >
                    Save Template & Enter Table
                </button>
            </form>
        </div>
    );
}