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
    instructor_name: "",
    current_belt: ""
  });
  const [currentBeltLevel, setCurrentBeltLevel] = useState("");
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
        fetchStudentBeltLevel(student.id);
        setStudentInfo({
          dob: student.date_of_birth || "",
          state: student.state || "",
          guardian_name: student.guardian_name || "",
          gender: student.gender || "",
          age: student.age?.toString() || "",
          instructor_name: student.instructor_name || "",
          current_belt: student.current_belt || "white"
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
        instructor_name: "",
        current_belt: ""
      });
      setCurrentBeltLevel("");
    }
  }, [test, open, students]);

  const fetchStudentBeltLevel = async (studentId: number) => {
    try {
      const response = await api.get(`/belt-tests/?student=${studentId}`);
      const beltTests = response.data || [];
      const passedTests = beltTests.filter((t: any) => t.result === 'passed');

      if (passedTests.length > 0) {
        // Get the latest passed test
        const latestTest = passedTests.sort((a: any, b: any) =>
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
        )[0];
        setCurrentBeltLevel(latestTest.tested_for_belt);
      } else {
        // Use student's initial belt level
        const student = students.find((s: any) => s.id === studentId);
        setCurrentBeltLevel(student?.current_belt || "white");
      }
    } catch (error) {
      console.error("Failed to fetch belt tests:", error);
      const student = students.find((s: any) => s.id === studentId);
      setCurrentBeltLevel(student?.current_belt || "white");
    }
  };

  const handleStudentChange = (studentId: string) => {
    setFormData({ ...formData, student_id: studentId });
    // Note: studentId here is string from Select value, but might need parsing if comparing with number ID
    const student = students.find((s: any) => s.id.toString() === studentId);
    if (student) {
      fetchStudentBeltLevel(student.id);
      setStudentInfo({
        dob: student.date_of_birth || "",
        state: student.state || "",
        guardian_name: student.guardian_name || "",
        gender: student.gender || "",
        age: student.age?.toString() || "",
        instructor_name: student.instructor_name || "",
        current_belt: student.current_belt || "white"
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
                  <Label className="text-xs">Current Belt Level</Label>
                  <div className="text-sm font-semibold px-3 py-2 bg-background border rounded-md">
                    {currentBeltLevel ? currentBeltLevel.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Loading...'}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date of Birth</Label>
                  <Input
                    type="date"
                    value={studentInfo.dob}
                    className="text-sm"
                    readOnly
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Age</Label>
                  <Input
                    type="number"
                    value={studentInfo.age}
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
                    className="text-sm"
                    readOnly
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Guardian Name</Label>
                  <Input
                    value={studentInfo.guardian_name}
                    className="text-sm"
                    readOnly
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Instructor Name</Label>
                  <Input
                    value={studentInfo.instructor_name}
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
                {(() => {
                  const beltLevels = [
                    { value: 'white', label: 'White', order: 0 },
                    { value: 'yellow_stripe', label: 'Yellow Stripe', order: 1 },
                    { value: 'yellow', label: 'Yellow', order: 2 },
                    { value: 'green_stripe', label: 'Green Stripe', order: 3 },
                    { value: 'green', label: 'Green', order: 4 },
                    { value: 'blue_stripe', label: 'Blue Stripe', order: 5 },
                    { value: 'blue', label: 'Blue', order: 6 },
                    { value: 'red_stripe', label: 'Red Stripe', order: 7 },
                    { value: 'red', label: 'Red', order: 8 },
                    { value: 'red_black', label: 'Red Black', order: 9 },
                    { value: 'black_1st_dan', label: 'Black 1st Dan', order: 10 },
                    { value: 'black_2nd_dan', label: 'Black 2nd Dan', order: 11 },
                    { value: 'black_3rd_dan', label: 'Black 3rd Dan', order: 12 }
                  ];

                  if (!formData.student_id || !currentBeltLevel) {
                    return beltLevels.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ));
                  }

                  const currentBeltOrder = beltLevels.find(b => b.value === currentBeltLevel)?.order || 0;

                  // Only show belts higher than current
                  return beltLevels
                    .filter(b => b.order > currentBeltOrder)
                    .map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ));
                })()}
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
