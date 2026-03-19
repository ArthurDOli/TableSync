import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Plus, Trash2, FileText, Settings2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";

type AttributeField = {
    name: string;
};

export function SessionEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [templateName, setTemplateName] = useState('Default Template');

    const [fields, setFields] = useState<AttributeField[]>([{ name: '' }]);

    const [isSaving, setIsSaving] = useState(false);

    const [errorMsg, setErrorMsg] = useState('');

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
        setErrorMsg('');

        const validFields = fields.filter(f => f.name.trim() !== '');
        if (validFields.length === 0) {
            setErrorMsg("You must provide at least one valid attribute name");
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

    useEffect(() => {
        async function verifyAccess() {
            try {
                const sessionRes = await api.get(`/sessions/${id}`);
                const currentUserId = Number(localStorage.getItem('userId'));

                const isMaster = sessionRes.data.masterId === currentUserId;
                const isParticipant = sessionRes.data.participants.some((p: { userId: number }) => p.userId === currentUserId);

                if (isMaster && sessionRes.data.totalTemplates > 0) {
                    navigate(`/session/${id}/play`)
                }

                if (!isMaster && isParticipant) {
                    navigate(`/session/${id}/play`);
                }

                if (!isMaster) {
                    navigate("/dashboard");
                    return;
                }
            } catch (erro) {
                navigate("/dashboard")
            }
        }
        verifyAccess();
    }, [id, navigate])

    return (
        <div className="flex flex-col items-center min-h-screen overflow-y-auto bg-black text-white py-12 px-4
            bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]
            bg-[size:128px_128px]"
        >
            <div className="w-full max-w-2xl flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    title="Back to Dashboard"
                    className="text-red-500 rounded-lg p-2 border border-red-800 bg-zinc-900/50 transition-colors
                        hover:bg-red-800 hover:text-white shrink-0
                        hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                >
                    <ArrowLeft size={18}/>
                </button>

                <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                    <Settings2 className="text-zinc-300" size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">
                        Master Panel
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Configure the character sheet template for this session.
                    </p>
                </div>
            </div>

            <div className="w-full max-w-2xl z-10">
                <form
                    onSubmit={handleSaveTemplate}
                    className="flex flex-col gap-6 bg-[rgb(5,5,6)] border border-zinc-800 p-8 rounded-xl w-full shadow-2xl"
                >
                    <FieldGroup>
                        <Field>
                            <FieldLabel className="text-zinc-300">
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
                                    className="pl-10 h-11 bg-zinc-900/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
                                />
                            </div>
                            <FieldDescription className="text-zinc-500">
                                Name this set of rules to keep things organized.
                            </FieldDescription>
                        </Field>
                    </FieldGroup>

                    <hr className="border-zinc-800/80 -mx-8 my-2"/>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <FieldLabel className="mb-0 text-zinc-300">
                                    Sheet Attributes
                                </FieldLabel>
                                <p className="text-xs text-zinc-500 mt-1">Define health, mana, strength, etc.</p>
                            </div>
                            
                            <Button
                                type="button"
                                onClick={handleAddField}
                                variant="outline"
                                size="sm"
                                className="h-8 border-dashed border-zinc-700 bg-transparent text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                            >
                                <Plus size={14} className="mr-1.5" /> 
                                Add Field
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-2 pb-1 scroll-smooth">
                            {fields.map((field, index) => (
                                <div
                                    key={index}
                                    className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200"
                                >
                                    <Input 
                                        type="text"
                                        placeholder="E.g., Max HP, Current HP, Armor Class..."
                                        value={field.name}
                                        onChange={e => handleFieldChange(index, e.target.value)}
                                        className="flex-1 h-10 bg-zinc-900/50 border-zinc-700 text-zinc-200 focus-visible:ring-zinc-500"
                                    />
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveField(index)}
                                            className="shrink-0 text-zinc-500 border border-transparent transition-all 
                                                hover:text-red-400 
                                                hover:bg-red-500/10 
                                                hover:border-red-500/20"
                                            title="Remove attribute"
                                        >
                                            <Trash2 size={16}/>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr className="border-zinc-800/80 -mx-8" />

                    <div className="flex flex-col gap-4">
                        {errorMsg && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3
                                rounded-lg text-sm animate-in fade-in zoom-in-95">
                                <AlertCircle size={16}/>
                                {errorMsg}
                            </div>
                        )}
                        
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="mt-2 w-full h-11 bg-zinc-100 text-zinc-900 font-bold transition-all duration-300
                                hover:bg-white
                                hover:scale-[1.02]
                                hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            {isSaving ? "Saving..." : "Save Template & Open Tabletop"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}