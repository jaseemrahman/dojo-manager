import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { z } from "zod";

interface StudentDialogProps {
  open: boolean;
  student: any | null;
  onClose: (refresh: boolean) => void;
}

// Comprehensive Indian States and Districts
const districtsByState: Record<string, string[]> = {
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR District, Kadapa (Cuddapah)"],
  "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao (North Cachar Hills)", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran (Motihari)", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur (Bhabua)", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger (Monghyr)", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia (Purnea)", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada (South Bastar)", "Dhamtari", "Durg", "Gariyaband", "Janjgir-Champa", "Jashpur", "Kabirdham (Kawardha)", "Kanker (North Bastar)", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha (Palanpur)", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang (Ahwa)", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kachchh", "Kheda (Nadiad)", "Mahisagar", "Mehsana", "Morbi", "Narmada (Rajpipla)", "Navsari", "Panchmahal (Godhra)", "Patan", "Porbandar", "Rajkot", "Sabarkantha (Himmatnagar)", "Surat", "Surendranagar", "Tapi (Vyara)", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram (Gurgaon)", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul &amp; Spiti", "Mandi", "Shimla", "Sirmaur (Sirmour)", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum (Jamshedpur)", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribag", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela-Kharsawan", "Simdega", "West Singhbhum (Chaibasa)"],
  "Karnataka": ["Bagalkot", "Ballari (Bellary)", "Belagavi (Belgaum)", "Bengaluru (Bangalore) Rural", "Bengaluru (Bangalore) Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru (Chikmagalur)", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi (Gulbarga)", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru (Mysore)", "Raichur", "Ramanagara", "Shivamogga (Shimoga)", "Tumakuru (Tumkur)", "Udupi", "Uttara Kannada (Karwar)", "Vijayapura (Bijapur)", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
  "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Noklak", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar (Keonjhar)", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Nawanshahr (Shahid Bhagat Singh Nagar)", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar (Mohali)", "Sangrur", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi (Tuticorin)", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhoopalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal (Rural)", "Warangal (Urban)", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi (Chatrapati Sahuji Mahraj Nagar)", "Amroha (J.P. Nagar)", "Auraiya", "Ayodhya (Faizabad)", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur (Panchsheel Nagar)", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj (Kanshiram Nagar)", "Kaushambi", "Kheri", "Kushinagar (Padrauna)", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal (Bhim Nagar)", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur (South Dinajpur)", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman (West Bardhaman)", "Paschim Medinipur (West Medinipur)", "Purba Bardhaman (East Bardhaman)", "Purba Medinipur (East Medinipur)", "Purulia", "South 24 Parganas", "Uttar Dinajpur (North Dinajpur)"]
};

const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  age: z.number().min(1, "Age must be at least 1").max(99, "Age must be less than 100"),
  gender: z.enum(["male", "female", "other"]),
  guardian_name: z.string().trim().min(1, "Guardian name is required").max(100),
  phone_number: z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  address: z.string().max(500).optional(),
  state: z.string().trim().min(1, "State is required").max(100),
  district: z.string().trim().min(1, "District is required").max(100),
  national_id: z.string().trim().max(50).optional(),
  admission_fee: z.string().optional().refine((val) => !val || parseFloat(val) <= 5000, "Admission fee cannot exceed 5000"),
  current_belt: z.string(),
  tai_certification_number: z.string().trim().regex(/^[A-Za-z0-9-]*$/, "Only letters, numbers, and hyphens allowed").max(20, "Maximum 20 characters").optional(),
  instructor_name: z.string().trim().regex(/^[A-Za-z\s]*$/, "Only letters and spaces allowed").max(100).optional(),
  fee_structure: z.enum(["2_classes_700", "4_classes_1000"]),
  date_of_birth: z.string().min(1, "Date of birth is required"),
});

