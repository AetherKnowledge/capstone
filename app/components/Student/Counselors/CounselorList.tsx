"use client";

import { useState } from "react";
import { IoIosSearch } from "react-icons/io";
import SelectBox from "../../SelectBox";
import CounselorsTable from "./CounselorsTable";

const CounselorList = () => {
  const [name, setName] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-[82vh]">
      <div className="p-4 border-b-1 border-none rounded-t-2xl text-base-content bg-base-100">
        <h2 className="text-3xl font-bold text-primary">Users</h2>
      </div>
      <div className="divider mt-[-8] pl-3 pr-3" />
      <div className="flex flex-row items-center justify-center gap-3 pr-5 pl-5">
        <label className="input w-full outline-none ring-0 focus-within:outline-none focus-within:ring-0">
          <IoIosSearch className="text-xl text-base-content" />
          <input
            type="text"
            className="grow text-base-content outline-none ring-0 focus:outline-none focus:ring-0"
            placeholder="Search users..."
            onChange={(e) => {
              setName(e.target.value.trim() || null);
            }}
          />
        </label>
        <SelectBox
          items={["All", "Online", "Offline"]}
          placeholder="Status"
          queryKey="status"
          defaultValue="All"
          className="w-[12vw] min-w-30"
        />
      </div>
      <CounselorsTable name={name ?? undefined} />
    </div>
  );
};

export default CounselorList;
