import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Layers3 } from "lucide-react";
import backgroundImage from "@/assets/background-image.jpg"

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
        <div className="flex items-center justify-center min-h-screen overflow-hidden bg-black text-white relative
            bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]
            bg-[size:128px_128px]"
        >
            <div className="flex w-full flex-col justify-center items-center lg:w-1/2 px-4 z-10">
                <div className="w-full max-w-md lg:ml-32">
                    <div className="flex items-center gap-3 mb-10">
                        <Layers3 className="text-white" size={32}/>
                        <span className="text-3xl font-extrabold text-white tracking-tighter">
                            TableSync
                        </span>
                    </div>

                    <form
                        onClick={handleSaveTemplate}
                        className="flex flex-col gap-4 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl w-full
                            shadow-[0_0_50px_10px_rgba(255,255,255,0.05)]"
                    >
                        <div className="flex flex-col gap-1 mb-4">
                            <h1 className="text-2xl font-bold">
                                Setup Character Sheet
                            </h1>
                            <p className="text-zinc-400 text-sm">
                                Define the attributes for this session
                            </p>
                        </div>

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
            </div>

            <div className="hidden lg:flex w-1/2 items-center justify-end relative h-screen">
                <img 
                    src={backgroundImage}
                    alt="TableSync Background Image"
                    className="
                        w-full max-w-[900px] h-full object-cover 
                        absolute right-0
                        opacity-40
                        [mask-image:linear-gradient(ellipse_at_right_center,white_20%,transparent_75%)]
                        [-webkit-mask-image:radial-gradient(ellipse_at_right_center,white_20%,transparent_75%)]
                        "
                />

                <div className="absolute bottom-20 right-24 text-right w-full max-w-[350px]">
                    <p className="text-[26px] text-zinc-400 italic leading-relaxed">
                        "The longest journey begins with a single step."
                    </p>
                    <p className="text-[20px] text-zinc-500 mt-1 font-medium">
                        — A Wise Master
                    </p>
                </div>
            </div>
        </div>
    );
}