import StudentChatbotPage from "@/app/components/Student/Chatbot/AiChatbotPage";
import { UserType } from "@/app/generated/prisma";
import authOptions from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const ChatbotPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== UserType.Student)
    return redirect("/user/dashboard");

  return (
    <div className="flex-1 pt-25">
      <div className="bg-base-100 shadow-br rounded-xl">
        <StudentChatbotPage />
      </div>
    </div>
  );
};

export default ChatbotPage;
