'use client'
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      <div className="flex gap-4">
        <div className="inline-block bg-white p-3 rounded-md shadow-md">
          <h2 className="text-xl font-semibold my-4">Today's Running Showtime</h2>
          <p className="text-lg mb-4">{noOfShowtimes}</p>
        </div>
        <div className="inline-block bg-white p-3 rounded-md shadow-md">
          <h2 className="text-xl font-semibold my-4">Complaints Reported Today</h2>
          <p className="text-lg mb-4">0</p>
        </div>
      </div>
    </div>
  )
}
