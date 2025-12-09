import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Phone, MapPin } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudentCardProps {
  student: any;
  onEdit: (student: any) => void;
  onDelete: () => void;
}

const StudentCard = ({ student, onEdit, onDelete }: StudentCardProps) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const getBeltColor = (belt: string) => {
    const colors: Record<string, string> = {
      white: "bg-gray-200 text-gray-800",
      yellow_stripe: "bg-yellow-300 text-yellow-900",
      yellow: "bg-yellow-400 text-yellow-900",
      green_stripe: "bg-green-400 text-white",
      green: "bg-green-500 text-white",
      blue_stripe: "bg-blue-400 text-white",
      blue: "bg-blue-500 text-white",
      red_stripe: "bg-red-400 text-white",
      red: "bg-red-500 text-white",
      red_black: "bg-gradient-to-r from-red-600 to-gray-900 text-white",
      black_1st_dan: "bg-gray-900 text-white",
      black_2nd_dan: "bg-gray-900 text-white",
      black_3rd_dan: "bg-gray-900 text-white",
      black_4th_dan: "bg-gray-900 text-white",
      black_5th_dan: "bg-gray-900 text-white",
    };
    return colors[belt] || "bg-gray-200 text-gray-800";
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
    return beltMap[belt] || belt.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${student.id}/`);

      toast({
        title: "Student deleted",
        description: "Student has been successfully removed",
      });

      onDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  return (
    <Card
      className="shadow-card hover:shadow-elevated transition-shadow h-full flex flex-col cursor-pointer"
      onClick={() => navigate(`/students/${student.id}`)}
    >
      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
              <AvatarImage src={student.profile_photo} />
              <AvatarFallback className="bg-primary text-primary-foreground text-base sm:text-lg">
                {student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base sm:text-lg truncate">{student.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {student.age} years • {student.gender}
              </p>
            </div>
          </div>
          <Badge
            className={`${getBeltColor(student.current_belt)} flex-shrink-0 self-start`}
            variant="secondary"
          >
            {formatBeltName(student.current_belt)}
          </Badge>
        </div>

        <div className="space-y-2 text-xs sm:text-sm flex-1">
          {student.registration_number && (
            <p className="text-muted-foreground">
              Reg No: <span className="font-medium text-primary">{student.registration_number}</span>
            </p>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{student.phone_number}</span>
          </div>
          {student.address && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2 break-words">{student.address}</span>
            </div>
          )}
          <p className="text-muted-foreground">
            Guardian: <span className="font-medium break-words">{student.guardian_name}</span>
          </p>
          {student.state && (
            <p className="text-muted-foreground">
              State: <span className="font-medium">{student.state}</span>
            </p>
          )}
          <p className="text-muted-foreground">
            Joined: {new Date(student.admission_date).toLocaleDateString()}
          </p>
          {student.tai_certification_number && (
            <p className="text-muted-foreground">
              TAI Cert: <span className="font-medium">{student.tai_certification_number}</span>
            </p>
          )}
          {student.instructor_name && (
            <p className="text-muted-foreground">
              Instructor: <span className="font-medium">{student.instructor_name}</span>
            </p>
          )}
          <p className="text-muted-foreground">
            DOB: {new Date(student.date_of_birth).toString() !== 'Invalid Date' ? new Date(student.date_of_birth).toLocaleDateString('en-GB') : 'N/A'}
          </p>
          <p className="text-muted-foreground">
            Fee: <span className="font-medium">
              {student.fee_structure === '2_classes_700' ? '2 classes/week - ₹700' : '4 classes/week - ₹1000'}
            </span>
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(student);
              }}
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden xs:inline">Edit</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive px-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Student</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {student.name}? This action
                    cannot be undone and will also delete all associated fees,
                    attendance, and belt test records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentCard;
