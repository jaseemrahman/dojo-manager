import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const BeltTestDialog = ({ open, test, students, onClose }: any) => {
  const [formData, setFormData] = useState({
    student_id: "",
    test_date: new Date().toISOString().split("T")[0],
    tested_for_belt: "yellow",
    test_fee: "50",
    result: "pending",
    examiner_name: "",
    notes: ""
  });
  const [studentInfo, setStudentInfo] = useState({
    dob: "",
    state: "",
    guardian_name: "",
    gender: "",
    age: "",
    instructor_name: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (test) {
      setFormData({
        student_id: test.student.toString(),
        test_date: test.test_date,
        tested_for_belt: test.tested_for_belt,
        test_fee: test.test_fee.toString(),
        result: test.result,
        examiner_name: test.examiner_name || "",
        notes: test.notes || ""
      });
      // Auto-fill student info when editing
      const student = students.find((s: any) => s.id === test.student);
      if (student) {
        setStudentInfo({
          dob: student.date_of_birth || "",
          state: student.state || "",
          guardian_name: student.guardian_name || "",
          gender: student.gender || "",
          age: student.age?.toString() || "",
          instructor_name: student.instructor_name || ""
        });
      }
    } else {
      setFormData({
        student_id: "",
        test_date: new Date().toISOString().split("T")[0],
        tested_for_belt: "yellow",
        test_fee: "50",
        result: "pending",
        examiner_name: "",
        notes: ""
      });
      setStudentInfo({
        dob: "",
        state: "",
        guardian_name: "",
        gender: "",
        age: "",
        instructor_name: ""
      });
    }
  }, [test, open, students]);

  const handleStudentChange = (studentId: string) => {
    setFormData({ ...formData, student_id: studentId });
    // Note: studentId here is string from Select value, but might need parsing if comparing with number ID
    const student = students.find((s: any) => s.id.toString() === studentId);
    if (student) {
      setStudentInfo({
        dob: student.date_of_birth || "",
        state: student.state || "",
        guardian_name: student.guardian_name || "",
        gender: student.gender || "",
        age: student.age?.toString() || "",
        instructor_name: student.instructor_name || ""
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        student: formData.student_id,
        test_date: formData.test_date,
        tested_for_belt: formData.tested_for_belt,
        test_fee: parseFloat(formData.test_fee),
        result: formData.result,
        examiner_name: formData.examiner_name,
        notes: formData.notes
      };

      if (test) {
        await api.patch(`/belt-tests/${test.id}/`, data);
        toast({ title: "Test updated" });
      } else {
        await api.post("/belt-tests/", data);
        toast({ title: "Test scheduled" });
      }
      onClose(true);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.response?.data?.detail || "Failed to save test", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{test ? "Edit Test" : "Schedule Test"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student *</Label>
            <Select value={formData.student_id} onValueChange={handleStudentChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {formData.student_id && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Student Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date of Birth</Label>
                  <Input
                    type="date"
                    value={studentInfo.dob}
                    onChange={(e) => setStudentInfo({ ...studentInfo, dob: e.target.value })}
                    className="text-sm"
                    readOnly
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Age</Label>
                  <Input
                    type="number"
                    value={studentInfo.age}
                    onChange={(e) => setStudentInfo({ ...studentInfo, age: e.target.value })}
                    className="text-sm"
                    readOnly
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Gender</Label>
                  <Input
                    value={studentInfo.gender}
                    className="text-sm"
                    readOnly
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">State</Label>
                  <Input
                    value={studentInfo.state}
                    onChange={(e) => setStudentInfo({ ...studentInfo, state: e.target.value })}
                    className="text-sm"
                    readOnly
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Guardian Name</Label>
                  <Input
                    value={studentInfo.guardian_name}
                    onChange={(e) => setStudentInfo({ ...studentInfo, guardian_name: e.target.value })}
                    className="text-sm"
                    readOnly
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Instructor Name</Label>
                  <Input
                    value={studentInfo.instructor_name}
                    onChange={(e) => setStudentInfo({ ...studentInfo, instructor_name: e.target.value })}
                    className="text-sm"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Test Date *</Label>
            <Input type="date" value={formData.test_date} onChange={(e) => setFormData({ ...formData, test_date: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <Label>Testing For *</Label>
            <Select value={formData.tested_for_belt} onValueChange={(v) => setFormData({ ...formData, tested_for_belt: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="yellow_stripe">Yellow Stripe</SelectItem>
                <SelectItem value="yellow">Yellow</SelectItem>
                <SelectItem value="green_stripe">Green Stripe</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="blue_stripe">Blue Stripe</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="red_stripe">Red Stripe</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="red_black">Red Black</SelectItem>
                <SelectItem value="black_1st_dan">Black 1st Dan</SelectItem>
                <SelectItem value="black_2nd_dan">Black 2nd Dan</SelectItem>
                <SelectItem value="black_3rd_dan">Black 3rd Dan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Test Fee (₹) *</Label>
            <Input type="number" step="0.01" value={formData.test_fee} onChange={(e) => setFormData({ ...formData, test_fee: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <Label>Result</Label>
            <Select value={formData.result} onValueChange={(v) => setFormData({ ...formData, result: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Name of Examiner</Label>
            <Input
              value={formData.examiner_name}
              onChange={(e) => setFormData({ ...formData, examiner_name: e.target.value })}
              placeholder="Enter examiner name"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : test ? "Update" : "Schedule"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BeltTestDialog;
