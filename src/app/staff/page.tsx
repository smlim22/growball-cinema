'use client'
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";

export default function StaffPage() {
  const router = useRouter();
  const [name, setName] = useState('');
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

  return (
    <div className="py-10 px-12 font-inter">
      <h1 className="text-2xl font-bold mb-4">Welcome, {name}</h1>
      <div className="flex gap-4">
        <div className="inline-block bg-white p-3 rounded-md shadow-md">
          <h2 className="text-xl font-semibold my-4">Start Transaction</h2>
          <p className="text-lg mb-4 justify-items-end">
            <MoveRight className="cursor-pointer" onClick={() => router.push("/staff/pos")}/>
          </p>
        </div>
        <div className="inline-block bg-white p-3 rounded-md shadow-md">
          <h2 className="text-xl font-semibold my-4">Orders Pending</h2>
          <p className="text-lg mb-4">0</p>
        </div>
      </div>
    </div>
  )
}