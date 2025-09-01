"use client";
import { UserType } from "@/app/generated/prisma"; // Adjust the import path as necessary
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AiFillHome } from "react-icons/ai";
import { FaCalendar, FaRobot, FaUsers } from "react-icons/fa";
import { IoChatboxEllipses } from "react-icons/io5";
import SidebarButton from "./SidebarButton";

const Sidebar = () => {
  const [isLarge, setIsLarge] = useState(false);
  const session = useSession();

  useEffect(() => {
    const handleResize = () => setIsLarge(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!session.data?.user) {
    return null;
  }

  return (
    <motion.div
      animate={{ width: isLarge ? "25vw" : "2.5rem" }} // 2.5rem = w-10
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col space-y-4 sticky top-31 h-[40vh] min-w-[60px] max-w-[300px] bg-base-100 shadow-br rounded-xl pt-4 pb-4 z-10 overflow-hidden"
    >
      {session.data.user.type === UserType.Student
        ? studentSidebar()
        : session.data.user.type === UserType.Admin
        ? adminSidebar()
        : session.data.user.type === UserType.Counselor
        ? counselorSidebar()
        : null}
    </motion.div>
  );
};

const studentSidebar = () => {
  return (
    <>
      <SidebarButton href="/user/dashboard" icon={AiFillHome}>
        Dashboard
      </SidebarButton>
      <SidebarButton href="/user/counselors" icon={FaUsers}>
        Counselors
      </SidebarButton>
      <SidebarButton href="/user/appointments" icon={FaCalendar}>
        Appointments
      </SidebarButton>
      <SidebarButton href="/user/chatbot" icon={FaRobot}>
        Chatbot
      </SidebarButton>
      <SidebarButton href="/user/chats" icon={IoChatboxEllipses}>
        Chats
      </SidebarButton>
    </>
  );
};

const counselorSidebar = () => {
  return (
    <>
      <SidebarButton href="/user/dashboard" icon={AiFillHome}>
        Dashboard
      </SidebarButton>
      <SidebarButton href="/user/appointments" icon={FaCalendar}>
        Appointments
      </SidebarButton>
      <SidebarButton href="/user/chats" icon={IoChatboxEllipses}>
        Chats
      </SidebarButton>
    </>
  );
};
const adminSidebar = () => {
  return (
    <>
      <SidebarButton href="/user/dashboard" icon={AiFillHome}>
        Dashboard
      </SidebarButton>
      <SidebarButton href="/user/appointments" icon={FaCalendar}>
        Appointments
      </SidebarButton>
      <SidebarButton href="/user/users" icon={FaUsers}>
        Users
      </SidebarButton>
      <SidebarButton href="/user/chats" icon={IoChatboxEllipses}>
        Chats
      </SidebarButton>
      <SidebarButton href="/user/events" icon={FaCalendar}>
        Events
      </SidebarButton>
    </>
  );
};

export default Sidebar;
