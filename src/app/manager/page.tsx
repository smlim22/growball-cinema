'use client'
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Theme, Button } from '@radix-ui/themes';
import { FileIcon } from "@radix-ui/react-icons";

export default function ManagerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [noOfShowtimes, setNoOfShowtimes] = useState<number>(0);
  const today = new Date().toISOString().split("T")[0];

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
          <p className="text-lg mb-4">0</p>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="flex gap-4 flex-row">
        <div className="bg-white p-4 rounded-md shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl font-bold">Ticket Sales Summary</h2>
            <div className="flex gap-4">
              <div className="flex gap-2 items-center">
                <label>Year:</label>
                <select className="border border-gray-300 p-2 rounded-md">
                  <option>2025</option>
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <label>Month:</label>
                <select className="border border-gray-300 p-2 rounded-md">
                  <option>January</option>
                </select>
              </div>
            </div>
          </div>
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
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl font-bold">FNB Sales Summary</h2>
            <div className="flex gap-4">
              <div className="flex gap-2 items-center">
                <label>Year:</label>
                <select className="border border-gray-300 p-2 rounded-md">
                  <option>2025</option>
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <label>Month:</label>
                <select className="border border-gray-300 p-2 rounded-md">
                  <option>January</option>
                </select>
              </div>
            </div>
          </div>
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