const StudentDialog = ({ open, student, onClose }: StudentDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male",
    guardian_name: "",
    phone_number: "",
    address: "",
    state: "",
    district: "",
    national_id: "",
    admission_fee: "",
    current_belt: "white",
    admission_date: new Date().toISOString().split("T")[0],
    tai_certification_number: "",
    instructor_name: "",
    fee_structure: "2_classes_700",
    date_of_birth: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        age: student.age?.toString() || "",
        gender: student.gender || "male",
        guardian_name: student.guardian_name || "",
        phone_number: student.phone_number || "",
        address: student.address || "",
        state: student.state || "",
        district: student.district || "",
        national_id: student.national_id || "",
        admission_fee: student.admission_fee?.toString() || "",
        current_belt: student.current_belt || "white",
        admission_date: student.admission_date || new Date().toISOString().split("T")[0],
        tai_certification_number: student.tai_certification_number || "",
        instructor_name: student.instructor_name || "",
        fee_structure: student.fee_structure || "2_classes_700",
        date_of_birth: student.date_of_birth || "",
      });
    } else {
      setFormData({
        name: "",
        age: "",
        gender: "male",
        guardian_name: "",
        phone_number: "",
        address: "",
        state: "",
        district: "",
        national_id: "",
        admission_fee: "",
        current_belt: "white",
        admission_date: new Date().toISOString().split("T")[0],
        tai_certification_number: "",
        instructor_name: "",
        fee_structure: "2_classes_700",
        date_of_birth: "",
      });
    }
    setPhotoFile(null);
  }, [student, open]);

  // Handle state change - reset district if logic requires (optional, but good UX)
  const handleStateChange = (value: string) => {
    setFormData(prev => ({ ...prev, state: value, district: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Calculate age from date of birth
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }

      const validatedData = studentSchema.parse({
        ...formData,
        age: calculatedAge,
      });

      setLoading(true);

      const data = new FormData();
      data.append("name", validatedData.name);
      data.append("age", validatedData.age.toString());
      data.append("gender", validatedData.gender);
      data.append("guardian_name", validatedData.guardian_name);
      data.append("phone_number", validatedData.phone_number);
      data.append("address", validatedData.address || "");
      data.append("state", validatedData.state);
      data.append("district", validatedData.district);
      data.append("national_id", validatedData.national_id || "");
      data.append("admission_fee", validatedData.admission_fee || "0");
      data.append("current_belt", formData.current_belt);
      data.append("admission_date", formData.admission_date);
      data.append("tai_certification_number", validatedData.tai_certification_number || "");
      data.append("instructor_name", validatedData.instructor_name || "");
      data.append("fee_structure", validatedData.fee_structure);
      data.append("date_of_birth", validatedData.date_of_birth);

      // Generate registration number if new
      if (!student) {
        const dobDate = new Date(validatedData.date_of_birth);
        const day = dobDate.getDate().toString().padStart(2, '0');
        const month = (dobDate.getMonth() + 1).toString().padStart(2, '0');
        const year = dobDate.getFullYear();
        const registrationNumber = `MTA${day}${month}${year}`;
        data.append("registration_number", registrationNumber);
      }

      data.append("is_active", "true");

      if (photoFile) {
        data.append("profile_photo", photoFile);
      }

      if (student) {
        await api.patch(`/students/${student.id}/`, data);

        toast({
          title: "Student updated",
          description: "Student information has been updated successfully",
        });
      } else {
        await api.post("/students/", data);

        toast({
          title: "Student added",
          description: "New student has been added successfully",
        });
      }

      onClose(true);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error(error);
        let errorMessage = "Failed to save student";

        // Try to extract specific field errors from backend response
        if (error.response?.data) {
          const data = error.response.data;
          if (typeof data === 'object' && !Array.isArray(data)) {
            const messages = Object.entries(data)
              .map(([field, msgs]: [string, any]) => {
                const msgText = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                return `${fieldName}: ${msgText}`;
              });
            if (messages.length > 0) {
              errorMessage = messages.join('\n');
            } else if (data.detail) {
              errorMessage = data.detail;
            }
          } else if (Array.isArray(data)) {
            errorMessage = data.join(' ');
          }
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {student ? "Edit Student" : "Add New Student"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-border cursor-pointer group hover:opacity-90 transition-opacity"
                onClick={() => document.getElementById("photo")?.click()}
              >
                {photoFile ? (
                  <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-full w-full object-cover" />
                ) : student?.profile_photo ? (
                  <img src={student.profile_photo} alt={student.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-6 w-6 text-white" />
                </div>
              </div>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground">Tap to upload photo</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardian_name">Guardian/Parent Name *</Label>
            <Input
              id="guardian_name"
              value={formData.guardian_name}
              onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              maxLength={20}
              required
            />
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="national_id">National ID</Label>
              <Input
                id="national_id"
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                maxLength={50}
                placeholder="e.g. Aadhar/Passport"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admission_fee">Admission Fee</Label>
              <Input
                id="admission_fee"
                type="number"
                value={formData.admission_fee}
                onChange={(e) => {
                  if (e.target.value.length <= 5) {
                    setFormData({ ...formData, admission_fee: e.target.value });
                  }
                }}
                max="5000"
                placeholder=""
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admission_date">Admission Date *</Label>
              <Input
                id="admission_date"
                type="date"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tai_certification_number">TAI Certification Number</Label>
              <Input
                id="tai_certification_number"
                value={formData.tai_certification_number}
                onChange={(e) => setFormData({ ...formData, tai_certification_number: e.target.value })}
                maxLength={20}
                placeholder="e.g., TAI12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor_name">Instructor Name</Label>
              <Input
                id="instructor_name"
                value={formData.instructor_name}
                onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                maxLength={100}
                placeholder="e.g., John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_belt">Current Belt & Level *</Label>
            <Select value={formData.current_belt} onValueChange={(value) => setFormData({ ...formData, current_belt: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
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
                <SelectItem value="black_4th_dan">Black 4th Dan</SelectItem>
                <SelectItem value="black_5th_dan">Black 5th Dan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee_structure">Fee Structure *</Label>
            <Select value={formData.fee_structure} onValueChange={(value) => setFormData({ ...formData, fee_structure: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="2_classes_700">2 classes/week - ₹700</SelectItem>
                <SelectItem value="4_classes_1000">4 classes/week - ₹1000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select value={formData.state} onValueChange={handleStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {Object.keys(districtsByState).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Select
                value={formData.district}
                onValueChange={(value) => setFormData({ ...formData, district: value })}
                disabled={!formData.state}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.state ? "Select district" : "Select state first"} />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {formData.state && districtsByState[formData.state]?.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              maxLength={500}
              rows={2}
            />
          </div>



          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : student ? "Update" : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog >
  );
};

export default StudentDialog;
