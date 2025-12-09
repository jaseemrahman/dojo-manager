import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { User as UserIcon, Calendar, Info, Pencil, Upload, Eye, EyeOff, Save, X, Building2, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Comprehensive Indian States and Districts (same as StudentDialog)
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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProfileData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    address: string;
    state: string;
    district: string;
    profile_photo: string | null;
    academy_name: string;
    plain_password?: string;
}

const Profile = () => {
    const [profileData, setProfileData] = useState<ProfileData>({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        address: "",
        state: "",
        district: "",
        profile_photo: "", // Url
        academy_name: "",
        plain_password: "",
    });

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password Change State
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [viewImageModalOpen, setViewImageModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ new_password: "", confirm_password: "" });
    const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
    const [passLoading, setPassLoading] = useState(false);
    // State for viewing plain password in profile
    const [showPlainPassword, setShowPlainPassword] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get("/users/me/");
            setProfileData({
                username: response.data.username || "",
                email: response.data.email || "",
                first_name: response.data.first_name || "",
                last_name: response.data.last_name || "",
                phone_number: response.data.phone_number || "",
                address: response.data.address || "",
                state: response.data.state || "",
                district: response.data.district || "",
                profile_photo: response.data.profile_photo || null,
                academy_name: response.data.academy_name || "",
                plain_password: response.data.plain_password || "",
            });
        } catch (error) {
            toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const initials = (profileData.academy_name || profileData.first_name || "A").substring(0, 2).toUpperCase();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Phone Validation
        const phoneRegex = /^\d{10}$/;
        if (profileData.phone_number && !phoneRegex.test(profileData.phone_number)) {
            toast({ title: "Validation Error", description: "Phone number must be exactly 10 digits", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("phone_number", profileData.phone_number);
            formData.append("state", profileData.state);
            formData.append("district", profileData.district);
            formData.append("address", profileData.address);
            formData.append("academy_name", profileData.academy_name);

            if (photoFile) {
                formData.append("profile_photo", photoFile);
            }

            const response = await api.patch("/users/me/", formData);

            toast({ title: "Success", description: "Profile updated successfully" });

            setProfileData(prev => ({
                ...prev,
                profile_photo: response.data.profile_photo || prev.profile_photo,
                academy_name: response.data.academy_name || prev.academy_name, // ensure name update reflects immediately
                plain_password: response.data.plain_password || prev.plain_password
            }));

            setEditModalOpen(false);
            setPhotoFile(null);
            setPhotoPreview(null);
        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.data) {
                const data = error.response.data;
                if (data.profile_photo) {
                    toast({ title: "Error", description: data.profile_photo[0], variant: "destructive" });
                } else if (data.phone_number) {
                    toast({ title: "Error", description: data.phone_number[0], variant: "destructive" });
                } else {
                    toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
                }
            } else {
                toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password.length < 8) {
            toast({ title: "Error", description: "Password must be at least 8 characters long", variant: "destructive" });
            return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }
        setPassLoading(true);
        try {
            await api.post("/users/change_password/", {
                new_password: passwordData.new_password,
            });
            toast({ title: "Success", description: "Password changed successfully" });
            setPasswordData({ new_password: "", confirm_password: "" });
            setPasswordModalOpen(false);
            // Refresh profile to get the new plain password if needed, or just warn user
            fetchProfile();
        } catch (error: any) {
            const msg = error.response?.data?.new_password?.[0] || "Failed";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setPassLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Profile</h1>
                <Button onClick={() => setEditModalOpen(true)} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                    <Pencil className="h-4 w-4" /> Edit Profile
                </Button>
            </div>

            <Card className="shadow-sm border-border">
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => setViewImageModalOpen(true)}
                            >
                                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-md">
                                    <AvatarImage src={profileData.profile_photo || undefined} className="object-cover" />
                                    <AvatarFallback className="text-2xl bg-muted">{initials}</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="text-center sm:text-left space-y-1">
                                <h2 className="text-2xl font-bold">{profileData.academy_name || "Academy User"}</h2>
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span>{profileData.email}</span>
                                </div>
                                {profileData.academy_name && (
                                    <Badge variant="secondary" className="mt-2">
                                        {profileData.academy_name}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Compact Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Password Row */}
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Password</p>
                                <div className="flex items-center justify-between">
                                    <p className="font-medium font-mono text-lg">
                                        {showPlainPassword && profileData.plain_password
                                            ? profileData.plain_password
                                            : "********"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                if (!profileData.plain_password) {
                                                    toast({
                                                        title: "View Unavailable",
                                                        description: "Password text is not available for this account yet. Please change password to enable viewing.",
                                                    });
                                                } else {
                                                    setShowPlainPassword(!showPlainPassword);
                                                }
                                            }}
                                            title={profileData.plain_password ? "Toggle Visibility" : "Not Available"}
                                        >
                                            {showPlainPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setPasswordModalOpen(true)}
                                            title="Change Password"
                                        >
                                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">State</p>
                                <p className="font-medium">{profileData.state || "-"}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">District</p>
                                <p className="font-medium">{profileData.district || "-"}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Phone Number</p>
                                <p className="font-medium">{profileData.phone_number || "-"}</p>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-1">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">{profileData.address || "-"}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Profile Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleProfileUpdate} className="space-y-6 pt-4">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                    <AvatarImage src={photoPreview || profileData.profile_photo || undefined} />
                                    <AvatarFallback className="text-3xl bg-muted">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <div className="space-y-2 text-center sm:text-left">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Change Photo
                                </Button>
                                <p className="text-xs text-muted-foreground">JPG, PNG or GIF (max. 2MB)</p>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Academy Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-8"
                                        value={profileData.academy_name}
                                        onChange={(e) => setProfileData({ ...profileData, academy_name: e.target.value })}
                                        placeholder="Enter academy name"
                                    />
                                </div>
                            </div>
                            {/* Email Read Only inside Edit Modal too? Yes, usually. */}
                            <div className="space-y-2 col-span-2">
                                <Label>Email (Read-only)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input value={profileData.email} disabled className="pl-8 bg-muted" />
                                </div>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>Phone Number</Label>
                                <Input
                                    value={profileData.phone_number}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setProfileData({ ...profileData, phone_number: val });
                                    }}
                                    placeholder="Enter phone number"
                                    type="tel"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>State</Label>
                                <Select value={profileData.state} onValueChange={(val) => setProfileData({ ...profileData, state: val, district: "" })}>
                                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(districtsByState).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>District</Label>
                                <Select
                                    value={profileData.district}
                                    onValueChange={(val) => setProfileData({ ...profileData, district: val })}
                                    disabled={!profileData.state}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                                    <SelectContent>
                                        {profileData.state && districtsByState[profileData.state]?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Address</Label>
                                <Input
                                    value={profileData.address}
                                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                    placeholder="Enter your address"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Password Modal */}
            <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword.new ? "text" : "password"}
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    required
                                    minLength={8}
                                />
                                <button type="button" onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })} className="absolute right-3 top-2.5 text-muted-foreground">
                                    {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword.confirm ? "text" : "password"}
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })} className="absolute right-3 top-2.5 text-muted-foreground">
                                    {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" disabled={passLoading} className="w-full bg-red-600 hover:bg-red-700">
                            {passLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Image Preview Modal */}
            <Dialog open={viewImageModalOpen} onOpenChange={setViewImageModalOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-transparent border-none shadow-none text-white">
                    <div className="relative flex items-center justify-center min-h-[400px]">
                        <img
                            src={profileData.profile_photo || ""}
                            alt="Profile"
                            className="max-w-full max-h-[80vh] object-contain rounded-md"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Profile;
