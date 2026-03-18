import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Layers3, Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import backgroundImage from "@/assets/background-image.jpg"

type AttributeField = {
    name: string;
};

export function SessionEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [templateName, setTemplateName] = useState('Default Template');

    const [fields, setFields] = useState<AttributeField[]>([{ name: '' }]);

    const [isSaving, setIsSaving] = useState(false);

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

        const validFields = fields.filter(f => f.name.trim() !== '');
        if (validFields.length === 0) {
            alert("You must add at least one attribute");
            return;
        }

        setIsSaving(true);

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
        } finally {
            setIsSaving(false);
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
                        onSubmit={handleSaveTemplate}
                        className="flex flex-col gap-4 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl w-full
                            shadow-[0_0_50px_10px_rgba(255,255,255,0.05)]"
                    >
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-bold">
                                Setup Character Sheet
                            </h1>
                            <p className="text-zinc-400 text-sm mb-2">
                                Define the attributes for this session
                            </p>
                        </div>

                        <FieldGroup>
                            <Field>
                                <FieldLabel>
                                    Template Name
                                </FieldLabel>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                                    <Input 
                                        type="text"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        required
                                        placeholder="Ex: D&D 5e Standard"
                                        className="pl-10 bg-zinc-900/50 border-zinc-700
                                            placeholder:text-zinc-600
                                            focus-visible:ring-zinc-500"
                                    />
                                </div>
                                <FieldDescription className="text-zinc-500">
                                    Name this set of rules/attributes
                                </FieldDescription>
                            </Field>
                        </FieldGroup>

                        <hr className="border-zinc-800 -mx-8"/>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <FieldLabel className="mb-0">
                                    Attributes
                                </FieldLabel>
                                <Button
                                    type="button"
                                    onClick={handleAddField}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-zinc-700 bg-transparent text-zinc-300 transitions-colors
                                        hover:bg-zinc-800
                                        hover:text-white"
                                >
                                    <Plus size={14} className="mr-1" /> 
                                        Add
                                </Button>
                            </div>

                        <div className="flex flex-col gap-3 max-h-[30vh] overflow-y-auto pr-2 pb-1 scroll-smooth">
                            {fields.map((field, index) => (
                                <div
                                key={index}
                                className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-300"
                                >
                                    <Input 
                                        type="text"
                                        placeholder="E.g., HP, Strenght, Armor Class..."
                                        value={field.name}
                                        onChange={e => handleFieldChange(index, e.target.value)}
                                        required
                                        className="flex-1 bg-zinc-900/50 border-zinc-700
                                        focus-visible:ring-zinc-500"
                                        />
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveField(index)}
                                            className="shrink-0 text-zinc-500 border border-transparent transition-all
                                                hover:text-white
                                                hover:bg-red-500/20
                                                hover:border-red-500/50"
                                                title="Remove attribute"
                                        >
                                            <Trash2 size={16}/>
                                        </Button>
                                    )}
                                </div>
                            ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="mt-2 font-bold w-full transition-all duration-300
                                hover:bg-zinc-800
                                hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                        >
                            {isSaving ? "Saving..." : "Save Template & Enter Table"}
                        </Button>
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