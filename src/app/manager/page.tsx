'use client'
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Theme, Button } from '@radix-ui/themes';
import { FileIcon } from "@radix-ui/react-icons";
import { SquareArrowOutUpRight } from "lucide-react";
import TicketChart from "@/app/components/TicketChart";
import FNBChart from "../components/FNBChart";
import { generateTicketSalesReportPDF } from "@/app/utils/ticketSalesReport";
import { generateFNBSalesReportPDF } from "@/app/utils/fnbSalesReport";

export default function ManagerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [noOfShowtimes, setNoOfShowtimes] = useState<number>(0);
  const [noOfComplaints, setNoOfComplaints] = useState<number>(0);
  const today = new Date().toISOString().split("T")[0];
  const [startDateTicket, setStartDateTicket] = useState<string>("");
  const [endDateTicket, setEndDateTicket] = useState<string>("");
  const [startDateFNB, setStartDateFNB] = useState<string>("");
  const [endDateFNB, setEndDateFNB] = useState<string>("");
  const [isGeneratingTicketReport, setIsGeneratingTicketReport] = useState(false);
  const [isGeneratingFNBReport, setIsGeneratingFNBReport] = useState(false);

  useEffect(() => {
    const getUserName = async () => {
      const {data: {user}} = await supabase.auth.getUser();

      if (!user){
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("staff")
        .select("staff_name")
        .eq("uuid", user.id)
        .single();

      if (error) {
        console.error("Error fetching staff name:", error);
        return;
      }

      setName(data?.staff_name);
    }
    getUserName();
  });

  useEffect(() => {
    const countShowtimes = async () => {
      const { count, error } = await supabase.from("showtimes")
        .select("*", { count: 'exact', head: true })
        .eq("date", today);
      
      if (error) {
        console.error("Error counting showtimes:", error);
        return;
      }

      setNoOfShowtimes(count ?? 0);
    }

    countShowtimes();
  });

  useEffect(() => {
    const countComplaints = async () => {
      const { count, error } = await supabase.from("complaint")
        .select("*", { count: 'exact', head: true })
        .eq("date", today);
      
      if (error) {
        console.error("Error counting complaints:", error);
        return;
      }
      setNoOfComplaints(count ?? 0)
    }
    countComplaints();
  });

  useEffect(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth();
    
    // First day of current month
    const firstDay = new Date(year, month, 2);
    const startFormatted = firstDay.toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Last day of current month
    const lastDay = new Date(year, month + 1, 1);
    const endFormatted = lastDay.toISOString().split("T")[0]; // YYYY-MM-DD
    
    setStartDateTicket(startFormatted);
    setEndDateTicket(endFormatted);
    setStartDateFNB(startFormatted);
    setEndDateFNB(endFormatted);
  }, []);

  const handleDownloadTicketReport = async () => {
    if (!startDateTicket || !endDateTicket) {
      alert('Please select a date range');
      return;
    }

    setIsGeneratingTicketReport(true);
    try {
      await generateTicketSalesReportPDF(startDateTicket, endDateTicket);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingTicketReport(false);
    }
  };

  const handleDownloadFNBReport = async () => {
    if (!startDateFNB || !endDateFNB) {
      alert('Please select a date range');
      return;
    }

    setIsGeneratingFNBReport(true);
    try {
      await generateFNBSalesReportPDF(startDateFNB, endDateFNB);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingFNBReport(false);
    }
  };

  return (
    <div className="py-10 px-6 md:px-12 font-inter">
      <h1 className="text-2xl font-bold mb-4">Welcome, {name}</h1>
      <div className="flex gap-4 mb-8 flex-col md:flex-row">
        <div className="flex flex-col bg-white px-6 py-5 gap-5 rounded-2xl shadow-lg w-full md:w-1/3">
          <h2 className="text-xl font-bold">Today's Running Showtime</h2>
          <div className="text-3xl font-semibold text-center">
            {noOfShowtimes}
          </div>
        </div>
        <div 
          className="cursor-pointer flex flex-col bg-white px-6 py-5 gap-5 rounded-2xl shadow-lg w-full md:w-1/3"
          onClick={() => router.push("/manager/feedback-complaint")}
        >
          <h2 className="text-xl font-bold flex items-center gap-3">
            Complaints Reported Today
            <SquareArrowOutUpRight 
              size={20}
              className="cursor-pointer" 
              onClick={() => router.push("/manager/feedback-complaint")}
            />  
          </h2>
          <div className="text-3xl font-semibold text-center">
            {noOfComplaints}
          </div>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="flex gap-4 flex-col md:flex-row">
        <div className="bg-white px-6 py-5 rounded-2xl shadow-lg w-full md:w-1/2">
          <div className="flex flex-col gap-5 mb-4">
            <h2 className="text-xl font-bold">Ticket Sales Summary</h2>
            <div className="flex gap-4">
              <div className="flex gap-2 items-center">
                <label>From:</label>
                <input 
                  type="date" 
                  className="border border-gray-300 p-2 rounded-md"
                  value={startDateTicket}
                  onChange={(e) => setStartDateTicket(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                <label>To:</label>
                <input 
                  type="date" 
                  className="border border-gray-300 p-2 rounded-md"
                  value={endDateTicket}
                  onChange={(e) => setEndDateTicket(e.target.value)}
                  min={startDateTicket}
                />
              </div>
            </div>
          </div>
          <TicketChart startDate={startDateTicket} endDate={endDateTicket}/>
          <Theme className="inline">
            <Button
              variant="solid"
              color="green"
              onClick={handleDownloadTicketReport}
              disabled={isGeneratingTicketReport || !startDateTicket || !endDateTicket}
            >
              <FileIcon/> {isGeneratingTicketReport ? 'Generating...' : 'Download Detailed Report'}
            </Button>
          </Theme>
        </div>
        <div className="bg-white px-6 py-5 rounded-2xl shadow-lg w-full md:w-1/2">
          <div className="flex flex-col gap-5 mb-4">
            <h2 className="text-xl font-bold">F&B Sales Summary</h2>
            <div className="flex gap-4">
              <div className="flex gap-2 items-center">
                <label>From:</label>
                <input 
                  type="date" 
                  className="border border-gray-300 p-2 rounded-md"
                  value={startDateFNB}
                  onChange={(e) => setStartDateFNB(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                <label>To:</label>
                <input 
                  type="date" 
                  className="border border-gray-300 p-2 rounded-md"
                  value={endDateFNB}
                  onChange={(e) => setEndDateFNB(e.target.value)}
                  min={startDateFNB}
                />
              </div>
            </div>
          </div>
          <FNBChart startDate={startDateFNB} endDate={endDateFNB} />
          <Theme className="inline">
            <Button
              variant="solid"
              color="green"
              onClick={handleDownloadFNBReport}
              disabled={isGeneratingFNBReport || !startDateFNB || !endDateFNB}
            >
              <FileIcon/> {isGeneratingFNBReport ? 'Generating...' : 'Download Detailed Report'}
            </Button>
          </Theme>
        </div>
      </div>
    </div>
  )
}
