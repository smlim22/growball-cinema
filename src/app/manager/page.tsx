'use client'
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Theme, Button } from '@radix-ui/themes';
import { FileIcon } from "@radix-ui/react-icons";
import { MoveRight } from "lucide-react";
import TicketChart from "@/app/components/TicketChart";
import FNBChart from "../components/FNBChart";

export default function ManagerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [noOfShowtimes, setNoOfShowtimes] = useState<number>(0);
  const today = new Date().toISOString().split("T")[0];
  const [startDateTicket, setStartDateTicket] = useState<string>("");
  const [endDateTicket, setEndDateTicket] = useState<string>("");
  const [startDateFNB, setStartDateFNB] = useState<string>("");
  const [endDateFNB, setEndDateFNB] = useState<string>("");

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

  return (
    <div className="py-10 px-12 font-inter">
      <h1 className="text-2xl font-bold mb-4">Welcome, {name}</h1>
      <div className="flex gap-4 mb-8">
        <div className="inline-block bg-white p-3 rounded-md shadow-md">
          <h2 className="text-xl font-semibold my-4">Today's Running Showtime</h2>
          <p className="text-lg mb-4">{noOfShowtimes}</p>
        </div>
        <div className="inline-block bg-white p-3 rounded-md shadow-md">
          <h2 className="text-xl font-semibold my-4">Complaints Reported Today</h2>
          <p className="flex justify-between items-center text-lg mb-4">
            0 
            <span> 
              <MoveRight className="cursor-pointer" onClick={() => router.push("/manager/feedback-complaint")}/>
            </span> 
          </p>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="flex gap-4 flex-row">
        <div className="bg-white p-4 rounded-md shadow-md">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-xl text-start font-bold">Ticket Sales Summary</h2>
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
            >
              <FileIcon/> Download Detailed Report
            </Button>
          </Theme>
        </div>
        <div className="bg-white p-4 rounded-md shadow-md">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-xl text-start font-bold">FNB Sales Summary</h2>
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
            >
              <FileIcon/> Download Detailed Report
            </Button>
          </Theme>
        </div>
      </div>
    </div>
  )
}
