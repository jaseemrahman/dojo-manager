import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface StudentEventDialogProps {
    open: boolean;
    studentId: string;
    event?: any;
    onClose: (refresh: boolean) => void;
}

interface EventItem {
    item_name: string;
    prize: string;
}

const StudentEventDialog = ({ open, studentId, event, onClose }: StudentEventDialogProps) => {
    const [formData, setFormData] = useState({
        event_name: "",
        date: new Date().toISOString().split("T")[0],
        location: "",
        participation_type: "participated", // participated | winner
    });
    const [eventItems, setEventItems] = useState<EventItem[]>([{ item_name: "", prize: "" }]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (event) {
            setFormData({
                event_name: event.event_name || "",
                date: event.date || new Date().toISOString().split("T")[0],
                location: event.location || "",
                participation_type: event.participation_type || "participated",
            });
            // Load event items or create default
            if (event.event_items && event.event_items.length > 0) {
                setEventItems(event.event_items);
            } else {
                setEventItems([{ item_name: "", prize: "" }]);
            }
        } else {
            setFormData({
                event_name: "",
                date: new Date().toISOString().split("T")[0],
                location: "",
                participation_type: "participated",
            });
            setEventItems([{ item_name: "", prize: "" }]);
        }
    }, [event, open]);

    const addEventItem = () => {
        setEventItems([...eventItems, { item_name: "", prize: "" }]);
    };

    const removeEventItem = (index: number) => {
        if (eventItems.length > 1) {
            setEventItems(eventItems.filter((_, i) => i !== index));
        }
    };

    const updateEventItem = (index: number, field: keyof EventItem, value: string) => {
        const updated = [...eventItems];
        updated[index][field] = value;
        setEventItems(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate
            if (!formData.event_name.trim()) {
                toast({
                    title: "Validation Error",
                    description: "Event name is required.",
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            // For winners, validate event items and prizes
            if (formData.participation_type === "winner") {
                const validItems = eventItems.filter(item => item.item_name.trim());
                if (validItems.length === 0) {
                    toast({
                        title: "Validation Error",
                        description: "Please add at least one event item for winners.",
                        variant: "destructive"
                    });
                    setLoading(false);
                    return;
                }

                const missingPrizes = validItems.some(item => !item.prize.trim());
                if (missingPrizes) {
                    toast({
                        title: "Validation Error",
                        description: "Please specify prizes for all event items.",
                        variant: "destructive"
                    });
                    setLoading(false);
                    return;
                }
            }

            // Prepare event items only for winners
            const validItems = formData.participation_type === "winner"
                ? eventItems.filter(item => item.item_name.trim()).map(item => ({
                    item_name: item.item_name,
                    prize: item.prize
                }))
                : [];

            const payload = {
                student: studentId,
                event_name: formData.event_name,
                date: formData.date,
                location: formData.location,
                participation_type: formData.participation_type,
                event_items: validItems
            };

            if (event) {
                await api.patch(`/student-events/${event.id}/`, payload);
                toast({
                    title: "Event Updated",
                    description: "Student event participation updated.",
                });
            } else {
                await api.post("/student-events/", payload);
                toast({
                    title: "Event Added",
                    description: "Student event participation recorded.",
                });
            }

            onClose(true);

            if (!event) {
                setFormData({
                    event_name: "",
                    date: new Date().toISOString().split("T")[0],
                    location: "",
                    participation_type: "participated",
                });
                setEventItems([{ item_name: "", prize: "" }]);
            }

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: `Failed to ${event ? 'update' : 'add'} event.`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => onClose(false)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{event ? "Edit Event" : "Add Event Participation"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="event_name">Event Name *</Label>
                        <Input
                            id="event_name"
                            placeholder="e.g., Annual Championship"
                            value={formData.event_name}
                            onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="e.g., Stadium"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Participation Type *</Label>
                        <RadioGroup
                            value={formData.participation_type}
                            onValueChange={(val) => setFormData({ ...formData, participation_type: val })}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="participated" id="r1" />
                                <Label htmlFor="r1">Participated</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="winner" id="r2" />
                                <Label htmlFor="r2">Winner</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {formData.participation_type === "winner" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Event Items *</Label>
                                <Button type="button" size="sm" onClick={addEventItem} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Item
                                </Button>
                            </div>

                            {eventItems.map((item, index) => (
                                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            placeholder="Item name"
                                            value={item.item_name}
                                            onChange={(e) => updateEventItem(index, 'item_name', e.target.value)}
                                            required
                                        />
                                        <Input
                                            placeholder="Prize"
                                            value={item.prize}
                                            onChange={(e) => updateEventItem(index, 'prize', e.target.value)}
                                            required
                                        />
                                    </div>
                                    {eventItems.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeEventItem(index)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                            {event ? "Update Event" : "Add Event"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StudentEventDialog;
