import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, Award } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const BeltTestCard = ({ test, student, onEdit, onDelete }: any) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const handleDelete = async () => {
    try {
      await api.delete(`/belt-tests/${test.id}/`);
      toast({ title: "Test deleted", description: "Belt test has been removed" });
      onDelete();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete test", variant: "destructive" });
    }
  };

  const getResultBadge = (result: string) => {
    const styles = { passed: "bg-green-100 text-green-800", failed: "bg-red-100 text-red-800", pending: "bg-blue-100 text-blue-800" };
    return styles[result as keyof typeof styles];
  };

  const formatBeltName = (belt: string) => {
    const beltMap: Record<string, string> = {
      white: "White",
      yellow_stripe: "Yellow Stripe",
      yellow: "Yellow",
      green_stripe: "Green Stripe",
      green: "Green",
      blue_stripe: "Blue Stripe",
      blue: "Blue",
      red_stripe: "Red Stripe",
      red: "Red",
      red_black: "Red Black",
      black_1st_dan: "Black 1st Dan",
      black_2nd_dan: "Black 2nd Dan",
      black_3rd_dan: "Black 3rd Dan",
      black_4th_dan: "Black 4th Dan",
      black_5th_dan: "Black 5th Dan",
    };
    return beltMap[belt] || belt.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const getBeltColor = (belt: string) => {
    const colorMap: Record<string, string> = {
      white: "bg-gray-100 text-gray-800 border-gray-300",
      yellow_stripe: "bg-gradient-to-r from-white to-yellow-400 text-gray-800 border-yellow-400",
      yellow: "bg-yellow-400 text-gray-800 border-yellow-500",
      green_stripe: "bg-gradient-to-r from-white to-green-500 text-white border-green-500",
      green: "bg-green-600 text-white border-green-700",
      blue_stripe: "bg-gradient-to-r from-white to-blue-500 text-white border-blue-500",
      blue: "bg-blue-600 text-white border-blue-700",
      red_stripe: "bg-gradient-to-r from-white to-red-500 text-white border-red-500",
      red: "bg-red-600 text-white border-red-700",
      red_black: "bg-gradient-to-r from-red-600 to-black text-white border-red-700",
      black_1st_dan: "bg-black text-white border-gray-800",
      black_2nd_dan: "bg-black text-white border-gray-800",
      black_3rd_dan: "bg-black text-white border-gray-800",
      black_4th_dan: "bg-black text-white border-gray-800",
      black_5th_dan: "bg-black text-white border-gray-800",
    };
    return colorMap[belt] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{student?.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(test.test_date).toLocaleDateString()}
            </p>
          </div>
          <Badge className={getResultBadge(test.result)} variant="outline">
            {test.result.charAt(0).toUpperCase() + test.result.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <p className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Testing for:
            <Badge
              variant="outline"
              className={`${getBeltColor(test.tested_for_belt)} font-semibold`}
            >
              {formatBeltName(test.tested_for_belt)}
            </Badge>
          </p>
          <p className="text-muted-foreground">Fee: ₹{parseFloat(test.test_fee).toFixed(2)}</p>
          {test.examiner_name && (
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">Examiner:</span> {test.examiner_name}
            </p>
          )}
          {test.notes && <p className="text-muted-foreground text-xs mt-2">{test.notes}</p>}
        </div>

        <div className="mt-auto">
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(test)}><Edit className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete Test</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BeltTestCard;
