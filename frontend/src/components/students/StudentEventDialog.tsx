import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface StudentEventDialogProps {
    open: boolean;
    studentId: string;
    event?: any;
    onClose: (refresh: boolean) => void;
}

const StudentEventDialog = ({ open, studentId, event, onClose }: StudentEventDialogProps) => {
    const [formData, setFormData] = useState({
        event_name: "",
        date: new Date().toISOString().split("T")[0],
        location: "",
        participation_type: "participated", // participated | winner
        result: "", // Prize/Result
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (event) {
            setFormData({
                event_name: event.event_name || "",
                date: event.date || new Date().toISOString().split("T")[0],
                location: event.location || "",
                participation_type: event.participation_type || "participated",
                result: event.result || "",
            });
        } else {
            setFormData({
                event_name: "",
                date: new Date().toISOString().split("T")[0],
                location: "",
                participation_type: "participated",
                result: "",
            });
        }
    }, [event, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate
            if (formData.participation_type === "winner" && !formData.result) {
                toast({
                    title: "Validation Error",
                    description: "Please specify the prize/result for the winner.",
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            const data = new FormData();
            data.append('student', studentId);
            data.append('event_name', formData.event_name);
            data.append('date', formData.date);
            data.append('location', formData.location);
            data.append('participation_type', formData.participation_type);
            if (formData.participation_type === 'winner') {
                data.append('result', formData.result);
            } else {
                data.append('result', "");
            }

            if (event) {
                await api.patch(`/student-events/${event.id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast({
                    title: "Event Updated",
                    description: "Student event participation updated.",
                });
            } else {
                await api.post("/student-events/", data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
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
                    result: "",
                });
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
            <DialogContent className="max-w-md">
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
                        <div className="space-y-2">
                            <Label htmlFor="result">Prize *</Label>
                            <Input
                                id="result"
                                placeholder="e.g., First Place, Gold Medal"
                                value={formData.result}
                                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                                required
                            />
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
